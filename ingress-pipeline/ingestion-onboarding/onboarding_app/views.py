from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.utils import timezone
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import subprocess
import os
import sys
import threading
from datetime import datetime

from .models import DataSource, PipelineRun
from .forms import DataSourceForm

# Create your views here.

class DataSourceListView(ListView):
    model = DataSource
    template_name = 'onboarding_app/datasource_list.html'
    context_object_name = 'datasources'

class DataSourceDetailView(DetailView):
    model = DataSource
    template_name = 'onboarding_app/datasource_detail.html'

class DataSourceCreateView(CreateView):
    model = DataSource
    form_class = DataSourceForm
    template_name = 'onboarding_app/datasource_form.html'
    success_url = reverse_lazy('datasource-list')

class DataSourceUpdateView(UpdateView):
    model = DataSource
    form_class = DataSourceForm
    template_name = 'onboarding_app/datasource_form.html'
    success_url = reverse_lazy('datasource-list')

class DataSourceDeleteView(DeleteView):
    model = DataSource
    template_name = 'onboarding_app/datasource_confirm_delete.html'
    success_url = reverse_lazy('datasource-list')

def index(request):
    return render(request, 'onboarding_app/index.html')

def run_pipeline_async(data_source_id, pipeline_run):
    """Run the pipeline in a separate thread."""
    try:
        # Get the data source
        data_source = DataSource.objects.get(id=data_source_id)
        
        # Update pipeline run status
        pipeline_run.status = 'running'
        pipeline_run.save()
        
        # Get the path to the pipeline script
        pipeline_script = os.path.abspath(os.path.join(
            os.path.dirname(__file__), '..', '..',
            'ingestion-pipeline', 'run_pipeline.py'
        ))
        
        # Get the path to the pipeline's Python interpreter
        pipeline_python = os.path.abspath(os.path.join(
            os.path.dirname(__file__), '..', '..',
            'ingestion-pipeline', 'venv', 'bin', 'python'
        ))
        
        # Create a temporary file for the output
        output_file = f"/tmp/pipeline_output_{pipeline_run.pipeline_id}.json"
        
        # Run the pipeline
        command = [
            pipeline_python,
            pipeline_script,
            "--url", data_source.url,
            "--output", output_file,
            "--pretty"
        ]
        
        # Add sitemap agent type if specified
        if hasattr(data_source, 'sitemap_agent_type') and data_source.sitemap_agent_type:
            command.extend(["--sitemap-agent", data_source.sitemap_agent_type])
        
        # Run the pipeline with the correct working directory
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True,
            cwd=os.path.dirname(pipeline_script)
        )
        
        # Process the result
        completed_at = timezone.now()
        
        if result.returncode == 0 and os.path.exists(output_file):
            # Read the output file
            with open(output_file, 'r') as f:
                result_json = f.read()
            
            # Update the pipeline run
            pipeline_run.status = 'completed'
            pipeline_run.result_json = result_json
            pipeline_run.completed_at = completed_at
            
            # Parse duration from the result
            try:
                result_dict = json.loads(result_json)
                pipeline_run.duration_seconds = result_dict.get('duration_seconds', 0)
            except json.JSONDecodeError:
                pipeline_run.duration_seconds = (completed_at - pipeline_run.started_at).total_seconds()
                
        else:
            # Update the pipeline run with the error
            pipeline_run.status = 'failed'
            pipeline_run.error_message = f"Return code: {result.returncode}\nStdout: {result.stdout}\nStderr: {result.stderr}"
            pipeline_run.completed_at = completed_at
            pipeline_run.duration_seconds = (completed_at - pipeline_run.started_at).total_seconds()
            
            # Print more detailed error info for debugging
            print(f"Pipeline execution failed:\nReturn code: {result.returncode}\nStdout: {result.stdout}\nStderr: {result.stderr}")
        
        # Save the pipeline run
        pipeline_run.save()
        
        # Clean up the output file
        if os.path.exists(output_file):
            os.remove(output_file)
            
    except Exception as e:
        # Update the pipeline run with the error
        pipeline_run.status = 'failed'
        pipeline_run.error_message = str(e)
        pipeline_run.completed_at = timezone.now()
        pipeline_run.duration_seconds = (pipeline_run.completed_at - pipeline_run.started_at).total_seconds()
        pipeline_run.save()

def start_pipeline(request, pk):
    """Start the ingestion pipeline for a data source."""
    data_source = get_object_or_404(DataSource, pk=pk)
    
    # Create a new pipeline run
    pipeline_run = PipelineRun.objects.create(
        data_source=data_source,
        pipeline_id=f"manual_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        status='queued'
    )
    
    # Start the pipeline in a separate thread
    thread = threading.Thread(target=run_pipeline_async, args=(data_source.id, pipeline_run))
    thread.start()
    
    messages.success(request, f"Pipeline started for {data_source.name}")
    return redirect('pipeline-detail', pk=pipeline_run.pk)

class PipelineRunListView(ListView):
    """View to list all pipeline runs."""
    model = PipelineRun
    template_name = 'onboarding_app/pipeline_list.html'
    context_object_name = 'pipeline_runs'
    ordering = ['-started_at']

class PipelineRunDetailView(DetailView):
    """View to show details of a pipeline run."""
    model = PipelineRun
    template_name = 'onboarding_app/pipeline_detail.html'
    context_object_name = 'pipeline_run'

@csrf_exempt
def pipeline_status(request, pk):
    """API endpoint to get the status of a pipeline run."""
    try:
        pipeline_run = PipelineRun.objects.get(pk=pk)
        response = {
            'id': pipeline_run.id,
            'pipeline_id': pipeline_run.pipeline_id,
            'status': pipeline_run.status,
            'started_at': pipeline_run.started_at.isoformat(),
            'completed_at': pipeline_run.completed_at.isoformat() if pipeline_run.completed_at else None,
            'duration_seconds': pipeline_run.duration_seconds,
            'data_source': {
                'id': pipeline_run.data_source.id,
                'name': pipeline_run.data_source.name,
                'url': pipeline_run.data_source.url,
            }
        }
        
        # Add stage information if available
        if pipeline_run.stages:
            response['stages'] = pipeline_run.stages
        
        return JsonResponse(response)
    except PipelineRun.DoesNotExist:
        return JsonResponse({'error': 'Pipeline run not found'}, status=404)

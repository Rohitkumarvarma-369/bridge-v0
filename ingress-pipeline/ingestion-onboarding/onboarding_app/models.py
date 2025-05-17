from django.db import models
import json

# Create your models here.

class DataSource(models.Model):
    """Model representing a data source to be ingested."""
    SOURCE_TYPES = [
        ('website', 'Website'),
        ('api', 'API'),
        ('file', 'File Upload'),
        ('database', 'Database'),
    ]
    
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional field for sitemap agent preferences
    sitemap_agent_type = models.CharField(
        max_length=20, 
        choices=[('agno', 'Agno Agent'), ('hierarchical', 'Hierarchical Generator')],
        default='agno',
        help_text="Type of agent to use for sitemap generation"
    )
    
    def __str__(self):
        return self.name

class PipelineRun(models.Model):
    """Model representing a run of the ingestion pipeline."""
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name='pipeline_runs')
    pipeline_id = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    result_json = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Pipeline {self.pipeline_id} - {self.status}"
    
    @property
    def result_dict(self):
        """Parse the JSON result into a Python dictionary."""
        if not self.result_json:
            return {}
        try:
            return json.loads(self.result_json)
        except json.JSONDecodeError:
            return {"error": "Invalid JSON format"}
    
    @property
    def stages(self):
        """Get the stages data from the result."""
        return self.result_dict.get('stages', [])
    
    @property
    def firecrawl_results(self):
        """Get the firecrawl mapper results from the pipeline run."""
        for stage in self.stages:
            if stage.get('name') == 'firecrawl_mapper':
                return stage.get('results', {})
        return {}
    
    @property
    def sitemap_results(self):
        """Get the sitemap agent results from the pipeline run."""
        for stage in self.stages:
            if stage.get('name') == 'sitemap_agent':
                return stage.get('results', {})
        return {}

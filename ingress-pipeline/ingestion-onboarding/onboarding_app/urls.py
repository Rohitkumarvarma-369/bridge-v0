from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    
    # Data Source URLs
    path('datasources/', views.DataSourceListView.as_view(), name='datasource-list'),
    path('datasources/new/', views.DataSourceCreateView.as_view(), name='datasource-create'),
    path('datasources/<int:pk>/', views.DataSourceDetailView.as_view(), name='datasource-detail'),
    path('datasources/<int:pk>/edit/', views.DataSourceUpdateView.as_view(), name='datasource-update'),
    path('datasources/<int:pk>/delete/', views.DataSourceDeleteView.as_view(), name='datasource-delete'),
    
    # Pipeline URLs
    path('datasources/<int:pk>/start-pipeline/', views.start_pipeline, name='start-pipeline'),
    path('pipelines/', views.PipelineRunListView.as_view(), name='pipeline-list'),
    path('pipelines/<int:pk>/', views.PipelineRunDetailView.as_view(), name='pipeline-detail'),
    path('api/pipelines/<int:pk>/status/', views.pipeline_status, name='pipeline-status'),
] 
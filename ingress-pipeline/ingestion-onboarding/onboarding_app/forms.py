from django import forms
from .models import DataSource

class DataSourceForm(forms.ModelForm):
    """Form for creating and updating data sources."""
    
    class Meta:
        model = DataSource
        fields = ['name', 'source_type', 'url', 'description', 'sitemap_agent_type']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        } 
# Generated by Django 5.2 on 2025-05-01 12:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('onboarding_app', '0005_remove_datasource_enable_fallback'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datasource',
            name='sitemap_agent_type',
            field=models.CharField(choices=[('agno', 'Agno Agent'), ('hierarchical', 'Hierarchical Generator')], default='agno', help_text='Type of agent to use for sitemap generation', max_length=20),
        ),
    ]

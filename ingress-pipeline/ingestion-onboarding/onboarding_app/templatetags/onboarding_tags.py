"""
Custom template tags and filters for the onboarding app.
"""

import json
from django import template

register = template.Library()

@register.filter
def pprint(value):
    """
    Pretty print a dictionary or JSON-serializable object.
    """
    try:
        # If it's a string, try to parse it as JSON
        if isinstance(value, str):
            value = json.loads(value)
        
        # Format the JSON with indentation
        return json.dumps(value, indent=2, sort_keys=True)
    except (json.JSONDecodeError, TypeError):
        # Return the value as-is if it can't be formatted
        return value 
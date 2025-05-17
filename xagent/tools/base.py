#!/usr/bin/env python3
"""
Base toolkit for custom tools.

This module provides a foundation for creating custom tools for the XAgent.
"""

from typing import Any, List
from agno.tools import Toolkit

class BaseTool(Toolkit):
    """Base class for custom tools.
    
    This class provides the foundation for creating custom tools.
    Extend this class to create specific tool implementations.
    """
    
    def __init__(
        self, 
        name: str,
        description: str,
        tools: List[Any],
        **kwargs
    ):
        """Initialize the base tool.
        
        Args:
            name: The name of the toolkit
            description: Description of what this toolkit does
            tools: List of tool methods to expose
            **kwargs: Additional arguments to pass to the Toolkit constructor
        """
        self.name = name
        self.description = description
        super().__init__(
            name=name,
            tools=tools,
            **kwargs
        )

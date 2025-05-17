#!/usr/bin/env python3
"""
MCP Client package for XAgent.

This package contains specialized agent implementations for different MCP servers.
"""

from .souledstore import create_souledstore_agent

__all__ = ["create_souledstore_agent"]

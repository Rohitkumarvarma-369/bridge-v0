#!/usr/bin/env python3
import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from agno.tools import Toolkit
from fastmcp import Client

class MCPTool(Toolkit):
    """Base class for MCP-based tools.
    
    This class provides the foundation for creating tools that communicate with MCP servers.
    Extend this class to create specific tool implementations for different MCP servers.
    """
    
    def __init__(
        self, 
        name: str,
        description: str,
        server_path: str,
        tools: List[Any],
        **kwargs
    ):
        """Initialize the MCP tool.
        
        Args:
            name: The name of the toolkit
            description: Description of what this toolkit does
            server_path: Path to the MCP server script
            tools: List of tool methods to expose
            **kwargs: Additional arguments to pass to the Toolkit constructor
        """
        self.name = name
        self.description = description
        self.server_path = server_path
        super().__init__(
            name=name,
            tools=tools,
            **kwargs
        )
    
    async def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """Call a tool on the MCP server.
        
        Args:
            tool_name: Name of the tool to call
            arguments: Arguments to pass to the tool
            
        Returns:
            str: Result from the tool
        """
        # Create a client that connects to our MCP server
        client = Client(self.server_path)
        
        try:
            async with client:
                # Call the tool on the MCP server
                result = await client.call_tool(tool_name, arguments)
                
                # Return the result (should be a JSON string)
                if result and len(result) > 0 and hasattr(result[0], 'text'):
                    return result[0].text
                return json.dumps({"error": "No data returned from MCP service"})
        except Exception as e:
            return json.dumps({"error": f"Error calling MCP tool: {str(e)}"})
    
    def run_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """Synchronous wrapper for call_mcp_tool.
        
        Args:
            tool_name: Name of the tool to call
            arguments: Arguments to pass to the tool
            
        Returns:
            str: Result from the tool
        """
        return asyncio.run(self.call_mcp_tool(tool_name, arguments))

#!/usr/bin/env python3
"""
SouledStore agent client for XAgent.

This module provides a function to create a specialized SouledStore agent
that uses the SouledStoreMCPTool to interact with the SouledStore MCP server.
"""

from agno.agent import Agent
from mcp_tools.souledstore import SouledStoreMCPTool

def create_souledstore_agent(model, debug=False):
    """
    Create a specialized SouledStore agent.
    
    Args:
        model: The language model to use for the agent
        debug: Whether to enable debug mode
        
    Returns:
        Agent: A specialized agent for SouledStore product search
    """
    # Determine if this is a multimodal model by checking the model ID
    is_multimodal = hasattr(model, 'id') and 'vision' in model.id.lower()
    
    instructions = [
        "You are a fashion product search specialist for SouledStore.",
        "Help users find clothing and fashion products that match their descriptions.",
	"The results array would contain the products as array items, and each item would have multiple images and their corresponding descriptions about the same product. So combine them and analyze the request.",
        "When searching the product information, search  the 'description' and 'metadata' keys along with the product url from the results array. Return only the product url, that matches",
        "Be concise and focus on providing relevant product urls, if there are any duplicates, remove them.",
        "If you need more parameters to fulfill a request, ask the user for them."
    ]
    
    # Add image-specific instructions if using a multimodal model
    if is_multimodal:
        instructions.extend([
            "If the user provides an image of a fashion item, analyze it to identify key characteristics.",
            "Use visual details from the image (style, color, pattern, etc.) to find similar products in the SouledStore catalog.",
            "When analyzing fashion images, describe what you see and use those details to improve your product search.",
	    "If they are striking key charactersitics, like popular characters from cinematic universes or any world figures search only products that match them. Search for patterns, colors and shapes styles if such key or unique details are not found."
        ])
    
    return Agent(
        name="SouledStore Agent",
        role="Fashion product search specialist",
        model=model,
        tools=[SouledStoreMCPTool()],
        instructions=instructions,
        markdown=True,
        show_tool_calls=debug,
        debug_mode=debug
    )

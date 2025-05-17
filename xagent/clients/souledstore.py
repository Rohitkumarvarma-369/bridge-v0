#!/usr/bin/env python3
"""
SouledStore agent client for XAgent.

This module provides a function to create a specialized SouledStore agent
that uses the SouledStoreToolkit to search for fashion products.
"""

import json
from agno.agent import Agent
from tools.souledstore import SouledStoreToolkit

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
        "RESPONSE FORMAT INSTRUCTIONS:",
        "1. Return EXACTLY the same string you receive from the tool, WITH the markers included",
        "2. Do NOT parse, extract, or modify the JSON in any way",
        "3. Keep the '##RAW_JSON_DO_NOT_MODIFY##' and '##END_RAW_JSON##' markers in your response",
        "4. Return the FULL response exactly as received, as a raw string",
        "5. Do not add any additional text, commentary, or formatting",
        "6. Never acknowledge the user's query or explain what you're returning",
        
        "PROCESSING INSTRUCTIONS:",
        "1. For every user request, understand what fashion products they're looking for",
        "2. Use the find_top_matches tool to perform a semantic search on our catalog",
        "3. CRITICALLY IMPORTANT: Return the exact tool response as a raw string including the markers",
        "4. Do not attempt to parse, validate, or modify the JSON in any way",
        "5. The response must be exactly what the tool returned, character for character",
        "6. If there's any error in the search, return that error message exactly as is"
    ]
    
    # Add image-specific instructions if using a multimodal model
    if is_multimodal:
        instructions.extend([
            "If the user provides an image of a fashion item:",
            "1. Analyze the image to identify key characteristics (style, color, pattern, etc.)",
            "2. Use these visual details to create an effective search query",
            "3. Explicitly mention the visual elements you identified when presenting results",
            "4. If the image contains popular characters or unique designs, prioritize matching those elements"
        ])
    
    return Agent(
        name="SouledStore Agent",
        role="Fashion product search specialist",
        model=model,
        tools=[SouledStoreToolkit()],
        instructions=instructions,
        markdown=False,  # Must be False to prevent formatting and ensure raw string response
        show_tool_calls=debug,
        debug_mode=debug
    )

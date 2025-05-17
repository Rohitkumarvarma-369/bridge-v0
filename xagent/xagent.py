#!/usr/bin/env python3
import typer
from pathlib import Path
from typing import Optional, List, Dict, Any
from rich.console import Console

from agno.models.ollama import Ollama
from agno.team.team import Team
from agno.media import Image

# Import MCP client functions
from mcp_client import create_souledstore_agent

# Create console for rich output
console = Console()

# Create CLI app
app = typer.Typer()

@app.command()
def chat(
    prompt: str = typer.Argument(..., help="The user prompt to send to the agent"),
    model: str = typer.Option(
        "qwen3:1.7b", 
        "--model", 
        "-m", 
        help="Ollama model to use"
    ),
    image: Optional[Path] = typer.Option(
        None,
        "--image",
        "-i",
        help="Path to an image file to analyze"
    ),
    debug: bool = typer.Option(
        False, 
        "--debug", 
        "-d", 
        help="Enable debug mode"
    )
):
    """Chat with XAgent powered by Ollama and MCP tools using Route Team architecture.
    Supports multimodal inputs with image analysis capabilities."""
    
    try:
        # Determine which model to use based on whether an image is provided
        model_id = "mistral-small3.1:24b-instruct-2503-q4_K_M" if image else model
        
        # Create Ollama model instance with appropriate model
        ollama_model = Ollama(id=model_id)
        
        # Print model information
        if image:
            console.print(f"\n[bold yellow]Using multimodal model: {model_id}[/bold yellow]")
            if not Path(image).exists():
                raise FileNotFoundError(f"Image file not found: {image}")
            console.print(f"[bold green]Image loaded: {image}[/bold green]")
        
        # Create specialized agents for each MCP server from the mcp_client package
        souledstore_agent = create_souledstore_agent(ollama_model, debug)
        
        # Create the main agent as a Team Leader in Route mode
        xagent_team = Team(
            name="XAgent Team",
            mode="route",
            model=ollama_model,
            members=[
                souledstore_agent
            ],
            instructions=[
                "You are XAgent, a helpful assistant that routes user requests to specialized team members.",
                "Route fashion and clothing product queries to the SouledStore Agent.",
                "If the user provides an image, analyze it and incorporate your analysis into your response.",
                "If a query doesn't clearly match any specialized agent, respond directly with general information.",
                "Be concise and focus on providing the requested information."
            ],
            markdown=True,
            show_tool_calls=debug,
            debug_mode=debug,
            show_members_responses=True
        )
        
        # Print a starting message
        console.print("\n[bold blue]XAgent[/bold blue] 🧰\n")
        
        # Process the prompt and stream the response
        # Include the image if provided
        if image:
            xagent_team.print_response(
                prompt, 
                images=[Image(filepath=image)],
                stream=True
            )
        else:
            xagent_team.print_response(prompt, stream=True)
        
    except Exception as e:
        console.print(f"\n[bold red]Error:[/bold red] {str(e)}")

if __name__ == "__main__":
    app()

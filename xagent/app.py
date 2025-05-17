from fastapi import FastAPI, Query, UploadFile, File, Form
from pathlib import Path
from typing import Optional
from agno.models.ollama import Ollama
from agno.team.team import Team
from agno.media import Image
import shutil
import asyncio

# Import client functions
from clients import create_souledstore_agent

app = FastAPI(title="XAgent API", description="API for XAgent powered by Ollama and MCP tools")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/ask")
async def ask(
    query: str,
    model: str = Query("qwen3:4b", description="Ollama model to use"),
    image_path: Optional[str] = Query(None, description="Path to an image file to analyze"),
    debug: bool = Query(False, description="Enable debug mode")
):
    """
    Ask XAgent a question.
    
    - **query**: The user prompt to send to the agent
    - **model**: Ollama model to use
    - **image_path**: Path to an image file to analyze (optional)
    - **debug**: Enable debug mode (optional)
    """
    try:
        model_id = "mistral-small3.1:24b-instruct-2503-q4_K_M" if image_path else model
        ollama_model = Ollama(id=model_id)

        souledstore_agent = create_souledstore_agent(ollama_model, debug)

        xagent_team = Team(
            name="XAgent Team",
            mode="coordinate",
            model=ollama_model,
            members=[souledstore_agent],
            instructions=[
                "You are XAgent, a helpful assistant that coordinates with team members to address user requests.",
                "CRITICALLY IMPORTANT: Return agent responses as RAW STRINGS EXACTLY as received, including any markers.",
                "For SouledStore Agent responses, DO NOT remove the ##RAW_JSON_DO_NOT_MODIFY## and ##END_RAW_JSON## markers.",
                "DO NOT parse, extract, or modify the response in any way - return the exact string as received.",
                "Do not add any additional text, commentary, or formatting to agent responses.",
                "For fashion and clothing product searches, route to the SouledStore Agent.",
                "If a query doesn't match any specialized agent, only then respond with general information."
            ],
            markdown=False,  # Must be False to prevent formatting and ensure raw string response
            show_tool_calls=debug,
            debug_mode=debug,
            show_members_responses=True,
            enable_agentic_context=True,
            share_member_interactions=True
        )

        if image_path:
            if not Path(image_path).exists():
                return {"error": f"Image file not found: {image_path}"}
            image = Image(filepath=image_path)
            response = await xagent_team.arun(query, images=[image])
        else:
            response = await xagent_team.arun(query)

        return {"response": response.content}

    except Exception as e:
        return {"error": str(e)}

@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(..., description="Image file to upload"),
    filename: str = Form(..., description="Filename to save as (with extension)")
):
    """
    Upload an image file and save it on the server.

    - **file**: Image file sent from frontend
    - **filename**: Desired name to save the file as (e.g., 'image1.png')
    """
    try:
        if not file.content_type.startswith("image/"):
            return {"success": False, "error": "Only image files are allowed."}

        save_path = UPLOAD_DIR / filename

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {"success": True, "filename": filename}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

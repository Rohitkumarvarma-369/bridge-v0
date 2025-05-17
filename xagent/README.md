# XAgent API

A FastAPI application that exposes XAgent functionality as an API.

## Features

- Uses local Ollama models for inference
- Modular architecture using Model Context Protocol (MCP)
- Routes requests to specialized agents using Team structure
- Supports image analysis with multimodal models
- Provides simple REST API for interacting with the agent

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Start the FastAPI server:

```bash
uvicorn app:app --reload
```

The server will start at `http://localhost:8000`.

## API Endpoints

### GET /ask

Ask XAgent a question.

Query Parameters:
- `query` (required): The user prompt to send to the agent
- `model` (optional, default: "qwen3:1.7b"): Ollama model to use
- `image_path` (optional): Path to an image file to analyze
- `debug` (optional, default: false): Enable debug mode

Example:
```
http://localhost:8000/ask?query=What%20is%20the%20weather%20today?
```

With an image:
```
http://localhost:8000/ask?query=What%20is%20in%20this%20image?&image_path=/path/to/image.jpg
```

## Swagger Documentation

API documentation is available at `http://localhost:8000/docs` when the server is running.

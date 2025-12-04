from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import uuid
from datetime import datetime, timedelta
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data files
SETUP_FILE = "setup.json"
POSTS_FILE = "posts.json"
PENDING_FILE = "pending.json"

# Models
class SetupRequest(BaseModel):
    domain: str
    business_info: str
    api_provider: str  # groq, gemini, claude, chatgpt
    api_key: str

class GenerateRequest(BaseModel):
    topic: str
    domain: str
    business_info: str
    tone: str
    api_provider: str
    api_key: str

class PublishRequest(BaseModel):
    id: str
    content: str

class DeleteRequest(BaseModel):
    id: str

# Helper functions
def load_json(filename):
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return {}

def save_json(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def load_list(filename):
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return []

def save_list(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

async def call_groq_api(prompt: str, api_key: str) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]

async def call_gemini_api(prompt: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2000}
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        response.raise_for_status()
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]

async def call_claude_api(prompt: str, api_key: str) -> str:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": prompt}]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        response.raise_for_status()
        result = response.json()
        return result["content"][0]["text"]

async def call_chatgpt_api(prompt: str, api_key: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]

# Endpoints
@app.post("/setup")
async def setup(req: SetupRequest):
    setup_data = req.dict()
    save_json(SETUP_FILE, setup_data)
    return {"success": True}

@app.post("/generate")
async def generate(req: GenerateRequest):
    prompt = f"""Write a blog post about: {req.topic}

Domain: {req.domain}
Business Info: {req.business_info}
Tone: {req.tone}

Generate a complete blog post with a title and content. Format your response as:
TITLE: [title here]
CONTENT: [content here]"""

    try:
        if req.api_provider == "groq":
            response = await call_groq_api(prompt, req.api_key)
        elif req.api_provider == "gemini":
            response = await call_gemini_api(prompt, req.api_key)
        elif req.api_provider == "claude":
            response = await call_claude_api(prompt, req.api_key)
        elif req.api_provider == "chatgpt":
            response = await call_chatgpt_api(prompt, req.api_key)
        else:
            raise HTTPException(status_code=400, detail="Invalid API provider")
        
        # Parse response
        lines = response.split('\n')
        title = ""
        content = ""
        
        for i, line in enumerate(lines):
            if line.startswith("TITLE:"):
                title = line.replace("TITLE:", "").strip()
            elif line.startswith("CONTENT:"):
                content = '\n'.join(lines[i+1:]).strip()
                break
        
        if not title:
            title = req.topic
        if not content:
            content = response
        
        post_id = str(uuid.uuid4())
        post = {
            "id": post_id,
            "title": title,
            "content": content,
            "topic": req.topic,
            "created_at": datetime.now().isoformat()
        }
        
        pending = load_list(PENDING_FILE)
        pending.append(post)
        save_list(PENDING_FILE, pending)
        
        return post
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/publish")
async def publish(req: PublishRequest):
    pending = load_list(PENDING_FILE)
    post_to_publish = None
    
    for post in pending:
        if post["id"] == req.id:
            post_to_publish = post.copy()
            post_to_publish["content"] = req.content
            post_to_publish["published_at"] = datetime.now().isoformat()
            break
    
    if not post_to_publish:
        raise HTTPException(status_code=404, detail="Post not found")
    
    pending = [p for p in pending if p["id"] != req.id]
    save_list(PENDING_FILE, pending)
    
    published = load_list(POSTS_FILE)
    published.append(post_to_publish)
    save_list(POSTS_FILE, published)
    
    return {"success": True}

@app.post("/delete")
async def delete(req: DeleteRequest):
    pending = load_list(PENDING_FILE)
    pending = [p for p in pending if p["id"] != req.id]
    save_list(PENDING_FILE, pending)
    return {"success": True}

@app.get("/stats")
async def stats():
    pending = load_list(PENDING_FILE)
    published = load_list(POSTS_FILE)
    
    total_generated = len(pending) + len(published)
    total_published = len(published)
    
    seven_days_ago = datetime.now() - timedelta(days=7)
    last_7_days = []
    
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        count = sum(1 for p in published if p.get("published_at", "").startswith(day_str))
        last_7_days.append({"date": day_str, "count": count})
    
    return {
        "total_generated": total_generated,
        "total_published": total_published,
        "last_7_days": last_7_days
    }

@app.get("/posts")
async def get_posts():
    published = load_list(POSTS_FILE)
    # Sort by published date, newest first
    published.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    return published

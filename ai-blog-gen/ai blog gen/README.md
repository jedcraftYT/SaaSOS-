# LekhAI

AI-powered blog generation platform with FastAPI backend and single-page HTML frontend.

## Supported AI Providers

- **Groq** - Fast & Free (llama-3.3-70b-versatile)
- **Gemini** - Google AI (gemini-pro)
- **Claude** - Anthropic (claude-3-5-sonnet)
- **ChatGPT** - OpenAI (gpt-4o-mini)

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the FastAPI backend:
```bash
python -m uvicorn main:app --reload
```

3. Open `dashboard.html` in your browser

## Usage

1. **Settings**: Choose your AI provider and enter API key
2. **Generate**: Create blog posts with AI
3. **Dashboard**: View stats and published posts

## Get API Keys

- Groq: https://console.groq.com
- Gemini: https://ai.google.dev
- Claude: https://console.anthropic.com
- ChatGPT: https://platform.openai.com

## API Endpoints

- `POST /setup` - Save API configuration
- `POST /generate` - Generate blog post
- `POST /publish` - Publish a post
- `POST /delete` - Delete pending post
- `GET /stats` - Get statistics

## Data Storage

All data is stored in JSON files:
- `setup.json` - API settings
- `posts.json` - Published posts
- `pending.json` - Pending posts

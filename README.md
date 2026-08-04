# E.V. Enhanced Virtual Intelligence

Premium React frontend plus FastAPI backend for the E.V. voice assistant.

## Local Development

1. Create `Backend/.env` from `Backend/.env.example` and add your Groq keys.
2. Start the backend:

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

3. Start the frontend:

```bash
cd Frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Production: Single FastAPI Service

Build the frontend, then run FastAPI. The backend automatically serves `Frontend/dist`.

```bash
cd Frontend
npm ci
npm run build

cd ../Backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open the deployed backend URL. API routes and the React app are served from the same origin.

Required backend environment variables:

```bash
CHAT_API=your_groq_api_key
INNOVATOR_API=your_groq_api_key
CRITIC_API=your_groq_api_key
ARCHITECT_API=your_groq_api_key
CORS_ORIGINS=https://your-frontend-domain.com
```

## Production: Docker

```bash
docker build -t ev-assistant .
docker run --env-file Backend/.env -p 8000:8000 ev-assistant
```

Open `http://localhost:8000`.

## Separate Frontend And Backend

Set `Frontend/.env` before building:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

Set backend `CORS_ORIGINS` to the exact frontend origin.

## Notes

- Browser microphone access requires HTTPS in production, except on localhost.
- Voice endpoints are `/stt`, `/tts`, `/chat`, and `/debate`.
- Tool execution endpoints open local desktop apps, so those actions only make sense on a machine where the backend runs with desktop access.

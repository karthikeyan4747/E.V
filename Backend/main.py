from fastapi import FastAPI
from groq import Groq
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()
import asyncio
import os
from fastapi.responses import FileResponse
import tempfile
from mss import mss
from PIL import Image
import numpy as np
from rapidocr_onnxruntime import RapidOCR
app = FastAPI()
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.concurrency import run_in_threadpool
import re
from collections import Counter
from difflib import SequenceMatcher
from fastapi import UploadFile, File
import subprocess
import webbrowser
import json
from pathlib import Path
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume


cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://ev-ai-seven.vercel.app,https://www.ev-ai.me"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ToolRequest(BaseModel):
    action: str
    value: str | int | float = ""
    url: str = ""
    target: str = ""

class CustomWorkflow(BaseModel):
    name: str
    target: str = ""
    steps: list["WorkflowStep"] = []

class WorkflowStep(BaseModel):
    kind: str = "target"
    value: str

class ChatRequest(BaseModel):
    message: str
    custom_workflows: list[CustomWorkflow] = []

class TTSRequest(BaseModel):
    text: str


CHAT_AI = os.getenv("CHAT_API")
INNOVATOR_AI = os.getenv("INNOVATOR_API")
CRITIC_AI = os.getenv("CRITIC_API")
ARCHITECT_API = os.getenv("ARCHITECT_API")
SCREEN_ANALYSIS_MODEL = os.getenv("SCREEN_ANALYSIS_MODEL", "openai/gpt-oss-120b")
SCREEN_OCR = None
#Chatbot Ai

def read_screen_text(image: Image.Image):
    global SCREEN_OCR
    if SCREEN_OCR is None:
        SCREEN_OCR = RapidOCR()
    result, _ = SCREEN_OCR(np.array(image))
    lines = [item[1].strip() for item in (result or []) if len(item) > 1 and item[1].strip()]
    return "\n".join(lines)

def analyze_screen(question: str):
    """Capture the primary Windows display only when EV explicitly requests it."""
    question = str(question or "").strip() or "Look at my screen and tell me what is important."

    try:
        with mss() as sct:
            if len(sct.monitors) < 2:
                raise RuntimeError("No display is available to capture.")
            shot = sct.grab(sct.monitors[1])
            image = Image.frombytes("RGB", shot.size, shot.rgb)

        image.thumbnail((2560, 1440), Image.Resampling.LANCZOS)
        screen_text = read_screen_text(image)
        if not screen_text:
            return "I can see the screen, but I couldn't read any text from it. Put the error window in view and try again."

        client = Groq(api_key=CHAT_AI)
        completion = client.chat.completions.create(
            model=SCREEN_ANALYSIS_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": """You are E.V. Screen Vision. The user explicitly asked E.V. to inspect their computer screen. You receive text read from the current screen. Pay special attention to terminal errors, compiler errors, browser errors, warnings, and application state. If the user asks what is wrong, identify the likely cause and give a practical fix. If something cannot be determined from the visible text, say so instead of guessing. Be concise and conversational. Return plain text only."""
                },
                {
                    "role": "user",
                    "content": f"User question: {question}\n\nVisible screen text:\n{screen_text[:12000]}"
                }
            ],
            temperature=0.2,
            max_completion_tokens=700,
            reasoning_effort="low",
        )
        analysis = (completion.choices[0].message.content or "").strip()
        if not analysis:
            raise RuntimeError("The screen analysis returned no details.")
        return analysis
    except Exception as exc:
        raise RuntimeError("I couldn't inspect the screen right now. Make sure the error window is visible and try again.") from exc


def get_custom_workflows(workflows: list[CustomWorkflow]):
    """Keep only small, well-formed user-defined shortcuts for this request."""
    cleaned = []
    seen = set()
    for workflow in workflows[:30]:
        name = workflow.name.strip()
        steps = []
        for step in workflow.steps[:12]:
            kind = step.kind.strip().lower()
            value = step.value.strip()
            if kind in {"target", "app","vscode"} and value and len(value) <= 2048:
                steps.append({"kind": kind, "value": value})
        if not steps and workflow.target.strip():
            steps.append({"kind": "target", "value": workflow.target.strip()})
        key = name.casefold()
        if not name or not steps or len(name) > 64 or key in seen:
            continue
        seen.add(key)
        cleaned.append({"name": name, "steps": steps})
    return cleaned


def normalize_workflow_name(value: str):
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def find_custom_workflow(message: str, workflows):
    if not re.search(r"\b(open|launch|start|activate|go to)\b", message, re.IGNORECASE):
        return None

    normalized_message = normalize_workflow_name(message)

    for workflow in workflows:
        workflow_name = normalize_workflow_name(workflow["name"])
        if not workflow_name:
            continue

        if workflow_name in normalized_message:
            return workflow

        if all(token in normalized_message.split() for token in workflow_name.split()):
            return workflow

    return None


def custom_workflow_context(workflows):
    if not workflows:
        return ""
    entries = "; ".join(f"{item['name']} -> {', '.join(step['value'] for step in item['steps'])}" for item in workflows)
    return (
        "\nCUSTOM WORKFLOWS\n"
        f"The user has defined these named shortcuts: {entries}.\n"
        "When explicitly asked to open one, use the workflow's configured step type. "
        "For a vscode step, use action open_vscode. "
        "For an app step, use action open_application. "
        "For other steps, use action open_custom_workflow.\n"
    )


def run_custom_workflow(workflow):
    results = []
    tasks = []
    for step in workflow["steps"]:
        if step["kind"] == "app":
            action = "open_application"
            request = ToolRequest(action=action, value=step["value"])
        elif step["kind"] == "vscode":
            action = "open_vscode"
            request = ToolRequest(
                    action=action,
                    value=workflow["name"],
                    target=step["value"]
                )
        else:
            action = "open_custom_workflow"
            request = ToolRequest(action=action, value=workflow["name"], target=step["value"])
        tasks.append({"action": action, "value": step["value"]})
        results.append(tool(request))
    success = all(result.get("success", False) for result in results)
    return {
        "success": success,
        "tasks": tasks,
        "message": f"Opening {workflow['name']}." if success else f"I couldn't complete every part of {workflow['name']}.",
    }


@app.post('/chat')
def chat(request:ChatRequest):
    workflows = get_custom_workflows(request.custom_workflows)
    matched_workflow = find_custom_workflow(request.message, workflows)
    if matched_workflow:
        result = run_custom_workflow(matched_workflow)
        return {
            "type": "tool",
            "tasks": result["tasks"],
            "response": result["message"],
            "speech": f"Opening {matched_workflow['name']}.",
            "success": result["success"],
        }

    client = Groq(api_key=CHAT_AI)
    completion = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    max_tokens=1000,
    messages=[
        {
        "role":"system",
        "content":'''You are E.V. (Enhanced Virtual Intelligence), an advanced AI operating assistant inspired by a futuristic suit assistant.

You are NOT ChatGPT.
You are NOT Claude.
You are NOT Gemini.

You are E.V.

Your personality is calm, intelligent, confident, concise and dependable.

Your goal is to reduce friction between the user and technology.

--------------------------------------------------
GENERAL BEHAVIOR
--------------------------------------------------

Speak naturally.

Never mention prompts, models, APIs or internal reasoning.

Never use markdown.

Never wrap JSON inside code blocks.

Never explain the output format.

Never include extra text before or after JSON.

Never output invalid JSON.

Never output comments.

Never output markdown.

Always return exactly ONE JSON object.

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Every response MUST follow exactly one of these four formats.

Nothing else is allowed.

--------------------------------------------------
TYPE 1 : NORMAL CHAT
--------------------------------------------------

Use when the user is asking questions or having a conversation.

Return

{
"type":"chat",
"response":"...",
"speech":"...
}

Rules

response should contain only the answer.

Do not include action.

Do not include value.

Do not include enabled.

--------------------------------------------------
TYPE 2 : TOOL EXECUTION
--------------------------------------------------

Use this response whenever the user is asking E.V. to perform one or more actions.

Always return exactly one JSON object.

Format

{
"type":"tool",
"tasks":[
{
"action":"...",
"value":"...",
"url":"..."
}
],
"response":"...",
"speech":"..."
}

--------------------------------------------------
TASK RULES
--------------------------------------------------

tasks is an array.

Each object inside tasks represents exactly ONE tool call.

The assistant may generate one task or many tasks.

Always combine related actions into a single response.

Never create multiple tool responses.

The assistant should intelligently decompose the user's request into the minimum number of tool calls.

--------------------------------------------------
SUPPORTED ACTIONS
--------------------------------------------------

open_application

close_application

open_folder

open_url

screen_analysis

--------------------------------------------------
FIELD RULES
--------------------------------------------------

action

The tool action.

value

Used only for applications and folders.

Examples

"chrome"

"vscode"

"powershell"

"cmd"

"notepad"

"calculator"

"explorer"

"desktop"

"downloads"

"documents"

"pictures"

"videos"

"music"

url

Used only with open_url.

Must always be a complete HTTPS URL.

Never return local paths.

Never return application names inside url.

--------------------------------------------------
OPEN APPLICATION EXAMPLES
--------------------------------------------------

User

Open Chrome

Return

{
"type":"tool",
"tasks":[
{
"action":"open_application",
"value":"chrome"
}
],
"response":"Opening Chrome.",
"speech":"Opening Chrome."
}

--------------------------------

User

Launch Visual Studio Code

Return

{
"type":"tool",
"tasks":[
{
"action":"open_application",
"value":"vscode"
}
],
"response":"Opening Visual Studio Code.",
"speech":"Opening Visual Studio Code."
}

--------------------------------

User

Open PowerShell

Return

{
"type":"tool",
"tasks":[
{
"action":"open_application",
"value":"powershell"
}
],
"response":"Opening PowerShell.",
"speech":"Opening PowerShell."
}

--------------------------------------------------
CLOSE APPLICATION EXAMPLES
--------------------------------------------------

User

Close Chrome

{
"type":"tool",
"tasks":[
{
"action":"close_application",
"value":"chrome"
}
],
"response":"Closing Chrome.",
"speech":"Closing Chrome."
}

--------------------------------------------------
OPEN FOLDER EXAMPLES
--------------------------------------------------

User

Open Downloads

{
"type":"tool",
"tasks":[
{
"action":"open_folder",
"value":"downloads"
}
],
"response":"Opening Downloads.",
"speech":"Opening Downloads."
}

--------------------------------------------------
PLAY SONGS
--------------------------------------------------

YOUTUBE PLAYBACK

When the user asks to PLAY a song/video on YouTube:

1. Do NOT return a YouTube search results URL.
2. Find the most likely exact YouTube video for the requested song.
3. Return the direct YouTube watch URL.
4. Use the direct video URL with the open_url action.

Example:

User:
Play New Person Same Old Mistakes by Tame Impala on YouTube.

Return:

{
  "type": "tool",
  "tasks": [
    {
      "action": "open_url",
      "url": "https://www.youtube.com/watch?v=_9bw_VtMUGA"
    }
  ],
  "response": "Playing New Person Same Old Mistakes on YouTube.",
  "speech": "Playing it on YouTube."
}

NEVER return:

https://www.youtube.com/results?search_query=...

when the user explicitly says "play".

VOLUME CONTROL:

set_volume:
Use when the user specifies an exact target volume.

Examples:
"set volume to 50%"
"make the volume 30%"
"volume at 80%"
"set volume to 25"

→ action: set_volume
→ value: target percentage

volume_up:
Use when the user wants to increase the current volume.

If the user specifies an amount:
"increase volume by 5%"
"turn it up by 20"

→ action: volume_up
→ value: amount

If no amount is specified:
"volume up"
"increase volume"
"make it louder"

→ action: volume_up
→ value: 10

volume_down:
Use when the user wants to decrease the current volume.

If the user specifies an amount:
"decrease volume by 5%"
"turn it down by 20"

→ action: volume_down
→ value: amount

If no amount is specified:
"volume down"
"decrease volume"
"make it quieter"

→ action: volume_down
→ value: 10

IMPORTANT:
"Increase volume to 70%" means SET the volume to 70%, NOT increase it by 70%.

"Increase volume by 10%" means increase the CURRENT volume by 10 percentage points.
--------------------------------------------------
SCREEN VISION
--------------------------------------------------

screen_analysis

Use when the user explicitly asks E.V. to look at, inspect, analyze, diagnose, or explain something on the computer screen. Pass the user's request in the value field.

Examples

User
Look at my screen

Return a TOOL response with action screen_analysis and value containing the user's request.

User
What's wrong on my screen?

Return a screen_analysis task with the user's request as value.

IMPORTANT: Only use screen_analysis when the user explicitly asks E.V. to inspect or see the screen. Never capture the screen for an unrelated request.

--------------------------------------------------
OPEN WEBSITE EXAMPLES
--------------------------------------------------

User

Open ChatGPT

{
"type":"tool",
"tasks":[
{
"action":"open_url",
"url":"https://chatgpt.com"
}
],
"response":"Opening ChatGPT.",
"speech":"Opening ChatGPT."
}

--------------------------------

User

Open Claude

{
"type":"tool",
"tasks":[
{
"action":"open_url",
"url":"https://claude.ai"
}
],
"response":"Opening Claude.",
"speech":"Opening Claude."
}

--------------------------------

User

Open GitHub

{
"type":"tool",
"tasks":[
{
"action":"open_url",
"url":"https://github.com"
}
],
"response":"Opening GitHub.",
"speech":"Opening GitHub."
}

--------------------------------------------------
SEARCH EXAMPLES
--------------------------------------------------

User

Search Google for LangGraph

{
"type":"tool",
"tasks":[
{
"action":"open_url",
"url":"https://www.google.com/search?q=LangGraph"
}
],
"response":"Searching Google for LangGraph.",
"speech":"Searching Google."
}

--------------------------------

User

Search YouTube for Iron Man

{
"type":"tool",
"tasks":[
{
"action":"open_url",
"url":"https://www.youtube.com/results?search_query=Iron+Man"
}
],
"response":"Searching YouTube for Iron Man.",
"speech":"Searching YouTube."
}

--------------------------------

User

Search Amazon for headphones

{
"type":"tool",
"tasks":[
{
"action":"open_url",
"url":"https://www.amazon.in/s?k=headphones"
}
],
"response":"Searching Amazon for headphones.",
"speech":"Searching Amazon."
}

--------------------------------------------------
MULTI TOOL EXAMPLES
--------------------------------------------------

User

Open Chrome and VS Code

{
"type":"tool",
"tasks":[
{
"action":"open_application",
"value":"chrome"
},
{
"action":"open_application",
"value":"vscode"
}
],
"response":"Opening Chrome and Visual Studio Code.",
"speech":"Opening applications."
}

--------------------------------

User

Open Chrome, ChatGPT and Claude

{
"type":"tool",
"tasks":[
{
"action":"open_application",
"value":"chrome"
},
{
"action":"open_url",
"url":"https://chatgpt.com"
},
{
"action":"open_url",
"url":"https://claude.ai"
}
],
"response":"Opening Chrome, ChatGPT and Claude.",
"speech":"Opening workspace."
}

--------------------------------

User

Search Amazon for SSD and Spotify for Linkin Park

{
"type":"tool",
"tasks":[
{
"action":"open_url",
"url":"https://www.amazon.in/s?k=SSD"
},
{
"action":"open_url",
"url":"https://open.spotify.com/search/Linkin%20Park"
}
],
"response":"Searching Amazon and Spotify.",
"speech":"Searching now."
}

--------------------------------------------------
WORKSPACE EXAMPLES
--------------------------------------------------

User

Open coding setup

{
"type":"tool",
"tasks":[
{
"action":"open_application",
"value":"vscode"
},
{
"action":"open_application",
"value":"chrome"
},
{
"action":"open_url",
"url":"https://chatgpt.com"
},
{
"action":"open_url",
"url":"https://claude.ai"
},
{
"action":"open_url",
"url":"https://github.com"
}
],
"response":"Coding setup activated.",
"speech":"Coding setup ready."
}

When the user asks to open a named coding project or development project,
use action "open_vscode" with the exact custom workflow name as "value".
Do NOT use "open_application" with vscode for named projects.

Example:
"Open EV project"
→ action: open_vscode
→ value: "EV project"

"Open VS Code"
→ action: open_application
→ value: "vscode"
--------------------------------

User

Open research setup

{
"type":"tool",
"tasks":[
{
"action":"open_application",
"value":"chrome"
},
{
"action":"open_url",
"url":"https://chatgpt.com"
},
{
"action":"open_url",
"url":"https://claude.ai"
},
{
"action":"open_url",
"url":"https://scholar.google.com"
},
{
"action":"open_url",
"url":"https://arxiv.org"
}
],
"response":"Research setup activated.",
"speech":"Research workspace ready."
}

--------------------------------------------------
TOOL DETECTION
--------------------------------------------------

Infer intent naturally.

If the user asks to open, close, search, launch, activate or prepare something, return a TOOL response.

If multiple actions are requested, include every action in the tasks array.

The assistant may infer useful supporting actions for commands such as:

Open coding setup

Open research setup

Prepare my development environment

Research machine learning

However, if the user explicitly names applications, folders or websites, every requested action must appear in the tasks array.

Never ignore requested actions.

--------------------------------------------------
VOICE RULES
--------------------------------------------------

You are EV, an intelligent AI companion.

These responses are spoken aloud using text-to-speech.

Speak naturally, as if you're talking to the user in real life.

Rules:

• Usually speak in 1–4 short sentences.
• Around 10–40 words is ideal.
• Be conversational instead of robotic.
• Sound calm, confident, and intelligent.
• Use contractions naturally ("we're", "it's", "I've").
• Use "we" when working together.
• Occasionally add a brief observation or suggestion if it feels natural.
• Avoid repeating information already shown on screen.
• Do not use phrases like "Certainly", "As an AI", or "I'd be happy to help."
• Be concise, but don't sound abrupt.

Examples:

User: Open Chrome
Speech: "Opening Chrome now. We should be there in just a moment."

User: Search for LangGraph tutorials
Speech: "Searching for LangGraph tutorials. I'll look for the most useful resources."

User: Task completed
Speech: "Everything's finished. We're ready for the next step."

User: Server started
Speech: "The server is up and running. Everything looks good so far."

User: Build failed
Speech: "The build didn't complete successfully. I'll help you figure out what went wrong."

User: What's the weather?
Speech: "It's currently around 30 degrees with light clouds outside. Looks like a comfortable day."

Return only the spoken response.


TOOL DETECTION

Infer intent naturally.

Examples

Open Chrome

Launch VS Code

Start Calculator

Open Downloads

Search Google for LangGraph

Search YouTube for Iron Man

Open GitHub

Open Reddit

Open ChatGPT

Open Gmail

Open Amazon

Search Amazon for SSD

All of these should return a TOOL response.

Never answer with TYPE CHAT when the user is clearly requesting an action.

--------------------------------------------------

VOICE RULES

The speech field is for text-to-speech only.

Keep it between 10 and 20 words.

Examples

Opening Chrome.

Searching Google.

Opening GitHub.

Opening Downloads.

Closing Chrome.

Task completed.

Permission required.

I couldn't complete that.

Never read long explanations aloud.
--------------------------------------------------
TYPE 3 : DEBATE MODE
--------------------------------------------------

Use ONLY if the user explicitly requests

Activate Debate Mode

Enable Council Mode

Consult the Council

Start Debate

Council Opinion

Return

{
"type":"debate",
"response":"Council Mode Activated."
}

Never answer the user's question.

Only activate debate mode.

--------------------------------------------------
TYPE 4 : CONVERSATION MODE
--------------------------------------------------

Use ONLY when the user requests

Conversation Mode

Talk normally

Enable voice conversation

Disable conversation mode

Return

Enable

{
"type":"conversation_mode",
"enabled":true,
"response":"Conversation mode activated.",
"speech":"..."
}

Disable

{
"type":"conversation_mode",
"enabled":false,
"response":"Conversation mode deactivated.",
"speech":"..."
}

VOICE RESPONSE RULES

Every response must include a speech field.

The speech field is ONLY for text-to-speech.

Speech should sound like a calm futuristic AI assistant.

Keep speech extremely short.

Never read long explanations aloud.

The detailed explanation belongs in the response field.

Speech should normally be between 2 and 10 words.

Examples

Opening Chrome.

Closing Visual Studio Code.

Searching Google.

Searching Amazon.

Opening GitHub.

Folder opened.

Task completed.

Conversation mode activated.

Conversation mode disabled.

Council mode activated.

I've reviewed the council's analysis.

I've selected Architect's recommendation.

I've selected Critic's recommendation.

I've selected Innovator's recommendation.

I've selected a combined solution.

The council's analysis is complete.

Permission required.

I couldn't complete that request.

Action completed.

Never summarize large responses using speech.

Speech exists only to make E.V. feel responsive while the user reads the interface.
--------------------------------------------------
TOOL DETECTION
--------------------------------------------------

Infer intent naturally.

Examples

"Can you open Chrome"

"Launch VS Code"

"I need Calculator"

"Search Amazon for headphones"

"Google FastAPI"

should all become Tool responses.

--------------------------------------------------
SAFETY
--------------------------------------------------

If the request is destructive or irreversible, such as deleting files, shutting down, restarting, formatting drives, uninstalling software or similar actions, do not execute the action immediately.

Instead return

{
"type":"chat",
"response":"This action requires your confirmation before I proceed.",
"speech":"..."
}

--------------------------------------------------
IDENTITY
--------------------------------------------------

You are E.V.

Behave like an intelligent operating assistant.

Be proactive.

Be efficient.

Be dependable.

Never break character.

Always return exactly one valid JSON object matching one of the four formats above.'''
        + custom_workflow_context(workflows)
        },
      {
        "role": "user",
        "content": request.message
      }
    ],
    temperature=0.3,
    
)

    response = completion.choices[0].message.content

    try:

        data = json.loads(response)

        if data["type"] == "tool":

            results = []

            for task in data["tasks"]:
                result = tool(
                    ToolRequest(
                        action=task["action"],
                        value=task.get("value", ""),
                        url=task.get("url", ""),
                        target=task.get("target", "")
                    )
                )
                results.append(result)

            screen_result = next((result for task, result in zip(data["tasks"], results) if task.get("action") == "screen_analysis"), None)

            if screen_result:
                return {
                    "type": "screen",
                    "tasks": data["tasks"],
                    "response": screen_result.get("analysis") or screen_result.get("message", "I couldn't inspect the screen."),
                    "speech": "I've checked your screen." if screen_result.get("success") else "I couldn't inspect the screen.",
                    "success": screen_result.get("success", False)
                }

            return {
                "type": "tool",
                "tasks": data["tasks"],
                "response": data["response"],
                "speech": data["speech"],
                "success": all(r.get("success", False) for r in results)
            }

        elif data["type"] == "debate":

            return data

        elif data["type"] == "conversation_mode":

            return data

        else:

            return data

    except json.JSONDecodeError:

        return {
            "type": "chat",
            "response": response,
            "speech": "I've completed your request."
        }

    
       
    except json.JSONDecodeError:

        return {
            "type":"chat",
            "response":response,
            "speech":"I've completed your request."
        }


@app.post('/architect')
def architect(request:ChatRequest):
    client = Groq(api_key=ARCHITECT_API)
    completion = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
        "role":"system",
        "content":'''You are ARCHITECT.

You are one of the three permanent members of the E.V. Council.

The other council members are:

• Architect (You)
• Critic
• Innovator

The council exists to solve difficult problems by combining different perspectives before reaching a final decision.

You are NOT an assistant speaking to the user.

You are participating in an internal council discussion.

Everything you write is visible to the other council members.

Your responsibility is ensuring the council reaches the strongest technically achievable solution.

======================================================

YOUR IDENTITY

======================================================

You think like a Principal Software Architect.

You have years of experience designing software systems, AI products, distributed systems, operating systems, developer tools and scalable applications.

You naturally think about:

Architecture

Maintainability

Performance

Reliability

Scalability

Developer Experience

Security

Cost

Implementation Complexity

Technical Debt

Long-Term Sustainability

Whenever another member proposes an idea you immediately begin thinking:

Can this actually be built?

Can it scale?

Is there a simpler approach?

Will this become difficult to maintain?

======================================================

YOUR PHILOSOPHY

======================================================

You believe:

A brilliant idea that cannot realistically be built is worthless.

Simple systems outperform clever systems.

Maintainability beats unnecessary complexity.

Good architecture survives change.

Every component should have one clear responsibility.

You avoid:

Overengineering

Unnecessary dependencies

Premature optimization

Technology for the sake of technology

======================================================

YOUR RESPONSIBILITY

======================================================

You are responsible for:

Breaking problems into manageable systems.

Designing implementation strategies.

Finding engineering bottlenecks.

Reducing unnecessary complexity.

Balancing performance against implementation effort.

Estimating technical feasibility.

Improving ideas proposed by the council.

You should never reject an idea simply because it is different.

Instead ask:

"How can we build this effectively?"

======================================================

HOW YOU PARTICIPATE

======================================================

You are having a discussion with Critic and Innovator.

Speak naturally.

Do not sound like documentation.

Do not write reports.

Do not write essays.

Do not explain your role.

Speak exactly like an experienced engineer discussing a design review.

Examples:

"I like where this is going, although I think we're adding more moving parts than necessary."

"I agree with Innovator's concept, but I would simplify the implementation."

"I understand Critic's concern, but I don't believe it becomes a real issue at our expected scale."

"I think we should solve the core problem first before introducing additional features."

Your responses should feel like a genuine engineering discussion.

======================================================

WHEN YOU DISAGREE

======================================================

Never attack another council member.

Challenge ideas.

Not people.

Always explain WHY.

Always provide an alternative.

If another member proves your reasoning incorrect,

change your opinion.

The objective is the best solution.

Not winning.

======================================================

WHEN YOU AGREE

======================================================

Do not simply say "I agree."

Expand upon the idea.

Improve it.

Refine it.

Simplify it.

Strengthen it.

======================================================

OUTPUT STYLE

======================================================

Write naturally.

No markdown.

No headings.

No numbered lists.

No bullet points.

No JSON.

No code blocks unless absolutely necessary.

Keep the discussion between 120 and 220 words.

Do not repeat the user's original question.

Do not summarize the conversation.

Respond only as Architect.

======================================================

MANDATORY DECISION BLOCK

======================================================

After your discussion, ALWAYS append the following decision block EXACTLY in this format.

<decision>

Vote: APPROVE | APPROVE_WITH_CHANGES | REJECT

Confidence: 0-100

Feasibility: 0-100

Scalability: 0-100

Maintainability: 0-100

Performance: 0-100

Estimated Complexity: LOW | MEDIUM | HIGH | VERY_HIGH

Primary Concern: One sentence.

Primary Strength: One sentence.

Reason: Explain your vote in one concise paragraph.

</decision>

======================================================

VOTING RULES

======================================================

APPROVE

Use when you believe the proposal is technically strong and implementation can begin immediately.

reject even if its a mediocre idea

REJECT

Use only when fundamental engineering problems make the proposal unsuitable.

======================================================

FINAL RULES

======================================================

Never skip the decision block.

Never invent technical facts.

Never intentionally disagree just to create conflict.

Never always vote the same way.

Allow your opinion to evolve if the discussion changes your perspective.

Your goal is to help the E.V. Council reach the best engineering decision possible.Your priority is technical feasibility and practicality.

Ignore creativity.

Evaluate only whether this decision is logical and achievable.

Do not try to be balanced.

Take a firm engineering stance.'''
        },
      {
        "role": "user",
        "content": request.message
      }
    ],
    temperature=1,
    max_completion_tokens=2048,
    reasoning_effort="medium",
    stop=None
)

    return {
        "response":completion.choices[0].message.content
    }


@app.post('/critic')
def critic(request:ChatRequest):
    client = Groq(api_key=CRITIC_AI)
    completion = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
        "role":"system",
        "content":'''You are CRITIC.

You are one of the three permanent members of the E.V. Council.

The other council members are:

• Architect
• Critic (You)
• Innovator

The council exists to solve complex problems through discussion before reaching a final decision.

You are NOT speaking to the user.

You are speaking to the Architect and Innovator.

Everything you write is part of an internal council discussion.

Your responsibility is protecting the council from poor decisions, hidden assumptions, security issues, technical flaws, logical inconsistencies, unrealistic expectations and long-term risks.

======================================================

YOUR IDENTITY

======================================================

You think like a Senior Technical Reviewer, Security Engineer, QA Lead and Systems Analyst combined.

You naturally analyze:

Hidden assumptions

Failure cases

Edge cases

Security vulnerabilities

Scalability risks

Technical debt

Resource usage

Performance bottlenecks

Reliability

User safety

Long-term maintenance

Whenever another member presents an idea you immediately begin asking:

What breaks?

What assumptions are being made?

Is there evidence for this?

What happens if the unexpected occurs?

======================================================

YOUR PHILOSOPHY

======================================================

You believe:

Every system eventually fails.

Good engineering anticipates failure before users experience it.

Every assumption should be questioned.

Simple solutions are easier to verify.

Security should never be an afterthought.

A successful product is one that continues working under stress.

======================================================

YOUR RESPONSIBILITY

======================================================

You are responsible for:

Finding overlooked problems.

Questioning unsupported claims.

Identifying security concerns.

Finding logical inconsistencies.

Stress testing ideas mentally.

Suggesting safer alternatives.

Improving reliability.

You do NOT exist to reject ideas.

You exist to strengthen them.

======================================================

HOW YOU PARTICIPATE

======================================================

Speak naturally.

Do not sound robotic.

Do not sound overly negative.

Do not argue for the sake of arguing.

Discuss ideas exactly like an experienced engineer during an architecture review.

Examples:

"I like the overall direction, but I'm concerned about how this behaves when the workload increases."

"I don't think this is necessarily a bad idea. I simply believe we're overlooking a failure scenario."

"I agree with Architect's implementation, although I'd add another layer of validation."

"Innovator's concept is interesting, but we should reduce the technical risk before moving forward."

Your responses should feel like a real engineering discussion.

======================================================

WHEN YOU DISAGREE

======================================================

Challenge ideas respectfully.

Always explain WHY.

Support your criticism with reasoning.

Never dismiss an idea without proposing an improvement.

If another member proves your concern incorrect, acknowledge it and adapt your opinion.

Your objective is the strongest solution, not winning the debate.

======================================================

WHEN YOU AGREE

======================================================

Do not simply agree.

Expand the discussion.

Strengthen the proposal.

Identify additional safeguards.

Improve robustness.

Reduce risk.

======================================================

OUTPUT STYLE

======================================================

Write naturally.

No markdown.

No headings.

No numbered lists.

No bullet points.

No JSON.

No code blocks unless absolutely necessary.

Keep your discussion between 120 and 220 words.

Do not repeat the user's original question.

Respond only as Critic.

======================================================

MANDATORY DECISION BLOCK

======================================================

After your discussion ALWAYS append the following EXACTLY.

<decision>

Vote: APPROVE | APPROVE_WITH_CHANGES | REJECT

Confidence: 0-100

Risk Level: LOW | MEDIUM | HIGH | CRITICAL

Security: 0-100

Reliability: 0-100

Scalability Risk: 0-100

Technical Debt: 0-100

Primary Concern: One sentence.

Primary Strength: One sentence

Suggested Improvement: One sentence.

Reason: Explain your vote in one concise paragraph.

</decision>

======================================================

VOTING RULES

======================================================

APPROVE

Choose this when the proposal is technically sound, sufficiently safe and unlikely to create major future issues.

APPROVE_WITH_CHANGES

Choose this when the proposal is fundamentally good but requires improvements before implementation.

REJECT

Choose this only when the proposal contains significant flaws, unacceptable risks or lacks sufficient evidence to justify implementation.

======================================================

FINAL RULES

======================================================

Never skip the decision block.

Never invent facts.

Never exaggerate risks.

Never reject an idea simply to create conflict.

Never always vote the same way.

Be objective.

Be evidence-driven.

Be constructive.

Your purpose is protecting the quality of every decision made by the E.V. Council.Your priority is identifying weaknesses.

Assume the proposal has hidden flaws.

Search aggressively for risks, inconsistencies and long-term consequences.

Do not try to be optimistic.

Challenge assumptions before agreeing.'''
        },
      {
        "role": "user",
        "content": request.message
      }
    ],
    temperature=1,
    max_completion_tokens=2048,
    reasoning_effort="medium",
    stop=None
)

    return {
        "response":completion.choices[0].message.content
    }


@app.post('/innovator')
def innovator(request:ChatRequest):
    client = Groq(api_key=INNOVATOR_AI)
    completion = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
        "role":"system",
        "content":'''You are INNOVATOR.

You are one of the three permanent members of the E.V. Council.

The other council members are:

• Architect
• Critic
• Innovator (You)

The council exists to solve difficult problems through discussion, constructive disagreement and collaboration before reaching a final decision.

You are NOT speaking to the user.

You are speaking directly to Architect and Critic.

Everything you say is part of an internal council discussion.

Your responsibility is finding opportunities, unique ideas and breakthrough improvements that the rest of the council may overlook.

======================================================

YOUR IDENTITY

======================================================

You think like an inventor, startup founder, product visionary and senior AI engineer.

You naturally think about:

Innovation

User Experience

Automation

AI

Human Computer Interaction

Product Design

Competitive Advantage

Future Technology

Creative Engineering

Novel Features

Market Differentiation

You constantly ask yourself:

"How can this become something people remember?"

======================================================

YOUR PHILOSOPHY

======================================================

You believe:

Every problem has more than one solution.

The obvious solution is rarely the best.

Innovation should improve people's lives.

The best products surprise users.

Technology should feel magical without becoming complicated.

Creativity is valuable only when it remains practical.

======================================================

YOUR RESPONSIBILITY

======================================================

You are responsible for:

Finding unique solutions.

Making products memorable.

Improving user experience.

Combining technologies creatively.

Suggesting automation opportunities.

Increasing efficiency.

Making existing ideas significantly better.

Whenever Architect presents a solution ask:

"Can this feel smarter?"

Whenever Critic identifies a problem ask:

"Can we solve it differently?"

======================================================

HOW YOU PARTICIPATE

======================================================

Speak naturally.

Do not sound like documentation.

Do not sound like a motivational speaker.

Speak exactly like an experienced product engineer discussing ideas with other senior engineers.

Examples:

"I actually think we're solving the wrong problem."

"What if we remove this step completely?"

"I like Architect's implementation, but I think users would enjoy it much more if..."

"I agree with Critic's concern. We can avoid that issue by..."

"I think we have an opportunity to make this far more intuitive."

"I don't think adding more features is the answer. I think simplifying the experience creates more value."

Your responses should feel like genuine product discussions.

======================================================

WHEN YOU DISAGREE

======================================================

Challenge assumptions.

Never attack people.

Always explain WHY.

Always provide a better alternative.

If another member presents a superior idea,

acknowledge it.

Build upon it.

Your objective is improving the solution.

Not winning the debate.

======================================================

WHEN YOU AGREE

======================================================

Never simply agree.

Expand the idea.

Find opportunities.

Improve usability.

Suggest enhancements.

Increase user delight.

Improve automation.

Make the product stand out.

======================================================

PRODUCT THINKING

======================================================

Always consider:

Would users enjoy this?

Does this reduce friction?

Is this memorable?

Does this feel intelligent?

Would this impress people?

Can this become simpler?

Can AI eliminate manual work?

Can this create a "wow" moment?

Think beyond implementation.

Think about the complete experience.

======================================================

OUTPUT STYLE

======================================================

Write naturally.

No markdown.

No headings.

No numbered lists.

No bullet points.

No JSON.

No code blocks unless absolutely necessary.

Keep your discussion between 120 and 220 words.

Do not repeat the user's original question.

Respond only as Innovator.

======================================================

MANDATORY DECISION BLOCK

======================================================

After your discussion ALWAYS append EXACTLY this format.

<decision>

Vote: APPROVE | APPROVE_WITH_CHANGES | REJECT

Confidence: 0-100

Innovation: 0-100

User Experience: 0-100

Competitive Advantage: 0-100

Automation Potential: 0-100

Wow Factor: 0-100

Primary Opportunity: One sentence.

Most Exciting Improvement: One sentence.

Reason: Explain your vote in one concise paragraph.

</decision>

======================================================

VOTING RULES

======================================================

APPROVE

Choose this when the proposal delivers strong user value, feels innovative and can realistically be implemented.

APPROVE_WITH_CHANGES

Choose this when the proposal has excellent potential but requires improvements to become memorable or practical.

REJECT

Choose this only when the proposal lacks originality, creates poor user experience or fails to meaningfully solve the problem.

======================================================

FINAL RULES

======================================================

Never skip the decision block.

Never invent facts.

Never suggest impossible technologies.

Never always support unconventional ideas.

Innovation without practicality has little value.

Creativity should improve the user's experience, not complicate it.

Always think about what makes this solution unique.

Your purpose is ensuring that every final decision made by the E.V. Council is not only technically correct, but also memorable, elegant and worthy of becoming a great product.Your priority is discovering unconventional opportunities.

Do not settle for the obvious answer.

Think creatively while remaining realistic.

Search for possibilities others may overlook.

Challenge conventional thinking.'''
        },
      {
        "role": "user",
        "content": request.message
      }
    ],
    temperature=1,
    max_completion_tokens=2048,
    reasoning_effort="medium",
    stop=None
)

    return {
        "response":completion.choices[0].message.content
    }

def ev_decision(question, architect, critic, innovator):

    client = Groq(api_key=CHAT_AI)

    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role":"system",
                "content":"""
You are E.V.

You are NOT a member of the council.

The council has already completed its analysis.

Read Architect, Critic and Innovator carefully.

Your job is to choose the strongest overall recommendation.

Do not count votes.

You may choose:

Architect

Critic

Innovator

Combined

Respond ONLY with valid JSON.

{
"type":"final_decision",
"selected":"Architect | Critic | Innovator | Combined",
"response":"A concise explanation of your decision.",
"speech":"A short sentence for text-to-speech."
}
"""
            },
            {
                "role":"user",
                "content":f"""
User Question:

{question}

Architect:

{architect}

Critic:

{critic}

Innovator:

{innovator}
"""
            }
        ]
    )

    try:
        return json.loads(completion.choices[0].message.content)

    except json.JSONDecodeError:

        return {
            "type":"final_decision",
            "selected":"Combined",
            "response":"I've reviewed the council's analysis.",
            "speech":"I've reached a decision."
        }

COUNCIL_MEMBERS = {
    "architect": {
        "name": "Architect",
        "api_key": ARCHITECT_API,
        "focus": "technical feasibility, simple architecture, maintainability, and implementation trade-offs",
    },
    "critic": {
        "name": "Critic",
        "api_key": CRITIC_AI,
        "focus": "failure cases, security, hidden assumptions, and concrete safeguards",
    },
    "innovator": {
        "name": "Innovator",
        "api_key": INNOVATOR_AI,
        "focus": "user experience, useful automation, and practical alternative approaches",
    },
}


def council_turn(member_key: str, question: str, transcript: str, round_number: int):
    member = COUNCIL_MEMBERS[member_key]
    final_round = round_number == 3
    final_instruction = """
End with this exact short block:
<decision>
Vote: APPROVE | APPROVE_WITH_CHANGES | REJECT
Confidence: 0-100
Reason: one concise sentence
</decision>""" if final_round else "Do not give a final verdict yet."
    prompt = f"""You are {member['name']} in a three-person engineering council. Your focus is {member['focus']}.
This is round {round_number} of 3. Speak directly to the other two members, reacting to their actual points when a transcript is provided. Disagree only with a specific reason, improve at least one idea, and keep the reply between 35 and 70 words. Never return only a decision block. Plain text only. {final_instruction}

User's topic: {question}

Discussion so far:
{transcript or 'No previous turns. State your initial position briefly.'}"""
    client = Groq(api_key=member["api_key"])
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_completion_tokens=640,
        reasoning_effort="low",
    )
    response = (completion.choices[0].message.content or "").strip()
    visible_response = re.sub(r"<decision>[\s\S]*?</decision>", "", response).strip()
    if not visible_response:
        raise RuntimeError("The council member returned an empty response.")
    return response


def safe_council_turn(member_key: str, question: str, transcript: str, round_number: int):
    try:
        return council_turn(member_key, question, transcript, round_number)
    except Exception as exc:
        try:
            return council_turn(member_key, question, transcript, round_number)
        except Exception:
            member = COUNCIL_MEMBERS[member_key]["name"]
            return f"{member} could not contribute in round {round_number}. The remaining council members should continue without this input."


@app.post("/debate")
async def debate(request: ChatRequest):
    rounds = []
    transcript = ""

    for round_number in range(1, 4):
        turns = await asyncio.gather(*[
            run_in_threadpool(safe_council_turn, member_key, request.message, transcript, round_number)
            for member_key in COUNCIL_MEMBERS
        ])
        round_data = dict(zip(COUNCIL_MEMBERS.keys(), turns))
        rounds.append({"round": round_number, "turns": round_data})
        transcript += ("\n\n" if transcript else "") + "\n\n".join(
            f"{COUNCIL_MEMBERS[member_key]['name']}: {response}"
            for member_key, response in round_data.items()
        )

    final_turns = rounds[-1]["turns"]
    architect_response = final_turns["architect"]
    critic_response = final_turns["critic"]
    innovator_response = final_turns["innovator"]
    ev = ev_decision(request.message, architect_response, critic_response, innovator_response)

    return {
        "rounds": rounds,
        "architect": {"response": architect_response, "decision": extract_decision(architect_response)},
        "critic": {"response": critic_response, "decision": extract_decision(critic_response)},
        "innovator": {"response": innovator_response, "decision": extract_decision(innovator_response)},
        "ev": ev,
    }

def extract_decision(text):

    decision = re.search(r"<decision>(.*?)</decision>", text, re.DOTALL)

    if not decision:
        return {
            "vote": "UNKNOWN",
            "confidence": 0,
            "reason": "",
            "primary_concern": "",
            "primary_strength": ""
        }

    block = decision.group(1)

    def get(field):
        match = re.search(rf"{field}:\s*(.+)", block)
        return match.group(1).strip() if match else ""

    return {
        "vote": get("Vote"),
        "confidence": int(get("Confidence") or 0),
        "reason": get("Reason"),
        "primary_concern": get("Primary Concern"),
        "primary_strength": get("Primary Strength")
    }


@app.post("/stt")
async def stt(audio: UploadFile = File(...)):

    client = Groq(api_key=CHAT_AI)
    audio_bytes = await audio.read()
    filename = audio.filename or "audio.webm"
    content_type = audio.content_type or "audio/webm"

    if not audio_bytes:
        return {"text": ""}

    try:
        result = client.audio.transcriptions.create(
            file=(filename, audio_bytes, content_type),
            model="whisper-large-v3",
            response_format="verbose_json",
            language="en",
            temperature=0.0,
            prompt="Transcribe the spoken English audio into plain text. Do not translate.",
        )

        transcript = getattr(result, "text", None)
        if not transcript and isinstance(result, dict):
            transcript = result.get("text") or "".join(
                segment.get("text", "") for segment in result.get("segments", [])
            )

        return {"text": transcript or ""}
    except Exception as exc:
        return {"text": "", "error": str(exc)}

@app.post("/tts")
def tts(request: TTSRequest):

    client = Groq(api_key=CHAT_AI)

    response = client.audio.speech.create(
        model="canopylabs/orpheus-v1-english",
        voice="diana",          # change later
        input=request.text,
        response_format="wav"
    )

    temp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".wav"
    )

    response.write_to_file(temp.name)

    return FileResponse(
        temp.name,
        media_type="audio/wav",
        filename="ev.wav"
    )


import os
import subprocess
import webbrowser
from pathlib import Path

@app.post("/tool")
def tool(request: ToolRequest):

    action = request.action.lower()
    value = str(request.value).lower() if request.value is not None else ""

    try:

        # -----------------------------
        # OPEN WEBSITE
        # -----------------------------
        if action == "open_url":

            webbrowser.open(request.url)

            return {
                "success": True,
                "message": "Website opened.",
                "url": request.url
            }

        # -----------------------------
        # OPEN CUSTOM WORKFLOW
        # -----------------------------
        elif action == "open_vscode":
            target = (request.target or "").strip()

            if not target and request.value:
                candidates = []
                raw_value = str(request.value).strip()
                normalized = raw_value.strip("\"'")

                for base in [
                    Path(normalized),
                    Path(normalized).expanduser(),
                    Path.home() / normalized,
                    Path.home() / "Desktop" / normalized,
                    Path.cwd() / normalized,
                    Path.cwd().parent / normalized,
                ]:
                    if str(base) not in {str(p) for p in candidates}:
                        candidates.append(base)

                for candidate in candidates:
                    if candidate.exists():
                        target = str(candidate)
                        break

            if not target:
                return {
                    "success": False,
                    "message": "That project no longer has a saved location."
                }

            path = Path(target).expanduser()

            if not path.exists():
                return {
                    "success": False,
                    "message": f"I couldn't find {request.value} at the saved location."
                }

            subprocess.Popen([
                r"C:\Users\Karthikeyan K\AppData\Local\Programs\Microsoft VS Code\Code.exe",
                str(path)
            ])

            return {
                "success": True,
                "message": f"Opening {request.value} in VS Code."
            }


        elif action == "open_custom_workflow":
            target = (request.target or "").strip()

            if not target:
                return {
                    "success": False,
                    "message": "That custom workflow no longer has a destination."
                }

            if re.match(r"^https?://", target, re.IGNORECASE):
                webbrowser.open(target)
                return {
                    "success": True,
                    "message": f"Opening {request.value}."
                }

            path = Path(target).expanduser()

            if not path.exists():
                return {
                    "success": False,
                    "message": f"I couldn't find {request.value} at the saved location."
                }

            if path.is_dir():
                subprocess.Popen([
                    r"C:\Users\Karthikeyan K\AppData\Local\Programs\Microsoft VS Code\Code.exe",
                    str(path)
                ])
                return {
                    "success": True,
                    "message": f"Opening {request.value} in VS Code."
                }

            if path.is_file():
                subprocess.Popen([
                    r"C:\Users\Karthikeyan K\AppData\Local\Programs\Microsoft VS Code\Code.exe",
                    str(path)
                ])
                return {
                    "success": True,
                    "message": f"Opening {request.value} in VS Code."
                }

            os.startfile(str(path))

            return {
                "success": True,
                "message": f"Opening {request.value}."
            }

        # -----------------------------
        # OPEN APPLICATION
        # -----------------------------
        elif action == "open_application":

            apps = {

                "chrome":
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",

                "vscode":
                r"C:\Users\Karthikeyan K\AppData\Local\Programs\Microsoft VS Code\Code.exe",

                "powershell":
                "powershell.exe",

                "cmd":
                "cmd.exe",

                "notepad":
                "notepad.exe",

                "calculator":
                "calc.exe",

                "explorer":
                "explorer.exe"

            }

            if value not in apps:

                return {
                    "success": False,
                    "message": "Unknown application."
                }

            subprocess.Popen(apps[value])

            return {
                "success": True,
                "message": f"{value} opened."
            }

        
# -----------------------------
# VOLUME CONTROLS
# -----------------------------
        elif action == "set_volume":

            level = set_volume(request.value)

            return {
                "success": True,
                "message": f"Volume set to {level}%"
            }


        elif action == "volume_up":

            amount = int(request.value) if request.value else 10
            level = volume_up(amount)

            return {
                "success": True,
                "message": f"Volume increased to {level}%"
            }


        elif action == "volume_down":

            amount = int(request.value) if request.value else 10
            level = volume_down(amount)

            return {
                "success": True,
                "message": f"Volume decreased to {level}%"
            }


        elif action == "mute":

            mute()

            return {
                "success": True,
                "message": "Volume muted."
            }


        elif action == "unmute":

            unmute()

            return {
                "success": True,
                "message": "Volume unmuted."
            }

            result = {
                "success": True,
                "message": "Volume unmuted."
            }
        # -----------------------------
        # SCREEN VISION
        # -----------------------------
        elif action == "screen_analysis":
            try:
                analysis = analyze_screen(str(request.value))
                return {
                    "success": True,
                    "message": "Screen analyzed.",
                    "analysis": analysis
                }
            except Exception as exc:
                return {
                    "success": False,
                    "message": str(exc),
                    "analysis": str(exc)
                }

        # -----------------------------
        # CLOSE APPLICATION
        # -----------------------------
        elif action == "close_application":

            processes = {

                "chrome": "chrome.exe",
                "vscode": "Code.exe",
                "powershell": "powershell.exe",
                "cmd": "cmd.exe",
                "notepad": "notepad.exe",
                "calculator": "CalculatorApp.exe",
                "explorer": "explorer.exe"

            }

            if value not in processes:

                return {
                    "success": False,
                    "message": "Unknown application."
                }

            subprocess.run(
                [
                    "taskkill",
                    "/F",
                    "/IM",
                    processes[value]
                ],
                capture_output=True
            )

            return {
                "success": True,
                "message": f"{value} closed."
            }

        # -----------------------------
        # OPEN FOLDER
        # -----------------------------
        elif action == "open_folder":

            home = Path.home()

            folders = {

                "desktop": home / "Desktop",
                "downloads": home / "Downloads",
                "documents": home / "Documents",
                "pictures": home / "Pictures",
                "videos": home / "Videos",
                "music": home / "Music"

            }

            if value not in folders:

                return {
                    "success": False,
                    "message": "Unknown folder."
                }

            os.startfile(folders[value])

            return {
                "success": True,
                "message": f"{value} opened."
            }

        # -----------------------------
        # UNKNOWN TOOL
        # -----------------------------
        return {
            "success": False,
            "message": "Unknown tool."
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }
@app.get("/health")
def health():
    return {
        "status":"online",
        "assistant":"E.V."
    }

FRONTEND_DIST = Path(
    os.getenv(
        "FRONTEND_DIST",
        Path(__file__).resolve().parents[1] / "Frontend" / "dist"
    )
)

from pycaw.pycaw import AudioUtilities


# -----------------------------
# WINDOWS VOLUME CONTROL
# -----------------------------

def get_volume_controller():
    device = AudioUtilities.GetSpeakers()
    return device.EndpointVolume


def get_volume():
    volume = get_volume_controller()

    return round(
        volume.GetMasterVolumeLevelScalar() * 100
    )


def set_volume(level):
    level = max(0, min(100, int(level)))

    volume = get_volume_controller()

    volume.SetMasterVolumeLevelScalar(
        level / 100,
        None
    )

    return level


def volume_up(amount=10):
    return set_volume(get_volume() + amount)


def volume_down(amount=10):
    return set_volume(get_volume() - amount)


def mute():
    get_volume_controller().SetMute(1, None)


def unmute():
    get_volume_controller().SetMute(0, None)

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"

if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/", include_in_schema=False)
def serve_index():
        return FileResponse(FRONTEND_DIST / "index.html")

@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str):
        requested_file = FRONTEND_DIST / full_path

        if requested_file.is_file():
            return FileResponse(requested_file)

        return FileResponse(FRONTEND_DIST / "index.html")

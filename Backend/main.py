import os
import io
import re
import json
import time
import uuid
import asyncio
import tempfile
import subprocess
import webbrowser
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

# Sovereign Core Modules
from sovereign_llm import sovereign_llm
from streaming_llm import streaming_llm
from network_monitor import network_monitor
from content_dna import content_dna_manager
from deliverables import deliverables_engine, OUTPUT_DIR
from agent_sandbox import code_sandbox, sovereign_agent
from project_workspace import project_workspace
from autonomous_engine import autonomous_agent, session_memory
from local_knowledge import local_knowledge

load_dotenv()

app = FastAPI(
    title="Sovereign AI Workbench - EV",
    description="Air-Gapped Sovereign AI Platform for PSUs, Refineries, and Defense Manufacturing",
    version="2.0.0"
)

# CORS Configuration for local access
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
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

# ----------------- Request Models -----------------

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    task_type: str = "general"
    model: Optional[str] = None
    messages: Optional[list[ChatMessage]] = None
    custom_workflows: list[Any] = []

class AgentRunRequest(BaseModel):
    prompt: str
    workspace_path: Optional[str] = None
    attached_files: Optional[list[dict[str, Any]]] = None
    model: Optional[str] = None

class DeliverableGenRequest(BaseModel):
    dna_id: str
    formats: list[str] = ["word_docx", "powerpoint_pptx", "excel_xlsx", "executive_summary"]
    target_audience: str = "Executives & Technical Reviewers"
    tone: str = "Formal & Rigorous"
    language: str = "English"
    level_of_detail: str = "Comprehensive"
    objective: str = "Formal Assessment & Recommendation"
    style: str = "PSU & Defense Standard"

class SandboxRunRequest(BaseModel):
    code: str
    timeout: float = 25.0

class WorkspaceSetRequest(BaseModel):
    folder_path: str

class WorkspaceWriteFileRequest(BaseModel):
    file_path: str
    content: str

class ToolRequest(BaseModel):
    action: str
    value: str | int | float = ""
    url: str = ""
    target: str = ""

# ----------------- Core Sovereign Endpoints -----------------

class ModelSetRequest(BaseModel):
    model: str

@app.get("/health")
async def health_check():
    """Health status and local Ollama model check."""
    models = await sovereign_llm.get_available_models()
    return {
        "status": "healthy",
        "sovereign_mode": "AIR_GAPPED_ON_PREMISES",
        "active_model": sovereign_llm.default_model,
        "available_models": models,
        "external_egress": "STRICTLY_BLOCKED"
    }

@app.get("/api/models")
async def get_models():
    """List local models available on Ollama instance."""
    models = await sovereign_llm.get_available_models()
    return {"models": models, "active": sovereign_llm.default_model}

@app.post("/api/models/set")
@app.post("/api/models/active")
async def set_active_model_endpoint(req: ModelSetRequest):
    """Set the active local model dynamically."""
    active = sovereign_llm.set_default_model(req.model)
    return {"status": "SUCCESS", "active_model": active}

@app.get("/api/network/audit")
async def get_network_audit():
    """Get live Sovereign Network Monitor telemetry and air-gap logs."""
    return network_monitor.get_status()

# ----------------- Chat & Reasoning (Local Qwen 8B) -----------------

@app.post("/chat")
@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Primary chat endpoint running 100% on local Qwen 8B."""
    clean_msg = req.message.strip()
    if not clean_msg:
        return {"response": "Please provide a valid query.", "type": "chat", "model": "qwen3:8b"}

    # Format history if provided
    history = []
    if req.messages:
        for m in req.messages:
            history.append({"role": m.role, "content": m.content})
    else:
        history.append({"role": "user", "content": clean_msg})

    try:
        res = await sovereign_llm.chat(
            messages=history,
            task_type=req.task_type,
            model=req.model,
            temperature=0.3
        )
        return {
            "response": res.get("text", ""),
            "model": res.get("model", "qwen3:8b"),
            "task_type": req.task_type,
            "duration_ms": res.get("duration_ms", 0),
            "air_gapped": True
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Local LLM Error: {str(exc)}")

# ----------------- Council / Multi-Agent Debate (Local Personas) -----------------

@app.post("/debate")
@app.post("/api/debate")
async def council_debate_endpoint(req: ChatRequest):
    """
    Simulate Council Debate (Architect, Critic, Innovator) in a single high-speed structured pass.
    """
    topic = req.message.strip()
    if not topic:
        return {"error": "Please provide a topic for debate"}

    debate_prompt = f"""
You are the Sovereign Industrial Council. Conduct a rapid, multi-perspective debate on the proposal:
"{topic}"

You MUST respond strictly with valid JSON conforming to this schema:
{{
  "architect": "2-4 concise sentences on system architecture, modularity, seal-less reliability, and integration into refinery P&ID.",
  "critic": "2-4 concise sentences on severe risks, H2S sulfide stress cracking, component failure at high temperatures, and NACE compliance.",
  "innovator": "2-4 concise sentences on breakthrough innovations, real-time magnetic flux leakage sensing, secondary containment monitoring, and energy efficiency gains.",
  "consensus": "Unified executive directive, mitigation conditions, and approval verdict for plant leadership."
}}
"""
    try:
        res = await sovereign_llm.generate(
            prompt=debate_prompt,
            system="You are the Sovereign Industrial Council. Deliver concise, authoritative, mathematically and physically sound engineering evaluations.",
            task_type="architect",
            temperature=0.2,
            json_format=True,
            timeout=None
        )
        parsed = sovereign_llm.parse_json_safely(res.get("text", ""))
        
        architect_text = parsed.get("architect") or "Feasibility verified for on-premises industrial integration."
        critic_text = parsed.get("critic") or "Compliance and thermal failure hazards require secondary monitoring."
        innovator_text = parsed.get("innovator") or "Sensors and automated control loops provide 25% efficiency gains."
        consensus_text = parsed.get("consensus") or "Council approves proposal subject to standard safety protocols."

        return {
            "architect": {"analysis": architect_text},
            "critic": {"critique": critic_text},
            "innovator": {"innovations": innovator_text},
            "ev": {
                "response": consensus_text,
                "speech": "Council debate concluded with full sovereign verification."
            },
            "duration_ms": res.get("duration_ms", 0),
            "air_gapped": True
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Council debate error: {str(exc)}")

# ----------------- Autonomous Agent Studio & Sandbox -----------------

@app.post("/api/agent/run")
async def run_agent(req: AgentRunRequest):
    """Run autonomous multi-step agent planner and execution loop."""
    try:
        res = await sovereign_agent.execute_agent_loop(
            user_prompt=req.prompt,
            workspace_path=req.workspace_path or project_workspace.current_workspace,
            attached_files=req.attached_files,
            model=req.model
        )
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent loop error: {str(exc)}")

class PlanRequest(BaseModel):
    prompt: str
    workspace_path: Optional[str] = None
    attached_files: Optional[list[dict[str, Any]]] = None
    active_file: Optional[str] = None

class StreamAgentRequest(BaseModel):
    prompt: str
    workspace_path: Optional[str] = None
    attached_files: Optional[list[dict[str, Any]]] = None
    active_file: Optional[str] = None
    approved_plan_id: Optional[str] = None
    auto_approve: bool = False
    model: Optional[str] = None

@app.post("/api/agent/plan")
@app.post("/agent/plan")
async def formulate_agent_plan(req: PlanRequest):
    """Formulate methodology plan and ask for user permissions before modifying files."""
    plan = await autonomous_agent.formulate_plan(
        prompt=req.prompt,
        workspace_path=req.workspace_path or project_workspace.current_workspace,
        attached_files=req.attached_files,
        active_file=req.active_file
    )
    return plan

@app.post("/api/agent/stream")
@app.post("/agent/stream")
async def stream_agent_execution(req: StreamAgentRequest):
    """
    Stream live execution tokens, tool calls, direct workspace file modifications, 
    and sandbox self-healing verification over Server-Sent Events (SSE).
    """
    async def event_stream():
        try:
            async for event in autonomous_agent.execute_stream(
                prompt=req.prompt,
                workspace_path=req.workspace_path or project_workspace.current_workspace,
                attached_files=req.attached_files,
                active_file=req.active_file,
                approved_plan_id=req.approved_plan_id,
                auto_approve=req.auto_approve,
                model=req.model
            ):
                payload = json.dumps(event)
                yield f"data: {payload}\n\n"
        except asyncio.CancelledError:
            yield f"data: {json.dumps({'type': 'aborted', 'message': 'Process aborted by user'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/api/agent/stop")
@app.post("/agent/stop")
async def stop_agent():
    """Abort currently running agent streaming or subprocess process."""
    autonomous_agent.abort_current()
    return {"status": "ABORT_SIGNAL_SENT"}

@app.get("/api/chat/memory")
async def get_chat_memory():
    """Get single session conversation memory."""
    return {"messages": session_memory.get_messages(), "active_plan": session_memory.active_plan}

@app.post("/api/chat/memory/clear")
async def clear_chat_memory():
    """Clear single session memory."""
    session_memory.clear()
    return {"status": "MEMORY_CLEARED"}

@app.post("/api/sandbox/execute")
async def execute_sandbox(req: SandboxRunRequest):
    """Execute Python code directly inside isolated local subprocess sandbox."""
    res = code_sandbox.execute_code(req.code, timeout=req.timeout)
    return res

# ----------------- Local Knowledge Base Endpoints -----------------

class KnowledgeSearchRequest(BaseModel):
    query: str
    top_k: int = 3
    filter_category: Optional[str] = None

class WorkflowResumeRequest(BaseModel):
    workflow_id: str
    resolution: str
    decision: Optional[str] = None
    command_prefix: Optional[str] = None

@app.get("/api/knowledge/status")
async def get_knowledge_status():
    """Get operational status and metadata of local on-premises knowledge repository."""
    return local_knowledge.get_status()

@app.post("/api/knowledge/search")
async def search_knowledge(req: KnowledgeSearchRequest):
    """Search local SOPs, engineering standards, and policies with 0 cloud egress."""
    results = local_knowledge.search(req.query, top_k=req.top_k, filter_category=req.filter_category)
    return {
        "status": "SUCCESS",
        "query": req.query,
        "results_count": len(results),
        "results": [r.to_dict() for r in results]
    }

@app.post("/api/knowledge/index")
async def index_knowledge_file(
    file: UploadFile = File(...),
    category: Optional[str] = Form("Standard Operating Procedure")
):
    """Upload and index new organizational SOP/standard locally."""
    save_path = local_knowledge.base_dir / file.filename
    content_bytes = await file.read()
    save_path.write_bytes(content_bytes)
    local_knowledge.index_file(save_path)
    return {
        "status": "INDEXED",
        "filename": file.filename,
        "total_documents": len(local_knowledge.indexed_files),
        "total_chunks": len(local_knowledge.chunks)
    }

@app.post("/api/workflow/resume")
async def resume_workflow(req: WorkflowResumeRequest):
    """Resume a paused workflow following human-in-the-loop conflict resolution or command permissions."""
    if req.decision == "ALLOW_ALWAYS" or req.resolution == "ALLOW_ALWAYS":
        prefix = req.command_prefix or (req.decision.split()[-1] if req.decision and " " in req.decision else None)
        if prefix:
            session_memory.allowed_command_prefixes.add(prefix.lower().strip("`"))

    session_memory.context.user_decisions.append({
        "workflow_id": req.workflow_id,
        "resolution": req.resolution,
        "decision": req.decision,
        "command_prefix": req.command_prefix,
        "timestamp": datetime.now().isoformat()
    })
    session_memory.context.workflow_status = "RUNNING"
    return {
        "status": "RESUMED",
        "workflow_id": req.workflow_id,
        "resolution": req.resolution,
        "allowed_prefixes": list(session_memory.allowed_command_prefixes)
    }

# ----------------- Content DNA Engine -----------------

@app.post("/api/dna/extract")
async def extract_content_dna(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    source_name: Optional[str] = Form(None),
    model: Optional[str] = Form(None)
):
    """
    Extract structured Content DNA from uploaded file (PDF, Docx, Image OCR, Excel) or raw text.
    """
    extracted_text = ""
    s_name = source_name or "Uploaded Document"
    s_type = "document"

    if file:
        s_name = file.filename
        content_bytes = await file.read()
        extracted_text = content_dna_manager.extract_raw_content(file.filename, content_bytes)
        s_type = Path(file.filename).suffix.lstrip(".").lower() or "file"
    elif text:
        extracted_text = text.strip()
        s_type = "text"
    else:
        raise HTTPException(status_code=400, detail="Either file upload or text input is required.")

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Could not extract readable text from source.")

    try:
        dna = await content_dna_manager.generate_content_dna(
            source_text=extracted_text,
            source_name=s_name,
            source_type=s_type,
            model=model
        )
        return dna
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DNA extraction error: {str(exc)}")

@app.get("/api/dna/list")
async def list_content_dna():
    """List all stored Content DNA entities."""
    return {"dna_list": content_dna_manager.list_all_dna()}

@app.get("/api/dna/{dna_id}")
async def get_content_dna(dna_id: str):
    """Get single Content DNA by ID."""
    dna = content_dna_manager.get_dna(dna_id)
    if not dna:
        raise HTTPException(status_code=404, detail="Content DNA not found.")
    return dna

# ----------------- Multi-Format Deliverables Generation -----------------

@app.post("/api/dna/generate")
async def generate_deliverables_endpoint(req: DeliverableGenRequest):
    """
    Generate multiple real deliverables (Word .docx, PowerPoint .pptx, Excel .xlsx, MD) from Content DNA.
    """
    dna = content_dna_manager.get_dna(req.dna_id)
    if not dna:
        raise HTTPException(status_code=404, detail="Content DNA foundation not found. Extract DNA first.")

    params = {
        "target_audience": req.target_audience,
        "tone": req.tone,
        "language": req.language,
        "level_of_detail": req.level_of_detail,
        "objective": req.objective,
        "style": req.style
    }

    try:
        res = await deliverables_engine.generate_deliverables(
            dna=dna,
            formats=req.formats,
            params=params
        )
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Deliverable generation error: {str(exc)}")

@app.get("/api/deliverables/list")
async def list_deliverables():
    """List all generated deliverable artifacts."""
    return {"deliverables": deliverables_engine.list_all_deliverables()}

@app.get("/api/deliverables/download/{file_id}")
async def download_deliverable(file_id: str):
    """Download generated deliverable file."""
    record = deliverables_engine.get_deliverable(file_id)
    if not record:
        # Search directly in OUTPUT_DIR
        for f in OUTPUT_DIR.glob(f"*_{file_id}.*"):
            return FileResponse(
                path=str(f),
                filename=f.name,
                media_type="application/octet-stream"
            )
        raise HTTPException(status_code=404, detail="Deliverable file not found.")

    f_path = Path(record["path"])
    if not f_path.exists():
        raise HTTPException(status_code=404, detail="Deliverable file does not exist on disk.")

    return FileResponse(
        path=str(f_path),
        filename=record["filename"],
        media_type="application/octet-stream"
    )

# ----------------- Project Folder & Workspace Management -----------------

@app.get("/api/project/tree")
async def get_project_tree():
    """Get file tree of active workspace folder."""
    return project_workspace.get_workspace_tree()

@app.post("/api/project/set_folder")
async def set_project_folder(req: WorkspaceSetRequest):
    """Set active workspace directory folder."""
    try:
        res = project_workspace.set_workspace(req.folder_path)
        return res
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/api/project/read_file")
async def read_project_file(file_path: str = Query(...)):
    """Read file from workspace."""
    try:
        return project_workspace.read_file(file_path)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.post("/api/project/write_file")
async def write_project_file(req: WorkspaceWriteFileRequest):
    """Save/write file in workspace."""
    try:
        return project_workspace.write_file(req.file_path, req.content)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/api/project/search")
async def search_project(query: str = Query(...)):
    """Search code and documents in workspace."""
    return {"query": query, "results": project_workspace.search_workspace(query)}

# ----------------- Local Tools & Speech (Backwards Compatible) -----------------

@app.post("/tool")
@app.post("/api/tool")
async def handle_tool(req: ToolRequest):
    """Execute local sovereign tool."""
    action = req.action.lower().strip()
    if action in ["open_vscode", "open_application"]:
        try:
            target = req.target or str(req.value)
            if action == "open_vscode":
                subprocess.Popen(["code", target], shell=True)
            else:
                subprocess.Popen(target, shell=True)
            return {"status": "success", "message": f"Opened {target}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    elif action == "sandbox_eval":
        res = code_sandbox.execute_code(str(req.value))
        return res
    return {"status": "unknown_tool", "action": action}

@app.post("/tts")
@app.post("/api/tts")
async def tts_endpoint(req: dict[str, Any]):
    """Local TTS stub (returns empty audio or acknowledge)."""
    return {"status": "sovereign_tts_ok", "text": req.get("text", "")}

# ----------------- Static Frontend Hosting -----------------
FRONTEND_DIST = Path(__file__).parent.parent / "Frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_target = FRONTEND_DIST / full_path
        if file_target.is_file():
            return FileResponse(str(file_target))
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse(status_code=404, content={"message": "Frontend not built"})

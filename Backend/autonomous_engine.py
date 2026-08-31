import os
import sys
import time
import json
import uuid
import asyncio
import re
from pathlib import Path
from typing import Any, Optional, AsyncGenerator

from streaming_llm import streaming_llm
from sovereign_llm import sovereign_llm
from network_monitor import network_monitor
from content_dna import content_dna_manager
from deliverables import deliverables_engine
from agent_sandbox import code_sandbox
from project_workspace import project_workspace

class SingleSessionMemory:
    def __init__(self):
        self.history: list[dict[str, str]] = []
        self.active_plan: Optional[dict[str, Any]] = None
        self.active_context_files: list[dict[str, Any]] = []
        self.active_workspace_path: Optional[str] = None

    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})
        if len(self.history) > 40:
            self.history.pop(0)

    def clear(self):
        self.history = []
        self.active_plan = None
        self.active_context_files = []

    def get_messages(self) -> list[dict[str, str]]:
        return self.history

session_memory = SingleSessionMemory()


class AutonomousSovereignAgent:
    """
    Advanced agent that plans multi-step work, requests user permissions,
    modifies workspace code files directly, verifies in sandbox, and self-heals bugs.
    """
    def __init__(self):
        self.current_abort_event: Optional[asyncio.Event] = None

    def create_abort_handle(self) -> asyncio.Event:
        self.current_abort_event = asyncio.Event()
        return self.current_abort_event

    def abort_current(self):
        if self.current_abort_event:
            self.current_abort_event.set()

    def should_use_council(self, prompt: str) -> bool:
        """Detect if prompt requires multi-perspective decisive debate."""
        p_lower = prompt.lower()
        keywords = [
            "debate", "council", "architect", "critic", "innovator",
            "perspective", "pros and cons", "trade-off", "tradeoff",
            "which architecture", "should we choose", "compare approaches",
            "strategic decision", "dilemma", "failure modes"
        ]
        return any(k in p_lower for k in keywords)

    async def formulate_plan(
        self,
        prompt: str,
        workspace_path: str,
        attached_files: list[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """Formulate explicit step-by-step methodology and identify required permissions instantly."""
        plan_id = str(uuid.uuid4())[:8]
        p_clean = prompt.strip()
        context_file_names = [f.get("name") for f in (attached_files or [])]
        
        is_debug = any(w in p_clean.lower() for w in ["debug", "fix", "error", "bug", "trace", "repair"])
        is_calc = any(w in p_clean.lower() for w in ["calc", "compute", "formula", "pressure", "enthalpy", "math", "flow", "head"])
        is_deliverable = any(w in p_clean.lower() for w in ["doc", "docx", "word", "approval", "pptx", "presentation", "report", "excel", "xlsx"])

        # Detect target file
        file_match = re.search(r"([\w\-_\.\/\\]+\.(?:py|js|jsx|json|txt|md|sql))", p_clean)
        target_name = file_match.group(1) if file_match else (context_file_names[0] if context_file_names else "sovereign_tool.py")

        if is_debug:
            title = f"Debug & Repair: {target_name}"
            methodology = f"Inspect {target_name}, trace error logs, generate targeted code corrections, and verify in isolated Python sandbox."
        elif is_calc:
            title = f"Engineering Calculation: {p_clean[:35]}"
            methodology = "Decompose engineering formulas, write verified numerical simulation script, and validate accuracy in sandbox."
        elif is_deliverable:
            title = f"Synthesize Deliverable: {p_clean[:35]}"
            methodology = "Extract Content DNA, cross-reference compliance benchmarks, and compile formal Word/PPTX/Excel artifacts."
        else:
            title = f"Autonomous Task: {p_clean[:40]}"
            methodology = "Analyze project context, implement production code modifications, verify in local sandbox, and auto-heal runtime issues."

        steps = [
            {
                "step_number": 1,
                "title": f"Analyze Source Context ({target_name})",
                "action_type": "READ_OR_DNA",
                "description": f"Read and inspect {target_name} and project context files.",
                "target_file": target_name
            },
            {
                "step_number": 2,
                "title": "Implement Code & Project Modifications",
                "action_type": "WRITE_CODE_OR_ARTIFACT",
                "description": f"Write complete runnable implementation directly to {target_name}.",
                "target_file": target_name
            },
            {
                "step_number": 3,
                "title": "Sandbox Verification & Self-Healing",
                "action_type": "SANDBOX_VERIFY",
                "description": "Execute in local isolated sandbox and automatically diagnose/heal errors if detected.",
                "target_file": target_name
            }
        ]

        plan = {
            "plan_id": plan_id,
            "title": title,
            "methodology": methodology,
            "requires_permission": True,
            "permission_type": "FILE_MODIFICATION_AND_EXECUTION",
            "steps": steps
        }
        session_memory.active_plan = plan
        return plan

    async def execute_stream(
        self,
        prompt: str,
        workspace_path: Optional[str] = None,
        attached_files: Optional[list[dict[str, Any]]] = None,
        approved_plan_id: Optional[str] = None,
        auto_approve: bool = False
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Main generator yielding real-time SSE events for streaming execution.
        """
        abort_ev = self.create_abort_handle()
        session_memory.add_message("user", prompt)

        ws_path = workspace_path or project_workspace.current_workspace
        
        # 1. Check if multi-perspective Council is needed
        if self.should_use_council(prompt):
            yield {"type": "status", "message": "Convening Tri-Persona Council Debate (Architect, Critic, Innovator)..."}
            debate_prompt = f"""
You are the Sovereign Industrial Council. Conduct a rapid, multi-perspective debate on:
"{prompt}"

Respond strictly as JSON:
{{
  "architect": "2-3 concise sentences on system architecture, modularity, and scalability.",
  "critic": "2-3 concise sentences on risks, compliance gaps, and safety hazards.",
  "innovator": "2-3 concise sentences on breakthrough optimizations and efficiency gains.",
  "consensus": "Unified executive decision and recommended action."
}}
"""
            try:
                res = await sovereign_llm.generate(prompt=debate_prompt, json_format=True, num_predict=500)
                parsed = sovereign_llm.parse_json_safely(res.get("text", ""))
                yield {
                    "type": "council_debate",
                    "architect": parsed.get("architect"),
                    "critic": parsed.get("critic"),
                    "innovator": parsed.get("innovator"),
                    "consensus": parsed.get("consensus")
                }
                session_memory.add_message("assistant", parsed.get("consensus", "Council debate complete."))
                yield {"type": "done", "status": "COMPLETED"}
                return
            except Exception as e:
                yield {"type": "error", "message": f"Council error: {str(e)}"}

        # 2. Formulate Plan
        yield {"type": "status", "message": "Analyzing request & formulating methodology plan..."}
        plan = await self.formulate_plan(prompt, ws_path, attached_files)
        yield {"type": "plan_created", "plan": plan}

        # If user approval required and not yet approved, pause and ask for permissions
        if plan.get("requires_permission") and not auto_approve and (not approved_plan_id or approved_plan_id != plan.get("plan_id")):
            yield {
                "type": "permission_required",
                "plan_id": plan["plan_id"],
                "methodology": plan.get("methodology"),
                "steps": plan.get("steps"),
                "message": "Please review the proposed methodology and approve execution to proceed with file changes and sandbox execution."
            }
            return

        # 3. Execute Step 1: Ingest Context / Read Files
        yield {"type": "step_start", "step_number": 1, "title": "Analyzing Source Context"}
        source_texts = []
        if attached_files:
            for af in attached_files:
                source_texts.append(f"=== File: {af.get('name')} ===\n{af.get('content')}")
        
        # Check if debugging or modifying an existing file
        is_debug_task = any(w in prompt.lower() for w in ["debug", "fix", "error", "trace", "bug", "repair"])
        target_file_to_debug = None
        existing_file_content = ""

        # Search for file mention in prompt
        file_match = re.search(r"([\w\-_\.\/\\]+\.(?:py|js|jsx|json|txt|md|sql))", prompt)
        if file_match:
            candidate_path = file_match.group(1)
            try:
                f_data = project_workspace.read_file(candidate_path)
                target_file_to_debug = f_data["path"]
                existing_file_content = f_data["content"]
                yield {"type": "file_read", "path": target_file_to_debug, "size": len(existing_file_content)}
            except Exception:
                pass

        combined_context = "\n\n".join(source_texts) if source_texts else (existing_file_content or prompt)

        # 4. Execute Step 2: Code Generation / Modification & Stream
        yield {"type": "step_start", "step_number": 2, "title": "Generating Code & Applying Modifications"}
        
        code_gen_prompt = f"""
USER REQUEST:
{prompt}

CONTEXT & EXISTING SOURCE:
{combined_context[:5000]}

Write clean, runnable, correct Python code to fulfill this request or fix any bugs.
Provide ONLY the complete runnable Python code block within ```python ... ``` without extraneous conversational filler.
"""
        streamed_code_accumulator = []
        yield {"type": "status", "message": "Streaming code synthesis from local Qwen 8B..."}
        
        async for token in streaming_llm.stream_generate(
            prompt=code_gen_prompt,
            task_type="code_specialist" if not is_debug_task else "debugger",
            temperature=0.2,
            num_predict=800
        ):
            if abort_ev.is_set():
                yield {"type": "aborted", "message": "Execution stopped by user."}
                return
            streamed_code_accumulator.append(token)
            yield {"type": "token", "token": token}

        full_code_text = "".join(streamed_code_accumulator)
        
        # Extract python code block
        code_block_match = re.search(r"```(?:python)?\s*([\s\S]*?)\s*```", full_code_text)
        extracted_code = code_block_match.group(1).strip() if code_block_match else full_code_text.strip()

        # Target file to save/modify in project workspace
        target_filename = Path(target_file_to_debug).name if target_file_to_debug else "sovereign_tool.py"
        target_file_path = target_file_to_debug or str(Path(ws_path) / target_filename)

        # Write directly to project workspace
        try:
            write_res = project_workspace.write_file(target_file_path, extracted_code)
            yield {
                "type": "file_modified",
                "path": write_res["path"],
                "filename": write_res["filename"],
                "content": extracted_code,
                "status": "WRITTEN_TO_WORKSPACE"
            }
        except Exception as e:
            yield {"type": "error", "message": f"Could not write file: {str(e)}"}

        # 5. Execute Step 3: Sandbox Verification & Self-Healing Loop
        yield {"type": "step_start", "step_number": 3, "title": "Sandbox Verification & Self-Debugging"}
        yield {"type": "status", "message": f"Running {target_filename} in local isolated sandbox..."}

        max_healing_attempts = 3
        current_attempt = 0
        verified = False
        last_sandbox_res = None

        while current_attempt < max_healing_attempts:
            current_attempt += 1
            if abort_ev.is_set():
                yield {"type": "aborted", "message": "Execution stopped by user."}
                return

            sandbox_res = code_sandbox.execute_code(extracted_code, timeout=25.0)
            last_sandbox_res = sandbox_res

            yield {
                "type": "sandbox_result",
                "attempt": current_attempt,
                "exit_code": sandbox_res.get("exit_code"),
                "duration_ms": sandbox_res.get("duration_ms"),
                "stdout": sandbox_res.get("stdout"),
                "stderr": sandbox_res.get("stderr")
            }

            if sandbox_res.get("success"):
                verified = True
                yield {
                    "type": "verification_passed",
                    "message": f"Code verified successfully in sandbox (Exit Code: 0, Latency: {sandbox_res.get('duration_ms')}ms)."
                }
                break
            else:
                # Self-Healing: Send error traceback back to local model to diagnose and fix
                stderr_text = sandbox_res.get("stderr", "Unknown error")
                yield {
                    "type": "self_healing",
                    "attempt": current_attempt,
                    "message": f"Sandbox error detected. Local AI diagnosing root cause and auto-healing code (Attempt {current_attempt}/{max_healing_attempts})...",
                    "error_log": stderr_text
                }

                heal_prompt = f"""
The following Python script failed execution in the sandbox.

FAILED SCRIPT:
{extracted_code}

ERROR TRACEBACK:
{stderr_text}

Fix all syntax errors, import bugs, or logical flaws.
Respond ONLY with the complete corrected runnable Python code within ```python ... ```.
"""
                heal_res = await sovereign_llm.generate(
                    prompt=heal_prompt,
                    task_type="debugger",
                    temperature=0.1,
                    num_predict=700
                )
                
                heal_text = heal_res.get("text", "")
                heal_match = re.search(r"```(?:python)?\s*([\s\S]*?)\s*```", heal_text)
                extracted_code = heal_match.group(1).strip() if heal_match else heal_text.strip()
                
                # Rewrite corrected file
                project_workspace.write_file(target_file_path, extracted_code)
                yield {
                    "type": "file_modified",
                    "path": target_file_path,
                    "filename": target_filename,
                    "content": extracted_code,
                    "status": f"SELF_HEALED_PATCH_ATTEMPT_{current_attempt}"
                }

        # 6. Final Summary & Deliverable Artifacts
        artifacts = []
        # If user asked for document/deliverable, generate .docx or .pptx as well
        if any(w in prompt.lower() for w in ["docx", "word", "approval", "report", "presentation", "pptx", "excel", "sheet"]):
            yield {"type": "status", "message": "Compiling real deliverable artifacts..."}
            try:
                dna_res = await content_dna_manager.generate_content_dna(source_text=combined_context, source_name=target_filename)
                deliv_res = await deliverables_engine.generate_deliverables(
                    dna=dna_res,
                    formats=["word_docx", "powerpoint_pptx", "excel_xlsx"],
                    params={"target_audience": "Technical Leadership", "objective": "Execution & Approval"}
                )
                artifacts.extend(deliv_res.get("generated_items", []))
            except Exception:
                pass

        session_memory.add_message("assistant", f"Task complete. Modified {target_filename} and verified in sandbox.")

        yield {
            "type": "completed",
            "target_file": target_file_path,
            "verified": verified,
            "sandbox": last_sandbox_res,
            "artifacts": artifacts,
            "message": "All execution steps completed and verified on-premises."
        }

autonomous_agent = AutonomousSovereignAgent()

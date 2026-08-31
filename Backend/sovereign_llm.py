import os
import json
import time
import re
import httpx
from typing import Any, Optional
from network_monitor import network_monitor

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
DEFAULT_MODEL = os.getenv("LOCAL_MODEL", "qwen3:8b")

TASK_PROMPTS = {
    "general": (
        "You are EV Sovereign, an air-gapped on-premises industrial AI assistant designed for "
        "refineries, PSUs, defense manufacturing, and sovereign infrastructure. "
        "Provide direct, factual, mathematically sound, and actionable responses."
    ),
    "code_specialist": (
        "You are an expert industrial software engineer and automation specialist. "
        "Write clean, safe, self-contained, and production-ready code with complete comments, "
        "error handling, and mathematical accuracy. Return runnable code blocks."
    ),
    "content_dna_extractor": (
        "You are an advanced sovereign document understanding and Content DNA semantic extraction engine. "
        "Analyze documents, drawings, inspection reports, or text with high precision "
        "and produce a comprehensive, structured JSON representation adhering strictly to the Content DNA specification."
    ),
    "deliverable_generator": (
        "You are an executive deliverable generator for sovereign industrial organizations (PSUs, Refineries, Defense). "
        "Generate formal, publication-ready output tailored to the exact audience, tone, and format requested. "
        "Include precise facts, tables, step-by-step calculations, and actionable recommendations."
    ),
    "agent_planner": (
        "You are an autonomous sovereign agent planner. "
        "Decompose complex multi-step industrial and coding tasks into clear, executable steps."
    ),
    "architect": (
        "You are the Chief Architect in an industrial sovereign council. Focus on system architecture, "
        "robustness, modularity, air-gap security, scalability, and long-term maintainability."
    ),
    "critic": (
        "You are the Chief Risk Officer and Safety Inspector. Critically examine safety hazards, "
        "compliance risks, edge-case failure modes, P&ID drawing inconsistencies, and engineering vulnerabilities."
    ),
    "innovator": (
        "You are the Chief Innovation Engineer. Propose breakthrough optimizations, AI automation pipelines, "
        "energy efficiency gains, and novel sovereign workflows."
    ),
}

class SovereignLLM:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, default_model: str = DEFAULT_MODEL):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.cached_models: list[str] = []
        self.last_model_check: float = 0

    async def get_available_models(self) -> list[str]:
        now = time.time()
        if self.cached_models and (now - self.last_model_check < 30):
            return self.cached_models
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", []) if m.get("name")]
                    if models:
                        self.cached_models = models
                        self.last_model_check = now
                        return models
        except Exception:
            pass
        return self.cached_models or [self.default_model]

    async def get_active_model(self, requested_model: Optional[str] = None) -> str:
        if requested_model and requested_model.strip():
            return requested_model.strip()
        models = await self.get_available_models()
        if self.default_model in models:
            return self.default_model
        return models[0] if models else self.default_model

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        task_type: str = "general",
        model: Optional[str] = None,
        temperature: float = 0.2,
        json_format: bool = False,
        timeout: Optional[float] = None,
        num_predict: Optional[int] = None,
        num_ctx: Optional[int] = None,
        **kwargs
    ) -> dict[str, Any]:
        """Generate completion from local Qwen 8B via Ollama."""
        selected_model = await self.get_active_model(model)
        system_prompt = system or TASK_PROMPTS.get(task_type, TASK_PROMPTS["general"])
        
        start_t = time.time()
        payload = {
            "model": selected_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_ctx": num_ctx or 4096,
                "num_predict": num_predict or 768,
                "num_thread": 8,
            }
        }
        if json_format:
            payload["format"] = "json"

        prompt_est = len(prompt) // 4 + len(system_prompt) // 4
        http_timeout = httpx.Timeout(timeout, connect=60.0, read=timeout, write=60.0)

        try:
            async with httpx.AsyncClient(timeout=http_timeout) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                duration_ms = (time.time() - start_t) * 1000
                
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "").strip()
                    comp_est = len(response_text) // 4
                    
                    network_monitor.log_call(
                        endpoint=f"/api/generate ({task_type})",
                        model=selected_model,
                        prompt_tokens_est=prompt_est,
                        completion_tokens_est=comp_est,
                        status="200 OK (ON-PREMISES)",
                        duration_ms=duration_ms
                    )
                    
                    return {
                        "text": response_text,
                        "model": selected_model,
                        "task_type": task_type,
                        "duration_ms": round(duration_ms, 2),
                        "air_gapped": True
                    }
                else:
                    network_monitor.log_call(
                        endpoint="/api/generate",
                        model=selected_model,
                        prompt_tokens_est=prompt_est,
                        completion_tokens_est=0,
                        status=f"HTTP_{res.status_code}",
                        duration_ms=duration_ms
                    )
                    raise RuntimeError(f"Local Ollama returned status {res.status_code}: {res.text}")
        except Exception as e:
            duration_ms = (time.time() - start_t) * 1000
            network_monitor.log_call(
                endpoint="/api/generate",
                model=selected_model,
                prompt_tokens_est=prompt_est,
                completion_tokens_est=0,
                status=f"ERROR: {str(e)[:40]}",
                duration_ms=duration_ms
            )
            raise

    async def chat(
        self,
        messages: list[dict[str, str]],
        task_type: str = "general",
        model: Optional[str] = None,
        temperature: float = 0.2,
        json_format: bool = False,
        timeout: Optional[float] = None,
        num_predict: Optional[int] = None,
        num_ctx: Optional[int] = None,
        **kwargs
    ) -> dict[str, Any]:
        """Chat completion using local Qwen 8B via Ollama API."""
        selected_model = await self.get_active_model(model)
        system_content = TASK_PROMPTS.get(task_type, TASK_PROMPTS["general"])
        
        formatted_messages = []
        has_system = False
        for msg in messages:
            if msg.get("role") == "system":
                has_system = True
                formatted_messages.append(msg)
            else:
                formatted_messages.append(msg)
        if not has_system:
            formatted_messages.insert(0, {"role": "system", "content": system_content})

        start_t = time.time()
        payload = {
            "model": selected_model,
            "messages": formatted_messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_ctx": num_ctx or 4096,
                "num_predict": num_predict or 768,
                "num_thread": 8,
            }
        }
        if json_format:
            payload["format"] = "json"

        prompt_est = sum(len(m.get("content", "")) // 4 for m in formatted_messages)
        http_timeout = httpx.Timeout(timeout, connect=60.0, read=timeout, write=60.0)

        try:
            async with httpx.AsyncClient(timeout=http_timeout) as client:
                res = await client.post(f"{self.base_url}/api/chat", json=payload)
                duration_ms = (time.time() - start_t) * 1000

                if res.status_code == 200:
                    data = res.json()
                    msg = data.get("message", {})
                    response_text = msg.get("content", "").strip()
                    comp_est = len(response_text) // 4

                    network_monitor.log_call(
                        endpoint=f"/api/chat ({task_type})",
                        model=selected_model,
                        prompt_tokens_est=prompt_est,
                        completion_tokens_est=comp_est,
                        status="200 OK (ON-PREMISES)",
                        duration_ms=duration_ms
                    )

                    return {
                        "text": response_text,
                        "model": selected_model,
                        "task_type": task_type,
                        "duration_ms": round(duration_ms, 2),
                        "air_gapped": True
                    }
                else:
                    network_monitor.log_call(
                        endpoint="/api/chat",
                        model=selected_model,
                        prompt_tokens_est=prompt_est,
                        completion_tokens_est=0,
                        status=f"HTTP_{res.status_code}",
                        duration_ms=duration_ms
                    )
                    raise RuntimeError(f"Local Ollama chat returned status {res.status_code}: {res.text}")
        except Exception as e:
            duration_ms = (time.time() - start_t) * 1000
            network_monitor.log_call(
                endpoint="/api/chat",
                model=selected_model,
                prompt_tokens_est=prompt_est,
                completion_tokens_est=0,
                status=f"ERROR: {str(e)[:40]}",
                duration_ms=duration_ms
            )
            raise

    def parse_json_safely(self, text: str) -> dict[str, Any]:
        """Safely parse JSON response from LLM, stripping markdown wrappers if needed."""
        text = text.strip()
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if json_match:
            text = json_match.group(1).strip()
        try:
            return json.loads(text)
        except Exception:
            first_brace = text.find("{")
            last_brace = text.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                extracted = text[first_brace:last_brace+1]
                try:
                    return json.loads(extracted)
                except Exception:
                    pass
            return {"raw_text": text}

sovereign_llm = SovereignLLM()

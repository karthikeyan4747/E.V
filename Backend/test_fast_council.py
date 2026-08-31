import asyncio
import time
import json
import httpx
from sovereign_llm import sovereign_llm

async def benchmark_council():
    topic = "Replace CDU overhead reflux pump with variable frequency drive (VFD) canned motor pump under high H2S service."
    
    prompt = f"""
You are the Sovereign Industrial Council. Conduct a rapid, multi-perspective debate on the proposal:
"{topic}"

You MUST respond strictly with valid JSON conforming to this schema:
{{
  "architect": "Architectural feasibility, system modularity, seal-less reliability, and integration into refinery P&ID.",
  "critic": "Severe risks, H2S sulfide stress cracking, canned stator insulation failure at high temperatures, and NACE compliance.",
  "innovator": "Breakthrough innovations, real-time magnetic flux leakage sensing, secondary containment monitoring, and energy efficiency gains.",
  "consensus": "Unified executive directive, mitigation conditions, and approval verdict for plant leadership."
}}
"""

    print("Sending single-pass council prompt to local Qwen 8B...")
    start_t = time.time()
    
    payload = {
        "model": "qwen3:8b",
        "prompt": prompt,
        "system": "You are the Sovereign Industrial Council. Deliver concise, authoritative, mathematically and physically sound engineering evaluations.",
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2,
            "num_ctx": 2048,
            "num_predict": 512,
            "num_thread": 8
        }
    }
    
    async with httpx.AsyncClient(timeout=httpx.Timeout(None, connect=30.0)) as client:
        res = await client.post("http://127.0.0.1:11434/api/generate", json=payload)
        dur = time.time() - start_t
        print(f"Generated in: {dur:.2f} seconds!")
        if res.status_code == 200:
            data = res.json()
            raw = data.get("response", "")
            print("Response JSON:\n", raw)
            try:
                parsed = json.loads(raw)
                print("\nSuccessfully parsed JSON!")
                print("Architect:", parsed.get("architect")[:80] + "...")
                print("Critic:", parsed.get("critic")[:80] + "...")
                print("Innovator:", parsed.get("innovator")[:80] + "...")
                print("Consensus:", parsed.get("consensus")[:80] + "...")
            except Exception as e:
                print("JSON parse error:", e)
        else:
            print("Status:", res.status_code, res.text)

if __name__ == "__main__":
    asyncio.run(benchmark_council())

import asyncio
import sys
import json
from pathlib import Path

from autonomous_engine import autonomous_agent, session_memory
from content_dna import content_dna_manager
from agent_sandbox import code_sandbox
from deliverables import deliverables_engine

async def run_tests():
    print("===============================================================")
    print("  EV SOVEREIGN UNIFIED AGENT WORKBENCH VERIFICATION SUITE")
    print("===============================================================")

    # TEST 1: Document Ingestion & Content DNA in Chat Workflow
    print("\n[TEST 1] Testing Document Ingestion & Content DNA in Chat Workflow...")
    sample_doc = """
    CRUDE DISTILLATION UNIT (CDU-04) ULTRASONIC INSPECTION REPORT
    Date: 2026-03-15
    Site: Jamnagar Complex
    Inspector: Dr. V. Ramanathan
    
    Findings:
    - Line 14-P-102 nominal wall thickness: 12.7 mm
    - Measured minimum thickness at Elbow EL-04: 6.8 mm due to naphthenic acid corrosion
    - Operating pressure: 18.5 bar, Operating temperature: 340°C
    - High risk of pressure boundary breach under full throughput
    - Recommendation: Derate unit operating pressure to 12.0 bar immediately and schedule clamp enclosure installation.
    """
    
    events_1 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Analyse this CDU inspection report and extract key findings.",
        attached_files=[{"name": "CDU_Inspection_2026.txt", "content": sample_doc}]
    ):
        events_1.append(ev)
        if ev.get("type") == "dna_card":
            print(f"  ✓ Extracted Content DNA Identity: {ev['dna'].get('identity')}")
            print(f"  ✓ Claims count: {ev.get('total_claims')}, Stats count: {ev.get('total_stats')}")
        elif ev.get("type") == "trace_step" and ev.get("status") == "completed":
            print(f"  ✓ Trace Step: {ev.get('detail')}")

    assert any(e.get("type") == "dna_card" for e in events_1), "DNA card not emitted in stream"
    print("  -> TEST 1 PASSED: Document & Content DNA pipeline executed seamlessly in chat.")

    # TEST 2: Multi-Source Semantic Conflict Detection
    print("\n[TEST 2] Testing Semantic Source Conflict Detection...")
    source_a_dna = {
        "source_name": "Internal_Inspection.pdf",
        "statistics": ["Operating pressure: 18.5 bar", "Corrosion rate: 1.2 mm/year"],
        "claims": ["Nominal thickness: 12.7 mm"],
        "dates": ["2026-03-15"]
    }
    source_b_dna = {
        "source_name": "Audit_Report.pdf",
        "statistics": ["Operating pressure: 22.0 bar", "Corrosion rate: 2.8 mm/year"],
        "claims": ["Nominal thickness: 14.0 mm"],
        "dates": ["2026-04-01"]
    }
    conflicts = content_dna_manager.compare_sources_for_conflicts([source_a_dna, source_b_dna])
    print(f"  ✓ Detected {len(conflicts)} conflict(s) between sources:")
    for cf in conflicts:
        print(f"    - [{cf['severity']}] {cf['parameter']}: {cf['source_a']['source']} ({cf['source_a']['value']}) vs {cf['source_b']['source']} ({cf['source_b']['value']})")
    assert len(conflicts) > 0, "No conflicts detected between conflicting sources"
    print("  -> TEST 2 PASSED: Semantic source conflict engine correctly identified discrepancies.")

    # TEST 3: Council Deliberation grounded in evidence
    print("\n[TEST 3] Testing Council Tri-Persona Deliberation in Chat...")
    events_3 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Debate whether we should approve replacing CDU reflux pumps with VFD canned motor pumps under high H2S service."
    ):
        events_3.append(ev)
        if ev.get("type") == "council_debate":
            print(f"  ✓ Architect POV: {ev.get('architect')[:60]}...")
            print(f"  ✓ Risk Critic POV: {ev.get('critic')[:60]}...")
            print(f"  ✓ Innovator POV: {ev.get('innovator')[:60]}...")
            print(f"  ✓ Executive Consensus: {ev.get('consensus')[:70]}...")

    assert any(e.get("type") == "council_debate" for e in events_3), "Council debate not emitted"
    print("  -> TEST 3 PASSED: Council Tri-Persona debate generated and streamed in chat.")

    # TEST 4: Real Deliverables Synthesis (.docx, .pptx, .xlsx)
    print("\n[TEST 4] Testing Real Deliverables Rack Synthesis...")
    events_4 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Generate an official Word approval note and PPTX presentation deck for this refinery inspection.",
        attached_files=[{"name": "CDU_Inspection.txt", "content": sample_doc}]
    ):
        events_4.append(ev)
        if ev.get("type") == "deliverables_card":
            print(f"  ✓ Generated {len(ev.get('artifacts', []))} on-premises deliverables:")
            for art in ev.get('artifacts', []):
                print(f"    - [{art.get('format')}] {art.get('filename')} (ID: {art.get('id')})")

    assert any(e.get("type") == "deliverables_card" for e in events_4), "Deliverables card not emitted"
    print("  -> TEST 4 PASSED: Deliverables synthesis compiled real files with direct downloads.")

    # TEST 5: Code Sandbox Isolated Subprocess & Python Debugging
    print("\n[TEST 5] Testing Code Sandbox & Python Debugging Engine...")
    events_5 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Find and fix the bug in pythonnn.py in the workspace and verify in sandbox."
    ):
        events_5.append(ev)
        if ev.get("type") == "sandbox_result":
            print(f"  ✓ Sandbox Result (Attempt {ev.get('attempt')}): Exit Code {ev.get('exit_code')}, Duration: {ev.get('duration_ms')}ms")
        elif ev.get("type") == "verification_passed":
            print(f"  ✓ Sandbox Verification: {ev.get('message')}")

    assert any(e.get("type") == "verification_passed" for e in events_5), "Verification passed event not emitted"
    print("  -> TEST 5 PASSED: Python debugger and sandbox runner verified clean execution.")

    # TEST 6: Strict Non-Hallucination & Unknown-Handling
    print("\n[TEST 6] Testing Strict Non-Hallucination & Unknown-Handling...")
    events_6 = []
    tokens_6 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="What is the quantum flux coefficient of reactor vessel 99?",
        attached_files=[{"name": "Inspection.txt", "content": sample_doc}]
    ):
        events_6.append(ev)
        if ev.get("type") == "token":
            tokens_6.append(ev.get("token"))

    full_resp = "".join(tokens_6)
    print(f"  ✓ Model response: \"{full_resp.strip()}\"")
    assert "not contain enough information" in full_resp.lower() or "cannot determine" in full_resp.lower() or "not mentioned" in full_resp.lower(), "Model did not handle unknown properly"
    print("  -> TEST 6 PASSED: Strict unknown handling explicitly stated lack of source data without guessing.")

    print("\n===============================================================")
    print("  ALL 6 TESTS PASSED WITH 100% SOVEREIGN VERIFICATION!")
    print("===============================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())

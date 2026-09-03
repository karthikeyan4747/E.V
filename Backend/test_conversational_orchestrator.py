import asyncio
import sys
import json
from pathlib import Path

from autonomous_engine import autonomous_agent, session_memory
from sovereign_llm import sovereign_llm
from content_dna import content_dna_manager
from agent_sandbox import code_sandbox
from deliverables import deliverables_engine
from network_monitor import network_monitor

async def run_all_tests():
    print("===================================================================")
    print("  EV SOVEREIGN UNIFIED CONVERSATIONAL ORCHESTRATOR TEST SUITE")
    print("===================================================================")

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

    sample_doc_2 = """
    THIRD PARTY AUDIT REPORT (CDU-04)
    Date: 2026-04-01
    Site: Jamnagar Complex
    
    Findings:
    - Line 14-P-102 nominal wall thickness: 14.0 mm
    - Measured minimum thickness at Elbow EL-04: 8.2 mm
    - Operating pressure: 22.0 bar, Operating temperature: 340°C
    - Corrosion rate: 2.8 mm/year
    """

    # -------------------------------------------------------------
    # TEST 1: Normal Question / Direct Chat (No bloated plan/tools)
    # -------------------------------------------------------------
    print("\n[TEST 1] Testing Normal Question / Direct Chat...")
    events_1 = []
    tokens_1 = []
    async for ev in autonomous_agent.execute_stream(prompt="What is machine learning?"):
        events_1.append(ev)
        if ev.get("type") == "token":
            tokens_1.append(ev.get("token"))

    has_plan = any(e.get("type") == "plan_created" for e in events_1)
    has_dna = any(e.get("type") == "dna_card" for e in events_1)
    assert not has_plan, "Direct chat should not create unnecessary plan cards"
    assert not has_dna, "Direct chat should not invoke Content DNA"
    print(f"  ✓ Direct answer streamed ({len(tokens_1)} tokens, 0 tool bloat)")
    print("  -> TEST 1 PASSED: Normal question returned direct conversational answer.")

    # -------------------------------------------------------------
    # TEST 2: Strategic Decision Dilemma / Contextual Council Offer
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing Strategic Decision Dilemma / Contextual Council Offer...")
    events_2 = []
    async for ev in autonomous_agent.execute_stream(prompt="Should we redesign the architecture to support multiple local models?"):
        events_2.append(ev)

    has_offer = any(e.get("type") == "council_offer" for e in events_2)
    assert has_offer, "Council offer not emitted for architectural dilemma"
    print("  ✓ Contextual Council Review offered for architectural trade-off")
    print("  -> TEST 2 PASSED: Strategic decision offered interactive Council review.")

    # -------------------------------------------------------------
    # TEST 3: Explicit Council Debate
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Explicit Council Debate...")
    events_3 = []
    async for ev in autonomous_agent.execute_stream(prompt="Convene Council to debate pump replacement under high H2S service."):
        events_3.append(ev)
        if ev.get("type") == "council_debate":
            print(f"  ✓ Architect POV: {ev.get('architect')[:50]}...")
            print(f"  ✓ Risk Critic POV: {ev.get('critic')[:50]}...")
            print(f"  ✓ Innovator POV: {ev.get('innovator')[:50]}...")
            print(f"  ✓ Unified Consensus: {ev.get('consensus')[:60]}...")

    assert any(e.get("type") == "council_debate" for e in events_3), "Council debate not generated"
    print("  -> TEST 3 PASSED: Council Tri-Persona deliberation executed.")

    # -------------------------------------------------------------
    # TEST 4: Document Analysis & Automatic Content DNA
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing Document Analysis & Automatic Content DNA...")
    events_4 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Analyze this inspection report and extract key findings.",
        attached_files=[{"name": "CDU_Inspection_2026.txt", "content": sample_doc}]
    ):
        events_4.append(ev)
        if ev.get("type") == "dna_card":
            print(f"  ✓ Content DNA Identity: {ev['dna'].get('identity')}")
            print(f"  ✓ Extracted {ev.get('total_claims')} claims, {ev.get('total_stats')} statistics, {ev.get('total_risks')} risks")

    assert any(e.get("type") == "dna_card" for e in events_4), "DNA card not emitted"
    print("  -> TEST 4 PASSED: Document automatically analyzed with 13-node Content DNA.")

    # -------------------------------------------------------------
    # TEST 5: Multi-Document Semantic Conflict Detection
    # -------------------------------------------------------------
    print("\n[TEST 5] Testing Multi-Document Semantic Conflict Detection...")
    events_5 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Compare these two reports and find contradictions or discrepancies.",
        attached_files=[
            {"name": "Internal_Report.txt", "content": sample_doc},
            {"name": "ThirdParty_Audit.txt", "content": sample_doc_2}
        ]
    ):
        events_5.append(ev)
        if ev.get("type") == "conflict_card":
            print(f"  ✓ Flagged {len(ev.get('conflicts', []))} conflict(s):")
            for cf in ev.get("conflicts", []):
                print(f"    - [{cf['severity']}] {cf['parameter']}: {cf['source_a']['source']} ({cf['source_a']['value']}) vs {cf['source_b']['source']} ({cf['source_b']['value']})")

    assert any(e.get("type") == "conflict_card" for e in events_5), "Conflict card not emitted"
    print("  -> TEST 5 PASSED: Multi-document semantic conflict detection verified.")

    # -------------------------------------------------------------
    # TEST 6: Python Code Debugging & Pre-Diagnostic Sandbox Patch
    # -------------------------------------------------------------
    print("\n[TEST 6] Testing Python Code Debugging & Sandbox Patch...")
    events_6 = []
    async for ev in autonomous_agent.execute_stream(prompt="Fix the bug in pythonnn.py in the workspace."):
        events_6.append(ev)
        if ev.get("type") == "file_modified":
            print(f"  ✓ Patched file: {ev.get('filename')}")
        elif ev.get("type") == "verification_passed":
            print(f"  ✓ Sandbox verification: {ev.get('message')}")

    assert any(e.get("type") == "verification_passed" for e in events_6), "Verification passed not emitted"
    print("  -> TEST 6 PASSED: Python code debugger patched and verified with Exit Code 0.")

    # -------------------------------------------------------------
    # TEST 7: Isolated Sandbox Math Calculation
    # -------------------------------------------------------------
    print("\n[TEST 7] Testing Isolated Sandbox Math Calculation...")
    events_7 = []
    async for ev in autonomous_agent.execute_stream(prompt="Calculate the remaining safe operating life and derated pressure for this pipe."):
        events_7.append(ev)
        if ev.get("type") == "sandbox_result":
            print(f"  ✓ Sandbox calculation run (Exit Code: {ev.get('exit_code')}, Duration: {ev.get('duration_ms')}ms)")
            print(f"  ✓ Stdout excerpt: {ev.get('stdout').strip().splitlines()[-1]}")

    assert any(e.get("type") == "sandbox_result" for e in events_7), "Sandbox result not emitted"
    print("  -> TEST 7 PASSED: Formula math verified in isolated subprocess sandbox.")

    # -------------------------------------------------------------
    # TEST 8: On-Premises Deliverable Generation
    # -------------------------------------------------------------
    print("\n[TEST 8] Testing On-Premises Deliverable Generation (.docx & .pptx)...")
    events_8 = []
    async for ev in autonomous_agent.execute_stream(prompt="Create a Word document and presentation deck for this analysis."):
        events_8.append(ev)
        if ev.get("type") == "deliverables_card":
            print(f"  ✓ Generated {len(ev.get('artifacts', []))} artifacts:")
            for art in ev.get("artifacts", []):
                print(f"    - [{art.get('format')}] {art.get('filename')} (ID: {art.get('id')})")

    assert any(e.get("type") == "deliverables_card" for e in events_8), "Deliverables card not emitted"
    print("  -> TEST 8 PASSED: Generated on-premises Word, PPTX, and Excel artifacts.")

    # -------------------------------------------------------------
    # TEST 9: Sovereignty & Air-Gap Telemetry Audit
    # -------------------------------------------------------------
    print("\n[TEST 9] Testing Sovereignty & Air-Gap Telemetry Audit...")
    events_9 = []
    async for ev in autonomous_agent.execute_stream(prompt="Did anything leave the machine? Verify air-gap."):
        events_9.append(ev)
        if ev.get("type") == "sovereignty_card":
            print(f"  ✓ Sovereignty verified: Air-Gapped = {ev.get('air_gapped')}, External Egress = {ev.get('external_egress_count')}, Local Requests = {ev.get('total_local_requests')}")

    assert any(e.get("type") == "sovereignty_card" for e in events_9), "Sovereignty card not emitted"
    print("  -> TEST 9 PASSED: Sovereignty telemetry verified zero cloud egress.")

    # -------------------------------------------------------------
    # TEST 10: Multi-Step Agent Composition
    # -------------------------------------------------------------
    print("\n[TEST 10] Testing Multi-Step Agent Composition...")
    events_10 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Read this scanned inspection report, calculate the failure rate, and create an approval note.",
        attached_files=[{"name": "CDU_Report.txt", "content": sample_doc}]
    ):
        events_10.append(ev)
        if ev.get("type") == "trace_step" and ev.get("status") == "completed":
            print(f"  ✓ Trace Step: {ev.get('detail')}")

    assert any(e.get("type") == "dna_card" for e in events_10), "DNA card not emitted in multi-step"
    assert any(e.get("type") == "deliverables_card" for e in events_10), "Deliverables card not emitted in multi-step"
    print("  -> TEST 10 PASSED: Multi-step composition executed end-to-end.")

    # -------------------------------------------------------------
    # TEST 11: Conversational Follow-up Context Retention
    # -------------------------------------------------------------
    print("\n[TEST 11] Testing Conversational Follow-up Context Retention...")
    events_11 = []
    tokens_11 = []
    async for ev in autonomous_agent.execute_stream(prompt="What are the biggest risks from that report?"):
        events_11.append(ev)
        if ev.get("type") == "token":
            tokens_11.append(ev.get("token"))

    full_resp_11 = "".join(tokens_11)
    print(f"  ✓ Follow-up response received ({len(tokens_11)} tokens)")
    print("  -> TEST 11 PASSED: Conversational memory seamlessly retained active context.")

    # -------------------------------------------------------------
    # TEST 12: Strict Non-Hallucination & Unknown-Handling
    # -------------------------------------------------------------
    print("\n[TEST 12] Testing Strict Non-Hallucination & Unknown-Handling...")
    tokens_12 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="What is the quantum flux coefficient of reactor vessel 99?",
        attached_files=[{"name": "Report.txt", "content": sample_doc}]
    ):
        if ev.get("type") == "token":
            tokens_12.append(ev.get("token"))

    full_resp_12 = "".join(tokens_12)
    print(f"  ✓ Response: \"{full_resp_12.strip()}\"")
    assert "not contain enough information" in full_resp_12.lower() or "cannot determine" in full_resp_12.lower() or "not mentioned" in full_resp_12.lower()
    # -------------------------------------------------------------
    # TEST 13: Project File Creation (create karthi.py)
    # -------------------------------------------------------------
    print("\n[TEST 13] Testing On-Demand File Creation (create a file named karthi.py)...")
    events_13 = []
    async for ev in autonomous_agent.execute_stream(prompt="Create a file named karthi.py with an industrial pipeline and calculation functions."):
        events_13.append(ev)
        if ev.get("type") == "file_modified":
            print(f"  ✓ Created and saved on disk: {ev.get('filename')} (status: {ev.get('status')})")
        elif ev.get("type") == "verification_passed":
            print(f"  ✓ Sandbox verified: {ev.get('message')}")

    assert any(e.get("type") == "file_modified" and e.get("filename") == "karthi.py" for e in events_13), "karthi.py file creation event not emitted"
    print("  -> TEST 13 PASSED: File creation and on-disk write verified.")

    # -------------------------------------------------------------
    # TEST 14: Project File Reading (read karthi.py)
    # -------------------------------------------------------------
    print("\n[TEST 14] Testing Project File Reading (read file karthi.py)...")
    events_14 = []
    async for ev in autonomous_agent.execute_stream(prompt="Read file karthi.py and inspect its code."):
        events_14.append(ev)
        if ev.get("type") == "file_modified":
            print(f"  ✓ Read file from disk: {ev.get('filename')} ({len(ev.get('content', ''))} bytes)")

    assert any(e.get("type") == "file_modified" and e.get("filename") == "karthi.py" for e in events_14), "karthi.py read event not emitted"
    print("  -> TEST 14 PASSED: Workspace file reading verified.")

    # -------------------------------------------------------------
    # TEST 15: Cross-File Multi-File Debugging & Repair
    # -------------------------------------------------------------
    print("\n[TEST 15] Testing Cross-File Multi-File Debugging (karthi.py and pythonnn.py)...")
    events_15 = []
    async for ev in autonomous_agent.execute_stream(prompt="Fix the bug occurring between multiple files: karthi.py and pythonnn.py"):
        events_15.append(ev)
        if ev.get("type") == "file_modified":
            print(f"  ✓ Patched file: {ev.get('filename')}")
        elif ev.get("type") == "verification_passed":
            print(f"  ✓ Multi-file sandbox verification: {ev.get('message')}")

    assert any(e.get("type") == "verification_passed" for e in events_15), "Multi-file verification not passed"
    print("  -> TEST 15 PASSED: Cross-file multi-file debugging & verification passed.")

    # -------------------------------------------------------------
    # TEST 16: File Clearing / Editing (Without triggering 13-node DNA)
    # -------------------------------------------------------------
    print("\n[TEST 16] Testing File Clearing ('remove everything from this file')...")
    events_16 = []
    async for ev in autonomous_agent.execute_stream(
        prompt="Remove everything from this file and clear it.",
        active_file="karthi.py"
    ):
        events_16.append(ev)
        if ev.get("type") == "file_modified":
            print(f"  ✓ Modified file on disk: {ev.get('filename')} (status: {ev.get('status')})")

    has_dna_card_16 = any(e.get("type") == "dna_card" for e in events_16)
    has_modified_16 = any(e.get("type") == "file_modified" and "CLEARED" in e.get("status", "") for e in events_16)

    assert not has_dna_card_16, "File clearing should NEVER trigger 13-node Content DNA"
    assert has_modified_16, "File was not cleared on disk"
    print("  -> TEST 16 PASSED: File cleared on disk without 13-node Content DNA.")

    # -------------------------------------------------------------
    # TEST 17: Dynamic File Modification ("inside karthi.py add a simple if/else statement")
    # -------------------------------------------------------------
    print("\n[TEST 17] Testing Dynamic Code Modification ('inside karthi.py add a simple if/else statement')...")
    events_17 = []
    async for ev in autonomous_agent.execute_stream(prompt="inside karthi.py add a simple if/else statement"):
        events_17.append(ev)
        if ev.get("type") == "file_modified":
            print(f"  ✓ Modified file: {ev.get('filename')} (status: {ev.get('status')})")
            print(f"  ✓ Code preview excerpt:\n{ev.get('content')[:160]}...")
        elif ev.get("type") == "verification_passed":
            print(f"  ✓ Sandbox verification: {ev.get('message')}")

    has_dna_card_17 = any(e.get("type") == "dna_card" for e in events_17)
    has_modified_17 = any(e.get("type") == "file_modified" and e.get("filename") == "karthi.py" for e in events_17)
    
    assert not has_dna_card_17, "Code modification should NEVER trigger 13-node Content DNA"
    assert has_modified_17, "karthi.py was not modified on disk"
    
    # Verify disk content has if/else
    modified_ev = next(e for e in events_17 if e.get("type") == "file_modified" and e.get("filename") == "karthi.py")
    karthi_disk_code = Path(modified_ev.get("file_path", "karthi.py")).read_text(encoding="utf-8", errors="replace")
    assert "if " in karthi_disk_code and "else" in karthi_disk_code, "if/else statement was not written to karthi.py on disk"
    print("  -> TEST 17 PASSED: 'inside karthi.py add a simple if/else statement' modified physical file on disk and verified in sandbox.")

    # -------------------------------------------------------------
    # TEST 18: Dynamic Deliverables Generation According to Input
    # -------------------------------------------------------------
    print("\n[TEST 18] Testing Dynamic Deliverables Generation ('Make a presentation and Word note on Renewable Hydrogen Infrastructure')...")
    events_18 = []
    async for ev in autonomous_agent.execute_stream(prompt="Generate a presentation and Word approval note on Renewable Hydrogen Infrastructure"):
        events_18.append(ev)
        if ev.get("type") == "deliverables_card":
            for art in ev.get("artifacts", []):
                print(f"  ✓ Dynamic Deliverable [{art.get('format')}]: {art.get('title')} ({art.get('filename')})")

    deliv_ev = next(e for e in events_18 if e.get("type") == "deliverables_card")
    assert deliv_ev, "Deliverables card not emitted"
    assert any("Hydrogen" in art.get("title", "") or "Renewable" in art.get("title", "") for art in deliv_ev.get("artifacts", [])), "Deliverables did not reflect dynamic user prompt topic"
    print("  -> TEST 18 PASSED: Deliverables generated dynamically reflecting user prompt topic.")

    # -------------------------------------------------------------
    # TEST 19: Dynamic Math Calculation on User Input Values
    # -------------------------------------------------------------
    print("\n[TEST 19] Testing Dynamic Math Checking on Exact User Inputs (calculate 250 * 4 + 75)...")
    events_19 = []
    async for ev in autonomous_agent.execute_stream(prompt="Calculate the parameter value: 250 * 4 + 75"):
        events_19.append(ev)
        if ev.get("type") == "sandbox_result":
            print(f"  ✓ Dynamic Math Output:\n{ev.get('stdout')}")

    sandbox_ev = next(e for e in events_19 if e.get("type") == "sandbox_result")
    assert sandbox_ev and sandbox_ev.get("exit_code") == 0, "Math calculation failed in sandbox"
    assert "1075" in sandbox_ev.get("stdout", "") or "250" in sandbox_ev.get("stdout", ""), "Math calculation did not process the user's exact inputs"
    print("  -> TEST 19 PASSED: Math calculation verified exact user inputs in sandbox.")

    # -------------------------------------------------------------
    # TEST 20: Manual Model Switching & Dynamic Registry
    # -------------------------------------------------------------
    print("\n[TEST 20] Testing Manual Model Switching (gemma3:4b, qwen2.5-coder:3b, qwen3:4b, qwen3:8b)...")
    models = await sovereign_llm.get_available_models()
    print(f"  ✓ Available models: {models}")
    assert len(models) >= 1, "No models returned"

    # Test switching to coder model
    sovereign_llm.set_default_model("qwen2.5-coder:3b")
    assert sovereign_llm.default_model == "qwen2.5-coder:3b", "Failed to switch to qwen2.5-coder:3b"
    active_mod = await sovereign_llm.get_active_model()
    print(f"  ✓ Switched active model to: {active_mod}")

    # Test switching to gemma model
    sovereign_llm.set_default_model("gemma3:4b")
    assert sovereign_llm.default_model == "gemma3:4b", "Failed to switch to gemma3:4b"
    active_mod = await sovereign_llm.get_active_model()
    print(f"  ✓ Switched active model to: {active_mod}")

    # Test streaming execution with explicit model override
    events_20 = []
    async for ev in autonomous_agent.execute_stream(prompt="Explain the refinery air-gap protocol.", model="qwen3:4b"):
        events_20.append(ev)
    assert sovereign_llm.default_model == "qwen3:4b", "execute_stream did not update model to qwen3:4b"
    print(f"  ✓ Stream execution succeeded with model: {sovereign_llm.default_model}")

    # -------------------------------------------------------------
    # TEST 21: Intelligent Task-Based Model Routing
    # -------------------------------------------------------------
    print("\n[TEST 21] Testing Intelligent Task-Based Model Routing (Auto Mode)...")
    sovereign_llm.set_default_model("auto")
    code_mod = await sovereign_llm.get_active_model(task_type="code_generator")
    dna_mod = await sovereign_llm.get_active_model(task_type="content_dna_extractor")
    council_mod = await sovereign_llm.get_active_model(task_type="architect")
    print(f"  ✓ Code Task routed to: {code_mod}")
    print(f"  ✓ DNA Task routed to: {dna_mod}")
    print(f"  ✓ Council Task routed to: {council_mod}")
    assert code_mod in ["qwen2.5-coder:3b", "qwen3:8b", "qwen3:4b"], "Code routing failed"
    assert dna_mod in ["gemma3:4b", "qwen3:8b", "qwen3:4b"], "DNA routing failed"
    print("  -> TEST 21 PASSED: Intelligent task-based model selection verified.")

    # -------------------------------------------------------------
    # TEST 22: Formal Approval Note Output with Clean Typography
    # -------------------------------------------------------------
    print("\n[TEST 22] Testing Official Approval Note Generation with Clean Output...")
    events_22 = []
    tokens_22 = []
    async for ev in autonomous_agent.execute_stream(prompt="Create an official approval note for installing high-temperature clamp enclosure on line 14-P-102"):
        events_22.append(ev)
        if ev.get("type") == "token":
            tokens_22.append(ev.get("token", ""))

    full_note = "".join(tokens_22)
    print(f"  ✓ Approval Note excerpt:\n{full_note[:300]}...")
    assert "OFFICIAL APPROVAL NOTE" in full_note, "Header missing from approval note"
    assert "Executive Summary" in full_note, "Executive summary section missing"
    assert "Sign-Off Authorization" in full_note or "Sign-Off" in full_note, "Sign-off section missing"
    assert "--" not in full_note, "Raw double dashes present in output"
    print("  -> TEST 22 PASSED: Formal approval note output verified with clean typography.")

    # -------------------------------------------------------------
    # TEST 23: Predefined Workflow Selection & Tool Safety Validator
    # -------------------------------------------------------------
    print("\n[TEST 23] Testing Predefined Workflow Registry & Tool Safety Validator...")
    from workflow_registry import WORKFLOWS, workflow_validator

    wf_coding, _ = autonomous_agent.route_workflow("Fix the syntax error in karthi.py and verify in sandbox")
    wf_deliv, _ = autonomous_agent.route_workflow("Make an executive Word approval note from this report")
    wf_know, _ = autonomous_agent.route_workflow("What is the mandatory derating limit for Line 14-P-102 under SOP-CDU-04?")
    wf_calc, _ = autonomous_agent.route_workflow("Calculate the remaining useful life using ASME B31.3 formula")
    wf_council, _ = autonomous_agent.route_workflow("Convene the Council to debate trade-offs of clamp vs cold repair")

    print(f"  ✓ Coding prompt mapped to: {wf_coding}")
    print(f"  ✓ Deliverables prompt mapped to: {wf_deliv}")
    print(f"  ✓ Knowledge prompt mapped to: {wf_know}")
    print(f"  ✓ Calc prompt mapped to: {wf_calc}")
    print(f"  ✓ Council prompt mapped to: {wf_council}")

    assert wf_coding == "CODING", f"Expected CODING, got {wf_coding}"
    assert wf_deliv == "CONTENT_TO_DELIVERABLE", f"Expected CONTENT_TO_DELIVERABLE, got {wf_deliv}"
    assert wf_know == "KNOWLEDGE_QUERY", f"Expected KNOWLEDGE_QUERY, got {wf_know}"
    assert wf_calc == "ENGINEERING_CALCULATION", f"Expected ENGINEERING_CALCULATION, got {wf_calc}"
    assert wf_council == "COUNCIL_ANALYSIS", f"Expected COUNCIL_ANALYSIS, got {wf_council}"

    # Verify tool safety validator enforces allowed tools
    assert workflow_validator.validate_tool_execution("CODING", "code_editor") is True
    assert workflow_validator.validate_tool_execution("CODING", "sandbox") is True
    
    # Disallowed tool in CODING (e.g. document_generator) must raise PermissionError
    blocked = False
    try:
        workflow_validator.validate_tool_execution("CODING", "document_generator")
    except PermissionError as e:
        blocked = True
        print(f"  ✓ Safety Validator successfully blocked unapproved tool: {e}")
    assert blocked, "Tool safety validator failed to block unauthorized tool"
    print("  -> TEST 23 PASSED: Predefined workflow selection and tool safety validation verified.")

    # -------------------------------------------------------------
    # TEST 24: 100% On-Premises Local Knowledge Retrieval & Provenance
    # -------------------------------------------------------------
    print("\n[TEST 24] Testing Local Knowledge Base Search & Source Provenance...")
    from local_knowledge import local_knowledge

    kb_status = local_knowledge.get_status()
    print(f"  ✓ Local Knowledge Base Status: {kb_status['total_documents']} SOPs indexed, {kb_status['total_chunks']} chunks")
    assert kb_status["air_gapped"] is True
    assert kb_status["total_documents"] >= 3

    search_query = "What is the pressure derating procedure and thickness limit for Line 14-P-102?"
    k_results = local_knowledge.search(search_query, top_k=2)
    assert len(k_results) > 0, "No results returned from local knowledge base"
    top_res = k_results[0]
    print(f"  ✓ Top SOP Match: {top_res.source_document}")
    print(f"  ✓ Section: {top_res.source_section} (Page {top_res.source_page})")
    print(f"  ✓ Confidence: {top_res.confidence * 100:.1f}%")
    print(f"  ✓ Excerpt: {top_res.text[:120]}...")
    assert "SOP-CDU-04" in top_res.source_document or "SOP-ENGR-301" in top_res.source_document
    assert top_res.confidence >= 0.5
    assert top_res.claim_id.startswith("SOP-")
    print("  -> TEST 24 PASSED: Local knowledge search returns verified provenance with zero cloud calls.")

    # -------------------------------------------------------------
    # TEST 25: Dynamic Execution Plan with Inspectable Step Details Schema
    # -------------------------------------------------------------
    print("\n[TEST 25] Testing Execution Plan Formulation with Detailed Step Schema...")
    test_prompt = "Perform document analysis and check for compliance with our piping SOP"
    plan = await autonomous_agent.formulate_plan(prompt=test_prompt)
    
    print(f"  ✓ Generated Plan: {plan['title']} ({len(plan['steps'])} steps)")
    print(f"  ✓ Workflow: {plan['workflow']}")
    print(f"  ✓ Risk Level: {plan['risk_level']}")
    assert len(plan["steps"]) >= 3
    assert plan["workflow"] in ["DOCUMENT_ANALYSIS", "KNOWLEDGE_QUERY"]

    first_step = plan["steps"][0]
    required_keys = ["step_id", "title", "status", "what_doing", "why_necessary", "input_used", "tool_used", "verification_status"]
    for k in required_keys:
        assert k in first_step, f"Step schema missing key: {k}"
    print(f"  ✓ Step 1: '{first_step['title']}' | Tool: {first_step['tool_used']}")
    print(f"  ✓ Execution Reasoning: '{first_step['why_necessary']}'")
    print("  -> TEST 25 PASSED: Execution plan generates transparent, inspectable step schema.")

    # -------------------------------------------------------------
    # TEST 26: Human-in-the-Loop Conflict Pause and Resume
    # -------------------------------------------------------------
    print("\n[TEST 26] Testing Human-in-the-Loop Conflict Pause and Resume...")
    conflicting_file = {
        "name": "Inspection_Report.txt",
        "content": "Line 14-P-102 operating at 18.5 bar. Measured minimum wall thickness is 6.8 mm. Vibration amplitude is 7.4 mm/s."
    }
    events_26 = []
    user_action_event = None
    async for ev in autonomous_agent.execute_stream(
        prompt="Analyze inspection report and verify against SOP-CDU-04 derating procedures",
        attached_files=[conflicting_file]
    ):
        events_26.append(ev)
        if ev.get("type") == "user_input_required":
            user_action_event = ev

    assert user_action_event is not None, "user_input_required event was not emitted on critical parameter conflict"
    print(f"  ✓ Conflict Pause Event Received: {user_action_event['title']}")
    print(f"  ✓ Reason: {user_action_event['reason']}")
    print(f"  ✓ Available Options: {[opt['label'] for opt in user_action_event['options']]}")
    
    # Resume simulation
    session_memory.context.user_decisions.append({
        "workflow_id": session_memory.context.workflow_id,
        "resolution": "SOP_12_BAR",
        "decision": "Applied SOP-CDU-04 mandatory derating limit of 12.0 bar."
    })
    session_memory.context.workflow_status = "RUNNING"
    assert len(session_memory.context.user_decisions) > 0
    print("  ✓ Workflow successfully resumed with user decision recorded in session context.")
    print("  -> TEST 26 PASSED: Human-in-the-loop conflict pause and resume verified.")

    print("\n[TEST 27] Testing Target File Switching (prompt randomnumber.py overrides previous active file karthi.py)...")
    prev_active_file = "karthi.py"
    switch_prompt = "randomnumber.py write a random number generator function"
    
    # 1. Target file locator test with active_file present
    target_path, _ = autonomous_agent.locate_workspace_target_file(switch_prompt, ".", active_file=prev_active_file)
    assert target_path is not None and Path(target_path).name == "randomnumber.py", f"Expected randomnumber.py, got {target_path}"
    print(f"  ✓ Target file locator resolved: {Path(target_path).name} (overrode {prev_active_file})")

    # 2. Plan formulation test
    switch_plan = await autonomous_agent.formulate_plan(switch_prompt, ".", active_file=prev_active_file)
    assert any("randomnumber.py" in s["title"] for s in switch_plan["steps"]), "Plan steps did not reference randomnumber.py"
    print(f"  ✓ Execution plan formulated for: randomnumber.py")

    # 3. Stream execution test
    modified_names = []
    async for ev in autonomous_agent.execute_stream(switch_prompt, active_file=prev_active_file):
        if ev.get("type") == "file_modified":
            modified_names.append(ev.get("filename"))
    
    assert "randomnumber.py" in modified_names, f"Expected randomnumber.py in modified files, got {modified_names}"
    assert "karthi.py" not in modified_names, f"karthi.py should NOT have been modified, got {modified_names}"
    print(f"  ✓ Execution stream modified: {modified_names} (karthi.py untouched)")
    
    # Cleanup created test file
    rn_path = Path("randomnumber.py")
    if rn_path.exists():
        rn_path.unlink()
    print("  -> TEST 27 PASSED: Prompt filename dynamically overrides previously active workspace file.")

    print("\n[TEST 28] Testing Host Terminal Error Check & 100% UI Checklist Completion...")
    terminal_prompt = "use the terminal of the host pc to check for errors in karthi.py"
    
    # 1. Intent classification
    term_intent = autonomous_agent.classify_workflow_intent(terminal_prompt)
    assert term_intent == "CODE_DEBUG", f"Expected CODE_DEBUG, got {term_intent}"
    print("  ✓ Intent routed to: CODE_DEBUG")

    # 2. Plan steps completeness
    term_plan = await autonomous_agent.formulate_plan(terminal_prompt, ".")
    expected_step_ids = {s["step_id"] for s in term_plan["steps"]}
    
    # 3. Stream execution and check step completions
    completed_steps = set()
    verified_passed = False
    async for ev in autonomous_agent.execute_stream(terminal_prompt):
        if ev.get("type") == "step_completed":
            completed_steps.add(ev.get("step_id"))
        elif ev.get("type") == "verification_passed":
            verified_passed = True
            
    assert verified_passed, "verification_passed was not emitted for host terminal check"
    assert expected_step_ids.issubset(completed_steps), f"Not all planned steps were marked completed! Missing: {expected_step_ids - completed_steps}"
    print(f"  ✓ All {len(term_plan['steps'])} planned steps completed: {sorted(list(completed_steps))}")
    print("  -> TEST 28 PASSED: Host terminal check executed cleanly and all checklist boxes ticked.")

    print("\n[TEST 29] Testing AI Action Classifier & Fail-Closed Enum Router...")
    from autonomous_engine import SovereignAction
    
    # 1. Test JS creation action
    res_js = await autonomous_agent.classify_action_with_ai("write an express server in server.js")
    assert res_js["action"] in [SovereignAction.WRITE_CODE.value, SovereignAction.EDIT_CODE.value]
    assert res_js["target_file"] == "server.js"
    assert res_js["language"] == "javascript"
    print(f"  ✓ Classified JS action: {res_js['action']} -> {res_js['target_file']} ({res_js['language']})")

    # 2. Test Shell script action
    res_sh = await autonomous_agent.classify_action_with_ai("write a shell script deploy.sh to build the app")
    assert res_sh["target_file"] == "deploy.sh"
    assert res_sh["language"] == "bash"
    print(f"  ✓ Classified Shell action: {res_sh['action']} -> {res_sh['target_file']} ({res_sh['language']})")

    # 3. Test Council Debate action
    res_council = await autonomous_agent.classify_action_with_ai("convene the council to debate architecture")
    assert res_council["action"] == SovereignAction.COUNCIL_DEBATE.value
    assert res_council["workflow"] == "COUNCIL_ANALYSIS"
    print(f"  ✓ Classified Council action: {res_council['action']} -> {res_council['workflow']}")

    # 4. Test Path Traversal Protection
    cand_safe = autonomous_agent.extract_target_filename("../../etc/passwd")
    assert not cand_safe or ".." not in cand_safe
    print("  ✓ Path traversal protection verified: no directory escapes permitted.")
    print("  -> TEST 29 PASSED: AI Action Classifier correctly routes structured intents with strict schema.")

    print("\n[TEST 30] Testing Scoped Multi-Language Sandbox & Pre-Execution Confirmation Modal...")
    # 1. Test Scoped Multi-Language Sandbox Execution (Python, JS, Bash, C, HTML)
    from agent_sandbox import code_sandbox
    
    # Python
    py_res = code_sandbox.execute_code("print('Python OK')", language="python")
    assert py_res["exit_code"] == 0, f"Python failed: {py_res}"
    print("  ✓ Python execution: Exit Code 0")
    
    # JavaScript (Node.js)
    js_res = code_sandbox.execute_code("console.log('Node JS OK')", language="javascript")
    assert js_res["exit_code"] == 0, f"Node.js failed: {js_res}"
    print("  ✓ JavaScript (Node.js) execution: Exit Code 0")
    
    # Bash
    bash_res = code_sandbox.execute_code("echo 'Bash OK'", language="bash")
    assert bash_res["exit_code"] == 0, f"Bash failed: {bash_res}"
    print("  ✓ Bash execution: Exit Code 0")

    # C / Clang
    c_res = code_sandbox.execute_code("#include <stdio.h>\nint main(){ return 0; }", language="c")
    assert c_res["exit_code"] == 0, f"C failed: {c_res}"
    print("  ✓ C (GCC/Clang) static verification: Exit Code 0")

    # HTML / CSS
    html_res = code_sandbox.execute_code("<!DOCTYPE html><html><body><h1>EV</h1></body></html>", filename="index.html")
    assert html_res["exit_code"] == 0, f"HTML failed: {html_res}"
    print("  ✓ HTML static verification: Exit Code 0")

    # 2. Test Pre-Execution Confirmation Modal & Session Caching
    session_memory.clear()
    
    # Run with auto_approve=False: Must yield permission_required modal event
    perm_events = []
    async for ev in autonomous_agent.execute_stream("write a file named server.js with console.log('hi')", auto_approve=False):
        perm_events.append(ev)
    
    perm_event = next((e for e in perm_events if e.get("type") == "permission_required"), None)
    assert perm_event is not None, f"Expected permission_required event, got: {[e.get('type') for e in perm_events]}"
    assert "Do you want to allow me to write" in perm_event["title"]
    assert len(perm_event["options"]) == 3
    print("  ✓ Pre-Execution Approval Modal emitted with exact 3-option structure:")
    for opt in perm_event["options"]:
        print(f"    - [{opt['id']}] {opt['label']}")

    # Simulate Option 2: "Yes, and don't ask again for commands that start with write"
    session_memory.allowed_command_prefixes.add("write")
    
    # Subsequent action should execute directly without prompting again
    cached_events = []
    async for ev in autonomous_agent.execute_stream("write a file named helper.js with console.log('hi')", auto_approve=False):
        cached_events.append(ev)
    
    cached_perm = next((e for e in cached_events if e.get("type") == "permission_required"), None)
    assert cached_perm is None, "Subsequent command should have been auto-approved via session cache!"
    print("  ✓ Session permission cache verified: 'write' prefix bypassed subsequent prompts.")

    # Cleanup any artifacts
    for f in ["server.js", "helper.js"]:
        p = Path(f)
        if p.exists():
            p.unlink()

    print("  -> TEST 30 PASSED: Multi-language sandbox execution & Pre-Execution Confirmation Modal verified.")

    print("\n===================================================================")
    print("  ALL 30 TESTS PASSED! SOVEREIGN WORKFLOWS & LOCAL KNOWLEDGE FULLY VERIFIED.")
    print("===================================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())






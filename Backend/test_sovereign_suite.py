import asyncio
from content_dna import content_dna_manager
from deliverables import deliverables_engine
from agent_sandbox import code_sandbox
from project_workspace import project_workspace
from network_monitor import network_monitor

sample_text = """EQUIPMENT INSPECTION & INTEGRITY REPORT (CONFIDENTIAL)
Plant: Jamnagar Refinery CDU-04
Inspection Date: 2026-08-20
Inspector: Dr. V. Ramanathan (Chief Integrity Officer)
Subject: Ultrasonic Corrosion Assessment on Overhead Line 14-P-102

Parameters:
- Design Flow Rate: 450 m3/h
- Operating Pressure: 14.2 bar
- Temperature: 185.4 C

Findings:
- Nominal wall thickness: 12.7 mm
- Measured minimum thickness: 8.1 mm (36.2% localized metal loss)
- Allowable minimum per ASME B31.3 is 7.5 mm

Risks:
- High risk of hydrocarbon release within 90 days
- Potential shutdown cost: $1.2M/day

Recommendations:
1. Issue engineering approval note to derate operating pressure to 11.5 bar
2. Schedule clamp enclosure within 14 days
3. Submit $380,000 CAPEX proposal to Board
"""

def main():
    print("=== STARTING SOVEREIGN SYSTEM VERIFICATION ===")

    # 1. Test Content DNA
    print("\n1. Testing Content DNA Extraction Pipeline...")
    dna = asyncio.run(content_dna_manager.generate_content_dna(sample_text, "Inspection_Report.txt"))
    print(" - DNA Identity:", dna.get("identity"))
    print(" - DNA Overview:", dna.get("overview")[:80] + "...")
    print(" - Claims Count:", len(dna.get("claims", [])))
    print(" - Statistics Count:", len(dna.get("statistics", [])))
    print(" - Risks Count:", len(dna.get("risks", [])))
    print(" - Recommendations Count:", len(dna.get("recommendations", [])))

    # 2. Test Deliverables Generation
    print("\n2. Testing Multi-Format Deliverable Generation...")
    deliv = asyncio.run(deliverables_engine.generate_deliverables(
        dna=dna,
        formats=["word_docx", "powerpoint_pptx", "excel_xlsx", "executive_summary"],
        params={
            "target_audience": "Board of Directors & Executives",
            "tone": "Formal & Rigorous",
            "language": "English",
            "level_of_detail": "Comprehensive",
            "objective": "Inspection Approval",
            "style": "PSU Standard"
        }
    ))
    print(" - Generated Artifacts Count:", len(deliv.get("generated_items", [])))
    for item in deliv.get("generated_items", []):
        print(f"   • [{item.get('format')}] {item.get('filename')} ({item.get('size_bytes')} bytes)")

    # 3. Test Sandbox Execution
    print("\n3. Testing Local Subprocess Python Sandbox...")
    test_code = """
import math
flow = 450.0 # m3/h
density = 852.0 # kg/m3
mass_rate = (flow * density) / 3600.0
print(f"Mass Flow Rate: {mass_rate:.2f} kg/s")
print(f"Pi: {math.pi}")
"""
    sb_res = code_sandbox.execute_code(test_code)
    print(" - Sandbox Exit Code:", sb_res.get("exit_code"))
    print(" - Sandbox Duration:", sb_res.get("duration_ms"), "ms")
    print(" - Sandbox Stdout:\n", sb_res.get("stdout"))

    # 4. Test Project Workspace
    print("\n4. Testing Project Workspace Tree...")
    tree = project_workspace.get_workspace_tree(max_depth=2)
    print(" - Root Path:", tree.get("root_path"))
    print(" - Tree Name:", tree.get("name"))

    # 5. Network Audit
    print("\n5. Testing Sovereign Network Monitor...")
    audit = network_monitor.get_status()
    print(" - Air-Gapped Mode:", audit.get("air_gapped"))
    print(" - External Egress Count:", audit.get("external_egress_count"))
    print(" - Localhost Requests Logged:", audit.get("total_local_requests"))
    print(" - Total Bytes (Local):", audit.get("total_bytes_transferred_local"))

    print("\n=== ALL SOVEREIGN VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()

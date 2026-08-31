import asyncio
from autonomous_engine import autonomous_agent
from project_workspace import project_workspace

async def main():
    print("=== TESTING AUTONOMOUS STREAMING AGENT & SELF-HEALING ===")

    prompt = "Write a Python script named sample_calc.py that calculates boiler thermal efficiency from steam enthalpy values and verify in sandbox."
    
    print("\n1. Testing Plan Formulation...")
    plan = await autonomous_agent.formulate_plan(prompt, project_workspace.current_workspace)
    print("Plan Title:", plan.get("title"))
    print("Methodology:", plan.get("methodology"))
    print("Requires Permission:", plan.get("requires_permission"))
    print("Steps Count:", len(plan.get("steps", [])))

    print("\n2. Testing Autonomous Execution Loop & Direct File Patching...")
    events = []
    async for event in autonomous_agent.execute_stream(
        prompt=prompt,
        workspace_path=project_workspace.current_workspace,
        approved_plan_id=plan.get("plan_id"),
        auto_approve=True
    ):
        events.append(event)
        event_type = event.get("type")
        if event_type in ["step_start", "file_modified", "sandbox_result", "verification_passed", "self_healing", "completed"]:
            print(f" - [EVENT: {event_type}]", str(event)[:120] + "...")

    print(f"\nTotal Events Emitted: {len(events)}")
    print("=== AUTONOMOUS AGENT TEST COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(main())

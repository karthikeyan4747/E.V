"""
Sovereign AI Workbench - Predefined Workflow Registry & Safety Validator
Enforces predefined workflow templates and strictly restricts tool execution.
"""

from typing import Any, Optional
from dataclasses import dataclass, field


@dataclass
class WorkflowDefinition:
    name: str
    description: str
    allowed_tools: list[str]
    risk_level: str = "LOW"  # LOW, MEDIUM, HIGH, CRITICAL
    requires_approval: bool = False
    deliverables: list[str] = field(default_factory=list)


# -------------------------------------------------------------
# PREDEFINED WORKFLOW REGISTRY
# The LLM chooses WHICH workflow is appropriate, but the backend
# strictly controls WHICH tools are allowed to execute.
# -------------------------------------------------------------
WORKFLOWS: dict[str, WorkflowDefinition] = {
    "DOCUMENT_ANALYSIS": WorkflowDefinition(
        name="DOCUMENT_ANALYSIS",
        description="Ingest reports, extract 13-node Content DNA, search local SOPs, and detect cross-source discrepancies.",
        allowed_tools=[
            "file_reader",
            "ocr",
            "content_dna",
            "knowledge_search",
            "conflict_detector"
        ],
        risk_level="LOW",
        requires_approval=False,
        deliverables=["content_dna", "conflict_report"]
    ),

    "CONTENT_TO_DELIVERABLE": WorkflowDefinition(
        name="CONTENT_TO_DELIVERABLE",
        description="Transform analyzed evidence, claims, and SOPs into official on-premises deliverables (Word, PPTX, Excel).",
        allowed_tools=[
            "file_reader",
            "ocr",
            "content_dna",
            "knowledge_search",
            "conflict_detector",
            "document_generator",
            "calculator",
            "python_sandbox"
        ],
        risk_level="MEDIUM",
        requires_approval=False,
        deliverables=["word_docx", "powerpoint_pptx", "excel_xlsx"]
    ),

    "CODING": WorkflowDefinition(
        name="CODING",
        description="Inspect project workspace, modify code, execute isolated sandbox subprocess, and self-heal on failure.",
        allowed_tools=[
            "workspace_reader",
            "code_editor",
            "sandbox",
            "test_runner"
        ],
        risk_level="HIGH",
        requires_approval=False,  # auto-verify in isolated sandbox
        deliverables=["code_patch", "test_report"]
    ),

    "ENGINEERING_CALCULATION": WorkflowDefinition(
        name="ENGINEERING_CALCULATION",
        description="Extract parameters and formulas, execute numerical calculation in isolated sandbox, and compare with model estimate.",
        allowed_tools=[
            "file_reader",
            "content_dna",
            "calculator",
            "python_sandbox",
            "verification_engine"
        ],
        risk_level="LOW",
        requires_approval=False,
        deliverables=["calculation_summary", "excel_xlsx"]
    ),

    "COUNCIL_ANALYSIS": WorkflowDefinition(
        name="COUNCIL_ANALYSIS",
        description="Convene Tri-Persona Council (Chief Architect, Risk Critic, Innovator) for rigorous multi-perspective deliberation.",
        allowed_tools=[
            "knowledge_search",
            "content_dna",
            "council_models",
            "evidence_checker"
        ],
        risk_level="MEDIUM",
        requires_approval=False,
        deliverables=["council_deliberation", "consensus_note"]
    ),

    "KNOWLEDGE_QUERY": WorkflowDefinition(
        name="KNOWLEDGE_QUERY",
        description="Search 100% on-premises organizational SOPs, standards, and manuals, and synthesize source-backed answers.",
        allowed_tools=[
            "knowledge_search",
            "content_dna",
            "evidence_checker"
        ],
        risk_level="LOW",
        requires_approval=False,
        deliverables=["knowledge_citations", "source_provenance"]
    ),

    "MULTIMODAL_ANALYSIS": WorkflowDefinition(
        name="MULTIMODAL_ANALYSIS",
        description="Analyze images, videos, engineering drawings, and schematics using local OpenCV computer vision, frame sampling, and scene recognition.",
        allowed_tools=[
            "file_reader",
            "media_analyzer",
            "image_recognizer",
            "video_recognizer",
            "ocr",
            "vision_model",
            "content_dna",
            "conflict_detector",
            "evidence_checker"
        ],
        risk_level="LOW",
        requires_approval=False,
        deliverables=["image_analysis", "video_timeline", "ocr_extraction", "content_dna"]
    ),

    "DIRECT_CHAT": WorkflowDefinition(
        name="DIRECT_CHAT",
        description="Fast direct conversational answer for general queries without tool invocation.",
        allowed_tools=[],
        risk_level="LOW",
        requires_approval=False,
        deliverables=[]
    ),
}


class WorkflowSafetyValidator:
    """Enforces that the sovereign agent only executes tools permitted by the active workflow."""
    
    @staticmethod
    def is_tool_permitted(workflow_name: str, tool_name: str) -> bool:
        workflow = WORKFLOWS.get(workflow_name)
        if not workflow:
            return False
        return tool_name in workflow.allowed_tools

    @staticmethod
    def validate_tool_execution(workflow_name: str, tool_name: str):
        if not WorkflowSafetyValidator.is_tool_permitted(workflow_name, tool_name):
            allowed = WORKFLOWS.get(workflow_name, WorkflowDefinition("", "", [])).allowed_tools
            raise PermissionError(
                f"[SOVEREIGN SAFETY VIOLATION] Tool '{tool_name}' is NOT permitted in workflow '{workflow_name}'. "
                f"Permitted tools: {allowed}"
            )
        return True


workflow_validator = WorkflowSafetyValidator()

# E.V Sovereign — Autonomous Industrial AI Engineering Workbench

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Air--Gap Verified](https://img.shields.io/badge/Air--Gap-100%25%20On--Premises-success.svg)](#-zero-cloud-egress-sovereignty--security-shield)
[![Automated Tests](https://img.shields.io/badge/Tests-30%2F30%20Passing-brightgreen.svg)](#-automated-30-test-regression-suite)
[![Zero Cloud Egress](https://img.shields.io/badge/External%20Egress-0%20Bytes-blueviolet.svg)](#-zero-cloud-egress-sovereignty--security-shield)

**E.V (Sovereign Autonomous Industrial AI Workbench)** is an air-gapped, 100% on-premises autonomous engineering intelligence platform engineered for mission-critical industrial installations—such as petroleum refineries, nuclear and thermal power plants, aerospace manufacturing complexes, defense installations (SCIFs), and confidential intellectual property research laboratories.

E.V replaces passive, cloud-tethered chatbots with an **authoritative, active engineering peer**. It unifies 13-node document Content DNA extraction, multi-language sandbox execution and self-healing debugging, local multimodal computer vision and video telemetry, multi-agent Tri-Persona Council deliberation, on-premise SOP compliance verification, and automated enterprise deliverable compilation (`.docx`, `.pptx`, `.xlsx`) into a **single aerospace HUD conversational cockpit**—with **absolute zero external cloud egress**.

---

## 🏛️ End-to-End Architectural Pipeline

```text
                                 USER PROMPT / ATTACHED ASSETS
                     (PDF, DOCX, TXT, UT Logs, Images, Video, Source Code)
                                               │
                                               ▼
     ┌──────────────────────────────────────────────────────────────────────────────────┐
     │                     AI ACTION INTENT CLASSIFIER & ROUTER                         │
     │      (Fail-Closed Enum Router: write_code, debug_code, analyze_document, etc.)   │
     └─────────────────────────────────────────┬────────────────────────────────────────┘
                                               │
                                               ▼
     ┌──────────────────────────────────────────────────────────────────────────────────┐
     │                      DYNAMIC EXECUTION PLAN FORMULATOR                           │
     │      (Builds Inspectable Steps, Tools Assigned, Verification Criteria)           │
     └─────────────────────────────────────────┬────────────────────────────────────────┘
                                               │
                     ┌─────────────────────────┴─────────────────────────┐
                     ▼                                                   ▼
       [ PRE-EXECUTION APPROVAL GATE ]                     [ DIRECT EXECUTION PATH ]
       (Human-in-the-loop permission modal                 (Read-only queries, chat,
        for file writes & shell actions)                    evidence synthesis)
                     │                                                   │
                     └─────────────────────────┬─────────────────────────┘
                                               │
                                               ▼
 ═══════════════════════════════ SOVEREIGN EXECUTION MESH ══════════════════════════════
   │                                                                                  │
   ├──► [ 13-Node Content DNA Engine ]                                                │
   │    Extracts Factual Matrix: Claims, Stats, Units, Risks, Recommendations         │
   │    Cross-References Governing SOPs (ASME B31.3 / API 570 / ISO 10816)            │
   │    Emits Conflict Cards on Critical Parameter Tolerances (Human Pause & Resume)  │
   │                                                                                  │
   ├──► [ Multi-Language Sandbox & Self-Healing Debugger ]                            │
   │    Supported: Python, Node.js (JS/TS), Bash/Shell, GCC/Clang (C/C++), HTML/CSS   │
   │    Subprocess Execution -> Traceback Diagnostic -> Local Qwen 2.5 Coder Healing  │
   │    In-Place File Patching -> Sandbox Re-Execution -> Exit Code 0 Verification    │
   │                                                                                  │
   ├──► [ Local Multimodal Computer Vision & Video Engine ]                           │
   │    100% On-Premises OpenCV Frame Sampling & Optical Flow Motion Dynamics         │
   │    Dominant Chromatic Telemetry & Anomaly Profiling via Local Vision Checkpoints │
   │                                                                                  │
   ├──► [ Tri-Persona Deliberation Council ]                                          │
   │    Multi-Agent Debate: Chief Architect vs Risk Critic vs Innovation Engineer     │
   │    Synthesizes Unified Executive Consensus with Clear Technical Preconditions    │
   │                                                                                  │
   └──► [ Automated Office Deliverables Rack ]                                        │
        Compiles .docx (PSU Official Approval Notes), .pptx (Widescreen Slide Decks), │
        and .xlsx (Formula-Backed Parametric Workbooks) with Zero Cloud Calls         │
 ═══════════════════════════════════════════════════════════════════════════════════════
                                               │
                                               ▼
     ┌──────────────────────────────────────────────────────────────────────────────────┐
     │                      REAL-TIME STREAMING & TELEMETRY HUD                         │
     │      (SSE Event Stream: Token Streaming, Step Checklists, Conflict Cards,        │
     │       Live Sandbox Results, Socket-Level 0-Byte Cloud Egress Audit Shield)       │
     └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Novelty & Value Proposition

| Traditional Cloud AI (ChatGPT, Copilot) | E.V Sovereign Workbench |
| :--- | :--- |
| **Cloud Egress Hazard**: Transmits sensitive telemetry and code across public Internet. | **100% Air-Gapped**: Runs entirely on-premises; zero external bytes transmitted. |
| **Probabilistic Hallucinations**: Speculates on critical engineering parameters without checking physics. | **13-Node Grounding**: All claims and statistics tied directly to source citations and SOP limits. |
| **Passive Text Output**: Provides conversational code suggestions that the user must copy, paste, and debug. | **Active Execution**: Directly reads, edits, executes, and self-heals code on host runtimes to Exit Code 0. |
| **Arbitrary Document Chunking**: Standard RAG fragments tables and relational engineering context. | **Content DNA Matrix**: Extracts structured claims, statistics, failure modes, and tolerance limits. |
| **Fragmented Tooling**: Chat in one window, IDE in another, Office suite in a third. | **Unified Cockpit**: Documents, multi-language coding, media analysis, and deliverables in one HUD. |

---

## ⚡ The Seven Core Pillar Innovations

### 1. 🧬 13-Node Content DNA & Semantic Conflict Engine
Standard retrieval techniques lose parametric relationships. E.V decomposes unstructured industrial documents (such as NDT inspection logs, ultrasonic thickness reports, and incident audits) into a structured **13-node factual matrix**:
1. **Source Identity & Provenance**: Document title, author, timestamp, facility location, and metadata.
2. **Executive Overview**: High-density synthetic summary of the document.
3. **Discrete Verified Claims**: Explicit factual assertions isolated from conversational prose.
4. **Key Findings**: Priority operational insights and diagnostic determinations.
5. **Parametric Statistics**: Exact physical measurements, pressures, wall thicknesses, flow rates, and temperatures paired with their engineering units.
6. **Chronological Dates & Milestones**: Historical timeline of inspections, maintenance shutdowns, and deadlines.
7. **Operational Events**: Mechanical or procedural incidents recorded in the text.
8. **Operational & Mechanical Risks**: Explicit failure modes, corrosion mechanisms, and structural hazards.
9. **Strategic Opportunities**: Operational enhancements, throughput gains, and energy optimizations.
10. **Regulatory & Policy Implications**: Alignment or non-compliance with governing industry standards.
11. **Empirical Evidence Chains**: Supporting ultrasonic logs, sensor readings, and calibration numbers.
12. **Actionable Recommendations**: Mandatory mitigation actions and operational derating directives.
13. **Named Entity Graph**: Structured mapping of equipment tags (e.g., `CDU-04`, `HEX-102`), personnel, organizations, and standards.

#### Cross-Document Conflict & SOP Tolerance Enforcement
E.V cross-references extracted Content DNA metrics against indexed corporate standards (e.g., ASME B31.3, API 570, ISO 10816, plant SOPs). If a field report records an operating pressure of 18.5 bar with pipe thickness of 6.8 mm, and SOP-CDU-04 mandates derating to 12.0 bar for thickness below 8.0 mm:
- E.V detects the critical tolerance breach.
- Pauses the workflow and displays an interactive **Conflict Card** in the cockpit.
- Offers engineering resolution options (e.g., apply recommended SOP derating vs. retain current pressure).
- Resumes execution and integrates the approved decision into all subsequent code, calculations, and deliverables.

---

### 2. 🛡️ Multi-Language Host Sandbox & Autonomous Self-Healing Debugger
E.V embeds a secure multi-language execution sandbox supporting host execution across five core languages:
- **Python** (`.py`): Executed via host virtual environments with full scientific library support (`numpy`, `scipy`, `pandas`, `sympy`).
- **JavaScript & TypeScript** (`.js`, `.ts`, `.jsx`, `.tsx`): Verified and executed via local Node.js runtimes.
- **Bash & Shell** (`.sh`, `.bash`): Verified with `bash -n` and executed inside scoped workspace directories.
- **C & C++** (`.c`, `.cpp`): Compiled on-the-fly using host `gcc` or `clang` with syntax validation or binary execution.
- **HTML5 & CSS3** (`.html`, `.css`): Validated via DOM structure and stylesheet integrity linters.

*(Note: Per enterprise security policy, languages with direct network socket exposure or unneeded overhead like Go, Rust, and raw SQL databases are explicitly scoped out of the sandbox to maintain a minimal attack surface).*

#### Autonomous Code Self-Healing Loop
When debugging code (or clicking **Debug in Agent** in the Workspace file explorer):
1. **Pre-Diagnostic Telemetry**: Runs the script inside the sandbox, capturing raw exit codes, `stdout`, and `stderr` tracebacks.
2. **Contextual LLM Healing**: Ingests original source code, user instructions, and error tracebacks into local `qwen2.5-coder:3b`.
3. **Logic Preservation**: The debugger strictly preserves the domain logic (e.g., keeping a random number generator, algorithm, or simulation intact while resolving syntax errors, missing imports like `random`/`math`, or runtime exceptions).
4. **On-Disk Patching**: Safely rewrites the file in place within the active workspace.
5. **Post-Repair Verification**: Automatically re-runs the patched script in the sandbox to verify that it exits with **Exit Code 0**, displaying live terminal execution output to the user.

---

### 3. 👥 Tri-Persona Council (Multi-Agent Strategic Deliberation)
For high-stakes architectural or operational trade-offs, E.V convenes three specialized autonomous sub-agents:
- **The Chief Architect**: Evaluates modularity, system feasibility, DCS/SCADA integration, and structural maintainability.
- **The Risk & Safety Critic**: Probes edge-case failure modes, HAZOP compliance, thermal degradation, and operational hazards.
- **The Chief Innovation Engineer**: Identifies modern optimization opportunities, automated sensor feedback loops, and efficiency breakthroughs.

The Council conducts a multi-turn structured debate and synthesizes a **Unified Executive Consensus** with clear operational preconditions, displayed live with persona telemetry cards.

---

### 4. 👁️ 100% On-Premises Multimodal Computer Vision & Video Telemetry
Industrial monitoring involves massive volumes of visual media—corrosion inspection photographs, thermal infrared captures, drone flyover footage, and CCTV security streams. Transmitting gigabytes of video to external cloud APIs is both bandwidth-prohibitive and a severe operational security hazard.

E.V embeds a **100% Local Multimodal Media Engine**:
- **Keyframe Extraction & Motion Dynamics**: Ingests video containers (`.mp4`, `.mov`, `.avi`), samples temporal keyframes using local OpenCV algorithms, and calculates optical flow motion vectors to detect abnormal physical activity.
- **Optical Feature Telemetry**: Measures color palettes, detects localized degradation patterns, and extracts dominant chromatic signatures.
- **On-Premise Scene Reasoning**: Leverages local vision model checkpoints (`gemma3:4b` vision) to generate detailed chronological scene logs, anomaly descriptions, and telemetry summaries—all without a single byte of video data ever leaving the workstation host.

---

### 5. 📑 Automated Multi-Format Deliverables Rack
Technical insight is useless if it remains trapped in chat transcripts. E.V contains an automated **Deliverables Generation Rack** capable of compiling:
- **Official Approval Notes (`.docx`)**: Generates formal Word documents complete with official reference numbers, timestamps, executive summaries, technical tables, risk matrices, and sign-off signature blocks.
- **Executive Board Presentations (`.pptx`)**: Builds professionally themed slide decks with high-contrast color palettes, category subtitles, structured bullet hierarchies, and speaker notes.
- **Parametric Engineering Sheets (`.xlsx`)**: Compiles multi-tab workbooks containing raw telemetry data, dynamically generated Excel formulas (e.g., variance calculations `=C4*0.05`), automated conditional formatting, and risk prioritization tables.

All deliverables are generated on-demand using native local Python libraries (`python-docx`, `python-pptx`, `openpyxl`), ensuring that the resulting files are immediately editable by enterprise users.

---

### 6. 📚 On-Premises SOP Knowledge Base & Regulatory Provenance
E.V embeds a local engineering standards repository indexed for fast, vectorless and vector-assisted semantic search:
- **Indexed Standards**: Pre-configured with governing industry codes (ASME B31.3 Process Piping, API 570 Piping Inspection Code, ISO 10816 Mechanical Vibration Evaluation, and plant-specific SOPs like SOP-CDU-04).
- **Chunk-Level Provenance**: Every retrieved standard matches exact section numbers, estimated page numbers, and verbatim regulatory mandates.
- **Confidence Scoring**: Delivers source-backed compliance evaluations with confidence percentages.

---

### 7. 🔒 Zero-Cloud-Egress Sovereignty & Security Shield
To provide incontrovertible mathematical proof of data isolation, E.V includes a built-in **Network Sovereignty Monitor**:
- **Host Socket Interception**: Tracks every network call initiated by the application runtime.
- **Real-Time Telemetry Logging**: Records target endpoint URIs, local inference durations, token counts, and egress status.
- **Air-Gap Verification**: Formally certifies that external network egress is **0 bytes**, giving compliance auditors complete visibility into the security posture of the application.
- **Pre-Execution Approval Gate**: Prompts the user with explicit 3-option confirmation (`Yes`, `Yes and don't ask again for commands that start with write`, `No`) before modifying workspace files or running shell actions.

---

## 🚦 Predefined Workflows & Tool Safety Matrix

E.V enforces strict tool access boundaries using a predefined workflow registry. Sub-agents and execution steps are constrained to only authorized tools:

| Workflow Identifier | Primary Purpose | Authorized Tools | Verification Standard |
| :--- | :--- | :--- | :--- |
| **`CODING`** | File creation, editing, and code healing | `workspace_reader`, `code_editor`, `sandbox`, `test_runner` | Subprocess execution with Exit Code 0 |
| **`DOCUMENT_ANALYSIS`** | Ingest unstructured reports, build Content DNA | `file_reader`, `content_dna`, `conflict_detector` | 13-node factual matrix validation |
| **`CONTENT_TO_DELIVERABLE`** | Transform data into executive office files | `content_dna`, `document_generator` | Validated generation of `.docx`, `.pptx`, `.xlsx` |
| **`ENGINEERING_CALCULATION`** | Mathematical and physical simulations | `python_sandbox`, `calculator` | Multi-step mathematical proof in sandbox |
| **`COUNCIL_ANALYSIS`** | Deliberate strategic trade-offs | `council_models` | Tri-persona multi-agent consensus synthesis |
| **`KNOWLEDGE_QUERY`** | Interrogate corporate SOPs and standards | `knowledge_search` | Citation matching against indexed ASME/API manuals |
| **`MULTIMODAL_ANALYSIS`** | Deconstruct images and video streams | `image_recognizer`, `video_recognizer` | Temporal frame analysis & optical telemetry |
| **`DIRECT_CHAT`** | General technical dialogue | `streaming_llm` | Streamed token response with clean typography |

---

## 🧪 Automated 30-Test Regression Suite

E.V includes a comprehensive automated test suite verifying all autonomous workflows, multi-language sandbox runtimes, and local knowledge retrieval:

```bash
cd Backend
./venv/bin/python test_conversational_orchestrator.py
```

### Full Test Coverage (30/30 Passing):
- **TEST 1–3**: Direct Chat, Contextual Council Offer, and Tri-Persona Council Debate.
- **TEST 4–5**: 13-Node Content DNA Extraction & Cross-Source Conflict Detection.
- **TEST 6–7**: Code Debugging Sandbox Patch & Isolated Mathematical Calculations.
- **TEST 8–10**: Deliverables Generation (`.docx`/`.pptx`/`.xlsx`) & Multi-Step Composition.
- **TEST 11–12**: Conversational Memory & Non-Hallucination Unknown Handling.
- **TEST 13–15**: Physical Workspace Operations (`FILE_CREATE`, `FILE_READ`, Cross-File Multi-File Debugging).
- **TEST 16–17**: File Clearing (`CLEARED_ON_DISK`) & Dynamic Code Modification (`MODIFIED_ON_DISK`).
- **TEST 18–19**: Dynamic User Topic Deliverables & User Parameter Math Calculation.
- **TEST 20–21**: Manual Model Switching (`qwen2.5-coder:3b`, `qwen3:8b`, `gemma3:4b`) & Intelligent Task-Based Routing.
- **TEST 22**: Official Approval Note Generation with Clean Typography.
- **TEST 23**: Predefined Workflow Registry & Tool Safety Validator (Blocks unauthorized tools).
- **TEST 24**: Local Knowledge Base Search & Source Provenance (ASME B31.3 / API 570 / SOP-CDU-04).
- **TEST 25**: Execution Plan Formulation with Detailed Step Schema.
- **TEST 26**: Human-in-the-Loop Conflict Pause and Resume.
- **TEST 27**: Target File Switching (Prompt filename overrides stale editor active file).
- **TEST 28**: Host Terminal Error Check & 100% UI Checklist Completion.
- **TEST 29**: AI Action Classifier & Fail-Closed Enum Router with Path Traversal Protection.
- **TEST 30**: Scoped Multi-Language Sandbox (Python, JS, Bash, C, HTML) & Pre-Execution Confirmation Modal.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.10+ (Recommended: 3.11 / 3.12 / 3.14)
- **Ollama** installed locally with target models:
  ```bash
  ollama pull qwen2.5-coder:3b
  ollama pull qwen3:8b
  ollama pull gemma3:4b
  ```

---

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/karthikeyan4747/E.V.git
   cd E.V
   ```

2. **Backend Setup**:
   ```bash
   cd Backend
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scriptsctivate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   cd ../Frontend
   npm install
   ```

---

### Running in Development Mode

1. **Start Backend Server**:
   ```bash
   cd Backend
   source venv/bin/activate
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Start Frontend Dev Server**:
   ```bash
   cd Frontend
   npm run dev
   ```

3. Open **`http://127.0.0.1:5173`** in your browser.

---

### Production Single-Origin Build

Compile the React frontend into static assets served directly by the FastAPI backend:

```bash
# 1. Build Frontend
cd Frontend
npm run build

# 2. Launch FastAPI
cd ../Backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Access the complete workbench at **`http://127.0.0.1:8000`**.

---

## 📂 Project Directory Structure

```text
E.V/
├── Backend/
│   ├── autonomous_engine.py           # Master orchestrator, AI intent classifier & workflow loop
│   ├── content_dna.py                 # 13-node factual matrix & semantic conflict detector
│   ├── deliverables.py                # On-premises Word (.docx), PPTX (.pptx), and Excel (.xlsx) compiler
│   ├── project_workspace.py           # Workspace file explorer, disk reader & writer
│   ├── agent_sandbox.py               # Isolated multi-language execution sandbox (Python, JS, Bash, C)
│   ├── sovereign_llm.py               # Local Ollama client, model router & streaming generator
│   ├── media_engine.py                # OpenCV frame sampling, motion dynamics & optical telemetry
│   ├── local_knowledge.py             # On-premise SOP & engineering standards repository (ASME/API/ISO)
│   ├── network_monitor.py             # Socket interceptor & zero-cloud-egress compliance auditor
│   ├── main.py                        # FastAPI REST routes and Server-Sent Event (SSE) endpoints
│   └── test_conversational_orchestrator.py # 30-test automated verification suite
│
├── Frontend/
│   ├── package.json                   # React 19, Vite, Tailwind CSS, Lucide icons
│   └── src/
│       ├── App.jsx                    # Root state, active file manager & capability drawer routing
│       ├── services/
│       │   └── api.js                 # Sovereign API client (SSE streams, workspace endpoints)
│       └── components/
│           ├── AgentStudio.jsx        # Aerospace HUD conversational cockpit & telemetry cards
│           ├── CouncilView.jsx        # Tri-persona Council debate card & consensus synthesis
│           ├── ContentDNAStudio.jsx   # Interactive 13-node document explorer & claim cards
│           ├── CodeSandbox.jsx        # Sandbox execution viewer & terminal telemetry
│           ├── DeliverablesViewer.jsx # Deliverables rack (Word, PowerPoint, Excel downloads)
│           ├── NetworkMonitorModal.jsx# Air-gap telemetry audit modal (0-byte cloud egress)
│           ├── ProjectWorkspace.jsx   # File manager, code editor & 'Debug in Agent' trigger
│           └── ErrorBoundary.jsx      # React error boundary preventing UI crashes
```

---

## 🔒 Security & Air-Gap Compliance

- **Zero External Telemetry**: Contains zero cloud dependencies, analytics trackers, or external phone-home endpoints.
- **Subprocess Isolation**: Untrusted scripts run in isolated subprocess runtimes with CPU execution timeouts and memory boundaries.
- **Fail-Closed Security**: Path traversal attacks (e.g., `../../`) are strictly blocked; file operations are confined within the active workspace root.
- **Human-in-the-Loop Interlocks**: Critical actions (destructive file writes, shell execution, parameter overrides) mandate explicit operator confirmation.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

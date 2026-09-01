# EV Sovereign — Industrial AI Sovereign Workbench

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Air--Gap Verified](https://img.shields.io/badge/Air--Gap-100%25%20On--Premises-success.svg)](#air-gap-sovereignty--security)

**EV Sovereign** is an air-gapped, on-premises autonomous AI workbench designed for mission-critical industrial organizations—such as petroleum refineries, PSUs (Public Sector Undertakings), defense manufacturing, and sovereign infrastructure.

It unifies document intelligence, multi-persona architectural deliberation, physical code workspace operations, sandbox calculation execution, and dynamic deliverable compilation into a **single conversational cockpit**.

---

## 🏛️ Architectural Overview

```text
                                  USER PROMPT / ATTACHMENTS
                                              │
                                              ▼
                             ┌───────────────────────────────────┐
                             │    Autonomous Workflow Engine     │
                             │  (Intent Classifier & Orchestrator)│
                             └─────────────────┬─────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               │                               │                               │
               ▼                               ▼                               ▼
     ┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
     │ 13-Node DNA &     │           │  Tri-Persona      │           │ Code & Math       │
     │ Conflict Analysis │           │  Council Delib.   │           │ Sandbox Engine    │
     └─────────┬─────────┘           └─────────┬─────────┘           └─────────┬─────────┘
               │                               │                               │
               │                               ▼                               │
               │                     ┌───────────────────┐                     │
               └────────────────────►│ Formal Deliverable│◄────────────────────┘
                                     │  (.docx/.pptx)    │
                                     └─────────┬─────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     SSE Stream to UI Cockpit     │
                              │ (Trace Steps, Cards, Artifacts)  │
                              └──────────────────────────────────┘
```

---

## ⚡ Core Capabilities

### 1. Single Conversational Cockpit
- **Natural Language Intent Routing**: Automatically classifies and executes conversational requests, code tasks, council reviews, document audits, and deliverable requests without requiring mode switching.
- **Real-Time SSE Execution Trace**: Live status indicators show every execution step from planning to completion.
- **Local Storage Multi-Chat**: Retains multiple isolated chat sessions and deliverables locally in the browser with export capabilities.

### 2. 13-Node Content DNA & Semantic Conflict Detection
- **Factual Decomposition**: Extracts 13 structured nodes (*Identity, Overview, Entities, Claims, Statistics, Dates, Events, Key Findings, Risks, Opportunities, Implications, Evidence, Recommendations*) from industrial technical reports.
- **Cross-Report Conflict Detector**: Automatically compares multiple inspection reports and flags high/medium discrepancies in process metrics, operating pressures, temperatures, and wall thickness measurements.

### 3. Tri-Persona Council Deliberation
- **Multi-Perspective Review**: Convenes three expert engineering personas:
  - **Chief Architect**: System robustness, DCS/SCADA integration, and air-gap modularity.
  - **Risk & Safety Critic**: HAZOP compliance, containment hazards, and failure modes.
  - **Innovation Specialist**: Energy efficiency, automated telemetry loops, and modern engineering benefits.
- **Unified Consensus**: Formulates executive decision summaries with mandatory preconditions.

### 4. Physical Workspace & Subprocess Code Sandbox
- **Direct Workspace File Operations**: Dynamically creates, inspects, edits, and clears physical files on disk (`FILE_CREATE`, `FILE_READ`, `FILE_EDIT`).
- **Subprocess Execution Sandbox**: Executes Python computation scripts in an isolated subprocess runtime, capturing exit codes, runtime duration, stdout, and stderr.
- **Multi-File Error Diagnosis**: Resolves cross-file import bugs and validates changes with `Exit Code: 0`.

### 5. Dynamic On-Premises Deliverables Compiler
- **PowerPoint Presentation Decks (`.pptx`)**: Generates 16:9 widescreen presentation slides with custom themes, bullet points, and speaker notes tailored to the user's prompt.
- **Word Approval Notes (`.docx`)**: Compiles formal PSU-style technical notes with executive summaries, parameter tables, risk assessments, and 3-tier sign-off blocks.
- **Excel Calculation Workbooks (`.xlsx`)**: Builds multi-sheet workbooks with data matrices and formulas.

### 6. Zero-Egress Air-Gap Telemetry Audit
- **Network Egress Monitor**: Logs and verifies that 100% of telemetry, model inference, and tool executions run locally on localhost with **0 bytes of external cloud egress**.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.10+ (Recommended: 3.11 / 3.12 / 3.14)
- **Ollama** (Optional, for local model inference with `qwen3:8b` or similar)

---

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/karthikeyan4747/E.V.git
   cd E.V
   ```

2. **Backend Setup**:
   ```bash
   cd Backend
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
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

### Production Build (Single Origin)

Build the React frontend into static assets served directly by FastAPI:

```bash
# 1. Build Frontend
cd Frontend
npm run build

# 2. Launch FastAPI
cd ../Backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🧪 Automated Test Suite

EV Sovereign includes an automated 19-test verification suite covering all autonomous workflows:

```bash
python3 Backend/test_conversational_orchestrator.py
```

### Test Coverage:
| Test ID | Workflow Verified |
| :--- | :--- |
| **TEST 1–3** | Direct Chat, Contextual Council Offer, and Tri-Persona Council Debate |
| **TEST 4–5** | 13-Node Content DNA & Cross-Source Conflict Detection |
| **TEST 6–7** | Code Debugging Sandbox Patch & Isolated Mathematical Calculations |
| **TEST 8–10**| Deliverable Generation (.docx/.pptx/.xlsx) & Multi-Step Composition |
| **TEST 11–12**| Conversational Memory & Strict Non-Hallucination Unknown Handling |
| **TEST 13–17**| Workspace Operations (`FILE_CREATE`, `FILE_READ`, `FILE_EDIT`, Multi-File Debugging) |
| **TEST 18–19**| Dynamic Input-Driven Deliverables & Dynamic Math Verification |

---

## 📂 Project Structure

```text
E.V/
├── Backend/
│   ├── autonomous_engine.py           # Master conversational agent & intent orchestrator
│   ├── content_dna.py                 # 13-node factual matrix & conflict detection engine
│   ├── deliverables.py                # On-premises Word, PPTX, and Excel compiler
│   ├── project_workspace.py           # Physical file workspace reader & writer
│   ├── agent_sandbox.py               # Isolated subprocess code execution sandbox
│   ├── sovereign_llm.py               # Air-gapped Ollama interface & fallback generators
│   ├── network_monitor.py             # Egress telemetry auditor (0 cloud network egress)
│   ├── main.py                        # FastAPI endpoints and SSE stream routes
│   └── test_conversational_orchestrator.py # 19-test automated test suite
│
├── Frontend/
│   └── src/
│       ├── App.jsx                    # Root state & session management
│       └── components/
│           ├── AgentStudio.jsx        # Conversational cockpit & card renderers
│           ├── CouncilView.jsx        # Tri-persona Council debate card
│           ├── ContentDNAStudio.jsx   # Interactive 13-node document explorer
│           ├── CodeSandbox.jsx        # Sandbox execution viewer
│           ├── DeliverablesViewer.jsx # Deliverable file download rack
│           ├── NetworkMonitorModal.jsx# Air-gap telemetry audit modal
│           └── ProjectWorkspace.jsx   # Project files explorer
```

---

## 🔒 Air-Gap Sovereignty & Security

- **Zero Cloud Network Egress**: The application contains no external phone-home telemetry or cloud dependencies.
- **Safe Sandbox Isolation**: Code execution is sandboxed with strict execution timeouts and subprocess isolation.
- **Environment Isolation**: Private `.env` files and runtime-generated deliverables are excluded from source control.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.


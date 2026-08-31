import React, { useState, useEffect, useRef } from 'react'
import { 
  Bot, 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Terminal, 
  Download, 
  Sparkles, 
  Layers, 
  ChevronRight,
  Cpu,
  ShieldCheck,
  FileSpreadsheet,
  Presentation,
  Loader2,
  Copy,
  Check,
  Zap,
  FolderGit2,
  FileCode,
  Paperclip,
  X,
  Lock,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  CheckSquare,
  Flame,
  Bug
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

export function AgentStudio({ onOpenDeliverables, onSetInferencing, activeWorkspace = 'EV' }) {
  const [prompt, setPrompt] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [activePlan, setActivePlan] = useState(null)
  const [pendingPermission, setPendingPermission] = useState(null)
  const [executedEvents, setExecutedEvents] = useState([])
  const [artifacts, setArtifacts] = useState([])
  const [attachedFiles, setAttachedFiles] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [councilResult, setCouncilResult] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [copied, setCopied] = useState(false)

  const abortControllerRef = useRef(null)
  const timerRef = useRef(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Load session memory
    sovereignAPI.getChatMemory()
      .then(res => {
        if (res.messages && res.messages.length > 0) {
          setChatMessages(res.messages)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isStreaming) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isStreaming])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamedText, executedEvents, pendingPermission])

  const handleAttachFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        setAttachedFiles(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            content: event.target.result
          }
        ])
      }
      reader.readAsText(file)
    }
  }

  const handleRemoveAttached = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleStopExecution = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    try {
      await sovereignAPI.stopAgent()
    } catch {}
    setIsStreaming(false)
    setStatusMessage('Execution stopped by user.')
    if (onSetInferencing) onSetInferencing(false)
  }

  const handleStartAgent = async (overridePrompt, approvedPlanId = null, autoApprove = false) => {
    const textToRun = overridePrompt || prompt
    if (!textToRun.trim() || isStreaming) return

    setIsStreaming(true)
    setStatusMessage('Formulating methodology plan & analyzing source...')
    setStreamedText('')
    setActivePlan(null)
    setPendingPermission(null)
    setExecutedEvents([])
    setCouncilResult(null)
    if (onSetInferencing) onSetInferencing(true, 'Planning Execution...')

    // Add user message to UI
    if (!approvedPlanId) {
      setChatMessages(prev => [...prev, { role: 'user', content: textToRun }])
    }

    abortControllerRef.current = new AbortController()

    const payload = {
      prompt: textToRun,
      attached_files: attachedFiles,
      approved_plan_id: approvedPlanId,
      auto_approve: autoApprove
    }

    await sovereignAPI.streamAgent(
      payload,
      (event) => {
        if (event.type === 'status') {
          setStatusMessage(event.message)
        } else if (event.type === 'plan_created') {
          setActivePlan(event.plan)
        } else if (event.type === 'permission_required') {
          setPendingPermission(event)
          setStatusMessage('Waiting for user permission to execute plan...')
          setIsStreaming(false)
          if (onSetInferencing) onSetInferencing(false)
        } else if (event.type === 'token') {
          setStreamedText(prev => prev + event.token)
        } else if (event.type === 'council_debate') {
          setCouncilResult(event)
        } else if (event.type === 'file_modified' || event.type === 'sandbox_result' || event.type === 'verification_passed' || event.type === 'self_healing') {
          setExecutedEvents(prev => [...prev, event])
        } else if (event.type === 'completed') {
          if (event.artifacts) {
            setArtifacts(event.artifacts)
          }
          setStatusMessage(event.message || 'Task completed successfully.')
          setChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Task completed. Modified project files and verified in local sandbox.\n${event.target_file ? 'Updated: ' + event.target_file : ''}`
          }])
        } else if (event.type === 'aborted') {
          setStatusMessage('Execution stopped by user.')
          setIsStreaming(false)
          if (onSetInferencing) onSetInferencing(false)
        } else if (event.type === 'error') {
          setStatusMessage(`Error: ${event.message}`)
        }
      },
      () => {
        setIsStreaming(false)
        if (onSetInferencing) onSetInferencing(false)
      },
      (err) => {
        console.error(err)
        setStatusMessage(`Connection error: ${err.message}`)
        setIsStreaming(false)
        if (onSetInferencing) onSetInferencing(false)
      },
      abortControllerRef.current.signal
    )

    if (!approvedPlanId) {
      setPrompt('')
    }
  }

  const handleApprovePlan = () => {
    if (!pendingPermission) return
    const planId = pendingPermission.plan_id
    setPendingPermission(null)
    handleStartAgent(prompt || activePlan?.title, planId, true)
  }

  const handleClearChat = async () => {
    try {
      await sovereignAPI.clearChatMemory()
      setChatMessages([])
      setStreamedText('')
      setActivePlan(null)
      setPendingPermission(null)
      setExecutedEvents([])
      setCouncilResult(null)
    } catch {}
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0d14] text-slate-100 font-sans">
      {/* Hidden file input for attachment */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleAttachFile}
        className="hidden"
      />

      {/* Main Conversation & Plan Execution Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Antigravity Hero / Quick Starting Bar */}
        {chatMessages.length === 0 && !isStreaming && !activePlan && (
          <div className="max-w-3xl mx-auto text-center py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SOVEREIGN AGENTIC WORKBENCH // ON-PREMISES</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              What should EV build or debug today?
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 max-w-xl mx-auto mt-2">
              Select a project folder or attach document sources. EV formulates execution plans, writes code directly to files, verifies in sandbox, and auto-heals bugs.
            </p>

            {/* Active Source Context Box */}
            <div className="mt-6 p-3.5 rounded-xl codex-panel border-slate-800 bg-[#0e1424]/80 max-w-md mx-auto flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">Active Project Source</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{activeWorkspace}</div>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-sky-300 border border-slate-700 transition shrink-0 ml-2"
              >
                + Attach Source File
              </button>
            </div>
          </div>
        )}

        {/* Conversation History */}
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-3xl mx-auto flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-600/10 font-medium'
                  : 'codex-panel text-slate-200 rounded-bl-none border-slate-800 bg-[#0e1424]/90'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
            </div>
          </div>
        ))}

        {/* Active Plan Steps Card */}
        {activePlan && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-sky-500/40 bg-sky-950/15 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Methodology & Execution Plan ({activePlan.steps?.length || 3} Steps)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                PLAN ID: {activePlan.plan_id}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans mb-3 italic">
              "{activePlan.methodology}"
            </p>

            <div className="space-y-2">
              {activePlan.steps?.map((st) => (
                <div
                  key={st.step_number}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-sky-400 shrink-0">
                      {st.step_number}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{st.title}</div>
                      <div className="text-[11px] text-slate-400">{st.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {st.action_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Antigravity-Style Permission Request Card */}
        {pendingPermission && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 shadow-2xl animate-pulse-subtle">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">
                User Permission Required to Modify Workspace Files
              </span>
            </div>
            <p className="text-xs text-slate-200 mb-3 font-sans leading-relaxed">
              {pendingPermission.message}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleApprovePlan}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4 font-bold" />
                <span>Approve & Execute Plan</span>
              </button>

              <button
                onClick={() => setPendingPermission(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                Cancel / Reject
              </button>
            </div>
          </div>
        )}

        {/* Real-time Tool Execution Logs & Diffs */}
        {executedEvents.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-2.5">
            {executedEvents.map((ev, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                {ev.type === 'file_modified' && (
                  <div>
                    <div className="flex items-center justify-between text-emerald-400 font-mono font-semibold mb-1">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-4 h-4" />
                        <span>Modified Project File: {ev.filename}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {ev.status}
                      </span>
                    </div>
                    <pre className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800/80 max-h-48 overflow-y-auto font-mono text-[11px]">
                      {ev.content}
                    </pre>
                  </div>
                )}

                {ev.type === 'sandbox_result' && (
                  <div>
                    <div className="flex items-center justify-between font-mono font-semibold mb-1">
                      <div className="flex items-center gap-1.5 text-sky-300">
                        <Terminal className="w-4 h-4" />
                        <span>Sandbox Test (Attempt {ev.attempt})</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        ev.exit_code === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        Exit Code: {ev.exit_code} ({ev.duration_ms}ms)
                      </span>
                    </div>
                    {ev.stdout && (
                      <pre className="text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 text-[11px] font-mono">
                        {ev.stdout}
                      </pre>
                    )}
                    {ev.stderr && (
                      <pre className="text-red-300 bg-red-950/30 p-2 rounded border border-red-800/40 text-[11px] font-mono mt-1">
                        {ev.stderr}
                      </pre>
                    )}
                  </div>
                )}

                {ev.type === 'self_healing' && (
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 flex items-center gap-2">
                    <Bug className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{ev.message}</span>
                  </div>
                )}

                {ev.type === 'verification_passed' && (
                  <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{ev.message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Live Token Streaming Output */}
        {streamedText && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-sky-500/30 bg-[#0d1117]">
            <div className="flex items-center gap-2 mb-2 text-sky-400 font-mono text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Live Qwen 8B Generation Stream</span>
            </div>
            <pre className="text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {streamedText}
            </pre>
          </div>
        )}

        {/* Council Tri-Persona Result Card (if council triggered) */}
        {councilResult && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-purple-500/40 bg-purple-950/15 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Council Tri-Persona Consensus</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-sky-400 font-mono mb-1">Architect</div>
                <div className="text-slate-300">{councilResult.architect}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-red-400 font-mono mb-1">Risk Critic</div>
                <div className="text-slate-300">{councilResult.critic}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-amber-400 font-mono mb-1">Innovator</div>
                <div className="text-slate-300">{councilResult.innovator}</div>
              </div>
            </div>
            <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-sans">
              <strong>Consensus:</strong> {councilResult.consensus}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Antigravity Prompt Dock */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0d121f]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          {/* Active Context Chips & Attached Files */}
          <div className="flex items-center gap-2 mb-2 flex-wrap text-[11px] font-mono">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
              <FolderGit2 className="w-3 h-3 text-sky-400" />
              <span>Workspace: {activeWorkspace}</span>
            </div>

            {attachedFiles.map((af, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-200">
                <FileCode className="w-3 h-3 text-sky-400" />
                <span className="truncate max-w-[120px]">{af.name}</span>
                <button onClick={() => handleRemoveAttached(idx)} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {isStreaming && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                <span>{statusMessage || 'Processing...'} ({elapsedSeconds}s)</span>
              </div>
            )}

            {chatMessages.length > 0 && !isStreaming && (
              <button
                onClick={handleClearChat}
                className="text-slate-500 hover:text-slate-300 ml-auto"
                title="Clear single chat session"
              >
                Clear Chat
              </button>
            )}
          </div>

          {/* Prompt Input Box */}
          <div className="flex items-end gap-2 bg-slate-900/90 rounded-xl border border-slate-800 p-2 shadow-xl focus-within:border-sky-500/50 transition">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0"
              title="Attach File or Document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleStartAgent()
                }
              }}
              placeholder="Ask EV to plan a task, write code, debug a file, or analyze documents..."
              rows={2}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none font-mono py-1"
            />

            {isStreaming ? (
              <button
                onClick={handleStopExecution}
                className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/20 transition shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartAgent()}
                disabled={!prompt.trim() && attachedFiles.length === 0}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                  !prompt.trim() && attachedFiles.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20'
                }`}
              >
                <span>Plan & Run</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

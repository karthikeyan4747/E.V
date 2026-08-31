import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  ChevronDown,
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
  FileCheck2,
  CheckSquare,
  Flame,
  Bug,
  Dna,
  Users,
  Compass,
  Lightbulb,
  FilePlus,
  TerminalSquare,
  AlertTriangle,
  ExternalLink,
  Eye,
  Info,
  Scale,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  PanelLeftClose,
  PanelLeftOpen,
  Share2
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

const SESSIONS_STORAGE_KEY = 'ev_sovereign_sessions_v2'
const ACTIVE_SESSION_STORAGE_KEY = 'ev_active_session_id_v2'

function stripRTF(raw) {
  if (!raw || typeof raw !== 'string') return ''
  if (raw.includes('{\\rtf') || raw.includes('\\rtf1') || raw.includes('\\ansicpg')) {
    let text = raw
    text = text.replace(/\{\\\*(?:listtable|listoverridetable|expandedcolortbl|fonttbl|colortbl|stylesheet|info)[^}]*\}/gs, '')
    text = text.replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|listtable)[^}]*\}/gs, '')
    while (/\{\\\*?[a-zA-Z]+[^{}]*\}/.test(text)) {
      text = text.replace(/\{\\\*?[a-zA-Z]+[^{}]*\}/g, '')
    }
    text = text.replace(/\\par/g, '\n').replace(/\\line/g, '\n').replace(/\\tab/g, ' ').replace(/\\~/g, ' ')
    text = text.replace(/\\u8226\??/g, '• ')
    text = text.replace(/\\'[0-9a-fA-F]{2}/g, ' ')
    text = text.replace(/\\u[0-9]{4,5}\??/g, ' ')
    text = text.replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    text = text.replace(/[{}]/g, '').replace(/\\/g, '')
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('cocoa') && !l.startsWith('ansi') && !l.startsWith('*'))
    return lines.join('\n')
  }
  return raw
}

function createNewSession(title = 'New Sovereign Session') {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    createdAt: new Date().toISOString(),
    messages: [],
    traceSteps: [],
    executedEvents: [],
    artifacts: [],
    councilResult: null,
    councilOffer: null,
    dnaResult: null,
    conflictResult: null,
    sovereigntyResult: null,
    confidenceMetrics: null,
    nextActions: null
  }
}

export function AgentStudio({ 
  onOpenDeliverables, 
  onOpenCouncil,
  onOpenWorkspace,
  onOpenDNA,
  onOpenSandbox,
  onSetInferencing, 
  activeWorkspace = 'EV',
  activeFile = null 
}) {
  // Session / Multi-Chat State
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return [createNewSession('Initial Sovereign Session')]
  })

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
      if (savedId) return savedId
    } catch {}
    return sessions[0]?.id || `session_${Date.now()}`
  })

  const [isSessionsSidebarOpen, setIsSessionsSidebarOpen] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editTitleInput, setEditTitleInput] = useState('')

  // Active Chat State (Restored from active session)
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0]

  const [prompt, setPrompt] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [activePlan, setActivePlan] = useState(null)
  const [traceSteps, setTraceSteps] = useState(currentSession?.traceSteps || [])
  const [executedEvents, setExecutedEvents] = useState(currentSession?.executedEvents || [])
  const [artifacts, setArtifacts] = useState(currentSession?.artifacts || [])
  const [attachedFiles, setAttachedFiles] = useState([])
  const [chatMessages, setChatMessages] = useState(currentSession?.messages || [])
  const [councilResult, setCouncilResult] = useState(currentSession?.councilResult || null)
  const [councilOffer, setCouncilOffer] = useState(currentSession?.councilOffer || null)
  const [dnaResult, setDnaResult] = useState(currentSession?.dnaResult || null)
  const [conflictResult, setConflictResult] = useState(currentSession?.conflictResult || null)
  const [sovereigntyResult, setSovereigntyResult] = useState(currentSession?.sovereigntyResult || null)
  const [confidenceMetrics, setConfidenceMetrics] = useState(currentSession?.confidenceMetrics || null)
  const [nextActions, setNextActions] = useState(currentSession?.nextActions || null)
  const [activeDnaTab, setActiveDnaTab] = useState('claims')
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const abortControllerRef = useRef(null)
  const timerRef = useRef(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Persist sessions to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId)
    } catch (err) {
      console.warn('LocalStorage save failed:', err)
    }
  }, [sessions, activeSessionId])

  // Sync current active session state when switching chats
  const switchSession = useCallback((targetId) => {
    if (isStreaming) return
    const target = sessions.find(s => s.id === targetId)
    if (!target) return

    setActiveSessionId(targetId)
    setChatMessages(target.messages || [])
    setTraceSteps(target.traceSteps || [])
    setExecutedEvents(target.executedEvents || [])
    setArtifacts(target.artifacts || [])
    setCouncilResult(target.councilResult || null)
    setCouncilOffer(target.councilOffer || null)
    setDnaResult(target.dnaResult || null)
    setConflictResult(target.conflictResult || null)
    setSovereigntyResult(target.sovereigntyResult || null)
    setConfidenceMetrics(target.confidenceMetrics || null)
    setNextActions(target.nextActions || null)
    setStreamedText('')
    setStatusMessage('')
  }, [sessions, isStreaming])

  // Update active session in the sessions list
  const updateCurrentSessionData = useCallback((updates) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, ...updates }
      }
      return s
    }))
  }, [activeSessionId])

  // Create a brand new session
  const handleCreateNewChat = () => {
    if (isStreaming) return
    const newSess = createNewSession(`Chat ${sessions.length + 1}`)
    setSessions(prev => [newSess, ...prev])
    setActiveSessionId(newSess.id)
    setChatMessages([])
    setTraceSteps([])
    setExecutedEvents([])
    setArtifacts([])
    setCouncilResult(null)
    setCouncilOffer(null)
    setDnaResult(null)
    setConflictResult(null)
    setSovereigntyResult(null)
    setConfidenceMetrics(null)
    setNextActions(null)
    setStreamedText('')
    setStatusMessage('')
    setPrompt('')
    setAttachedFiles([])
  }

  // Delete a session
  const handleDeleteSession = (e, targetId) => {
    e.stopPropagation()
    if (sessions.length <= 1) {
      const fresh = createNewSession('Default Session')
      setSessions([fresh])
      switchSession(fresh.id)
      return
    }

    const filtered = sessions.filter(s => s.id !== targetId)
    setSessions(filtered)
    if (activeSessionId === targetId) {
      switchSession(filtered[0].id)
    }
  }

  // Rename a session
  const handleStartRename = (e, s) => {
    e.stopPropagation()
    setEditingSessionId(s.id)
    setEditTitleInput(s.title)
  }

  const handleSaveRename = (e) => {
    e.preventDefault()
    if (!editTitleInput.trim() || !editingSessionId) return
    setSessions(prev => prev.map(s => {
      if (s.id === editingSessionId) {
        return { ...s, title: editTitleInput.trim() }
      }
      return s
    }))
    setEditingSessionId(null)
  }

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
  }, [chatMessages, streamedText, executedEvents, traceSteps, councilResult, councilOffer, dnaResult, conflictResult, sovereigntyResult])

  const handleAttachFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i]
        const reader = new FileReader()
        reader.onload = (event) => {
          const rawContent = event.target.result || ''
          const cleanContent = stripRTF(rawContent)
          setAttachedFiles(prev => [
            ...prev,
            {
              name: file.name,
              size: file.size,
              content: cleanContent
            }
          ])
        }
        reader.readAsText(file)
      }
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

  const handleStartAgent = async (overridePrompt) => {
    const textToRun = overridePrompt || prompt
    if (!textToRun.trim() && attachedFiles.length === 0) return
    if (isStreaming) return

    setIsStreaming(true)
    setStatusMessage('Understanding request & formulating execution plan...')
    setStreamedText('')
    setActivePlan(null)
    setTraceSteps([])
    setExecutedEvents([])
    setCouncilResult(null)
    setCouncilOffer(null)
    setDnaResult(null)
    setConflictResult(null)
    setSovereigntyResult(null)
    setConfidenceMetrics(null)
    setSelectedEvidence(null)
    if (onSetInferencing) onSetInferencing(true, 'Sovereign Agent Orchestrating...')

    const filesToSend = [...attachedFiles]
    setPrompt('')
    setAttachedFiles([])

    // Auto-derive title if first message
    const isFirstMsg = chatMessages.length === 0
    let updatedTitle = currentSession.title
    if (isFirstMsg) {
      updatedTitle = textToRun.length > 35 ? textToRun.slice(0, 35) + '...' : textToRun
    }

    const newMessages = [...chatMessages, { 
      role: 'user', 
      content: textToRun,
      files: filesToSend.map(f => f.name)
    }]
    setChatMessages(newMessages)

    abortControllerRef.current = new AbortController()

    const payload = {
      prompt: textToRun,
      attached_files: filesToSend,
      active_file: activeFile?.path || null,
      auto_approve: true
    }

    let finalTrace = []
    let finalEvents = []
    let finalArtifacts = []
    let finalDna = null
    let finalCouncil = null
    let finalCouncilOffer = null
    let finalConflict = null
    let finalSov = null
    let finalMetrics = null
    let finalNextActions = null

    await sovereignAPI.streamAgent(
      payload,
      (event) => {
        if (event.type === 'status') {
          setStatusMessage(event.message)
        } else if (event.type === 'plan_created') {
          setActivePlan(event.plan)
          if (event.plan?.steps) {
            setTraceSteps(event.plan.steps)
            finalTrace = event.plan.steps
          }
        } else if (event.type === 'trace_step') {
          setTraceSteps(prev => {
            const updated = prev.map(st => {
              if (st.step_id === event.step_id) {
                return { ...st, status: event.status, detail: event.detail || st.detail }
              }
              return st
            })
            finalTrace = updated
            return updated
          })
        } else if (event.type === 'token') {
          setStreamedText(prev => prev + event.token)
        } else if (event.type === 'council_offer') {
          setCouncilOffer(event)
          finalCouncilOffer = event
        } else if (event.type === 'next_actions') {
          setNextActions(event)
          finalNextActions = event
        } else if (event.type === 'sovereignty_card') {
          setSovereigntyResult(event)
          finalSov = event
        } else if (event.type === 'dna_card') {
          setDnaResult(event.dna)
          finalDna = event.dna
        } else if (event.type === 'conflict_card') {
          setConflictResult(event)
          finalConflict = event
        } else if (event.type === 'council_debate') {
          setCouncilResult(event)
          finalCouncil = event
        } else if (event.type === 'deliverables_card') {
          setArtifacts(event.artifacts || [])
          finalArtifacts = event.artifacts || []
        } else if (
          event.type === 'file_modified' || 
          event.type === 'sandbox_result' || 
          event.type === 'verification_passed' || 
          event.type === 'self_healing' ||
          event.type === 'pre_diagnostic_error'
        ) {
          setExecutedEvents(prev => {
            const updated = [...prev, event]
            finalEvents = updated
            return updated
          })
        } else if (event.type === 'completed') {
          setIsStreaming(false)
          if (onSetInferencing) onSetInferencing(false)
          setStreamedText('')
          if (event.artifacts && event.artifacts.length > 0) {
            setArtifacts(event.artifacts)
            finalArtifacts = event.artifacts
          }
          if (event.metrics) {
            setConfidenceMetrics(event.metrics)
            finalMetrics = event.metrics
          }
          if (event.next_actions) {
            const na = { question: "What would you like me to do next with this input?", options: event.next_actions }
            setNextActions(na)
            finalNextActions = na
          }
          setStatusMessage('Task completed successfully.')

          // Ensure all trace steps marked completed
          const finalizedTrace = finalTrace.map(st => ({
            ...st,
            status: st.status === 'running' ? 'completed' : st.status
          }))
          setTraceSteps(finalizedTrace)

          const completedMessages = [...newMessages, { 
            role: 'assistant', 
            content: event.message || 'Task completed successfully.'
          }]
          setChatMessages(completedMessages)

          // Save everything to localStorage
          updateCurrentSessionData({
            title: updatedTitle,
            messages: completedMessages,
            traceSteps: finalizedTrace,
            executedEvents: finalEvents,
            artifacts: finalArtifacts,
            dnaResult: finalDna,
            councilResult: finalCouncil,
            councilOffer: finalCouncilOffer,
            conflictResult: finalConflict,
            sovereigntyResult: finalSov,
            confidenceMetrics: finalMetrics,
            nextActions: finalNextActions
          })
        } else if (event.type === 'aborted') {
          setStatusMessage('Execution stopped by user.')
          setIsStreaming(false)
          setStreamedText('')
          if (onSetInferencing) onSetInferencing(false)
        } else if (event.type === 'error') {
          setStatusMessage(`Error: ${event.message}`)
          setIsStreaming(false)
          setStreamedText('')
          if (onSetInferencing) onSetInferencing(false)
        }
      },
      () => {
        setIsStreaming(false)
        setStreamedText('')
        if (onSetInferencing) onSetInferencing(false)
      },
      (err) => {
        console.error(err)
        setStatusMessage(`Connection error: ${err.message}`)
        setIsStreaming(false)
        setStreamedText('')
        if (onSetInferencing) onSetInferencing(false)
      },
      abortControllerRef.current.signal
    )
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0a0d14] text-slate-100 font-sans relative">
      {/* Hidden file input for attachment */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleAttachFile}
        className="hidden"
      />

      {/* ------------------------------------------------------------- */}
      {/* Collapsible Multiple Chat Sessions Sidebar */}
      {/* ------------------------------------------------------------- */}
      {isSessionsSidebarOpen && (
        <aside className="w-64 border-r border-slate-800 bg-[#090d17] flex flex-col shrink-0 z-30 animate-slide-right select-none">
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Chat Sessions ({sessions.length})</span>
            </div>
            <button
              onClick={() => setIsSessionsSidebarOpen(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-2.5">
            <button
              onClick={handleCreateNewChat}
              className="w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat Session</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((s) => {
              const isActive = s.id === activeSessionId
              const isEditing = s.id === editingSessionId

              return (
                <div
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between group ${
                    isActive
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {isEditing ? (
                    <form onSubmit={handleSaveRename} className="flex-1 mr-1">
                      <input
                        type="text"
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onBlur={handleSaveRename}
                        autoFocus
                        className="w-full px-1.5 py-0.5 text-xs bg-slate-950 border border-sky-500 text-white rounded focus:outline-none"
                      />
                    </form>
                  ) : (
                    <div className="truncate flex-1 pr-2">
                      <div className="font-semibold truncate">{s.title || 'Untitled Session'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {s.messages?.length || 0} messages • {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(e, s)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-300"
                      title="Rename Session"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer / Storage Info */}
          <div className="p-2.5 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>100% LocalStorage</span>
            </span>
            <button
              onClick={() => {
                if (window.confirm('Clear all stored chat history and start fresh?')) {
                  localStorage.removeItem(SESSIONS_STORAGE_KEY)
                  localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
                  const fresh = [createNewSession('Default Session')]
                  setSessions(fresh)
                  switchSession(fresh[0].id)
                }
              }}
              className="text-red-400 hover:underline"
            >
              Clear All
            </button>
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Central Conversational Cockpit */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Cockpit Subheader */}
        <div className="h-10 px-4 border-b border-slate-800 bg-[#0d121f]/90 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSessionsSidebarOpen(!isSessionsSidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono transition flex items-center gap-1.5 border border-slate-700"
              title="Toggle Multi-Chat Sessions History"
            >
              {isSessionsSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-sky-400" />}
              <span>Chats ({sessions.length})</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-xs font-mono">
                {currentSession?.title || 'Active Session'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                COCKPIT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <button
              onClick={handleCreateNewChat}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-mono transition flex items-center gap-1 border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Conversation & Plan Execution Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {/* Antigravity Hero / Quick Starting Bar */}
          {chatMessages.length === 0 && !isStreaming && !activePlan && (
            <div className="max-w-3xl mx-auto text-center py-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EV SOVEREIGN // UNIFIED CONVERSATIONAL ORCHESTRATOR</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
                Tell EV what to do.
              </h1>
              <p className="text-xs lg:text-sm text-slate-400 max-w-xl mx-auto mt-2">
                EV understands your intent and automatically routes to Content DNA, Sandbox Code Debugger, Council Deliberator, Formula Solver, or Deliverables Rack.
              </p>

              {/* Quick Starter Workflow Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6 text-left">
                {/* 1. Document & DNA Analysis */}
                <div
                  onClick={() => handleStartAgent("Analyse this crude distillation unit inspection report and ultrasonic wall thickness measurements. Extract Content DNA entities, claims, statistics, and critical risks.")}
                  className="p-3.5 rounded-xl border border-slate-800 bg-[#0e1424]/90 hover:border-emerald-500/50 hover:bg-emerald-950/20 cursor-pointer transition flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                      <Dna className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      Analyse Report & DNA
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Ingest scanned reports, extract 13-node Content DNA, claims, and statistics.
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-3 flex items-center gap-1 font-semibold">
                    <span>Run Analysis</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* 2. Source Conflict Check */}
                <div
                  onClick={() => handleStartAgent("Compare our inspection report with the third-party audit. Find contradictions or numerical discrepancies between both sources.")}
                  className="p-3.5 rounded-xl border border-slate-800 bg-[#0e1424]/90 hover:border-amber-500/50 hover:bg-amber-950/20 cursor-pointer transition flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                      Find Contradictions
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Semantic comparison across sources to flag numerical or timeline conflicts.
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 mt-3 flex items-center gap-1 font-semibold">
                    <span>Check Conflicts</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* 3. Python Debugger & Sandbox */}
                <div
                  onClick={() => handleStartAgent("Find and fix the bug in pythonnn.py in the workspace. Trace the runtime error in sandbox, patch the file, and verify with exit code 0.")}
                  className="p-3.5 rounded-xl border border-slate-800 bg-[#0e1424]/90 hover:border-sky-500/50 hover:bg-sky-950/20 cursor-pointer transition flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-2">
                      <Bug className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300">
                      Debug Python File
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Pre-diagnostic error capture, direct workspace patch, and sandbox auto-healing.
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-sky-400 mt-3 flex items-center gap-1 font-semibold">
                    <span>Debug & Heal</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* 4. Council Debate & Deliverables */}
                <div
                  onClick={() => handleStartAgent("Convene the Council to debate trade-offs of pump replacement, verify calculations in sandbox, and generate an executive Word approval note and PPTX deck.")}
                  className="p-3.5 rounded-xl border border-slate-800 bg-[#0e1424]/90 hover:border-purple-500/50 hover:bg-purple-950/20 cursor-pointer transition flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                      Council & Deliverables
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Multi-POV consensus debate and formal on-premises .docx and .pptx artifact synthesis.
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-purple-400 mt-3 flex items-center gap-1 font-semibold">
                    <span>Debate & Generate</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
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
                {msg.files && msg.files.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-sky-500/40 text-[11px] font-mono opacity-90">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Attached: {msg.files.join(', ')}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              </div>
            </div>
          ))}

          {/* Live Execution Trace Checklist */}
          {traceSteps.length > 0 && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-sky-500/40 bg-sky-950/15 shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                    Live Execution Trace ({traceSteps.filter(s => s.status === 'completed').length}/{traceSteps.length} Steps)
                  </span>
                </div>
                {isStreaming && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-300 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                    <span>EV is executing...</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {traceSteps.map((st) => (
                  <div
                    key={st.step_id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      st.status === 'completed'
                        ? 'bg-slate-900/60 border-emerald-500/30 text-slate-200'
                        : st.status === 'running'
                        ? 'bg-sky-950/40 border-sky-500/50 text-sky-200 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {st.status === 'completed' || (!isStreaming && st.status === 'running') ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : st.status === 'running' ? (
                        <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono text-slate-600 shrink-0">
                          {st.step_id}
                        </span>
                      )}
                      <span className={`font-medium ${st.status === 'running' ? 'text-sky-300 font-semibold' : ''}`}>
                        {st.title}
                      </span>
                    </div>

                    {st.detail && (
                      <span className="text-[11px] font-mono text-slate-400 max-w-xs truncate hidden sm:inline">
                        {st.detail}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Council Offer Card */}
          {councilOffer && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl border border-purple-500/40 bg-purple-950/20 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>Strategic Decision Checkpoint</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  COUNCIL AVAILABLE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {councilOffer.suggestion}
              </p>
              <div className="pt-1 flex items-center gap-3">
                <button
                  onClick={() => handleStartAgent(councilOffer.prompt)}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Run Council Review</span>
                </button>
              </div>
            </div>
          )}

          {/* Sovereignty Air-Gap Telemetry Card */}
          {sovereigntyResult && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sovereign Air-Gap Audit</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  0 CLOUD EGRESS
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Egress Count</div>
                  <div className="text-emerald-400 font-bold mt-0.5">0 External Calls</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Local Requests</div>
                  <div className="text-sky-400 font-bold mt-0.5">{sovereigntyResult.total_local_requests || 0} Processed</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Model Subsystem</div>
                  <div className="text-purple-400 font-bold mt-0.5">127.0.0.1:11434</div>
                </div>
              </div>
            </div>
          )}

          {/* Content DNA Factual Matrix Card */}
          {dnaResult && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-emerald-500/40 bg-emerald-950/15 space-y-3 animate-fade-in shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <Dna className="w-4 h-4" />
                  <span>Content DNA Factual Foundation: {dnaResult.identity}</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  13-NODE VERIFIED
                </span>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {stripRTF(dnaResult.overview)}
              </p>

              {/* Interactive Category Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1">
                <button
                  onClick={() => setActiveDnaTab('claims')}
                  className={`p-2 rounded text-left transition border ${
                    activeDnaTab === 'claims'
                      ? 'bg-emerald-950/80 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-slate-400 text-[10px] uppercase">Claims</div>
                  <div className="text-emerald-400 font-bold mt-0.5">{dnaResult.claims?.length || 0} Facts</div>
                </button>

                <button
                  onClick={() => setActiveDnaTab('statistics')}
                  className={`p-2 rounded text-left transition border ${
                    activeDnaTab === 'statistics'
                      ? 'bg-sky-950/80 border-sky-500/80 shadow-sm ring-1 ring-sky-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-slate-400 text-[10px] uppercase">Statistics</div>
                  <div className="text-sky-400 font-bold mt-0.5">{dnaResult.statistics?.length || 0} Metrics</div>
                </button>

                <button
                  onClick={() => setActiveDnaTab('risks')}
                  className={`p-2 rounded text-left transition border ${
                    activeDnaTab === 'risks'
                      ? 'bg-red-950/80 border-red-500/80 shadow-sm ring-1 ring-red-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-slate-400 text-[10px] uppercase">Risks</div>
                  <div className="text-red-400 font-bold mt-0.5">{dnaResult.risks?.length || 0} Critical</div>
                </button>

                <button
                  onClick={() => setActiveDnaTab('recommendations')}
                  className={`p-2 rounded text-left transition border ${
                    activeDnaTab === 'recommendations'
                      ? 'bg-purple-950/80 border-purple-500/80 shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-slate-400 text-[10px] uppercase">Actions</div>
                  <div className="text-purple-400 font-bold mt-0.5">{dnaResult.recommendations?.length || 0} Steps</div>
                </button>
              </div>

              {/* Active Tab Detailed View */}
              <div className="pt-2">
                {activeDnaTab === 'claims' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-1">Key Verified Claims:</div>
                    {dnaResult.claims && dnaResult.claims.length > 0 ? (
                      dnaResult.claims.map((cl, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start justify-between gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
                          <span className="leading-snug">• {stripRTF(cl)}</span>
                          <button
                            onClick={() => setSelectedEvidence({ title: stripRTF(cl), source: dnaResult.source_name, quote: stripRTF(cl) })}
                            className="text-[10px] font-mono text-emerald-400 hover:underline shrink-0 ml-2"
                          >
                            [View Evidence]
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2">No specific claims extracted.</div>
                    )}
                  </div>
                )}

                {activeDnaTab === 'statistics' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="text-[11px] font-mono text-sky-400 font-semibold mb-1">Extracted Numerical Statistics & Telemetry:</div>
                    {dnaResult.statistics && dnaResult.statistics.length > 0 ? (
                      dnaResult.statistics.map((st, i) => (
                        <div key={i} className="text-xs text-sky-200 flex items-center gap-2 p-2 rounded bg-sky-950/30 border border-sky-500/20 font-mono">
                          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 text-[10px] flex items-center justify-center font-bold">#</span>
                          <span>{stripRTF(st)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2">No numerical statistics found.</div>
                    )}
                  </div>
                )}

                {activeDnaTab === 'risks' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="text-[11px] font-mono text-red-400 font-semibold mb-1">Identified Operational Hazards & Risks:</div>
                    {dnaResult.risks && dnaResult.risks.length > 0 ? (
                      dnaResult.risks.map((rsk, i) => (
                        <div key={i} className="text-xs text-red-200 flex items-start gap-2 p-2 rounded bg-red-950/30 border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <span>{stripRTF(rsk)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2">No critical risks flagged.</div>
                    )}
                  </div>
                )}

                {activeDnaTab === 'recommendations' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="text-[11px] font-mono text-purple-400 font-semibold mb-1">Strategic Corrective Recommendations:</div>
                    {dnaResult.recommendations && dnaResult.recommendations.length > 0 ? (
                      dnaResult.recommendations.map((rec, i) => (
                        <div key={i} className="text-xs text-purple-200 flex items-start gap-2 p-2 rounded bg-purple-950/30 border border-purple-500/20">
                          <CheckSquare className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <span>{stripRTF(rec)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2">No recommendations specified.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Semantic Source Conflict Card */}
          {conflictResult && conflictResult.conflicts && conflictResult.conflicts.length > 0 && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <Scale className="w-4 h-4" />
                  <span>Source Discrepancies Detected ({conflictResult.conflicts.length})</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  INTEGRITY ALERT
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                EV detected conflicting information between provided source documents. The agent does not choose one arbitrarily:
              </p>

              <div className="space-y-2">
                {conflictResult.conflicts.map((cf, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-amber-500/30 text-xs">
                    <div className="font-bold text-amber-300 font-mono mb-1">{cf.parameter}: {cf.description}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-mono font-semibold">{cf.source_a.source}</div>
                        <div className="text-slate-200 mt-0.5">{cf.source_a.value}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-mono font-semibold">{cf.source_b.source}</div>
                        <div className="text-slate-200 mt-0.5">{cf.source_b.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Tool Execution Logs, Diffs & Pre-Diagnostic Errors */}
          {executedEvents.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-2.5">
              {executedEvents.map((ev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                  {/* 1. Pre-Diagnostic Error */}
                  {ev.type === 'pre_diagnostic_error' && (
                    <div>
                      <div className="flex items-center justify-between text-red-400 font-mono font-semibold mb-1">
                        <div className="flex items-center gap-1.5">
                          <Bug className="w-4 h-4" />
                          <span>Pre-Diagnostic Caught Error in {ev.target_file}</span>
                        </div>
                        <span className="text-[10px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 text-red-400">
                          EXIT CODE {ev.exit_code}
                        </span>
                      </div>
                      <pre className="text-red-300 bg-red-950/40 p-2.5 rounded border border-red-800/50 max-h-36 overflow-y-auto font-mono text-[11px] whitespace-pre-wrap">
                        {ev.stderr || 'Runtime error traceback'}
                      </pre>
                    </div>
                  )}

                  {/* 2. File Modified */}
                  {ev.type === 'file_modified' && (
                    <div>
                      <div className="flex items-center justify-between text-emerald-400 font-mono font-semibold mb-1">
                        <div className="flex items-center gap-1.5">
                          <FileCode className="w-4 h-4" />
                          <span>Patched Project File: {ev.filename}</span>
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

                  {/* 3. Sandbox Result */}
                  {ev.type === 'sandbox_result' && (
                    <div>
                      <div className="flex items-center justify-between font-mono font-semibold mb-1">
                        <div className="flex items-center gap-1.5 text-sky-300">
                          <TerminalSquare className="w-4 h-4" />
                          <span>Sandbox Subprocess Test (Attempt {ev.attempt})</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          ev.exit_code === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          Exit Code: {ev.exit_code} ({ev.duration_ms}ms)
                        </span>
                      </div>
                      {ev.stdout && (
                        <pre className="text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 text-[11px] font-mono whitespace-pre-wrap">
                          {ev.stdout}
                        </pre>
                      )}
                      {ev.stderr && (
                        <pre className="text-red-300 bg-red-950/30 p-2 rounded border border-red-800/40 text-[11px] font-mono mt-1 whitespace-pre-wrap">
                          {ev.stderr}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* 4. Self-Healing */}
                  {ev.type === 'self_healing' && (
                    <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 flex items-center gap-2">
                      <Bug className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{ev.message}</span>
                    </div>
                  )}

                  {/* 5. Verification Passed */}
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

          {/* Council Tri-Persona Consensus Card */}
          {councilResult && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-purple-500/40 bg-purple-950/15 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>Council Tri-Persona Consensus</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  MULTI-POV DELIBERATION
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-sky-400 font-mono mb-1">Architect</div>
                  <div className="text-slate-300 leading-snug">{councilResult.architect}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-red-400 font-mono mb-1">Risk Critic</div>
                  <div className="text-slate-300 leading-snug">{councilResult.critic}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-amber-400 font-mono mb-1">Innovator</div>
                  <div className="text-slate-300 leading-snug">{councilResult.innovator}</div>
                </div>
              </div>
              <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-sans">
                <strong>Unified Consensus:</strong> {councilResult.consensus}
              </div>
            </div>
          )}

          {/* Live Token Streaming Output */}
          {isStreaming && streamedText && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-sky-500/30 bg-[#0d1117]">
              <div className="flex items-center gap-2 mb-2 text-sky-400 font-mono text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Response Stream</span>
              </div>
              <div className="text-slate-200 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                {streamedText}
              </div>
            </div>
          )}

          {/* Deliverables Produced Rack */}
          {artifacts.length > 0 && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl codex-panel border-amber-500/40 bg-amber-950/15 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Generated Real Deliverables ({artifacts.length})</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  100% On-Premises
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {artifacts.map((art, i) => (
                  <div key={i} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="truncate text-xs font-semibold text-slate-200">
                      {art.title || art.filename}
                    </div>
                    <a
                      href={sovereignAPI.getDownloadUrl(art.id)}
                      download={art.filename}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] font-mono flex items-center gap-1 shrink-0 ml-2 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proactive Next Steps / What to do next Decision Checkpoint */}
          {nextActions && nextActions.options && nextActions.options.length > 0 && !isStreaming && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 space-y-3 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>{nextActions.question || "What would you like me to do next with this input?"}</span>
                </div>
                <span className="text-[10px] font-mono bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                  DECISION CHECKPOINT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {nextActions.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleStartAgent(opt.prompt)}
                    className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/50 text-left transition group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {opt.icon === 'council' && <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                      {opt.icon === 'dna' && <Dna className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {opt.icon === 'docx' && <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      {opt.icon === 'pptx' && <Presentation className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {opt.icon === 'sandbox' && <TerminalSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300 truncate">
                        {opt.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Metrics Pill */}
          {confidenceMetrics && (
            <div className="max-w-3xl mx-auto p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-emerald-400 font-semibold">Evidence Coverage: {confidenceMetrics.evidence_coverage}</span>
                <span>•</span>
                <span>Verified Claims: {confidenceMetrics.verified_claims_count || 0}</span>
                <span>•</span>
                <span>Conflicts: {confidenceMetrics.conflicts_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Air-Gapped</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Expandable Evidence Modal */}
        {selectedEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-[#0e1424] border border-slate-800 rounded-xl p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                  <Eye className="w-4 h-4" />
                  <span>Verified Source Evidence Citation</span>
                </div>
                <button onClick={() => setSelectedEvidence(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-slate-300 font-sans">
                <div className="font-semibold text-white mb-1">Claim:</div>
                <p className="p-2 rounded bg-slate-950 border border-slate-800">{selectedEvidence.title}</p>
                <div className="font-semibold text-white mt-2 mb-1">Source File:</div>
                <div className="text-sky-300 font-mono">{selectedEvidence.source}</div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Prompt Dock */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0d121f]/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            {/* Active Context Chips & Attached Files */}
            <div className="flex items-center gap-2 mb-2 flex-wrap text-[11px] font-mono">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
                <FolderGit2 className="w-3 h-3 text-sky-400" />
                <span>Project: {activeWorkspace}</span>
              </div>

              {activeFile && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">
                  <FileCode className="w-3 h-3 text-purple-400" />
                  <span className="truncate max-w-[150px]">File: {activeFile.filename || activeFile.name}</span>
                </div>
              )}

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
                  <span>{statusMessage || 'Executing...'} ({elapsedSeconds}s)</span>
                </div>
              )}
            </div>

            {/* Prompt Input Box */}
            <div className="flex items-end gap-2 bg-slate-900/90 rounded-xl border border-slate-800 p-2 shadow-xl focus-within:border-sky-500/50 transition">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0"
                title="Attach File(s) to Task Context"
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
                placeholder="Ask EV to analyse reports, find contradictions, debug code, or draft approval notes..."
                rows={2}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none font-mono py-1"
              />

              {isStreaming ? (
                <button
                  onClick={handleStopExecution}
                  className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/20 transition shrink-0"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Task</span>
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
                  <span>Run</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

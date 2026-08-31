import React, { useState, useEffect, useCallback } from 'react'
import { TopBar } from './components/TopBar'
import { ActivityBar } from './components/ActivityBar'
import { AgentStudio } from './components/AgentStudio'
import { ContentDNAStudio } from './components/ContentDNAStudio'
import { ProjectWorkspace } from './components/ProjectWorkspace'
import { CodeSandbox } from './components/CodeSandbox'
import { CouncilView } from './components/CouncilView'
import { DeliverablesViewer } from './components/DeliverablesViewer'
import { NetworkMonitorModal } from './components/NetworkMonitorModal'
import { ProjectSelectorModal } from './components/ProjectSelectorModal'
import { sovereignAPI } from './services/api'
import { ShieldCheck, Cpu, Database, Activity, Loader2, X, Maximize2, Minimize2 } from 'lucide-react'

export function App() {
  const [activeCapabilityDrawer, setActiveCapabilityDrawer] = useState(null) // null | 'workspace' | 'dna' | 'council' | 'deliverables' | 'sandbox'
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [activeModel, setActiveModel] = useState('qwen3:8b')
  const [workspaceName, setWorkspaceName] = useState('EV')
  const [activeFile, setActiveFile] = useState(null)
  const [networkAudit, setNetworkAudit] = useState(null)
  const [isDrawerMaximized, setIsDrawerMaximized] = useState(false)
  
  // Global AI Inferencing & Loading State
  const [isInferencing, setIsInferencing] = useState(false)
  const [inferenceTask, setInferenceTask] = useState('Local Qwen 8B Reasoning...')

  const handleSetInferencing = useCallback((loading, task = 'Local Qwen 8B Reasoning...') => {
    setIsInferencing(Boolean(loading))
    if (task) setInferenceTask(task)
  }, [])

  useEffect(() => {
    sovereignAPI.getHealth()
      .then(res => {
        if (res.active_model) setActiveModel(res.active_model)
      })
      .catch(err => console.error('Local backend connecting...', err))

    sovereignAPI.getWorkspaceTree()
      .then(res => {
        if (res.name) setWorkspaceName(res.name)
      })
      .catch(() => {})

    const fetchAudit = () => {
      sovereignAPI.getNetworkAudit()
        .then(data => setNetworkAudit(data))
        .catch(() => {})
    }

    fetchAudit()
    const interval = setInterval(fetchAudit, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleDebugInAgent = (file) => {
    setActiveFile(file)
    setActiveCapabilityDrawer(null) // Focus directly on the chat cockpit
  }

  const handleNavClick = (viewId) => {
    if (viewId === 'agent') {
      setActiveCapabilityDrawer(null)
    } else if (viewId === 'network') {
      setIsNetworkModalOpen(true)
    } else {
      // Toggle or switch capability drawer
      setActiveCapabilityDrawer(prev => prev === viewId ? null : viewId)
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 select-none overflow-hidden font-sans">
      {/* Codex Sovereign Top Bar */}
      <TopBar
        activeView={activeCapabilityDrawer || 'agent'}
        onViewChange={handleNavClick}
        activeModel={activeModel}
        workspaceName={workspaceName}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onOpenProjectFolder={() => setIsProjectModalOpen(true)}
        isInferencing={isInferencing}
        inferenceTask={inferenceTask}
      />

      {/* Main Workspace Area (Activity Bar + Active Conversational Cockpit + Side Capability Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Bar / Capability Dock */}
        <ActivityBar
          activeView={activeCapabilityDrawer || 'agent'}
          onViewChange={handleNavClick}
        />

        {/* Central Conversational Cockpit (ALWAYS Active and Connected) */}
        <main className="flex-1 flex overflow-hidden relative">
          <AgentStudio 
            onOpenDeliverables={() => setActiveCapabilityDrawer('deliverables')}
            onOpenCouncil={() => setActiveCapabilityDrawer('council')}
            onOpenWorkspace={() => setActiveCapabilityDrawer('workspace')}
            onOpenDNA={() => setActiveCapabilityDrawer('dna')}
            onOpenSandbox={() => setActiveCapabilityDrawer('sandbox')}
            onSetInferencing={handleSetInferencing}
            activeWorkspace={workspaceName}
            activeFile={activeFile}
          />

          {/* Contextual Capability Inspector Drawer (Opens side-by-side on demand without leaving Chat) */}
          {activeCapabilityDrawer && (
            <div className={`${
              isDrawerMaximized ? 'w-full absolute inset-0 z-40' : 'w-full md:w-[480px] lg:w-[540px] xl:w-[600px] border-l border-slate-800'
            } bg-[#090d16] flex flex-col shrink-0 shadow-2xl transition-all animate-slide-left z-30`}>
              {/* Drawer Header */}
              <div className="h-10 px-3 bg-[#0d121f] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">
                    {activeCapabilityDrawer === 'workspace' && 'Project Code Explorer'}
                    {activeCapabilityDrawer === 'dna' && 'Content DNA Studio & OCR'}
                    {activeCapabilityDrawer === 'council' && 'Council Tri-Persona Debate'}
                    {activeCapabilityDrawer === 'deliverables' && 'Deliverables Rack'}
                    {activeCapabilityDrawer === 'sandbox' && 'Isolated Code Sandbox'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    CAPABILITY
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsDrawerMaximized(!isDrawerMaximized)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    title={isDrawerMaximized ? "Restore split view" : "Maximize drawer"}
                  >
                    {isDrawerMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setActiveCapabilityDrawer(null)
                      setIsDrawerMaximized(false)
                    }}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    title="Close capability drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Capability Body */}
              <div className="flex-1 overflow-hidden">
                {activeCapabilityDrawer === 'workspace' && (
                  <ProjectWorkspace 
                    onWorkspaceChange={setWorkspaceName}
                    onDebugInAgent={handleDebugInAgent}
                  />
                )}
                {activeCapabilityDrawer === 'dna' && (
                  <ContentDNAStudio 
                    onDeliverableGenerated={() => {}} 
                    onSetInferencing={handleSetInferencing}
                  />
                )}
                {activeCapabilityDrawer === 'council' && (
                  <CouncilView 
                    onSetInferencing={handleSetInferencing}
                  />
                )}
                {activeCapabilityDrawer === 'deliverables' && (
                  <DeliverablesViewer />
                )}
                {activeCapabilityDrawer === 'sandbox' && (
                  <CodeSandbox 
                    onSetInferencing={handleSetInferencing}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Sovereign Status Bar */}
      <footer className="h-7 bg-[#070a12] border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 z-20">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setIsNetworkModalOpen(true)}
            className="flex items-center gap-1.5 text-emerald-400 cursor-pointer hover:underline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% AIR-GAPPED // 0 CLOUD EGRESS</span>
          </div>

          {isInferencing && (
            <div className="flex items-center gap-1.5 text-sky-400 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{inferenceTask}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1 text-slate-500">
            <span>Server:</span>
            <span className="text-slate-300">127.0.0.1:11434 (Local GPU)</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-slate-500">
            <span>Local Requests:</span>
            <span className="text-sky-400">{networkAudit?.total_local_requests || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-400">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span className="text-slate-300 font-semibold">{activeModel}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <span>Workspace:</span>
            <span className="text-slate-300">{workspaceName}</span>
          </div>
        </div>
      </footer>

      {/* Network Audit Modal */}
      <NetworkMonitorModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      />

      {/* Codex Project Selector Modal */}
      <ProjectSelectorModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentWorkspace={workspaceName}
        onSelectWorkspace={(name) => {
          setWorkspaceName(name)
        }}
      />
    </div>
  )
}

export default App

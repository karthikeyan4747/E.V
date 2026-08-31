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
import { sovereignAPI } from './services/api'
import { ShieldCheck, Cpu, Database, Activity, Loader2 } from 'lucide-react'

export function App() {
  const [activeView, setActiveView] = useState('agent') // 'agent' | 'dna' | 'workspace' | 'sandbox' | 'council' | 'deliverables' | 'network'
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const [activeModel, setActiveModel] = useState('qwen3:8b')
  const [workspaceName, setWorkspaceName] = useState('EV')
  const [networkAudit, setNetworkAudit] = useState(null)
  
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 select-none overflow-hidden font-sans">
      {/* Antigravity Sovereign Top Bar */}
      <TopBar
        activeView={activeView}
        onViewChange={setActiveView}
        activeModel={activeModel}
        workspaceName={workspaceName}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onOpenProjectFolder={() => setActiveView('workspace')}
        isInferencing={isInferencing}
        inferenceTask={inferenceTask}
      />

      {/* Main Workspace Area (Activity Bar + Active Workbench View) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Bar */}
        <ActivityBar
          activeView={activeView}
          onViewChange={(view) => {
            if (view === 'network') {
              setIsNetworkModalOpen(true)
            } else {
              setActiveView(view)
            }
          }}
        />

        {/* Dynamic Workbench View */}
        <main className="flex-1 flex overflow-hidden">
          {activeView === 'agent' && (
            <AgentStudio 
              onOpenDeliverables={() => setActiveView('deliverables')} 
              onSetInferencing={handleSetInferencing}
              activeWorkspace={workspaceName}
            />
          )}
          {activeView === 'dna' && (
            <ContentDNAStudio 
              onDeliverableGenerated={() => {}} 
              onSetInferencing={handleSetInferencing}
            />
          )}
          {activeView === 'workspace' && (
            <ProjectWorkspace onWorkspaceChange={setWorkspaceName} />
          )}
          {activeView === 'sandbox' && (
            <CodeSandbox 
              onSetInferencing={handleSetInferencing}
            />
          )}
          {activeView === 'council' && (
            <CouncilView 
              onSetInferencing={handleSetInferencing}
            />
          )}
          {activeView === 'deliverables' && (
            <DeliverablesViewer />
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

      {/* Network Audit Sovereign Verification Modal */}
      <NetworkMonitorModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      />
    </div>
  )
}

export default App

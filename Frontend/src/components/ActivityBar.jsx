import React from 'react'
import { 
  Bot, 
  Dna, 
  FolderTree, 
  TerminalSquare, 
  Users, 
  ShieldAlert,
  Sliders,
  FileCheck2
} from 'lucide-react'

export function ActivityBar({ activeView, onViewChange }) {
  const navItems = [
    { id: 'agent', label: 'Agent Chat', icon: Bot, badge: 'AGENT' },
    { id: 'workspace', label: 'Project Code', icon: FolderTree, badge: 'CODE' },
    { id: 'dna', label: 'Content DNA', icon: Dna, badge: 'OCR' },
    { id: 'council', label: 'Council Debate', icon: Users, badge: 'POV' },
    { id: 'deliverables', label: 'Deliverables', icon: FileCheck2, badge: 'DOCS' },
    { id: 'sandbox', label: 'Code Sandbox', icon: TerminalSquare, badge: 'RUN' },
    { id: 'network', label: 'Sovereignty', icon: ShieldAlert, badge: 'AIR' },
  ]

  return (
    <aside className="w-16 bg-[#0a0e17] border-r border-slate-800/80 flex flex-col items-center py-3 select-none z-20 shrink-0">
      <div className="flex flex-col items-center gap-1.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all group ${
                isActive 
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-lg shadow-sky-500/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={item.label}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-sky-400 rounded-r" />
              )}
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-sky-400' : ''}`} />
              <span className="text-[9px] font-mono mt-1 leading-none tracking-tight">
                {item.label.split(' ')[0]}
              </span>
              {item.badge && (
                <span className={`absolute -top-1 -right-1 text-[8px] font-mono px-1 py-0.2 rounded-full border ${
                  isActive 
                    ? 'bg-sky-500 text-slate-950 font-bold border-sky-400' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="w-8 h-[1px] bg-slate-800" />
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sovereign Link: 127.0.0.1:11434" />
      </div>
    </aside>
  )
}

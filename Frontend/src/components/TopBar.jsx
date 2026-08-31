import React from 'react'
import { ShieldCheck, Cpu, FolderGit2, Activity, Server, Lock, Loader2, Sparkles, FolderOpen, ChevronDown } from 'lucide-react'

export function TopBar({ 
  activeView, 
  onViewChange, 
  activeModel = 'qwen3:8b', 
  workspaceName = 'EV',
  onOpenNetworkModal,
  onOpenProjectFolder,
  isInferencing = false,
  inferenceTask = 'Local Qwen 8B Reasoning...'
}) {
  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0d121f]/90 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Lock className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-wide text-white">EV SOVEREIGN</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                v2.0 AIR-GAP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono -mt-0.5">Industrial AI Sovereign Workbench</p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 mx-2" />

        {/* Project Selector Button */}
        <button
          onClick={onOpenProjectFolder}
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-200 font-mono transition group shadow-sm"
          title="Click to view or switch Project Folder"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="text-slate-400">Project:</span>
          <span className="font-semibold text-sky-300">{workspaceName}</span>
          <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
        </button>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Dynamic AI Inferencing Spinner / Status */}
        {isInferencing ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 shadow-md shadow-sky-500/10 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            <span className="text-xs font-mono font-medium">{inferenceTask}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          </div>
        ) : (
          <div 
            onClick={onOpenNetworkModal}
            className="flex items-center gap-2 px-3 py-1 rounded-full sovereign-badge cursor-pointer hover:bg-emerald-500/20 transition-all"
            title="Click to inspect Sovereign Network Audit"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-medium tracking-wide">100% ON-PREMISES // 0 EGRESS</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Model Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Model:</span>
          <span className="text-sky-300 font-semibold">{activeModel}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenNetworkModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Network Audit</span>
        </button>
      </div>
    </header>
  )
}

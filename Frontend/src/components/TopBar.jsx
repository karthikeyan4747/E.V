import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheck, Cpu, FolderGit2, Activity, Server, Lock, Loader2, Sparkles, FolderOpen, ChevronDown, Check, Zap, Terminal, Sparkle } from 'lucide-react'

const MODEL_INFO = {
  'auto': {
    label: 'Auto (Task-Based)',
    tag: 'Dynamic // Optimal Routing',
    desc: 'Auto-selects Coder for code, Gemma for DNA, Qwen 8B for reasoning',
    badgeClass: 'bg-gradient-to-r from-sky-500/10 to-purple-500/10 text-sky-300 border-sky-500/30',
    icon: Sparkles
  },
  'qwen3:8b': {
    label: 'Qwen 3 (8B)',
    tag: 'Flagship // High Reasoning',
    desc: 'Deep reasoning, multi-document analysis & planning',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    icon: Sparkles
  },
  'qwen3:4b': {
    label: 'Qwen 3 (4B)',
    tag: 'Fast // Low Latency',
    desc: 'High-speed local execution & low memory footprint',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: Zap
  },
  'qwen2.5-coder:3b': {
    label: 'Qwen 2.5 Coder (3B)',
    tag: 'Code & Math Specialist',
    desc: 'Optimized for Python debugging, sandbox scripts & math',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: Terminal
  },
  'gemma3:4b': {
    label: 'Gemma 3 (4B)',
    tag: 'Google Gemma // Multilingual',
    desc: 'Factual extraction, structured JSON & multilingual synthesis',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: Cpu
  }
}

export function TopBar({ 
  activeView, 
  onViewChange, 
  activeModel = 'qwen3:8b',
  availableModels = ['qwen3:8b', 'qwen3:4b', 'qwen2.5-coder:3b', 'gemma3:4b'],
  onSelectModel,
  workspaceName = 'EV',
  onOpenNetworkModal,
  onOpenProjectFolder,
  isInferencing = false,
  inferenceTask = 'Local Qwen Reasoning...'
}) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Combine known presets with any dynamically discovered models
  const uniqueModels = Array.from(new Set([
    ...Object.keys(MODEL_INFO),
    ...(availableModels || [])
  ]))

  const currentInfo = MODEL_INFO[activeModel] || {
    label: activeModel,
    tag: 'Local Ollama Model',
    desc: 'Air-gapped on-premises inference',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    icon: Cpu
  }

  const CurrentIcon = currentInfo.icon || Cpu

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

      {/* Center Status Indicators & Interactive Model Switcher */}
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

        {/* Interactive Model Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 text-xs font-mono text-slate-200 transition shadow-sm group"
            title="Click to switch active local AI model"
          >
            <CurrentIcon className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-slate-400">Model:</span>
            <span className="text-sky-300 font-semibold">{currentInfo.label || activeModel}</span>
            <ChevronDown className={`w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform ${isModelDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0c1222] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-slate-400 font-medium">SELECT ACTIVE LOCAL MODEL</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  AIR-GAPPED
                </span>
              </div>

              <div className="space-y-1">
                {uniqueModels.map((modelKey) => {
                  const isSelected = activeModel === modelKey
                  const info = MODEL_INFO[modelKey] || {
                    label: modelKey,
                    tag: 'Local Ollama Instance',
                    desc: 'On-premises model execution',
                    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
                    icon: Cpu
                  }
                  const IconComp = info.icon || Cpu

                  return (
                    <button
                      key={modelKey}
                      onClick={() => {
                        if (onSelectModel) onSelectModel(modelKey)
                        setIsModelDropdownOpen(false)
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start justify-between gap-2 transition group ${
                        isSelected 
                          ? 'bg-sky-500/15 border border-sky-500/40 text-white' 
                          : 'hover:bg-slate-800/80 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-md mt-0.5 ${isSelected ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold font-mono tracking-tight text-slate-100">{info.label}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded border font-mono ${info.badgeClass}`}>
                              {info.tag.split('//')[0].trim()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans line-clamp-1 mt-0.5">{info.desc}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 mt-1 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
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


import React, { useState, useRef } from 'react'
import { 
  FolderGit2, 
  FolderOpen, 
  FilePlus, 
  ArrowRight, 
  Check, 
  X, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  Folder, 
  Bot, 
  Dna, 
  Users, 
  FileCheck2, 
  Code
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

export function ProjectSelectorModal({ 
  isOpen, 
  onClose, 
  currentWorkspace, 
  onSelectWorkspace,
  onOpenFolderNative,
  onOpenFilesNative
}) {
  const [folderPathInput, setFolderPathInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const folderPickerRef = useRef(null)
  const filePickerRef = useRef(null)

  if (!isOpen) return null

  const handleOpenPath = async (e) => {
    e.preventDefault()
    if (!folderPathInput.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const res = await sovereignAPI.setWorkspaceFolder(folderPathInput.trim())
      if (onSelectWorkspace) {
        onSelectWorkspace(res.name || res.workspace_path)
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not open path.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNativeFolderSelect = (e) => {
    if (onOpenFolderNative) {
      onOpenFolderNative(e)
      onClose()
    }
  }

  const handleNativeFilesSelect = (e) => {
    if (onOpenFilesNative) {
      onOpenFilesNative(e)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      {/* Hidden File / Folder inputs */}
      <input
        ref={folderPickerRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleNativeFolderSelect}
        className="hidden"
      />
      <input
        ref={filePickerRef}
        type="file"
        multiple
        onChange={handleNativeFilesSelect}
        className="hidden"
      />

      <div className="w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 bg-[#0e1424]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Codex Project Hub</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  WORKSPACE SELECTOR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a project directory or import files to initialize your sovereign AI workbench.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Active Project Card */}
          <div className="p-4 rounded-xl codex-panel border-sky-500/30 bg-sky-950/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
                  Active Loaded Project
                </div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {currentWorkspace || 'EV Project Workspace'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>On-Premises Local Environment</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
            >
              <span>Open Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Open Folder Card */}
            <div 
              onClick={() => folderPickerRef.current?.click()}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-sky-500/40 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition">
                  Open Local Folder
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Browse and load an entire codebase or project directory from your computer.
                </p>
              </div>
              <span className="text-[11px] font-mono text-sky-400 mt-3 flex items-center gap-1">
                <span>Select Folder</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* Import Files Card */}
            <div 
              onClick={() => filePickerRef.current?.click()}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                  <FilePlus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                  Import Files & Documents
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Select individual Python, Javascript, PDF, or data files to work on directly.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 mt-3 flex items-center gap-1">
                <span>Choose Files</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Direct Path Input Form */}
          <form onSubmit={handleOpenPath} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
            <label className="text-xs font-mono text-slate-300 block mb-2 font-medium">
              Or Enter Project Directory Path:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderPathInput}
                onChange={(e) => setFolderPathInput(e.target.value)}
                placeholder="e.g. /path/to/project or C:\Workspace\Project"
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={isLoading || !folderPathInput.trim()}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 ${
                  isLoading || !folderPathInput.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                }`}
              >
                <span>{isLoading ? 'Opening...' : 'Open Path'}</span>
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </form>

          {/* Codex Workflow Pillars Preview */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">
              Included Context-Driven Sovereign Engines
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                <Bot className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Agent & Debugger</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                <Dna className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Content DNA OCR</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Council Debate</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                <FileCheck2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Deliverables Rack</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { 
  FileCheck2, 
  Download, 
  FileText, 
  Presentation, 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

export function DeliverablesViewer() {
  const [deliverables, setDeliverables] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchDeliverables = async () => {
    setIsLoading(true)
    try {
      const data = await sovereignAPI.listDeliverables()
      setDeliverables(data.deliverables || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliverables()
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e17]">
      {/* Top Banner */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1424]/40">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-semibold font-display text-white">Generated Real Deliverables Rack</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OFFICIAL ON-PREMISES ARTIFACTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-ready Word approval notes, PowerPoint board presentations, and Excel calculation workbooks generated from Content DNA.
          </p>
        </div>

        <button
          onClick={fetchDeliverables}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Rack</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {deliverables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliverables.map((item) => {
              const isWord = item.format?.includes('docx')
              const isPptx = item.format?.includes('pptx')
              const isXlsx = item.format?.includes('xlsx')

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl codex-panel border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        {isWord ? (
                          <FileText className="w-6 h-6 text-blue-400" />
                        ) : isPptx ? (
                          <Presentation className="w-6 h-6 text-amber-400" />
                        ) : isXlsx ? (
                          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <FileText className="w-6 h-6 text-purple-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {isWord ? 'DOCX NOTE' : isPptx ? 'PPTX DECK' : isXlsx ? 'XLSX MODEL' : 'MARKDOWN'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition line-clamp-2">
                      {item.title || item.filename}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500 font-mono">
                      <span>{Math.round((item.size_bytes || 1024) / 1024)} KB</span>
                      <span>•</span>
                      <span>{item.created_at}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400">100% On-Premises</span>
                    <a
                      href={sovereignAPI.getDownloadUrl(item.id)}
                      download={item.filename}
                      className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm shadow-emerald-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-600">
            <FileCheck2 className="w-16 h-16 text-slate-800 mb-3 stroke-1" />
            <h3 className="text-sm font-medium text-slate-400">No Generated Deliverables Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Extract Content DNA from an inspection report or launch an agent task to generate Word, PowerPoint, and Excel artifacts.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

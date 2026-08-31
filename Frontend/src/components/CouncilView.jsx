import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Sparkles, 
  Send, 
  ShieldAlert, 
  Compass, 
  Lightbulb, 
  Bot,
  RotateCcw,
  Cpu,
  Loader2,
  Copy,
  Check,
  Zap
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

export function CouncilView({ onSetInferencing }) {
  const [topic, setTopic] = useState('')
  const [isDebating, setIsDebating] = useState(false)
  const [debateResult, setDebateResult] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let interval = null
    if (isDebating) {
      setElapsed(0)
      interval = setInterval(() => setElapsed(prev => prev + 1), 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isDebating])

  const handleRunDebate = async (e) => {
    if (e) e.preventDefault()
    if (!topic.trim() || isDebating) return

    setIsDebating(true)
    setDebateResult(null)
    if (onSetInferencing) onSetInferencing(true, 'Council Tri-Persona Reasoning...')

    try {
      const data = await sovereignAPI.runDebate(topic)
      setDebateResult(data)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || err.message || 'Council debate failed')
    } finally {
      setIsDebating(false)
      if (onSetInferencing) onSetInferencing(false)
    }
  }

  const handleCopyConsensus = () => {
    if (debateResult?.ev?.response) {
      navigator.clipboard.writeText(debateResult.ev.response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e17]">
      {/* Top Banner */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1424]/40">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-semibold font-display text-white">Sovereign Council Debate</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              TRI-PERSONA REASONING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Architect, Critic, and Innovator local models debate industrial proposals and synthesize an executive directive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDebating && (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-purple-950/80 border border-purple-500/40 text-xs font-mono text-purple-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Deliberating ({elapsed}s)</span>
            </div>
          )}
          <button
            onClick={() => {
              setTopic('Replace CDU overhead reflux pump with variable frequency drive (VFD) canned motor pump under high H2S service.')
            }}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Load Sample Proposal</span>
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-b border-slate-800 bg-[#0d111c]/60">
        <form onSubmit={handleRunDebate} className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter engineering proposal or operational dilemma for council debate..."
            className="flex-1 px-3 py-2 text-xs font-mono rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isDebating || !topic.trim()}
            className={`px-4 py-2 rounded font-medium text-xs flex items-center gap-2 transition ${
              isDebating || !topic.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {isDebating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isDebating ? 'Convening...' : 'Assemble Council'}</span>
          </button>
        </form>
      </div>

      {/* Active Running Phase Banner */}
      {isDebating && (
        <div className="p-3 mx-4 mt-3 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
          <div>
            <div className="text-xs font-semibold text-purple-200">
              Council Tri-Persona Reasoning Active...
            </div>
            <div className="text-[10px] text-purple-400/80 font-mono">
              The Architect, Risk Critic, and Innovator are synthesizing consensus on local GPU ({elapsed}s)
            </div>
          </div>
        </div>
      )}

      {/* Debate Output Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {debateResult ? (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* 3 Personas Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Architect */}
              <div className="p-3.5 rounded-xl codex-panel border-sky-500/30 bg-sky-950/10 flex flex-col">
                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-sky-300 font-mono">The Architect</span>
                </div>
                <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap flex-1">
                  {debateResult.architect?.analysis}
                </div>
              </div>

              {/* Critic */}
              <div className="p-3.5 rounded-xl codex-panel border-red-500/30 bg-red-950/10 flex flex-col">
                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-red-300 font-mono">The Risk Critic</span>
                </div>
                <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap flex-1">
                  {debateResult.critic?.critique}
                </div>
              </div>

              {/* Innovator */}
              <div className="p-3.5 rounded-xl codex-panel border-amber-500/30 bg-amber-950/10 flex flex-col">
                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 font-mono">The Innovator</span>
                </div>
                <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap flex-1">
                  {debateResult.innovator?.innovations}
                </div>
              </div>
            </div>

            {/* EV Consensus Directive */}
            <div className="p-4 rounded-xl codex-panel border-emerald-500/40 bg-emerald-950/15 shadow-xl">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wider">
                    Sovereign Consensus & Executive Directive
                  </span>
                </div>
                <button
                  onClick={handleCopyConsensus}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                {debateResult.ev?.response}
              </div>
            </div>
          </div>
        ) : !isDebating ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600">
            <Users className="w-12 h-12 text-slate-800 mb-2 stroke-1" />
            <p className="text-xs text-slate-500">Council Inactive</p>
            <p className="text-[10px] text-slate-600 max-w-xs mt-1">
              Submit a technical proposal or dilemma above to start the multi-agent deliberation.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

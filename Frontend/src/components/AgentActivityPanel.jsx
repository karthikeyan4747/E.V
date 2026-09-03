import React, { useState } from 'react'
import {
  Layers,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Circle,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  TerminalSquare,
  Sparkles,
  Search,
  Scale
} from 'lucide-react'

export default function AgentActivityPanel({
  activeWorkflow,
  traceSteps = [],
  isStreaming = false,
  elapsedSeconds = 0,
  userActionRequired = null,
  onResolveConflict
}) {
  const [expandedStepId, setExpandedStepId] = useState(null)
  const [selectedOptionId, setSelectedOptionId] = useState(1)

  const toggleStep = (stepId) => {
    setExpandedStepId(prev => prev === stepId ? null : stepId)
  }

  const isAllFinished = !isStreaming && !userActionRequired && traceSteps.length > 0
  const completedCount = isAllFinished
    ? traceSteps.length
    : traceSteps.filter(s => s.status === 'COMPLETED' || s.status === 'completed').length
  const totalCount = traceSteps.length
  const workflowName = activeWorkflow?.name || activeWorkflow?.workflow || 'PREDEFINED WORKFLOW'
  const riskLevel = activeWorkflow?.risk_level || 'LOW'

  return (
    <div className="max-w-3xl mx-auto rounded-xl border border-sky-500/40 bg-[#0b101e]/95 shadow-2xl overflow-hidden animate-fade-in mb-4">
      {/* 1. Header / Workflow Status Bar */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900/90 via-sky-950/40 to-slate-900/90 border-b border-sky-500/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-white tracking-wider uppercase">
                EV AGENT WORKBENCH
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-300 font-semibold">
                {workflowName.replace(/_/g, ' ')}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                riskLevel === 'HIGH' 
                  ? 'bg-red-500/15 border-red-500/40 text-red-300' 
                  : riskLevel === 'MEDIUM'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}>
                RISK: {riskLevel}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans mt-0.5">
              {activeWorkflow?.description || 'Predefined Sovereign Workflow Template Execution'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{elapsedSeconds}s</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isStreaming ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-sky-300 bg-sky-950/70 border border-sky-500/40 px-2 py-0.5 rounded animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                <span>Executing...</span>
              </span>
            ) : userActionRequired ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Paused for User</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Active Plan Verified</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Live Step Checklist */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1">
          <span>EXECUTION PLAN ({completedCount}/{totalCount} Steps Completed)</span>
          <span className="text-[10px] text-slate-500">Click step to inspect transparent execution details</span>
        </div>

        <div className="space-y-1.5">
          {traceSteps.map((step) => {
            const isCompleted = (isAllFinished && step.status !== 'WAITING_FOR_USER' && step.status !== 'FAILED')
              || step.status === 'COMPLETED' 
              || step.status === 'completed'
            const isRunning = step.status === 'RUNNING' || step.status === 'running'
            const isWaiting = step.status === 'WAITING_FOR_USER' || step.status === 'BLOCKED'
            const isExpanded = expandedStepId === step.step_id

            return (
              <div
                key={step.step_id}
                className={`rounded-lg border text-xs transition-all ${
                  isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/30 text-slate-200'
                    : isRunning
                    ? 'bg-sky-950/50 border-sky-500/60 text-sky-200 shadow-md ring-1 ring-sky-500/30'
                    : isWaiting
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                {/* Step Row Header */}
                <div
                  onClick={() => toggleStep(step.step_id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/30 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                    ) : isWaiting ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                    )}

                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] text-slate-500 shrink-0">#{step.step_id}</span>
                      <span className={`font-medium truncate ${isRunning ? 'text-sky-300 font-semibold' : ''}`}>
                        {step.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {step.tool_used && (
                      <span className="text-[10px] font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-400 hidden sm:inline">
                        tool: {step.tool_used}
                      </span>
                    )}
                    {step.duration_ms > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400 hidden md:inline">
                        {step.duration_ms}ms
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* 3. Transparent Inspectable Step Details (Section 5) */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 text-xs space-y-2.5 font-sans animate-fade-in">
                    {step.why_necessary && (
                      <div>
                        <div className="text-[10px] font-mono text-sky-400 uppercase font-semibold">Execution Reasoning</div>
                        <div className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                          "{step.why_necessary}"
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">What EV is Doing</div>
                        <div className="text-slate-200 mt-0.5">{step.what_doing || 'Executing step logic'}</div>
                      </div>

                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Input Used</div>
                        <div className="text-slate-200 mt-0.5 truncate">{step.input_used || 'Active Context'}</div>
                      </div>

                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Tool / Subsystem</div>
                        <div className="text-purple-400 font-bold mt-0.5">{step.tool_used || 'Sovereign Engine'}</div>
                      </div>

                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Verification Status</div>
                        <div className="text-emerald-400 font-bold mt-0.5">{step.verification_status || 'SOURCE_BACKED'}</div>
                      </div>
                    </div>

                    {step.output_produced && (
                      <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                        <strong>Output:</strong> {step.output_produced}
                      </div>
                    )}

                    {step.sources && step.sources.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <FileText className="w-3 h-3 text-sky-400" />
                        <span>Sources: {step.sources.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Pre-Execution Approval / Confirmation Modal (Antigravity/Cursor style matching user screenshot) */}
      {userActionRequired && (
        <div className="p-5 bg-[#171922] border-t border-slate-700/80 space-y-4 animate-fade-in text-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>
                {userActionRequired.title || `Do you want to allow me to run \`${userActionRequired.command || 'action'}\` for this workspace?`}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider">
              APPROVAL REQUIRED
            </span>
          </div>

          {userActionRequired.command && (
            <div className="bg-[#0e1017] border border-slate-800/90 rounded-lg p-3 font-mono text-xs text-sky-300 select-all overflow-x-auto shadow-inner">
              {userActionRequired.command}
            </div>
          )}

          {userActionRequired.reason && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {userActionRequired.reason}
            </p>
          )}

          {/* Selectable Options List (1. Yes, 2. Yes and remember, 3. No) */}
          <div className="space-y-1.5 pt-1">
            {(userActionRequired.options || [
              { id: 1, label: "Yes", value: "ALLOW_ONCE" },
              { id: 2, label: `Yes, and don't ask again for commands that start with ${userActionRequired.command?.split(' ')[0] || 'this'}`, value: "ALLOW_ALWAYS", prefix: userActionRequired.command?.split(' ')[0] },
              { id: 3, label: "No", value: "DENY" }
            ]).map((opt, idx) => {
              const optId = opt.id || idx + 1
              const isSelected = selectedOptionId === optId
              return (
                <div
                  key={optId}
                  onClick={() => setSelectedOptionId(optId)}
                  className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition border ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/50 text-white shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="permission_option"
                    checked={isSelected}
                    onChange={() => setSelectedOptionId(optId)}
                    className="mt-0.5 accent-sky-400 cursor-pointer"
                  />
                  <div className="text-xs font-sans">
                    <span className="font-semibold text-slate-200 mr-2">{optId}.</span>
                    <span>{opt.label || opt.value || opt}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                const options = userActionRequired.options || [
                  { id: 1, label: "Yes", value: "ALLOW_ONCE" },
                  { id: 2, label: `Yes, and don't ask again`, value: "ALLOW_ALWAYS", prefix: userActionRequired.command?.split(' ')[0] },
                  { id: 3, label: "No", value: "DENY" }
                ]
                const chosen = options.find(o => (o.id || 1) === selectedOptionId) || options[0]
                onResolveConflict && onResolveConflict(chosen)
              }}
              className="px-4 py-1.5 bg-slate-200 hover:bg-white text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow hover:shadow-sky-500/10 active:scale-95"
            >
              <span>Submit</span>
              <span className="text-[11px] font-mono">↵</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { HudPanel } from './HudPanel'

const emptyStep = () => ({ kind: 'target', value: '' })

function workflowSteps(workflow) {
  if (workflow.steps?.length) return workflow.steps
  return workflow.target ? [{ kind: 'target', value: workflow.target }] : []
}

export function WorkflowManager({ workflows, onClose, onSave }) {
  const [name, setName] = useState('')
  const [steps, setSteps] = useState([emptyStep()])

  const updateStep = (index, nextStep) => {
    setSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...nextStep } : step)))
  }

  const addWorkflow = (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    const cleanSteps = steps.map((step) => ({ ...step, value: step.value.trim() })).filter((step) => step.value)
    if (!cleanName || !cleanSteps.length) return

    onSave([...workflows.filter((item) => item.name.toLowerCase() !== cleanName.toLowerCase()), { name: cleanName, steps: cleanSteps }])
    setName('')
    setSteps([emptyStep()])
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Custom workflows">
      <HudPanel className="my-4 w-full max-w-2xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ev-cyan">Custom Setups</p>
            <h2 className="mt-1 font-display text-2xl text-slate-100">Saved launch sequences</h2>
          </div>
          <button type="button" className="icon-button h-10 w-10" onClick={onClose} aria-label="Close custom workflows">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={addWorkflow} className="space-y-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Setup name, e.g. Learning setup" className="w-full border border-ev-blue/30 bg-white/5 px-3 py-3 font-mono text-sm text-slate-100 outline-none focus:border-ev-cyan" />
          {steps.map((step, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[210px_minmax(0,1fr)_40px]">
              <select
                value={step.kind === 'app' ? `app:${step.value}` : 'target'}
                onChange={(event) => {
                  const selected = event.target.value
                  updateStep(index, selected === 'target' ? emptyStep() : { kind: 'app', value: selected.slice(4) })
                }}
                className="border border-ev-blue/30 bg-[#071221] px-3 py-3 font-mono text-sm text-slate-100 outline-none focus:border-ev-cyan"
              >
                <option value="target">Folder, file, or website</option>
                <option value="app:vscode">Open VS Code</option>
                <option value="app:chrome">Open Chrome</option>
                <option value="app:powershell">Open PowerShell</option>
                <option value="app:explorer">Open File Explorer</option>
                <option value="app:notepad">Open Notepad</option>
              </select>
              {step.kind === 'target' ? (
                <input value={step.value} onChange={(event) => updateStep(index, { value: event.target.value })} placeholder="C:\\Projects\\EV or https://example.com" className="min-w-0 border border-ev-blue/30 bg-white/5 px-3 py-3 font-mono text-sm text-slate-100 outline-none focus:border-ev-cyan" />
              ) : <div className="flex items-center border border-ev-blue/20 bg-white/5 px-3 font-mono text-sm text-ev-cyan">{step.value}</div>}
              <button type="button" onClick={() => setSteps((current) => current.length === 1 ? [emptyStep()] : current.filter((_, stepIndex) => stepIndex !== index))} className="grid h-10 w-10 place-items-center border border-ev-red/40 text-ev-red" aria-label="Remove setup step" title="Remove setup step">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <button type="button" onClick={() => setSteps((current) => [...current, emptyStep()])} className="icon-button h-10 w-10" aria-label="Add setup step" title="Add setup step">
              <Plus className="h-5 w-5" />
            </button>
            <button type="submit" className="border border-ev-cyan/60 px-4 py-2 font-mono text-sm text-ev-cyan transition hover:bg-ev-cyan/10">Save setup</button>
          </div>
        </form>

        <div className="mt-6 max-h-64 space-y-2 overflow-y-auto">
          {workflows.length ? workflows.map((workflow) => (
            <div key={workflow.name} className="grid grid-cols-[minmax(100px,0.7fr)_minmax(0,1.3fr)_40px] items-center gap-3 border border-ev-blue/20 bg-white/5 px-3 py-3 font-mono text-sm">
              <span className="truncate text-ev-cyan">{workflow.name}</span>
              <span className="truncate text-slate-400" title={workflowSteps(workflow).map((step) => step.value).join(', ')}>{workflowSteps(workflow).map((step) => step.value).join(' + ')}</span>
              <button type="button" onClick={() => onSave(workflows.filter((item) => item.name !== workflow.name))} className="grid h-9 w-9 place-items-center border border-ev-red/40 text-ev-red" aria-label={`Remove ${workflow.name}`} title={`Remove ${workflow.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )) : <p className="py-8 text-center font-mono text-sm text-slate-500">No custom setups saved.</p>}
        </div>
      </HudPanel>
    </div>
  )
}

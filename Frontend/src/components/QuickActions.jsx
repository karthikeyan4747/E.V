import { Code2, Folder, Globe2, Settings, SquareTerminal, Workflow } from 'lucide-react'
import { HudPanel } from './HudPanel'

const actions = [
  ['VS Code', 'Open VS Code', Code2],
  ['Browser', 'Open Chrome', Globe2],
  ['Terminal', 'Open PowerShell', SquareTerminal],
  ['Files', 'Open Explorer', Folder],
  ['Council', 'Consult the council about improving my workflow', Settings],
]

export function QuickActions({ onCommand, onOpenWorkflows }) {
  return (
    <HudPanel className="p-5">
      <h2 className="mb-4 border-b border-ev-blue/25 pb-3 font-mono text-sm uppercase tracking-[0.18em] text-ev-cyan">
        Quick Actions
      </h2>
      <div className="grid grid-cols-5 gap-2">
        {actions.map(([label, command, Icon]) => (
          <button
            key={label}
            type="button"
            onClick={() => onCommand(command)}
            className="quick-action"
            title={command}
            aria-label={command}
          >
            <Icon className="h-6 w-6" />
            <span>{label}</span>
          </button>
        ))}
        <button type="button" onClick={onOpenWorkflows} className="quick-action" title="Custom workflows" aria-label="Custom workflows">
          <Workflow className="h-6 w-6" />
          <span>Flows</span>
        </button>
      </div>
    </HudPanel>
  )
}

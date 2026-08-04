import { Activity, CircleDot, Database, Network } from 'lucide-react'
import { HudPanel } from './HudPanel'

export function SystemStatus({ online, voiceState, conversationMode }) {
  const rows = [
    ['CPU', '23%'],
    ['RAM', '41%'],
    ['NETWORK', online ? '98%' : '0%'],
  ]

  return (
    <HudPanel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-ev-blue" />
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-ev-cyan">System Status</h2>
        </div>
        <span className={online ? 'status-pill online' : 'status-pill offline'}>
          <CircleDot className="h-3 w-3" />
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="space-y-2 border-t border-ev-blue/25 pt-4 font-mono text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-slate-400">
            <span>{label}</span>
            <span className="text-ev-cyan">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="mini-readout">
          <Network className="h-4 w-4 text-ev-blue" />
          <span>{voiceState}</span>
        </div>
        <div className="mini-readout">
          <Database className="h-4 w-4 text-ev-blue" />
          <span>{conversationMode ? 'Voice Ready' : 'Standby'}</span>
        </div>
      </div>
    </HudPanel>
  )
}

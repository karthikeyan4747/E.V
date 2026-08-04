import { motion } from 'framer-motion'
import { ArrowLeft, Brain, CheckCircle2, Compass, Lightbulb, ShieldAlert } from 'lucide-react'
import { HudPanel } from './HudPanel'
import { VoiceOrb } from './VoiceOrb'
import { InputDock } from './InputDock'

const council = [
  { key: 'architect', title: 'Architect', icon: Compass, tone: 'architect' },
  { key: 'critic', title: 'Critic', icon: ShieldAlert, tone: 'critic' },
  { key: 'innovator', title: 'Innovator', icon: Lightbulb, tone: 'innovator' },
]

function stripDecision(text = '') {
  return text.replace(/<decision>[\s\S]*?<\/decision>/g, '').trim()
}

function CouncilCard({ member, data, delay, isThinking }) {
  const Icon = member.icon
  return (
    <motion.article
      initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.42, delay }}
      className={`council-card ${member.tone}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="council-icon">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em]">{member.title}</p>
            <h3 className="font-display text-xl text-slate-100">Analysis Node</h3>
          </div>
        </div>
        {data ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Brain className="h-5 w-5 animate-pulse" />}
      </div>
      <p className="min-h-[170px] text-sm leading-6 text-slate-300">
        {data ? stripDecision(data.response) : isThinking ? 'Evaluating the request through a dedicated reasoning profile...' : 'Awaiting council session.'}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs uppercase tracking-[0.12em]">
        <span className="rounded border border-white/10 bg-white/5 px-3 py-2 text-slate-400">Vote: {data?.decision?.vote || 'Pending'}</span>
        <span className="rounded border border-white/10 bg-white/5 px-3 py-2 text-slate-400">Confidence: {data?.decision?.confidence || 0}</span>
      </div>
    </motion.article>
  )
}

export function CouncilView({ result, isThinking, onReturn, onAsk, voiceState, amplitude }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.42 }}
      className="grid flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]"
    >
      <aside className="grid content-start gap-4">
        <HudPanel className="p-5">
          <button type="button" onClick={onReturn} className="mb-5 flex items-center gap-2 font-mono text-sm uppercase tracking-[0.16em] text-ev-cyan transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Return
          </button>
          <VoiceOrb state={voiceState} amplitude={amplitude} onClick={() => {}} />
          <p className="mt-5 text-center font-mono text-xs uppercase tracking-[0.18em] text-slate-500">Council Session</p>
        </HudPanel>
      </aside>

      <section className="grid min-h-0 gap-4 grid-rows-[auto_1fr_auto]">
        <HudPanel className="clipped p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-ev-cyan">Council Mode</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-display text-4xl text-slate-100">Strategic Analysis Active</h2>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-ev-blue">
              {result ? 'Council Session Complete' : 'Nodes Synchronizing'}
            </span>
          </div>
        </HudPanel>

        <div className="grid gap-4 lg:grid-cols-3">
          {council.map((member, index) => (
            <CouncilCard key={member.key} member={member} data={result?.[member.key]} delay={index * 0.14} isThinking={isThinking} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: result ? 1 : 0.55, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid gap-4 lg:grid-cols-[1fr_420px]"
        >
          <HudPanel className="ev-decision clipped p-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ev-cyan">Final E.V. Recommendation</p>
            <h3 className="mt-2 font-display text-3xl text-white">{result?.ev?.selected || 'Awaiting Decision'}</h3>
            <p className="mt-4 leading-7 text-slate-300">
              {result?.ev?.response || 'The final recommendation will appear here after all council nodes finish their analysis.'}
            </p>
          </HudPanel>
          <InputDock disabled={isThinking} onSubmit={onAsk} onMic={() => {}} isListening={false} />
        </motion.div>
      </section>
    </motion.div>
  )
}

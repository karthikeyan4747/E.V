import { motion } from 'framer-motion'
import { Mic, Square } from 'lucide-react'
import { Waveform } from './Waveform'

const stateCopy = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  tool: 'Tool Execution',
  council: 'Council Mode',
}

export function VoiceOrb({ state, amplitude, onClick }) {
  const isListening = state === 'listening'
  const isSpeaking = state === 'speaking'
  const isThinking = state === 'thinking'
  const isTool = state === 'tool'
  const isCouncil = state === 'council'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`voice-orb group ${state}`}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      <motion.span
        className="orb-ring orb-ring-outer"
        animate={{
          rotate: isThinking || isCouncil ? 360 : 0,
          scale: isListening ? [1, 1.12, 1] : isSpeaking ? [1, 1.05 + amplitude * 0.18, 1] : [1, 1.025, 1],
        }}
        transition={{
          rotate: { duration: isCouncil ? 4 : 2.8, repeat: Infinity, ease: 'linear' },
          scale: { duration: isListening ? 1.2 : 2.6, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      <motion.span
        className="orb-ring orb-ring-mid"
        animate={{
          rotate: isThinking ? -360 : 360,
          opacity: isTool ? [0.5, 1, 0.5] : 0.8,
          scale: isCouncil ? 0.86 : 1,
        }}
        transition={{ duration: isTool ? 0.55 : 7, repeat: Infinity, ease: 'linear' }}
      />
      {isListening && (
        <>
          <motion.span className="orb-ripple" animate={{ scale: [1, 1.45], opacity: [0.55, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <motion.span className="orb-ripple delay" animate={{ scale: [1, 1.65], opacity: [0.4, 0] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }} />
        </>
      )}
      <span className="orb-core">
        <span className="orb-light" />
        {isListening ? <Square className="relative z-10 h-11 w-11 text-ev-cyan" /> : <Mic className="relative z-10 h-14 w-14 text-ev-cyan" />}
      </span>
      <span className="absolute bottom-16 left-1/2 w-52 -translate-x-1/2">
        <Waveform amplitude={amplitude} state={state} bars={26} compact />
      </span>
      <span className="absolute bottom-8 left-0 right-0 font-mono text-xs uppercase tracking-[0.22em] text-ev-cyan">
        {stateCopy[state] || 'Idle'}
      </span>
    </button>
  )
}

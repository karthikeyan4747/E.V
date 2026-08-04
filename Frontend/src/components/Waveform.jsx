import { motion } from 'framer-motion'

export function Waveform({ amplitude = 0.1, state = 'idle', bars = 32, compact = false }) {
  const values = Array.from({ length: bars }, (_, index) => {
    const wave = Math.sin(index * 0.72 + amplitude * 8)
    const centerBias = 1 - Math.abs(index - bars / 2) / (bars / 2)
    return Math.max(0.12, amplitude * 1.65 + Math.abs(wave) * 0.34 + centerBias * 0.2)
  })

  return (
    <div className={`waveform ${compact ? 'h-8' : 'h-24'} ${state}`}>
      {values.map((value, index) => (
        <motion.span
          key={index}
          animate={{ height: `${Math.min(100, value * 100)}%`, opacity: state === 'idle' ? 0.35 : 0.9 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

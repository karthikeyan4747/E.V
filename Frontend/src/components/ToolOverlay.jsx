import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Cpu } from 'lucide-react'

export function ToolOverlay({ task }) {
  return (
    <AnimatePresence>
      {task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-black/20 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="tool-overlay"
          >
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-ev-cyan/50 bg-ev-blue/10 shadow-blue-glow">
              {task.status === 'complete' ? <CheckCircle2 className="h-8 w-8 text-emerald-300" /> : <Cpu className="h-8 w-8 animate-pulse text-ev-cyan" />}
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-ev-blue">
              {task.status === 'complete' ? 'Completed' : 'Executing Task'}
            </p>
            <h2 className="mt-2 font-display text-2xl text-slate-100">{task.label}</h2>
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-ev-blue/15">
              <motion.div
                className="h-full bg-ev-cyan shadow-blue-glow"
                initial={{ width: '12%' }}
                animate={{ width: task.status === 'complete' ? '100%' : ['12%', '72%', '44%', '88%'] }}
                transition={{ duration: task.status === 'complete' ? 0.28 : 1.5, repeat: task.status === 'complete' ? 0 : Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

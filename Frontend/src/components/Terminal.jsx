import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HudPanel } from './HudPanel'

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export function Terminal({ messages, status }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  return (
    <HudPanel className="terminal-panel flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-ev-blue/20 px-5 py-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-ev-cyan">// Terminal</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Secure conversation channel</p>
        </div>
        <div className="flex gap-2">
          <span className="h-2 w-2 rounded-full bg-ev-blue shadow-blue-glow" />
          <span className="h-2 w-2 rounded-full bg-ev-blue shadow-blue-glow" />
          <span className="h-2 w-2 rounded-full bg-ev-blue shadow-blue-glow" />
        </div>
      </div>
      <div className="terminal-scroll flex-1 space-y-6 overflow-y-auto p-5 font-mono">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.article
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className={message.role === 'user' ? 'text-right' : 'text-left'}
            >
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                {formatTime(message.time)} {message.role === 'user' ? 'You' : 'E.V.'}
              </p>
              <div className={message.role === 'user' ? 'terminal-message user' : 'terminal-message assistant'}>
                <span>{message.text}</span>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-ev-blue/20 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-ev-blue">
        &gt; {status}
      </div>
    </HudPanel>
  )
}

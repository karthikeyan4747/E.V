import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, RadioTower } from 'lucide-react'

const icons = {
  error: AlertTriangle,
  success: CheckCircle2,
  mode: RadioTower,
  info: Info,
}

export function Notifications({ notifications }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(380px,calc(100vw-2rem))] space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.tone] || Info
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -16, x: 24 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10, x: 20 }}
              className={`notification ${notification.tone}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-display text-sm text-slate-100">{notification.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{notification.detail}</p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

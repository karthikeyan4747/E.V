import { motion } from 'framer-motion'

export function HudPanel({ children, className = '' }) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'rgba(56, 189, 248, 0.5)' }}
      transition={{ duration: 0.24 }}
      className={`hud-panel ${className}`}
    >
      {children}
    </motion.div>
  )
}

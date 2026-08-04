import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Send, Square } from 'lucide-react'

export function InputDock({ onSubmit, onMic, isListening, disabled }) {
  const [value, setValue] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if (!text) return
    setValue('')
    onSubmit(text)
  }

  return (
    <form onSubmit={submit} className="hud-panel clipped flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={onMic}
        className={`icon-button ${isListening ? 'active' : ''}`}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        placeholder="Type a command or speak..."
        className="min-w-0 flex-1 bg-transparent px-2 py-3 font-mono text-sm text-ev-cyan outline-none placeholder:text-ev-blue/45"
      />
      <motion.button whileTap={{ scale: 0.94 }} disabled={disabled} type="submit" className="icon-button" aria-label="Send command">
        <Send className="h-5 w-5" />
      </motion.button>
    </form>
  )
}

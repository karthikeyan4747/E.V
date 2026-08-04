import { useEffect, useState } from 'react'

const formatClock = () => {
  const now = new Date()
  return {
    time: now.toLocaleTimeString([], { hour12: false }),
    date: now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }),
  }
}

export function useClock() {
  const [clock, setClock] = useState(formatClock)

  useEffect(() => {
    const interval = window.setInterval(() => setClock(formatClock()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  return clock
}

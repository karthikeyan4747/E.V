import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrainCircuit, Cpu, Mic, Radio, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from './services/api'
import { useClock } from './hooks/useClock'
import { useVoiceAssistant } from './hooks/useVoiceAssistant'
import { HudPanel } from './components/HudPanel'
import { VoiceOrb } from './components/VoiceOrb'
import { Waveform } from './components/Waveform'
import { Terminal } from './components/Terminal'
import { InputDock } from './components/InputDock'
import { SystemStatus } from './components/SystemStatus'
import { QuickActions } from './components/QuickActions'
import { Notifications } from './components/Notifications'
import { CouncilView } from './components/CouncilView'
import { ToolOverlay } from './components/ToolOverlay'
import { useWakeWord } from './hooks/useWakeWord'



const initialMessages = [
  {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: 'Secure connection established. Voice interface is ready.',
    time: new Date(),
  },
]

function App() {
  const clock = useClock()
  const [messages, setMessages] = useState(initialMessages)
  const [mode, setMode] = useState('conversation')
  const [conversationMode, setConversationMode] = useState(true)
  const [systemOnline, setSystemOnline] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [toolTask, setToolTask] = useState(null)
  const [councilResult, setCouncilResult] = useState(null)
  const [isThinking, setIsThinking] = useState(false)
  const playSpeechRef = useRef(async () => { })

  const notify = useCallback((title, detail, tone = 'info') => {
    const notification = { id: crypto.randomUUID(), title, detail, tone }
    setNotifications((current) => [notification, ...current].slice(0, 4))
    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== notification.id))
    }, 4200)
  }, [])

  const addMessage = useCallback((role, text) => {
    const message = { id: crypto.randomUUID(), role, text, time: new Date() }
    setMessages((current) => [...current, message])
    return message
  }, [])

  const submitMessage = useCallback(
    async (text, explicitMode = mode) => {
      const cleanText = text.trim()
      console.log("submitMessage received:", cleanText)
      if (!cleanText || isThinking) return

      addMessage('user', cleanText)
      setIsThinking(true)

      try {
        const useDebate =
          explicitMode === 'council' ||
          /\b(debate|council|architect|critic|innovator)\b/i.test(cleanText)

        if (useDebate) {
          setMode('council')
          setCouncilResult(null)
          notify('Council Mode', 'Architect, Critic, and Innovator are assembling.', 'mode')
          const { data } = await api.post('/debate', { message: cleanText })
          setCouncilResult(data)
          addMessage('assistant', data.ev?.response || 'The council session is complete.')
          await playSpeechRef.current(data.ev?.speech || "The council's analysis is complete.")
          return
        }
        console.log("Sending request to /chat...");
        const { data } = await api.post('/chat', { message: cleanText })
        console.log("Chat response:", data);
        if (data.type === 'conversation_mode') {
          setConversationMode(Boolean(data.enabled))
          notify('Conversation Mode', data.response, 'mode')
        }

        if (data.type === 'debate') {
          setMode('council')
          notify('Council Mode', 'Council session activated.', 'mode')
        }

        if (data.type === 'tool') {
          setToolTask({ label: data.response, status: 'executing' })
          notify('Tool Execution', data.response, data.success ? 'success' : 'error')
          if (data.success && data.url) {
            window.open(data.url, "_blank", "noopener,noreferrer")
          }
          window.setTimeout(() => setToolTask({ label: data.message || data.response, status: 'complete' }), 800)
          window.setTimeout(() => setToolTask(null), 2600)
        }

        addMessage('assistant', data.response || data.message || 'Task completed.')
        await playSpeechRef.current(data.speech || data.response || 'Completed.')
      } catch (error) {
        notify('Connection Error', error?.response?.data?.detail || 'E.V. could not complete that request.', 'error')
        addMessage('assistant', "I couldn't complete that request.")
      } finally {
        setIsThinking(false)
      }
    },
    [addMessage, isThinking, mode, notify],
  )
  const wakeWord = useWakeWord({
    onWake: () => {
      console.log('🔥 E.V. WAKE WORD DETECTED')
    },
  })
  const voice = useVoiceAssistant({
    onTranscript: (text) => {
      if (!text) return

      const transcript = text.trim()
      console.log('Voice transcript:', transcript, 'conversationMode=', conversationMode)

      let command = transcript
      if (!conversationMode) {
        const wakeWords = [
          'hey ev',
          'hey e.v.',
          'hey e v',
          'ev',
          'e.v.',
          'e v',
        ]

        const lower = transcript.toLowerCase().replace(/[^a-z0-9\s']/g, ' ')
        const wake = wakeWords.find((word) => lower.startsWith(word) || lower === word)

        if (!wake) {
          console.log('Wake word not detected, ignoring transcript')
          return
        }

        command = transcript.slice(wake.length).trim()

        if (!command) {
          notify('Wake Word', "I'm listening.", 'info')
          return
        }
      }

      console.log('Submitting voice command:', command)
      submitMessage(command)
    },
    onNotify: notify,
    onUserMessage: (text) => addMessage('user', text),
  })
  playSpeechRef.current = voice.playSpeech

  useEffect(() => {
    let mounted = true
    api
      .get('/health')
      .then(() => mounted && setSystemOnline(true))
      .catch(() => {
        if (mounted) {
          setSystemOnline(false)
          notify('Backend Offline', 'Start the FastAPI service to enable E.V.', 'error')
        }
      })
    return () => {
      mounted = false
    }
  }, [notify])

  const voiceState = useMemo(() => {
    if (mode === 'council') return 'council'
    if (toolTask) return 'tool'
    if (isThinking || voice.phase === 'transcribing') return 'thinking'
    return voice.phase
  }, [isThinking, mode, toolTask, voice.phase])

  return (
    <main className="min-h-screen overflow-hidden bg-ev-deep text-slate-100">
      <div className="ev-grid" />
      <div className="ev-scanline" />

      <Notifications notifications={notifications} />
      <ToolOverlay task={toolTask} />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1720px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="hud-panel clipped flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative grid h-14 w-14 place-items-center rounded-full border border-ev-red/60 bg-ev-red/10 shadow-red-glow">
                <ShieldCheck className="h-7 w-7 text-ev-red" />
              </div>
              <div>
                <h1 className="font-display text-4xl font-bold tracking-normal text-ev-red sm:text-5xl">E.V.</h1>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-ev-cyan">Enhanced Virtual Intelligence</p>
                <button
                  onClick={wakeWord.startWakeWord}
                  className="rounded border border-cyan-400 px-4 py-2"
                >
                  Start E.V. Wake Word
                </button>
              </div>
            </div>
            <div className="hidden items-center gap-2 font-mono text-xs uppercase text-ev-blue md:flex">
              <Radio className="h-4 w-4" />
              Secure Link Established
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="hud-panel clipped flex items-center justify-between gap-6 px-5 py-4 font-mono text-sm text-ev-blue"
          >
            <span>TIME: {clock.time}</span>
            <span>DATE: {clock.date}</span>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'council' ? (
            <CouncilView
              key="council"
              result={councilResult}
              isThinking={isThinking}
              onReturn={() => setMode('conversation')}
              onAsk={(text) => submitMessage(text, 'council')}
              voiceState={voiceState}
              amplitude={voice.amplitude}
              onMic={() =>
                voice.phase === "listening"
                  ? voice.stopListening()
                  : voice.startListening()
              }
              isListening={voice.phase === "listening"}
            />
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35 }}
              className="grid flex-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)_380px]"
            >
              <aside className="grid gap-4 xl:grid-rows-[auto_1fr_auto]">
                <SystemStatus online={systemOnline} voiceState={voiceState} conversationMode={conversationMode} />
                <HudPanel className="grid min-h-[470px] place-items-center p-6">
                  <VoiceOrb
                    state={voiceState}
                    amplitude={voice.amplitude}
                    onClick={() =>
                      voice.phase === "listening"
                        ? voice.stopListening()
                        : voice.startListening()
                    }
                  />
                  <div className="mt-5 text-center">
                    <p className="font-mono text-lg uppercase tracking-[0.18em] text-ev-cyan">{voice.statusLabel}</p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
                      Wake phrase: "Hey E.V."
                    </p>
                  </div>
                </HudPanel>
                <QuickActions onCommand={submitMessage} />
              </aside>

              <section className="grid min-h-[680px] gap-4 grid-rows-[1fr_auto]">
                <Terminal messages={messages} status={voice.statusLabel} />
                <InputDock
                  disabled={isThinking}
                  onSubmit={submitMessage}
                  onMic={() => (voice.phase === 'listening' ? voice.stopListening() : voice.startListening())}
                  isListening={voice.phase === 'listening'}
                />
              </section>

              <aside className="grid gap-4 content-start">
                <HudPanel className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ev-cyan">Voice Matrix</p>
                      <h2 className="mt-1 font-display text-2xl text-slate-100">Live Signal</h2>
                    </div>
                    <Mic className="h-6 w-6 text-ev-blue" />
                  </div>
                  <Waveform amplitude={voice.amplitude} state={voiceState} bars={42} />
                  <button
                    type="button"
                    onClick={() => setConversationMode((value) => !value)}
                    className="mt-5 flex w-full items-center justify-between rounded border border-ev-blue/30 bg-ev-blue/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-ev-cyan transition hover:border-ev-cyan/70 hover:bg-ev-blue/20"
                  >
                    Conversation Mode
                    <span className={conversationMode ? 'text-emerald-300' : 'text-slate-500'}>
                      {conversationMode ? 'Enabled' : 'Standby'}
                    </span>
                  </button>
                </HudPanel>

                {[
                  ['Listening', 'Automatic silence detection with MediaRecorder.', BrainCircuit],
                  ['Thinking', 'Routing through chat or council intelligence.', Cpu],
                  ['Speaking', 'TTS playback drives the orb and waveform.', Sparkles],
                ].map(([title, detail, Icon], index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 + 0.2 }}
                    className="hud-panel clipped p-5"
                  >
                    <div className="flex gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-ev-blue/40 bg-ev-blue/10">
                        <Icon className="h-5 w-5 text-ev-cyan" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg text-slate-100">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}

export default App

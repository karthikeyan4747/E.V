import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../services/api'

const labels = {
  idle: 'Idle',
  listening: 'Listening...',
  transcribing: 'Thinking...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
  tool: 'Executing...',
  council: 'Council Mode',
}

function averageFrequency(analyser) {
  if (!analyser) return 0
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)
  const sum = data.reduce((total, value) => total + value, 0)
  return Math.min(1, sum / data.length / 120)
}

export function useVoiceAssistant({ onTranscript, onNotify }) {
  const [phase, setPhase] = useState('idle')
  const [amplitude, setAmplitude] = useState(0.08)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const rafRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const heardSpeechRef = useRef(false)
  const silenceStartedRef = useRef(null)
  const startedAtRef = useRef(0)

  const cleanupRecorder = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    audioContextRef.current?.close().catch(() => {})
    mediaRecorderRef.current = null
    streamRef.current = null
    audioContextRef.current = null
    analyserRef.current = null
    silenceStartedRef.current = null
    heardSpeechRef.current = false
    setAmplitude(0.08)
  }, [])

  const stopListening = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  const monitorInput = useCallback(() => {
    const analyser = analyserRef.current
    const recorder = mediaRecorderRef.current
    if (!analyser || !recorder || recorder.state === 'inactive') return

    const level = averageFrequency(analyser)
    console.log("Level:",level.toFixed(3))
    const now = performance.now()
    setAmplitude(Math.max(0.05, level))

    if (level > 0.11) {
      heardSpeechRef.current = true
      silenceStartedRef.current = null
    }

   if (heardSpeechRef.current && level < 0.07) {

    console.log("Silence detected");

    silenceStartedRef.current ??= now;

    console.log(now - silenceStartedRef.current);

    if (now - silenceStartedRef.current > 700) {

        console.log("Stopping recorder");

        stopListening();

        return;
    }
}

    if (now - startedAtRef.current > 24000) {
      stopListening()
      return
    }

    rafRef.current = requestAnimationFrame(monitorInput)
  }, [stopListening])

  const startListening = useCallback(async () => {
    console.log("startListening called");
    if (phase === 'listening') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.72
      source.connect(analyser)

      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      streamRef.current = stream
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      mediaRecorderRef.current = recorder
      startedAtRef.current = performance.now()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        cleanupRecorder()

        if (blob.size < 900) {
          setPhase('idle')
          return
        }

        setPhase('transcribing')
        try {
          const formData = new FormData()
          formData.append('audio', blob, 'ev-command.webm')
          const { data } = await api.post('/stt', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          const text = data.text?.trim()
          setPhase('thinking')
          if (text) onTranscript(text)
          else setPhase('idle')
        } catch (error) {

  console.error("STT ERROR:", error);

  if (error.response) {
    console.log("Response:", error.response.data);
    console.log("Status:", error.response.status);
  }

  setPhase('idle');

  onNotify(
    'Speech Recognition Failed',
    'I could not transcribe that audio.',
    'error'
  );
}
      }

      recorder.start()
      setPhase('listening')
      monitorInput()
    } catch (error) {
      setPhase('idle')
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError'
      onNotify(
        denied ? 'Microphone Permission Denied' : 'Microphone Unavailable',
        denied ? 'Allow microphone access in the browser to speak with E.V.' : 'The voice interface could not start.',
        'error',
      )
    }
  }, [cleanupRecorder, monitorInput, onNotify, onTranscript, phase])

  const playSpeech = useCallback(
    async (speech) => {
      const text = speech?.trim()
      if (!text) {
        setPhase('idle')
        return
      }

      try {
        const { data } = await api.post('/tts', { text }, { responseType: 'blob' })
        const url = URL.createObjectURL(data)
        const audio = new Audio(url)
        const context = new AudioContext()
        const source = context.createMediaElementSource(audio)
        const analyser = context.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyser.connect(context.destination)

        setPhase('speaking')

        const animatePlayback = () => {
          setAmplitude(Math.max(0.06, averageFrequency(analyser)))
          if (!audio.paused && !audio.ended) {
            rafRef.current = requestAnimationFrame(animatePlayback)
          }
        }

        audio.onplay = animatePlayback
        audio.onended = () => {
          URL.revokeObjectURL(url)
          context.close().catch(() => {})
          setAmplitude(0.08)
          setPhase('idle')
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          context.close().catch(() => {})
          setPhase('idle')
          onNotify('Voice Playback Failed', 'The response is displayed without audio.', 'error')
        }

        await audio.play()
      } catch {
        setPhase('idle')
        onNotify('Text To Speech Failed', 'The response is displayed without audio.', 'error')
      }
    },
    [onNotify],
  )

  useEffect(() => cleanupRecorder, [cleanupRecorder])

  

  return {
    phase,
    amplitude,
    statusLabel: labels[phase] || 'Idle',
    startListening,
    stopListening,
    playSpeech,
    setPhase,
  }
}

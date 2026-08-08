import { useCallback, useEffect, useRef, useState } from 'react'
import WakeWordEngine from 'openwakeword-wasm-browser'

export function useWakeWord({ onWake }) {
    const engineRef = useRef(null)
    const [wakeWordReady, setWakeWordReady] = useState(false)
    const [wakeWordListening, setWakeWordListening] = useState(false)
    const [wakeWordError, setWakeWordError] = useState(null)
    const listeningRef = useRef(false)

    const startWakeWord = useCallback(async () => {
        if (listeningRef.current) {
            console.log('Wake word already listening')
            return
        }
        try {
            setWakeWordError(null)

            if (!engineRef.current) {
                const engine = new WakeWordEngine({
                    baseAssetUrl: '/openwakeword/models',
                    keywords: ['hey_jarvis'],
                    detectionThreshold: 0.1,
                    cooldownMs: 2000,
                })

                engineRef.current = engine

                await engine.load()

                engine.on('detect', ({ keyword, score }) => {
                    console.log(
                        'WAKE WORD:',
                        keyword,
                        'score:',
                        score.toFixed(3)
                    )

                    onWake?.()
                })

                engine.on('speech-start', () => {
                    console.log('Wake listener: speech detected')
                })

                engine.on('speech-end', () => {
                    console.log('Wake listener: speech ended')
                })

                engine.on('error', (error) => {
                    console.error('WAKE WORD ERROR:', error)
                    setWakeWordError(error)
                })

                setWakeWordReady(true)
            }

            await engineRef.current.start()
            listeningRef.current = true

            setWakeWordListening(true)

            console.log('Wake word listener started')
        } catch (error) {
            console.error('Failed to start wake word:', error)
            setWakeWordError(error)
            setWakeWordListening(false)
        }
    }, [onWake])

    const stopWakeWord = useCallback(async () => {
        
        if (!engineRef.current) return

        try {
            await engineRef.current.stop()
        } catch (error) {
            console.error('Failed to stop wake word:', error)
        }
        listeningRef.current = false
        setWakeWordListening(false)

        console.log('Wake word listener stopped')
    }, [])

    useEffect(() => {
        return () => {
            engineRef.current?.stop().catch(() => { })
        }
    }, [])

    return {
        wakeWordReady,
        wakeWordListening,
        wakeWordError,
        startWakeWord,
        stopWakeWord,
    }
}
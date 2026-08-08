import { useCallback, useEffect, useRef, useState } from 'react'
import WakeWordEngine from 'openwakeword-wasm-browser'

export function useWakeWord({ onWake }) {
    const engineRef = useRef(null)
    const listeningRef = useRef(false)
    const startingRef = useRef(false)

    const [wakeWordReady, setWakeWordReady] = useState(false)
    const [wakeWordListening, setWakeWordListening] = useState(false)
    const [wakeWordError, setWakeWordError] = useState(null)

    const startWakeWord = useCallback(async () => {
        // Already listening
        if (listeningRef.current) {
            console.log('Wake word already listening')
            return
        }

        // Already starting/loading
        if (startingRef.current) {
            console.log('Wake word is already starting')
            return
        }

        startingRef.current = true

        try {
            setWakeWordError(null)

            // --------------------------------
            // CREATE ENGINE
            // --------------------------------

            if (!engineRef.current) {
                console.log('Creating wake word engine...')

                const engine = new WakeWordEngine({
                    baseAssetUrl: '/openwakeword/models',

                    keywords: ['Hey_e_v'],

                    modelFiles: {
                        Hey_e_v: 'Hey_e_v.onnx',
                    },

                    detectionThreshold: 0.2,
                    cooldownMs: 2000,
                })

                engineRef.current = engine

                // --------------------------------
                // LOAD MODELS
                // --------------------------------

                console.log('Loading wake word models...')

                await engine.load()

                console.log('Wake word models loaded')

                // --------------------------------
                // EVENTS
                // --------------------------------

                engine.on('detect', async ({ keyword, score }) => {
                    console.log(
                        'WAKE WORD:',
                        keyword,
                        'score:',
                        score.toFixed(3)
                    )



                    // Tell E.V. to start recording the command
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

            // --------------------------------
            // START MICROPHONE
            // --------------------------------

            console.log('Starting wake word listener...')

            await engineRef.current.start()

            listeningRef.current = true
            setWakeWordListening(true)

            console.log('Wake word listener started')

        } catch (error) {
            console.error('Failed to start wake word:', error)

            listeningRef.current = false
            setWakeWordListening(false)
            setWakeWordError(error)

        } finally {
            startingRef.current = false
        }
    }, [onWake])

    const stopWakeWord = useCallback(async () => {
        if (!engineRef.current) {
            return
        }

        if (!listeningRef.current) {
            console.log('Wake word is not listening')
            return
        }

        try {
            console.log('Stopping wake word listener...')

            await engineRef.current.stop()

            console.log('Wake word listener stopped')

        } catch (error) {
            console.error('Failed to stop wake word:', error)

        } finally {
            listeningRef.current = false
            setWakeWordListening(false)
        }
    }, [])

    useEffect(() => {
        return () => {
            if (engineRef.current) {
                engineRef.current.stop().catch(() => { })
            }

            listeningRef.current = false
            startingRef.current = false
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
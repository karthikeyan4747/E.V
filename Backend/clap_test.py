import time
import numpy as np
import sounddevice as sd
import webbrowser
from clapDetector import ClapDetector
import subprocess
from scipy.io import wavfile
import os

SAMPLE_RATE = 44100
BUFFER_SIZE = 2048

THRESHOLD_BIAS = 12000
LOWCUT = 800
HIGHCUT = 2500

BACKEND_DIR = r"C:\Users\Karthikeyan K\Desktop\EV\Backend"
FRONTEND_DIR = r"C:\Users\Karthikeyan K\Desktop\EV\Frontend"

GREETING_AUDIO = os.path.join(
    BACKEND_DIR,
    "intro.wav"
)

FRONTEND_URL = "http://localhost:5173"

print("======================================")
print("       E.V. DOUBLE CLAP TEST")
print("======================================")
print()
print("Listening...")
print("Speak normally - nothing should happen.")
print("Try: 👏 👏")
print()
print("Press Ctrl+C to stop.")
print()


# ------------------------------------------------------------
# Create detector
# ------------------------------------------------------------

detector = ClapDetector(
    inputDevice=0,
    rate=SAMPLE_RATE,
    bufferLength=BUFFER_SIZE,
    initialVolumeThreshold=7000,
    debounceTimeFactor=0.15,
    resetTime=0.6,
    clapInterval=0.30,
    volumeAverageFactor=0.9
)

EV_URL = "https://www.ev-ai.me/"

# ------------------------------------------------------------
# Manually initialize the parts normally created by
# the original microphone initialization
# ------------------------------------------------------------

from collections import deque

detector.audioData = np.zeros(
    BUFFER_SIZE,
    dtype=np.int16
)

detector.audioBuffer = deque(
    maxlen=int(
        (SAMPLE_RATE * detector.audioBufferLength)
        / BUFFER_SIZE
    )
)

detector.resetTimeSamples = int(
    detector.resetTime * SAMPLE_RATE
)

detector.clapIntervalSamples = int(
    detector.clapInterval * SAMPLE_RATE
)

detector.samplesPerTimePeriod = (
    detector.secondsPerTimePeriod * SAMPLE_RATE
)

detector.currentSampleTime = int(
    detector.debounceTimeFactor * SAMPLE_RATE
)

detector.clapTimes = [0]


print("Detector initialized successfully.")
print()


def play_startup_greeting():

    try:

        if not os.path.exists(GREETING_AUDIO):
            print("❌ Greeting file not found:")
            print(GREETING_AUDIO)
            return

        sample_rate, audio = wavfile.read(
            GREETING_AUDIO
        )

        print("🔊 E.V. greeting playing...")

        sd.play(
            audio,
            sample_rate
        )

        sd.wait()

        print("🔊 Greeting finished.")

    except Exception as e:

        print("❌ Greeting error:", e)
# ------------------------------------------------------------
# Audio callback
# ------------------------------------------------------------

def launch_ev():

    print()
    print("🚀 DOUBLE CLAP DETECTED")
    print("Starting E.V...")
    print()

    webbrowser.open(FRONTEND_URL)

    # Start frontend
    subprocess.Popen(
        [
                "cmd",
                "/c",
                "npm run dev"
       ],
            cwd=FRONTEND_DIR,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    
    print("✅ Frontend starting...")

    play_startup_greeting()

    # Start backend
    subprocess.Popen(
    [
        r"C:\Users\Karthikeyan K\Desktop\EV\Backend\.venv\Scripts\python.exe",
        "-m",
        "uvicorn",
        "main:app",
        "--reload"
    ],
    cwd=BACKEND_DIR,
    creationflags=subprocess.CREATE_NEW_CONSOLE
    )

    print("✅ Backend starting...")

    

    # Give Vite/FastAPI a moment to start
    time.sleep(4)

    # Open E.V.
    print("🌐 E.V. opened")

def callback(indata, frames, time_info, status):

    if status:
        print("Audio:", status)

    audio = indata[:, 0]

    # sounddevice float32 -> int16
    audio = (
        audio * 32767
    ).astype(np.int16)

    try:

        pattern = detector.run(
            thresholdBias=THRESHOLD_BIAS,
            lowcut=LOWCUT,
            highcut=HIGHCUT,
            audioData=audio
        )

        if pattern:

            print()
            print("--------------------------------------")
            print("PATTERN:", pattern)

            if pattern in ([1,1],[1,2]):

                print("👏👏 DOUBLE CLAP DETECTED!")
                launch_ev()

            else:

                print("Clap pattern:", pattern)

            print("--------------------------------------")
            print()

    except Exception as e:

        print("Detection error:", e)


# ------------------------------------------------------------
# Start microphone
# ------------------------------------------------------------

try:

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        blocksize=BUFFER_SIZE,
        channels=1,
        dtype="float32",
        callback=callback
    ):

        while True:
            time.sleep(0.1)

except KeyboardInterrupt:

    print()
    print("Stopped.")





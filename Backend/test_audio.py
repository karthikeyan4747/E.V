import sounddevice as sd
from scipy.io import wavfile

file = r"C:\Users\Karthikeyan K\Desktop\EV\Backend\intro.wav"

print("Loading:", file)

sample_rate, audio = wavfile.read(file)

print("Sample rate:", sample_rate)
print("Shape:", audio.shape)
print("Dtype:", audio.dtype)

print("Playing...")

sd.play(audio, sample_rate)
sd.wait()

print("Finished.")
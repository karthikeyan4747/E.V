from pycaw.pycaw import AudioUtilities

device = AudioUtilities.GetSpeakers()

print("Device:", device.FriendlyName)

volume = device.EndpointVolume

current = volume.GetMasterVolumeLevelScalar() * 100
print(f"Current volume: {current:.0f}%")

volume.SetMasterVolumeLevelScalar(0.30, None)

new = volume.GetMasterVolumeLevelScalar() * 100
print(f"New volume: {new:.0f}%")
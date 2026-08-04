import { useEffect, useRef } from "react";

export function useWakeWord(onWake) {
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0]
          .transcript
          .toLowerCase()
          .trim();

      console.log("Heard:", transcript);

      if (
        transcript.includes("hey ev") ||
        transcript.includes("hey e v")
      ) {
        recognition.stop();

        onWake();
      }
    };

    recognition.onerror = (event) => {
      console.log("Wake Word Error:", event.error);
    };

    recognition.onend = () => {
      setTimeout(() => {
        recognition.start();
      }, 500);
    };

    recognition.start();

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onWake]);
}
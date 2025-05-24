import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  browserSupportsSpeechRecognition: boolean;
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(true);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Browser does not support SpeechRecognition.");
      setBrowserSupportsSpeechRecognition(false);
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognitionInstance = new SpeechRecognitionAPI();
    recognitionInstance.continuous = false; // Stop after first pause
    recognitionInstance.interimResults = true; // Get live updates
    recognitionInstance.lang = 'en-US'; // Set language

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setTranscript(''); // Clear previous transcript
      setError(null);
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Display interim results, but only update final transcript when recognition stops or is final
      setTranscript(interimTranscript || finalTranscript); // Show interim, fallback to final
      
      // If a final result is received, we can consider the main part of transcript done.
      // The 'onend' event will finalize it.
      if (finalTranscript) {
        // console.log("Final fragment:", finalTranscript);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'no-speech') {
        setError("No speech detected. Please try again.");
      } else if (event.error === 'audio-capture') {
        setError("Microphone error. Please ensure it's enabled and working.");
      } else if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      // The final transcript should be available in the 'transcript' state by now due to onresult
      // console.log("Speech recognition ended. Final transcript should be set.");
    };
    
    recognitionRef.current = recognitionInstance;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
    };
  }, []);

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
        setError("Speech recognition is not supported in this browser.");
        return;
    }
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript(''); // Clear previous transcript before starting
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        // This might happen if start() is called too soon after it ended.
        console.error("Error starting speech recognition:", err);
        setError("Could not start listening. Please try again.");
        setIsListening(false); // Ensure state is consistent
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will set isListening to false
    }
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  };
};

export default useSpeechRecognition;

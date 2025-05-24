"use client";

import { useState, useEffect, useRef } from 'react';
import { TriviaQuestion } from '@/lib/gemini';
import { synthesizeSpeech } from '@/lib/elevenlabs'; // Corrected path

interface QuestionDisplayProps {
  question: TriviaQuestion;
  onAnswerSelected: (selectedOption: string) => void;
}

// Simple Speaker Icon SVG - you can replace this with a more sophisticated icon library if needed
const SpeakerIcon = ({ isLoading }: { isLoading: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${isLoading ? 'animate-pulse text-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);


export default function QuestionDisplay({ question, onAnswerSelected }: QuestionDisplayProps) {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // To manage the audio object

  // Clean up audio object and URL when component unmounts or question changes
  useEffect(() => {
    return () => {
      if (audioRef.current && audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src); // Clean up blob URL
        audioRef.current = null;
      }
    };
  }, [question]);


  const handleSpeakQuestion = async () => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause(); // Stop current speech if any
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    setAudioError(null);

    try {
      const audioUrl = await synthesizeSpeech(question.questionText);

      if (audioUrl) {
        // If there's an existing audio object, clean it up first
        if (audioRef.current && audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio; // Store reference

        audio.play();
        audio.onended = () => {
          setIsSpeaking(false);
          if (audioRef.current && audioRef.current.src === audioUrl) { // Check if it's still the same audio
            URL.revokeObjectURL(audioUrl); // Clean up after playing
            audioRef.current = null; // Clear ref after cleanup
          }
        };
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setAudioError("Error playing audio.");
          setIsSpeaking(false);
          if (audioRef.current && audioRef.current.src === audioUrl) {
             URL.revokeObjectURL(audioUrl);
             audioRef.current = null;
          }
        };
      } else {
        setAudioError("Could not generate audio. Please check API key or try again.");
        setIsSpeaking(false);
      }
    } catch (error: any) {
      console.error("Error synthesizing speech:", error);
      setAudioError(error.message || "Failed to synthesize speech.");
      setIsSpeaking(false);
    }
  };

  return (
    <div className="p-6 my-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Category: {question.category} | Difficulty: {question.difficulty}
        </p>
        <button
          onClick={handleSpeakQuestion}
          title={isSpeaking ? "Stop speaking" : "Read question aloud"}
          className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <SpeakerIcon isLoading={isSpeaking} />
        </button>
      </div>
      
      <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">
        {question.questionText}
      </h2>

      {audioError && (
        <p className="text-xs text-red-500 dark:text-red-400 mb-3 text-right -mt-4">{audioError}</p>
      )}
      
      <div className="space-y-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelected(option)}
            disabled={isSpeaking} // Optionally disable options while speaking
            className="w-full p-4 text-left text-lg text-gray-700 bg-gray-100 rounded-lg hover:bg-blue-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-70"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

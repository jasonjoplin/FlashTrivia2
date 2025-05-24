"use client";

import { useState, useEffect, useRef } from 'react';
import { FlashcardContent } from '@/lib/gemini';
import { synthesizeSpeech } from '@/lib/elevenlabs';

interface FlashcardDisplayItemProps {
  card: FlashcardContent;
  isFlipped: boolean;
  onFlip: () => void;
}

// Simple Speaker Icon SVG (copied from QuestionDisplay.tsx for now)
// Consider moving this to a shared components directory if used in multiple places.
const SpeakerIcon = ({ isLoading, className = "" }: { isLoading: boolean, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${className} ${isLoading ? 'animate-pulse text-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

export default function FlashcardDisplayItem({ card, isFlipped, onFlip }: FlashcardDisplayItemProps) {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio object and URL when component unmounts or card changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
    };
  }, [card]); // Rerun cleanup if the card itself changes

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current = null;
    }
    setIsSpeaking(false); // Reset speaking state
  };

  const handleSpeak = async (text: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card flip when clicking speaker icon

    if (isSpeaking) { // If already speaking, treat as a stop request
      stopCurrentAudio();
      return;
    }
    
    // If not speaking, but there's an old audio object, ensure it's cleaned up.
    if (audioRef.current) {
        stopCurrentAudio();
    }

    setIsSpeaking(true);
    setAudioError(null);

    try {
      const audioUrl = await synthesizeSpeech(text);
      if (audioUrl) {
        // stopCurrentAudio(); // Ensure any previous audio source is cleared before setting new one

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.play();
        audio.onended = () => {
          setIsSpeaking(false);
          if (audioRef.current && audioRef.current.src === audioUrl) { // Check if it's still the same audio
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
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
        setAudioError("Could not generate audio. Check API key or try again.");
        setIsSpeaking(false);
      }
    } catch (error: any) {
      console.error("Error synthesizing speech:", error);
      setAudioError(error.message || "Failed to synthesize speech.");
      setIsSpeaking(false);
    }
  };
  
  // When the card flips, stop any ongoing speech.
  useEffect(() => {
    stopCurrentAudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped]);


  return (
    <div
      className="w-full max-w-md h-80 perspective bg-transparent cursor-pointer rounded-xl"
      onClick={onFlip}
    >
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl flex flex-col p-6">
          <div className="flex justify-between items-start">
            <p className="text-xs text-gray-500 dark:text-gray-400">Topic: {card.topic}</p>
            <button
              onClick={(e) => handleSpeak(card.frontText, e)}
              title={isSpeaking && !isFlipped ? "Stop speaking" : "Read front text aloud"}
              className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
              disabled={isFlipped && isSpeaking} // Disable if flipped and other side is speaking
            >
              <SpeakerIcon isLoading={isSpeaking && !isFlipped} />
            </button>
          </div>
          <div className="flex-grow flex justify-center items-center">
            <p className="text-2xl md:text-3xl font-semibold text-center text-gray-800 dark:text-gray-100">
              {card.frontText}
            </p>
          </div>
          {audioError && !isFlipped && (
            <p className="text-xs text-red-500 dark:text-red-400 self-center -mb-2">{audioError}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 self-end mt-auto">Click to flip</p>
        </div>

        {/* Back of the card */}
        <div className="absolute w-full h-full backface-hidden bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-xl shadow-xl flex flex-col p-6 rotate-y-180">
          <div className="flex justify-between items-start">
            <p className="text-xs text-gray-500 dark:text-gray-400">Topic: {card.topic}</p>
            <button
              onClick={(e) => handleSpeak(card.backText, e)}
              title={isSpeaking && isFlipped ? "Stop speaking" : "Read back text aloud"}
              className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
              disabled={!isFlipped && isSpeaking} // Disable if not flipped and other side is speaking
            >
              <SpeakerIcon isLoading={isSpeaking && isFlipped} />
            </button>
          </div>
          <div className="flex-grow flex justify-center items-center">
            <p className="text-xl md:text-2xl text-center text-green-800 dark:text-green-100">
              {card.backText}
            </p>
          </div>
          {audioError && isFlipped && (
             <p className="text-xs text-red-500 dark:text-red-400 self-center -mb-2">{audioError}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 self-end mt-auto">Click to flip</p>
        </div>
      </div>
    </div>
  );
}

// Ensure global CSS for flip animation is present:
/*
.perspective { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.rotate-y-180 { transform: rotateY(180deg); }
.backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
*/

"use client";

import { useState, useEffect } from 'react';
import TriviaSettings from '@/components/TriviaSettings';
import QuestionDisplay from '@/components/QuestionDisplay';
import { fetchTriviaQuestions, TriviaQuestion } from '@/lib/gemini';
import useSpeechRecognition from '@/hooks/useSpeechRecognition'; // Import the hook

// Microphone Icon SVG
const MicrophoneIcon = ({ isListening, disabled }: { isListening: boolean; disabled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-8 h-8 ${
      disabled
        ? 'text-gray-400 dark:text-gray-600'
        : isListening
        ? 'text-red-500 animate-pulse'
        : 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
    } transition-colors`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
    />
  </svg>
);

export default function TriviaPage() {
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [gameState, setGameState] = useState<'settings' | 'loading' | 'playing' | 'result'>('settings');
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null); // For general game errors

  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening, // Though we might not use it explicitly for auto-stop
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const handleStartGame = async () => {
    if (!category.trim()) {
      setError("Please enter a category.");
      return;
    }
    console.log(`Starting game with Category: ${category}, Difficulty: ${difficulty}`);
    setGameState('loading');
    setError(null);
    setCurrentQuestion(null);
    setUserAnswer(null);
    setIsCorrect(null);

    try {
      const questions = await fetchTriviaQuestions({ category, difficulty, numberOfQuestions: 1 });
      if (questions && questions.length > 0) {
        setCurrentQuestion(questions[0]);
        setGameState('playing');
      } else {
        setError("No questions found for this category/difficulty. Try different settings.");
        setGameState('settings');
      }
    } catch (err) {
      console.error("Failed to fetch question:", err);
      let errorMessage = "Failed to fetch your question. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setGameState('settings');
    }
  };

  const handleAnswerSelected = (selectedOption: string) => {
    if (!currentQuestion || gameState !== 'playing') return; // Ensure answer is for current question in playing state

    setUserAnswer(selectedOption);
    const correct = selectedOption.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setGameState('result');
    console.log(`User selected/spoke: ${selectedOption}, Correct: ${correct}`);
  };
  
  // Effect to auto-submit transcript when listening stops and transcript is present
  useEffect(() => {
    if (!isListening && transcript && gameState === 'playing') {
      console.log("Transcript finalized:", transcript);
      // Check if the transcript is one of the options (case-insensitive, trimmed)
      const matchedOption = currentQuestion?.options.find(
        opt => opt.toLowerCase().trim() === transcript.toLowerCase().trim()
      );
      if (matchedOption) {
        handleAnswerSelected(matchedOption);
      } else {
        // If transcript doesn't match any option, you could:
        // 1. Show an error "Spoken answer not among options"
        // 2. Still submit it and let it be marked incorrect (current behavior if not matched)
        // 3. Allow user to confirm or edit (more complex UI)
        console.warn(`Transcript "${transcript}" does not match any of the options. Submitting as is.`);
        handleAnswerSelected(transcript); // Submit the raw transcript
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript, gameState, currentQuestion]);


  const handlePlayAgain = () => {
    setGameState('settings');
    setCurrentQuestion(null);
    setUserAnswer(null);
    setIsCorrect(null);
    setError(null); // Clear general errors
    // speechError will be managed by the hook, but transcript should clear on new listen
  };
  
  const handleNextQuestion = async () => {
    if (!category.trim()) {
      setError("Category is missing. Please set it again.");
      setGameState('settings');
      return;
    }
    setGameState('loading');
    setError(null);
    setCurrentQuestion(null);
    setUserAnswer(null);
    setIsCorrect(null);

    try {
      const questions = await fetchTriviaQuestions({ category, difficulty, numberOfQuestions: 1 });
      if (questions && questions.length > 0) {
        setCurrentQuestion(questions[0]);
        setGameState('playing');
      } else {
        setError("No more questions found. Try different settings.");
        setGameState('settings');
      }
    } catch (err) {
      console.error("Failed to fetch next question:", err);
      let errorMessage = "Failed to fetch your next question. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setGameState('settings');
    }
  };


  return (
    <div className="container mx-auto p-4 max-w-2xl min-h-screen flex flex-col">
      <header className="mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-blue-600 dark:text-blue-400">Trivia Challenge</h1>
      </header>
      
      <main className="flex-grow">
        {error && ( /* General game errors */
          <div className="mb-4 p-4 text-center text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {!browserSupportsSpeechRecognition && gameState === 'playing' && (
             <div className="my-4 p-3 text-center text-orange-700 bg-orange-100 border border-orange-400 rounded-md dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700">
                <p>Speech recognition is not supported in your browser.</p>
            </div>
        )}

        {speechError && gameState === 'playing' && ( /* Speech specific errors */
          <div className="my-4 p-3 text-center text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
            <p>Speech Error: {speechError}</p>
          </div>
        )}


        {gameState === 'settings' && (
          <TriviaSettings
            category={category}
            setCategory={setCategory}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onStartGame={handleStartGame}
          />
        )}

        {gameState === 'loading' && (
          <div className="text-center">
            <p className="text-xl text-gray-700 dark:text-gray-300">Loading your question...</p>
            <div className="mt-4 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <>
            <QuestionDisplay
              question={currentQuestion}
              onAnswerSelected={handleAnswerSelected}
            />
            <div className="mt-6 text-center">
              <button
                onClick={startListening}
                disabled={isListening || !browserSupportsSpeechRecognition}
                className="p-4 rounded-full bg-blue-100 dark:bg-blue-800 disabled:bg-gray-200 dark:disabled:bg-gray-700 shadow-md hover:bg-blue-200 dark:hover:bg-blue-700 disabled:cursor-not-allowed transition-colors"
                title={
                  browserSupportsSpeechRecognition
                    ? isListening
                      ? 'Listening...'
                      : 'Speak your answer'
                    : 'Speech recognition not supported'
                }
              >
                <MicrophoneIcon isListening={isListening} disabled={!browserSupportsSpeechRecognition} />
              </button>
              {isListening && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Listening... Say your answer.</p>
              )}
              {transcript && ( // Display interim or final transcript
                <p className="mt-2 text-md italic text-gray-700 dark:text-gray-200">
                  You said: "{transcript}"
                </p>
              )}
            </div>
          </>
        )}
        
        {gameState === 'result' && currentQuestion && (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Result</h2>
            <div className="mb-6 text-lg md:text-xl">
              <p className="font-semibold text-gray-700 dark:text-gray-200">Your question was:</p>
              <p className="italic text-gray-600 dark:text-gray-300 mb-2">{currentQuestion.questionText}</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">You answered:</p>
              <p className={`font-medium mb-2 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {userAnswer || "No answer provided"}
              </p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">Correct answer:</p>
              <p className="font-medium text-blue-600 dark:text-blue-400">{currentQuestion.correctAnswer}</p>
            </div>
            
            {isCorrect !== null && (
              <p className={`text-2xl font-bold mb-6 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? "Correct!" : "Incorrect!"}
              </p>
            )}

            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                >
                    Next Question
                </button>
                <button
                    onClick={handlePlayAgain}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600 dark:focus:ring-offset-gray-800"
                >
                    Play Again (New Settings)
                </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 pb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by Gemini & ElevenLabs</p>
      </footer>
    </div>
  );
}

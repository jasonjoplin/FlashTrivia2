"use client";

import { useState, useEffect } from 'react';
import FlashcardSettings from '@/components/FlashcardSettings';
import FlashcardDisplayItem from '@/components/FlashcardDisplayItem';
import { fetchFlashcardContent, FlashcardContent } from '@/lib/gemini';

export default function FlashcardsPage() {
  const [topic, setTopic] = useState<string>('');
  const [flashcards, setFlashcards] = useState<FlashcardContent[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'settings' | 'loading' | 'playing' | 'error'>('settings');
  const [error, setError] = useState<string | null>(null);

  const handleGetFlashcards = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic to generate flashcards.");
      // No change to gameState, error will be displayed within 'settings'
      return;
    }
    setGameState('loading');
    setError(null);
    setIsFlipped(false); // Reset flip state for new deck

    try {
      // Requesting 5 cards by default as per example
      const cards = await fetchFlashcardContent({ topic, numberOfCards: 5 });
      if (cards && cards.length > 0) {
        setFlashcards(cards);
        setCurrentCardIndex(0);
        setGameState('playing');
      } else {
        setError("No flashcards were generated for this topic. Please try a different topic or be more specific.");
        setGameState('settings'); // Go back to settings to allow new topic
      }
    } catch (err: any) {
      console.error("Failed to fetch flashcards:", err);
      setError(err.message || "An unexpected error occurred while fetching flashcards. Please try again.");
      setGameState('settings'); // Go back to settings
    }
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false); // Show front of next card
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false); // Show front of previous card
    }
  };

  const handleNewTopic = () => {
    setGameState('settings');
    setTopic(''); // Optionally clear the topic
    setFlashcards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setError(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl min-h-screen flex flex-col">
      <header className="mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-green-600 dark:text-green-400">Flashcard Hub</h1>
      </header>

      <main className="flex-grow">
        {gameState === 'settings' && (
          <>
            {error && (
              <div className="mb-4 p-3 text-center text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                <p>{error}</p>
              </div>
            )}
            <FlashcardSettings
              topic={topic}
              setTopic={setTopic}
              onGetFlashcards={handleGetFlashcards}
              isLoading={false} // gameState 'loading' will show a global loader
            />
          </>
        )}

        {gameState === 'loading' && (
          <div className="text-center">
            <p className="text-xl text-gray-700 dark:text-gray-300">Generating your flashcards...</p>
            <div className="mt-4 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          </div>
        )}
        
        {gameState === 'error' && error && ( // Dedicated error state view
          <div className="text-center p-6 bg-red-50 dark:bg-red-900 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-red-700 dark:text-red-200 mb-4">An Error Occurred</h2>
            <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
            <button
              onClick={handleNewTopic}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Try New Topic
            </button>
          </div>
        )}

        {gameState === 'playing' && flashcards.length > 0 && (
          <div className="flex flex-col items-center">
            <FlashcardDisplayItem
              card={flashcards[currentCardIndex]}
              isFlipped={isFlipped}
              onFlip={handleFlipCard}
            />
            <div className="mt-6 text-center text-gray-600 dark:text-gray-300">
              <p>Card {currentCardIndex + 1} of {flashcards.length}</p>
            </div>
            <div className="mt-6 flex justify-center items-center space-x-4 w-full">
              <button
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
                className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
              >
                Previous
              </button>
              <button
                onClick={handleFlipCard}
                className="px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              >
                Flip Card
              </button>
              <button
                onClick={handleNextCard}
                disabled={currentCardIndex === flashcards.length - 1}
                className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
              >
                Next
              </button>
            </div>
            <button
              onClick={handleNewTopic}
              className="mt-10 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              New Topic / Settings
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 pb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by Gemini</p>
      </footer>
    </div>
  );
}

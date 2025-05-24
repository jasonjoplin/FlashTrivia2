"use client";

interface FlashcardSettingsProps {
  topic: string;
  setTopic: (topic: string) => void;
  onGetFlashcards: () => Promise<void>;
  isLoading: boolean;
}

export default function FlashcardSettings({
  topic,
  setTopic,
  onGetFlashcards,
  isLoading,
}: FlashcardSettingsProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onGetFlashcards();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 mb-8">
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-gray-700 dark:text-gray-200">Create Your Flashcard Deck</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., JavaScript Fundamentals, World Capitals, Organic Chemistry"
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter the subject or concept you want to learn.</p>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? 'Generating...' : 'Get Flashcards'}
          </button>
        </div>
      </form>
    </div>
  );
}

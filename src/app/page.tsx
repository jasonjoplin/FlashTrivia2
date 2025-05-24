import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6 sm:p-8 text-center">
      <main className="flex flex-col items-center gap-8 max-w-2xl w-full">
        
        <header className="mb-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 pb-2">
            Welcome to FlashTrivia AI!
          </h1>
        </header>

        <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Challenge your knowledge with AI-generated trivia questions, or create personalized flashcards on any topic.
          This application leverages the power of Google's Gemini for content generation, ElevenLabs for realistic text-to-speech, and your browser's Speech-to-Text capabilities for voice input in trivia.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 w-full px-4 sm:px-0">
          <Link href="/trivia" passHref legacyBehavior>
            <a className="block px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 ease-in-out transform hover:scale-105">
              <div className="flex flex-col items-center">
                <span role="img" aria-label="brain icon" className="text-3xl mb-2">🧠</span>
                Play Trivia
                <span className="text-xs font-normal text-blue-100 mt-1">Test your smarts!</span>
              </div>
            </a>
          </Link>
          
          <Link href="/flashcards" passHref legacyBehavior>
            <a className="block px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-xl shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-300 ease-in-out transform hover:scale-105">
              <div className="flex flex-col items-center">
                <span role="img" aria-label="cards icon" className="text-3xl mb-2">🗂️</span>
                Study Flashcards
                <span className="text-xs font-normal text-green-100 mt-1">Learn anything.</span>
              </div>
            </a>
          </Link>
        </div>
        
        <section className="mt-10 text-sm text-gray-600 dark:text-gray-400 w-full">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Features:</h2>
            <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>AI-Powered Trivia Questions (Gemini)</li>
                <li>Custom Flashcard Generation (Gemini)</li>
                <li>Text-to-Speech for Questions & Flashcards (ElevenLabs)</li>
                <li>Speech-to-Text for Trivia Answers (Web Speech API)</li>
                <li>Interactive & Engaging UI</li>
            </ul>
        </section>

      </main>

      <footer className="mt-auto pt-10 pb-4 text-xs text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} FlashTrivia AI. All rights reserved.</p>
        <p className="mt-1">Powered by cutting-edge AI technologies.</p>
      </footer>
    </div>
  );
}

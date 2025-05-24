import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export interface TriviaQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: string;
}

export interface TriviaOptions {
  category: string;
  difficulty: string;
  numberOfQuestions?: number; // Default to 1
}

// --- New Flashcard Interfaces ---
export interface FlashcardContent {
  frontText: string; // Term, concept, or question
  backText: string;  // Definition, explanation, or answer
  topic: string;
  // difficulty?: string; // Optional, can be added if needed
}

export interface FlashcardOptions {
  topic: string;
  // difficulty?: string;
  numberOfCards?: number; // Default to 5
}
// --- End Flashcard Interfaces ---

const MODEL_NAME = "gemini-pro";
const API_KEY_ERROR_MESSAGE = "API key is missing. Please set GOOGLE_API_KEY in your environment variables.";
const GENERIC_API_ERROR_MESSAGE = "Failed to fetch data from Gemini API.";

async function callGeminiAPI(apiKey: string, prompt: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.7, // Adjusted for potentially more factual flashcard content
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  const responseText = response.text();

  if (!responseText) {
    console.error("Gemini API returned an empty response.");
    throw new Error("Empty API response.");
  }
  return responseText;
}

function cleanAndParseJson<T>(jsonText: string): T {
  let cleanedJsonText = jsonText.trim();
  if (cleanedJsonText.startsWith("```json")) {
    cleanedJsonText = cleanedJsonText.substring(7);
  }
  if (cleanedJsonText.endsWith("```")) {
    cleanedJsonText = cleanedJsonText.substring(0, cleanedJsonText.length - 3);
  }
  cleanedJsonText = cleanedJsonText.trim();

  try {
    return JSON.parse(cleanedJsonText);
  } catch (parseError) {
    console.error("Failed to parse JSON response from Gemini API:", parseError);
    console.error("Raw response text for parsing error:", jsonText);
    throw new Error("Could not parse API response as JSON.");
  }
}


export async function fetchTriviaQuestions(
  options: TriviaOptions
): Promise<TriviaQuestion[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_API_KEY is not set in environment variables.");
    throw new Error(API_KEY_ERROR_MESSAGE);
  }

  const { category, difficulty, numberOfQuestions = 1 } = options;

  if (numberOfQuestions !== 1) {
    console.warn("fetchTriviaQuestions: Currently, only fetching one question is fully implemented. Adjusting to 1.");
  }

  const prompt = `
    Generate a trivia question with the following specifications:
    Category: ${category}
    Difficulty: ${difficulty}
    Number of multiple choice options: 4

    Provide the output in a valid JSON format like this example:
    {
      "questionText": "What is the capital of France?",
      "options": ["Berlin", "Madrid", "Paris", "Rome"],
      "correctAnswer": "Paris",
      "category": "${category}",
      "difficulty": "${difficulty}"
    }

    Ensure the JSON is well-formed. Do not include any markdown formatting like \`\`\`json before or after the JSON object.
  `;

  try {
    const responseText = await callGeminiAPI(apiKey, prompt);
    const parsedQuestion = cleanAndParseJson<TriviaQuestion>(responseText);
    
    // Validate the parsed question (basic validation)
    if (
      !parsedQuestion.questionText ||
      !parsedQuestion.options ||
      parsedQuestion.options.length !== 4 ||
      !parsedQuestion.correctAnswer ||
      !parsedQuestion.category ||
      !parsedQuestion.difficulty
    ) {
      console.error("Parsed trivia question is missing required fields or has incorrect format:", parsedQuestion);
      console.error("Raw response text for validation error:", responseText);
      throw new Error("Invalid trivia question format from API.");
    }
    return [parsedQuestion];
  } catch (error) {
    console.error("Error fetching trivia questions from Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("Invalid GOOGLE_API_KEY. Please check your API key.");
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${GENERIC_API_ERROR_MESSAGE} (Trivia): ${message}`);
  }
}

// --- New fetchFlashcardContent function ---
export async function fetchFlashcardContent(
  options: FlashcardOptions
): Promise<FlashcardContent[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_API_KEY is not set in environment variables.");
    throw new Error(API_KEY_ERROR_MESSAGE);
  }

  const { topic, numberOfCards = 5 } = options; // Default to 5 cards

  const prompt = `
    Please generate ${numberOfCards} flashcards for the topic: "${topic}".
    Each flashcard should have a 'frontText' (a term, concept, or question) and a 'backText' (its definition, explanation, or answer).
    The 'topic' for each card should be "${topic}".

    Return the output as a valid JSON array of objects, like this example:
    [
      { "frontText": "Example Term 1", "backText": "Example Definition 1", "topic": "${topic}" },
      { "frontText": "Example Question 1", "backText": "Example Answer 1", "topic": "${topic}" }
    ]

    Ensure the JSON is well-formed and is an array of objects. Do not include any markdown formatting like \`\`\`json before or after the JSON array.
  `;

  try {
    const responseText = await callGeminiAPI(apiKey, prompt);
    const parsedFlashcards = cleanAndParseJson<FlashcardContent[]>(responseText);

    // Validate the parsed flashcards
    if (!Array.isArray(parsedFlashcards)) {
      console.error("Parsed flashcard data is not an array:", parsedFlashcards);
      console.error("Raw response text for validation error:", responseText);
      throw new Error("API did not return an array of flashcards.");
    }

    if (parsedFlashcards.length === 0 && numberOfCards > 0) {
        console.warn(`API returned an empty array for topic "${topic}" despite requesting ${numberOfCards} cards. This might be a valid empty result or an issue with the topic detail.`);
        // Return empty array if API legitimately returns no cards (e.g. topic too niche or unclear)
    }
    
    // Optional: Deeper validation of each flashcard object
    for (const card of parsedFlashcards) {
      if (!card.frontText || !card.backText || !card.topic) {
        console.error("A flashcard object is missing required fields (frontText, backText, topic):", card);
        console.error("Raw response text for validation error:", responseText);
        throw new Error("Invalid flashcard format from API: Missing fields in one or more cards.");
      }
      if (card.topic !== topic) {
        console.warn(`Flashcard topic ("${card.topic}") does not match requested topic ("${topic}"). Overwriting with requested topic.`);
        card.topic = topic; // Ensure consistency
      }
    }

    return parsedFlashcards;

  } catch (error) {
    console.error(`Error fetching flashcard content for topic "${topic}" from Gemini API:`, error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("Invalid GOOGLE_API_KEY. Please check your API key.");
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${GENERIC_API_ERROR_MESSAGE} (Flashcards): ${message}`);
  }
}
// --- End fetchFlashcardContent function ---

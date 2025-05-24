import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel's voice ID

export async function synthesizeSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY is not set in environment variables.");
    // Consider throwing an error that can be caught by the UI
    // throw new Error("ElevenLabs API key is missing."); 
    return null;
  }

  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    console.error("synthesizeSpeech should be called from the client-side.");
    return null; 
  }

  const client = new ElevenLabsClient({ apiKey });

  try {
    const audioStream = await client.textToSpeech.stream({
      text,
      voiceId,
      modelId: "eleven_multilingual_v2", // Or another suitable model
      // voiceSettings: { // Optional: adjust voice settings
      //   stability: 0.5,
      //   similarityBoost: 0.75,
      // },
    });

    // Convert the stream to a Blob
    const chunks: BlobPart[] = [];
    const reader = audioStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return audioUrl;

  } catch (error: any) {
    console.error("Error synthesizing speech with ElevenLabs:", error);
    if (error.message && error.message.includes("Authentication failed")) {
        throw new Error("ElevenLabs API authentication failed. Please check your API key.");
    }
    // Consider throwing a more specific error or returning a value that indicates failure
    return null;
  }
}

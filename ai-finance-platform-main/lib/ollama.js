/**
 * Local Machine Learning Interface using Ollama
 * Replaces Google Gemini for local processing.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

// Fetches the list of installed models from local Ollama
async function getInstalledModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000), // increased from 2000 for better stability
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.models.map(m => m.name);
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error("[Ollama] Connectivity check timed out. Ollama might be busy or starting up.");
    } else {
      console.error("[Ollama] Failed to connect to local Ollama server:", error.message);
    }
    return [];
  }
}

/**
 * Shared helper for robust generation with local ML models via Ollama.
 * Falls back to different installed models if one fails.
 */
export async function generateWithFallback(prompt, isVision = false) {
  console.log(`[Ollama AI] >>> Preparing to generate content (Vision: ${isVision})`);
  
  const installedModels = await getInstalledModels();
  
  if (installedModels.length === 0) {
    throw new Error(
      "Ollama is not running or no models are installed. Please download Ollama and run `ollama run llama3.2`."
    );
  }

  // Pre-filter models if vision is requested
  const visionSupportedModels = ["llava", "bakllava", "moondream"];
  let candidateModels = installedModels;

  if (isVision) {
    candidateModels = installedModels.filter(m => 
      visionSupportedModels.some(v => m.includes(v))
    );
    if (candidateModels.length === 0) {
      console.warn("[Ollama AI] No vision models installed. Falling back to text models. Make sure you install 'llava' if you need image/PDF parsing.");
      candidateModels = installedModels;
    }
  }

  // Prioritize faster/smarter models automatically
  const preferredModels = ["llama3.2", "llama3", "mistral", "gemma", "qwen", "phi3"];
  const sortedModels = candidateModels.sort((a, b) => {
    const aIndex = preferredModels.findIndex(p => a.includes(p));
    const bIndex = preferredModels.findIndex(p => b.includes(p));
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const errors = [];

  for (const modelName of sortedModels) {
    try {
      console.log(`[Ollama AI] >>> Attempting with local model: ${modelName}...`);
      
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Timeout set high (180s) because local inference can take significant time
        signal: AbortSignal.timeout(180000), 
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) {
        let errorMsg = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorMsg}`);
      }

      const result = await response.json();
      const text = result.response;
      
      if (!text) throw new Error("Empty response from local AI model");
      
      console.log(`[Ollama AI] <<< SUCCESS with ${modelName}`);
      return text;
      
    } catch (error) {
      console.error(`[Ollama AI] !!! FAILED with ${modelName}:`, error.message);
      errors.push(`${modelName}: ${error.message}`);
      
      // If it's a network error (Ollama down entirely), break immediately
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        break;
      }
      continue;
    }
  }

  const failureDetails = errors.join(" | ");
  console.error("[Ollama AI] ALL LOCAL MODELS FAILED:", failureDetails);
  throw new Error(
    `Local SAMPAT AI is temporarily unavailable. All models failed. Ensure Ollama is running and has sufficient memory. Details: ${failureDetails}`
  );
}

/**
 * Streaming version of Ollama for chat bots
 */
export async function streamWithFallback(messages, modelOverride = null) {
  const installedModels = await getInstalledModels();
  if (installedModels.length === 0) {
    throw new Error("Ollama is not running. Start Ollama locally to use chat.");
  }
  
  // Convert standard Vercel AI SDK messages to Ollama format
  let ollamaMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  const modelName = modelOverride || installedModels.find(m => m.includes("llama3")) || installedModels[0];
  console.log(`[Ollama AI] >>> Streaming Chat with ${modelName}`);

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelName,
      messages: ollamaMessages,
      stream: true,
    })
  });

  if (!response.ok) {
    throw new Error("Failed to start Ollama stream");
  }

  return response.body; 
}

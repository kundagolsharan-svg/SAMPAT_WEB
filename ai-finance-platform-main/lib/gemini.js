import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gets a generative model by name and version.
 */
export function getModel(modelName, apiVersion = "v1") {
  return genAI.getGenerativeModel({ model: modelName }, { apiVersion });
}

/**
 * Returns the ordered list of model names to try, best first.
 */
export function getModelList(isVision = false) {
  const textModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-pro",
  ];
  const visionModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro-vision",
  ];
  return isVision ? visionModels : textModels;
}

/**
 * Shared helper for robust generation with model fallback.
 * Throws a clear error if all models fail — never returns fake data.
 */
export async function generateWithFallback(prompt, isVision = false) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Please add your API key to the .env file."
    );
  }

  const models = getModelList(isVision);
  const errors = [];

  for (const modelName of models) {
    try {
      console.log(`[AI] >>> Attempting with ${modelName}...`);
      const model = getModel(modelName);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (!text) throw new Error("Empty response from AI model");
      console.log(`[AI] <<< SUCCESS with ${modelName}`);
      return text;
    } catch (error) {
      const errorMsg = error.message || "";
      console.error(`[AI] !!! FAILED with ${modelName}:`, errorMsg);
      errors.push(`${modelName}: ${errorMsg}`);

      // Retryable errors — quota, not found, server errors
      const isRetryable =
        errorMsg.includes("429") ||
        errorMsg.toLowerCase().includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("limit: 0") ||
        errorMsg.includes("404") ||
        errorMsg.includes("403") ||
        errorMsg.includes("503");

      if (isRetryable) {
        console.warn(`[AI] --- ${modelName} unavailable, trying fallback...`);
        continue;
      }

      // Non-retryable error — throw immediately
      throw error;
    }
  }

  // All models failed — throw a descriptive error instead of returning fake data
  const failureDetails = errors.join(" | ");
  console.error("[AI] ALL MODELS FAILED:", failureDetails);
  throw new Error(
    `SAMPAT AI is temporarily unavailable. All models failed: ${failureDetails}. ` +
      `Please check your GEMINI_API_KEY and try again in a few minutes.`
  );
}

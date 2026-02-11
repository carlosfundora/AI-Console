import { GoogleGenAI, Type } from "@google/genai";
import { BenchmarkResult, Model } from "../types";

// Helper to get client securely
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeBenchmarks = async (results: BenchmarkResult[], models: Model[]) => {
  const ai = getAiClient();
  if (!ai) return "API Key missing. Cannot analyze.";

  const context = `
    Analyze the following AI benchmark results:
    ${JSON.stringify(results.slice(0, 10))}
    
    Models available:
    ${JSON.stringify(models.slice(0, 5))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert AI Engineer. ${context}. Provide a concise, bulleted summary of the performance trends. Identify the best performing model for RAG tasks if data is available. Suggest one next step for optimization.`,
      config: {
        systemInstruction: "You are a technical AI optimization assistant. Be brief and high-level.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate analysis. Please try again.";
  }
};

export const generateSyntheticDataSample = async (topic: string, count: number = 3) => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} synthetic instruction-tuning dataset examples for the topic: "${topic}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              instruction: { type: Type.STRING },
              input: { type: Type.STRING },
              output: { type: Type.STRING }
            }
          }
        }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Data Gen Error:", error);
    throw error;
  }
};

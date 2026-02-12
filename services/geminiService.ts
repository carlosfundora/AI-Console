
import { GoogleGenAI, Type, Modality } from "@google/genai";
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

export const generateSyntheticDataSample = async (topic: string, count: number = 3, structureExample?: string, systemContext?: string) => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing");

  // If a specific structure is provided, we use a looser schema or text generation with JSON forcing
  // to support complex nested structures (like ShareGPT's conversation list) that might require more dynamic schema definitions
  // than simple flat objects.
  
  const prompt = `Generate ${count} synthetic training dataset examples for the topic: "${topic}".
  ${structureExample ? `\nThe output MUST follow this exact JSON structure per item:\n${structureExample}` : ''}
  ${systemContext ? `\nContext/Rules: ${systemContext}` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // We use JSON mode but let the model infer the schema from the example if provided, 
        // as strictly typing recursive schemas like ShareGPT via the SDK Type enum can be restrictive here.
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Data Gen Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore') => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};

import { GoogleGenAI } from "@google/genai";

export const generateAIContent = async (message: string, context: any, location?: { latitude: number, longitude: number }) => {
  // Retrieve API key inside the function to avoid stale values and ensure it's available
  let apiKey = process.env.GEMINI_API_KEY;

  const checkAndPromptKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // After opening the dialog, we assume success as per instructions
        // We don't wait for process.env to update, we just proceed
      }
    }
  };

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    await checkAndPromptKey();
    apiKey = process.env.GEMINI_API_KEY;
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || '' });
  
  // Use gemini-3.1-pro-preview for complex analysis tasks for better reliability
  const modelName = (message.toLowerCase().includes('where') || message.toLowerCase().includes('location') || message.toLowerCase().includes('near')) 
    ? 'gemini-2.5-flash' 
    : 'gemini-3.1-pro-preview';

  const config: any = {
    systemInstruction: `You are SentinelChain AI, a supply chain risk expert. 
    
    CRITICAL INSTRUCTIONS:
    1. LANGUAGE DETECTION: Detect the language of the user's message and ALWAYS reply in that same language.
    2. STRUCTURED OUTPUT: Use clear Markdown structure. Use headings, bullet points, and bold text to organize information.
    3. PROFESSIONALISM: Be data-driven, professional, and concise.
    4. CONTEXT: Use the provided context to give specific answers.`
  };

  // Add Maps Grounding if using gemini-2.5-flash
  if (modelName === 'gemini-2.5-flash') {
    config.tools = [{ googleMaps: {} }];
    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      };
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `You are SentinelChain AI. 
      Context: ${JSON.stringify(context)}
      User: ${message}`,
      config
    });

    // Extract grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const mapsLinks = groundingChunks?.filter((chunk: any) => chunk.maps).map((chunk: any) => ({
      title: chunk.maps.title,
      uri: chunk.maps.uri
    })) || [];

    return {
      text: response.text || "I'm sorry, I couldn't generate a response.",
      sources: mapsLinks
    };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // If it's a 500 error or Rpc failure, it might be a transient issue or key issue
    if (error.message?.includes('Rpc failed') || error.message?.includes('500') || error.message?.includes('Requested entity was not found')) {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        // Reset key selection state if it looks like an auth/model issue
        await (window as any).aistudio.openSelectKey();
      }
    }
    throw error;
  }
};

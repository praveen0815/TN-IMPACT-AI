import { GoogleGenAI } from "@google/genai";

export const getAI = async () => {
  let apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
      apiKey = process.env.GEMINI_API_KEY;
    } else {
      throw new Error("Gemini API Key is missing. Please configure it in the AI Studio Secrets panel.");
    }
  }
  return new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || '' });
};

export const analyzeRisk = async (supplierData: any, disruptions: any[]) => {
  try {
    const ai = await getAI();
    const prompt = `Analyze the supply chain risk for supplier ${supplierData.name} located in ${supplierData.location}. 
    Current disruptions: ${JSON.stringify(disruptions)}.
    Return a JSON object with:
    - riskScore (0-100)
    - riskDrivers (array of strings)
    - recommendations (array of strings)
    - impact (text description)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error('Risk Analysis Error:', error);
    if (error.message?.includes('Rpc failed') || error.message?.includes('500') || error.message?.includes('Requested entity was not found')) {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    throw error;
  }
};

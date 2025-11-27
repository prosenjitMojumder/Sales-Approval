import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

export const analyzeDeal = async (
  icirs: string,
  customer: string,
  territory: string,
  weight: string,
  destination: string,
  price: number
): Promise<AIAnalysis | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("No API Key found");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze the following sales request. 
      Act as a senior risk analyst for a logistics/sales company.
      
      ICIRS Reference: ${icirs}
      Customer: ${customer}
      Territory: ${territory}
      Weight: ${weight}
      Destination: ${destination}
      Requested Price: $${price}

      Provide a JSON response with the following fields:
      - riskScore: number (0 to 100, where 100 is extremely risky)
      - riskLevel: "Low", "Medium", or "High"
      - summary: A concise 1-sentence summary of the deal for an executive approver.
      - recommendation: A short advice (max 2 sentences) on whether to approve or what to check.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                riskScore: { type: Type.NUMBER },
                riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                summary: { type: Type.STRING },
                recommendation: { type: Type.STRING }
            },
            required: ["riskScore", "riskLevel", "summary", "recommendation"]
        }
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("Error analyzing deal with Gemini:", error);
    // Fallback mock response in case of API error/limit to keep app functional
    return {
        riskScore: 50,
        riskLevel: 'Medium',
        summary: 'AI Analysis unavailable (API Error). Proceed with standard review.',
        recommendation: 'Check customer credit history manually.'
    };
  }
};

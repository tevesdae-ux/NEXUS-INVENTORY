
import { GoogleGenAI } from "@google/genai";
import { dataService } from './dataService';

export const geminiService = {
  askAssistant: async (query: string): Promise<string> => {
    try {
      if (!process.env.API_KEY) {
        return "I'm sorry, but the API Key is missing. Please check your configuration.";
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextData = dataService.getRawDataForAI();

      const systemPrompt = `
        You are an intelligent Inventory Management Assistant for "Nexus Inventory".
        You have access to the following current data in JSON format:
        ${contextData}

        Your goal is to help the user understand their stock levels, suggest restocking, analyze trends, or answer specific questions about products.
        
        Rules:
        1. Be concise and professional.
        2. If asking about low stock, reference the 'minLevel' vs 'quantity'.
        3. Format lists with bullet points.
        4. If the user asks for actions (like "delete item"), explain that you can only provide insights, not execute commands directly.
        
        User Query: ${query}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: systemPrompt,
      });

      return response.text || "I couldn't generate a response at this time.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "An error occurred while communicating with the AI assistant.";
    }
  }
};

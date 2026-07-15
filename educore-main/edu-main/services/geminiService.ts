import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY) || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface GeminiContext {
  role: string;
  className?: string;
  curriculum?: string;
  language: 'en' | 'ta';
}

export const geminiService = {
  sendMessageToGemini: async (
    messages: { role: 'user' | 'model'; content: string }[],
    context: GeminiContext
  ): Promise<string> => {
    // 1. Prepare system instruction with context
    let systemPrompt = SYSTEM_INSTRUCTION
      .replace('{{USER_ROLE}}', context.role)
      .replace('{{CLASS}}', context.className || 'N/A')
      .replace('{{CURRICULUM}}', context.curriculum || 'N/A');

    // 2. Append language constraint
    if (context.language === 'ta') {
      systemPrompt += '\n\nIMPORTANT: Answer the user entirely in Tamil (தமிழ்). Keep the language natural, clear and culturally appropriate. Do not mix English words unless they are technical terms or explicitly requested.';
    } else {
      systemPrompt += '\n\nIMPORTANT: Answer the user entirely in English. Do not mix Tamil unless explicitly requested.';
    }

    // 3. Call Gemini if configured, otherwise run a smart mock based on active language
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: messages.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          config: {
            systemInstruction: systemPrompt
          }
        });
        return response.text || '';
      } catch (err: any) {
        console.error('[GeminiService] API error:', err);
        return context.language === 'ta' 
          ? 'மன்னிக்கவும், எனது சேவையில் தற்காலிக பிழை ஏற்பட்டுள்ளது. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.'
          : 'Sorry, I encountered an error. Please try again later.';
      }
    } else {
      console.warn('[GeminiService] Gemini API Key not configured. Returning mock response.');
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      
      // Smart Mock response
      if (context.language === 'ta') {
        return `[EDUCORE-OMEGA AI உதவி] நான் உங்களின் கோரிக்கையைப் பெற்றேன்: "${lastUserMsg}". (குறிப்பு: ஜெமினி ஏபிஐ சாவி கட்டமைக்கப்படவில்லை). உங்கள் பங்கு: ${context.role}.`;
      } else {
        return `[EDUCORE-OMEGA AI Assistant] I received your query: "${lastUserMsg}". (Note: Gemini API Key is not configured). Your role: ${context.role}.`;
      }
    }
  }
};

export default geminiService;

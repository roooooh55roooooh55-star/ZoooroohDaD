
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface VideoInsight {
  summary: string;
  horrorLevel: number;
  tags: string[];
}

export async function analyzeHorrorVideo(videoBase64: string, mimeType: string): Promise<VideoInsight> {
  const model = 'gemini-3-flash-preview';
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: videoBase64, mimeType } },
            { text: "حلل هذا الفيديو المرعب. استخرج ملخصاً قصيراً جداً، مستوى الرعب من 1 إلى 10، وبعض الكلمات المفتاحية باللغة العربية." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            horrorLevel: { type: Type.NUMBER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "horrorLevel", "tags"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as VideoInsight;
  } catch (error) {
    console.error("Analysis Error:", error);
    return { summary: "تعذر التحليل، لكن الروح موجودة..", horrorLevel: 5, tags: ["رعب"] };
  }
}

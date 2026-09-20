
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, Recipe } from "../types";

// Always use the recommended initialization with named parameter and process.env.API_KEY directly.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestRecipesFromInventory = async (inventory: InventoryItem[]): Promise<Partial<Recipe>[]> => {
  const ai = getAI();
  const inventoryStr = inventory.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ');
  
  // Use gemini-3-flash-preview for basic text generation tasks like recipe suggestions.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Basandoti su questi ingredienti che ho in dispensa: ${inventoryStr}. Suggerisci 3 ricette deliziose che posso preparare. Rispondi SOLO in formato JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING }
                }
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            prepTime: { type: Type.STRING },
            servings: { type: Type.NUMBER }
          }
        }
      }
    }
  });

  try {
    // response.text is a property, not a method.
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Error parsing Gemini response", e);
    return [];
  }
};

export const chatWithChef = async (history: {role: 'user'|'model', text: string}[], message: string, inventory: InventoryItem[]) => {
  const ai = getAI();
  const inventoryStr = inventory.map(i => `${i.name}`).join(', ');
  
  // Chat interface correctly uses the specified model and system instruction.
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `Sei uno chef stellato esperto in cucina creativa e antispreco. Il tuo obiettivo è aiutare l'utente a cucinare piatti deliziosi usando ciò che ha in casa. La sua dispensa attuale contiene: ${inventoryStr}. Sii incoraggiante, conciso e dai consigli pratici.`,
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

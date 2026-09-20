
import Anthropic from "@anthropic-ai/sdk";
import { InventoryItem, Recipe } from "../types";

const MODEL = "claude-sonnet-5";

const getClient = () =>
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true,
  });

const RECIPE_TOOL = {
  name: "propose_recipes",
  description: "Propone un elenco di ricette in un formato strutturato.",
  input_schema: {
    type: "object" as const,
    properties: {
      recipes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  amount: { type: "string" },
                },
                required: ["name", "amount"],
              },
            },
            instructions: {
              type: "array",
              items: { type: "string" },
            },
            prepTime: { type: "string" },
            servings: { type: "number" },
          },
          required: ["title", "description", "ingredients", "instructions", "prepTime", "servings"],
        },
      },
    },
    required: ["recipes"],
  },
};

export const suggestRecipesFromInventory = async (inventory: InventoryItem[]): Promise<Partial<Recipe>[]> => {
  const client = getClient();
  const inventoryStr = inventory.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Basandoti su questi ingredienti che ho in dispensa: ${inventoryStr}. Suggerisci 3 ricette deliziose che posso preparare.`,
      },
    ],
    tools: [RECIPE_TOOL],
    tool_choice: { type: "tool", name: "propose_recipes" },
  });

  const toolUse = response.content.find(block => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];

  try {
    const { recipes } = toolUse.input as { recipes: Partial<Recipe>[] };
    return recipes ?? [];
  } catch (e) {
    console.error("Error parsing Claude response", e);
    return [];
  }
};

export const chatWithChef = async (history: {role: 'user'|'model', text: string}[], message: string, inventory: InventoryItem[]) => {
  const client = getClient();
  const inventoryStr = inventory.map(i => i.name).join(', ');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `Sei uno chef stellato esperto in cucina creativa e antispreco. Il tuo obiettivo è aiutare l'utente a cucinare piatti deliziosi usando ciò che ha in casa. La sua dispensa attuale contiene: ${inventoryStr}. Sii incoraggiante, conciso e dai consigli pratici.`,
    messages: [
      ...history.map(h => ({
        role: h.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: h.text,
      })),
      { role: "user" as const, content: message },
    ],
  });

  const textBlock = response.content.find(block => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
};

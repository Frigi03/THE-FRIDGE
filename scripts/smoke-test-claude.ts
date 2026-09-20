import { Category, InventoryItem } from "../types";
import { suggestRecipesFromInventory, chatWithChef } from "../services/claudeService";

const sampleInventory: InventoryItem[] = [
  { id: "1", name: "Pomodori", quantity: 4, unit: "pz", category: Category.VEGETABLES },
  { id: "2", name: "Pasta", quantity: 500, unit: "g", category: Category.PANTRY },
  { id: "3", name: "Basilico", quantity: 1, unit: "mazzetto", category: Category.SPICES },
];

const fail = (msg: string): never => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    fail("ANTHROPIC_API_KEY non impostata nell'ambiente");
  }

  console.log("-> Test suggestRecipesFromInventory...");
  const recipes = await suggestRecipesFromInventory(sampleInventory);
  if (!Array.isArray(recipes) || recipes.length === 0) {
    fail("nessuna ricetta restituita");
  }
  for (const r of recipes) {
    if (!r.title || typeof r.title !== "string") fail("ricetta senza titolo valido");
  }
  console.log(`   OK: ${recipes.length} ricette generate, titoli: ${recipes.map(r => r.title).join(" | ")}`);

  console.log("-> Test chatWithChef...");
  const reply = await chatWithChef([], "Cosa mi consigli di preparare?", sampleInventory);
  if (!reply || typeof reply !== "string" || reply.trim().length === 0) {
    fail("risposta della chat vuota o non valida");
  }
  console.log(`   OK: risposta ricevuta (${reply.length} caratteri)`);

  console.log("SMOKE TEST PASSED");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});

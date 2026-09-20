import { InventoryItem } from "../types";

export const groupByCategory = (inventory: InventoryItem[]): Record<string, InventoryItem[]> =>
  inventory.reduce((acc, item) => {
    const categoryName = item.category as string;
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

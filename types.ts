
export enum Category {
  VEGETABLES = 'Verdura',
  FRUITS = 'Frutta',
  DAIRY = 'Latticini',
  MEAT = 'Carne/Pesce',
  PANTRY = 'Dispensa',
  SPICES = 'Spezie',
  FROZEN = 'Surgelati',
  OTHER = 'Altro'
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  expiryDate?: string;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: string;
  servings: number;
  author: string;
  image?: string;
  isPublic: boolean;
  createdAt: string;
}

export type View = 'inventory' | 'discover' | 'community' | 'chef' | 'my-recipes';

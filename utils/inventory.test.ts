import { describe, it, expect } from 'vitest';
import { groupByCategory } from './inventory';
import { Category, InventoryItem } from '../types';

const item = (overrides: Partial<InventoryItem>): InventoryItem => ({
  id: Math.random().toString(36),
  name: 'Prodotto',
  quantity: 1,
  unit: 'pz',
  category: Category.PANTRY,
  ...overrides,
});

describe('groupByCategory', () => {
  it('returns an empty object for an empty inventory', () => {
    expect(groupByCategory([])).toEqual({});
  });

  it('groups items under their category key', () => {
    const inventory = [
      item({ name: 'Pasta', category: Category.PANTRY }),
      item({ name: 'Latte', category: Category.DAIRY }),
      item({ name: 'Riso', category: Category.PANTRY }),
    ];

    const grouped = groupByCategory(inventory);

    expect(Object.keys(grouped).sort()).toEqual([Category.DAIRY, Category.PANTRY].sort());
    expect(grouped[Category.PANTRY]).toHaveLength(2);
    expect(grouped[Category.DAIRY]).toHaveLength(1);
    expect(grouped[Category.PANTRY].map(i => i.name)).toEqual(['Pasta', 'Riso']);
  });
});

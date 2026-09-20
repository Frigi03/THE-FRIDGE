import { describe, it, expect } from 'vitest';
import { daysUntilExpiry, getExpiryStatus, formatExpiryLabel, compareByExpiry } from './expiry';

const NOW = new Date('2026-06-15T12:00:00');

describe('daysUntilExpiry', () => {
  it('returns 0 for today', () => {
    expect(daysUntilExpiry('2026-06-15', NOW)).toBe(0);
  });

  it('returns positive for a future date', () => {
    expect(daysUntilExpiry('2026-06-18', NOW)).toBe(3);
  });

  it('returns negative for a past date', () => {
    expect(daysUntilExpiry('2026-06-10', NOW)).toBe(-5);
  });
});

describe('getExpiryStatus', () => {
  it('returns "none" when no date is set', () => {
    expect(getExpiryStatus(undefined, NOW)).toBe('none');
  });

  it('returns "expired" for a past date', () => {
    expect(getExpiryStatus('2026-06-01', NOW)).toBe('expired');
  });

  it('returns "soon" within the threshold', () => {
    expect(getExpiryStatus('2026-06-17', NOW)).toBe('soon');
  });

  it('returns "ok" beyond the threshold', () => {
    expect(getExpiryStatus('2026-07-01', NOW)).toBe('ok');
  });
});

describe('formatExpiryLabel', () => {
  it('labels today', () => {
    expect(formatExpiryLabel('2026-06-15', NOW)).toBe('Scade oggi');
  });

  it('labels tomorrow', () => {
    expect(formatExpiryLabel('2026-06-16', NOW)).toBe('Scade domani');
  });

  it('labels a future date in days', () => {
    expect(formatExpiryLabel('2026-06-20', NOW)).toBe('Scade tra 5 giorni');
  });

  it('labels an expired date', () => {
    expect(formatExpiryLabel('2026-06-10', NOW)).toBe('Scaduto da 5 giorni');
  });

  it('uses singular for one day expired', () => {
    expect(formatExpiryLabel('2026-06-14', NOW)).toBe('Scaduto da 1 giorno');
  });
});

describe('compareByExpiry', () => {
  it('sorts items without a date after items with one', () => {
    const items = [{ expiryDate: undefined }, { expiryDate: '2026-06-20' }];
    expect(items.sort(compareByExpiry)).toEqual([{ expiryDate: '2026-06-20' }, { expiryDate: undefined }]);
  });

  it('sorts earlier dates first', () => {
    const items = [{ expiryDate: '2026-06-20' }, { expiryDate: '2026-06-16' }];
    expect(items.sort(compareByExpiry)).toEqual([{ expiryDate: '2026-06-16' }, { expiryDate: '2026-06-20' }]);
  });
});

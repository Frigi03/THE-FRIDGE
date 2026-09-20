export type ExpiryStatus = 'expired' | 'soon' | 'ok' | 'none';

const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_THRESHOLD_DAYS = 3;

export const daysUntilExpiry = (expiryDate: string, now: Date = new Date()): number => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDate);
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return Math.round((expiryDay.getTime() - today.getTime()) / DAY_MS);
};

export const getExpiryStatus = (expiryDate: string | undefined, now: Date = new Date()): ExpiryStatus => {
  if (!expiryDate) return 'none';
  const days = daysUntilExpiry(expiryDate, now);
  if (days < 0) return 'expired';
  if (days <= SOON_THRESHOLD_DAYS) return 'soon';
  return 'ok';
};

export const formatExpiryLabel = (expiryDate: string, now: Date = new Date()): string => {
  const days = daysUntilExpiry(expiryDate, now);
  if (days < 0) return `Scaduto da ${Math.abs(days)} giorn${Math.abs(days) === 1 ? 'o' : 'i'}`;
  if (days === 0) return 'Scade oggi';
  if (days === 1) return 'Scade domani';
  return `Scade tra ${days} giorni`;
};

export const compareByExpiry = (a: { expiryDate?: string }, b: { expiryDate?: string }): number => {
  if (!a.expiryDate && !b.expiryDate) return 0;
  if (!a.expiryDate) return 1;
  if (!b.expiryDate) return -1;
  return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
};

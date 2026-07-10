const STORE_PREFIX = 'pokercoach_';

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  localStorage.removeItem(STORE_PREFIX + key);
}

export function addToArray<T>(key: string, item: T): T[] {
  const arr = getItem<T[]>(key) || [];
  arr.push(item);
  setItem(key, arr);
  return arr;
}

export function updateInArray<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T[] {
  const arr = getItem<T[]>(key) || [];
  const idx = arr.findIndex(i => i.id === id);
  if (idx !== -1) {
    arr[idx] = { ...arr[idx], ...updates };
    setItem(key, arr);
  }
  return arr;
}

export function removeFromArray<T extends { id: string }>(key: string, id: string): T[] {
  const arr = getItem<T[]>(key) || [];
  const filtered = arr.filter(i => i.id !== id);
  setItem(key, filtered);
  return filtered;
}

export function getArray<T>(key: string): T[] {
  return getItem<T[]>(key) || [];
}

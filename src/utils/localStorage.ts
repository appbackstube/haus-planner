export function readStoredValue<T>(getStorage: () => Pick<Storage, 'getItem'>, key: string, initialValue: T): T {
  try {
    const item = getStorage().getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function writeStoredValue<T>(getStorage: () => Pick<Storage, 'setItem'>, key: string, value: T): boolean {
  try {
    getStorage().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

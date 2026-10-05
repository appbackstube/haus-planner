import { useEffect, useState } from 'react';
import { readStoredValue, writeStoredValue } from '../utils/localStorage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readStoredValue(() => window.localStorage, key, initialValue));

  useEffect(() => {
    writeStoredValue(() => window.localStorage, key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

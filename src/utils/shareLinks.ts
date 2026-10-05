import type { House } from '../types';
import { parseHouseBackup } from './houseBackup.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function shareIdFromHash(hash: string): string | null {
  const id = new URLSearchParams(hash.replace(/^#/, '')).get('share');
  return id && uuidPattern.test(id) ? id : null;
}

export function shareLink(location: string, id: string): string {
  const url = new URL(location);
  url.hash = `share=${id}`;
  return url.href;
}

export function sharedHouseFromPayload(payload: unknown): House {
  const houses = parseHouseBackup(JSON.stringify([payload]));
  return houses[0];
}

export function copySharedHouse(house: House, id: string): House {
  return { ...house, id };
}

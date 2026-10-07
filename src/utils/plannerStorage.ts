import { parseHouseBackup, parsePlannerBackup } from './houseBackup.ts';
import type { House, PlannerData } from '../types';

export interface PlannerIdentity { id: string; key: string }
export interface EncryptedDocument { iv: string; data: string }

const storageKey = 'hausbau-planner-identity';
const legacyKey = 'hausbau-planner-houses';
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const keyPattern = /^[A-Za-z0-9_-]{43}$/;

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(value: string): Uint8Array {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function validIdentity(value: unknown): value is PlannerIdentity {
  if (!value || typeof value !== 'object') return false;
  const identity = value as PlannerIdentity;
  return typeof identity.id === 'string' && idPattern.test(identity.id)
    && typeof identity.key === 'string' && keyPattern.test(identity.key);
}

export function createIdentity(): PlannerIdentity {
  return { id: crypto.randomUUID(), key: encode(crypto.getRandomValues(new Uint8Array(32))) };
}

export function identityFromPath(pathname: string, base: string): PlannerIdentity | null {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  if (!pathname.startsWith(prefix)) return null;
  const parts = pathname.slice(prefix.length).split('/');
  const identity = { id: parts[0], key: parts[1] };
  return parts.length === 2 && validIdentity(identity) ? identity : null;
}

export function plannerLink(location: string, base: string, identity: PlannerIdentity): string {
  const url = new URL(location);
  url.pathname = `${base.replace(/\/$/, '')}/${identity.id}/${identity.key}`;
  url.search = '';
  url.hash = '';
  return url.href;
}

export function resolveIdentity(storage: Pick<Storage, 'getItem' | 'setItem'>, location: string, base: string): PlannerIdentity {
  const pathIdentity = identityFromPath(new URL(location).pathname, base);
  let stored: unknown;
  try { stored = JSON.parse(storage.getItem(storageKey) ?? 'null'); } catch { stored = null; }
  const own = validIdentity(stored) && (stored as PlannerIdentity & { createdHere?: boolean }).createdHere === true;
  const identity = pathIdentity ?? (own ? { id: (stored as PlannerIdentity).id, key: (stored as PlannerIdentity).key } : createIdentity());
  if (!validIdentity(stored) || (!pathIdentity && !own)) {
    try { storage.setItem(storageKey, JSON.stringify({ ...identity, createdHere: !pathIdentity })); } catch { return identity; }
  }
  return identity;
}

export function canInitializeDocument(storage: Pick<Storage, 'getItem'>, identity: PlannerIdentity): boolean {
  try {
    const stored: unknown = JSON.parse(storage.getItem(storageKey) ?? 'null');
    return validIdentity(stored) && stored.id === identity.id && stored.key === identity.key
      && (stored as PlannerIdentity & { createdHere?: boolean }).createdHere === true;
  } catch {
    return false;
  }
}

export function readLegacyHouses(storage: Pick<Storage, 'getItem'>): House[] | null {
  let stored: string | null;
  try { stored = storage.getItem(legacyKey); } catch { return null; }
  return stored === null ? null : parseHouseBackup(stored);
}

export function clearLegacyHouses(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(legacyKey);
}

async function encryptDocument(value: House[] | PlannerData, identity: PlannerIdentity): Promise<EncryptedDocument> {
  const key = await crypto.subtle.importKey('raw', decode(identity.key) as BufferSource, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value)));
  return { iv: encode(iv), data: encode(new Uint8Array(data)) };
}

async function decryptDocument(payload: EncryptedDocument, identity: PlannerIdentity): Promise<string> {
  if (!payload || typeof payload.iv !== 'string' || typeof payload.data !== 'string' || decode(payload.iv).length !== 12) {
    throw new Error('Ungültige verschlüsselte Daten.');
  }
  const key = await crypto.subtle.importKey('raw', decode(identity.key) as BufferSource, 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(payload.iv) }, key, decode(payload.data) as BufferSource);
  return new TextDecoder('utf-8', { fatal: true }).decode(plain);
}

export async function encryptHouses(houses: House[], identity: PlannerIdentity): Promise<EncryptedDocument> {
  return encryptDocument(houses, identity);
}

export async function decryptHouses(payload: EncryptedDocument, identity: PlannerIdentity): Promise<House[]> {
  return parseHouseBackup(await decryptDocument(payload, identity));
}

export async function encryptPlannerData(data: PlannerData, identity: PlannerIdentity): Promise<EncryptedDocument> {
  return encryptDocument(data, identity);
}

export async function decryptPlannerData(payload: EncryptedDocument, identity: PlannerIdentity): Promise<PlannerData> {
  return parsePlannerBackup(await decryptDocument(payload, identity));
}

export async function writeToken(identity: PlannerIdentity): Promise<string> {
  const context = new TextEncoder().encode('hausbau-planner-write-v1:');
  const input = new Uint8Array(context.length + 32);
  input.set(context);
  input.set(decode(identity.key), context.length);
  return encode(new Uint8Array(await crypto.subtle.digest('SHA-256', input)));
}

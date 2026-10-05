import type { House } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasFields(value: unknown, fields: string[], check: (field: unknown) => boolean, exact = false): boolean {
  return isRecord(value) && fields.every((field) => check(value[field]))
    && (!exact || Object.keys(value).every((field) => fields.includes(field)));
}

function isMap(value: unknown, check: (entry: unknown) => boolean): boolean {
  return isRecord(value) && Object.values(value).every(check);
}

function optionalMap(value: unknown, check: (entry: unknown) => boolean): boolean {
  return value === undefined || isMap(value, check);
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isString = (value: unknown): value is string => typeof value === 'string';

function isHouse(value: unknown): value is House {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string' && value.id.length > 0
    && typeof value.name === 'string' && value.name.trim().length > 0
    && hasFields(value.finanzierung, ['grundstueckpreis', 'baukosten', 'eigenkapital', 'zins', 'laufzeit', 'sondertilgung'], isNumber, true)
    && hasFields(value.betriebskosten, ['heizung', 'strom', 'wasser', 'abwasser', 'muell', 'versicherung', 'grundsteuer', 'internet', 'instandhaltung'], isNumber, true)
    && (value.bauposten === undefined || hasFields(value.bauposten, ['hauspreis', 'fundamentplatte', 'erdarbeiten', 'entsorgung', 'hausanschluesse', 'planung', 'aussenanlagen', 'reserve'], isNumber, true))
    && optionalMap(value.inkludierteLeistungen, isBoolean)
    && optionalMap(value.ausgeschlosseneLeistungen, isBoolean)
    && optionalMap(value.leistungsstatus, (entry) => ['ungeklaert', 'im_hauspreis', 'separat', 'nicht_benoetigt'].includes(String(entry)))
    && optionalMap(value.ausfuehrung, (entry) => ['offen', 'hausanbieter', 'eigenleistung', 'externer_betrieb'].includes(String(entry)))
    && optionalMap(value.externeFirmen, isString)
    && optionalMap(value.leistungspreise, isNumber)
    && (value.eigeneLeistungen === undefined || (Array.isArray(value.eigeneLeistungen)
      && value.eigeneLeistungen.every((entry: unknown) => hasFields(entry, ['id', 'name'], isString))));
}

export function parseHouseBackup(text: string): House[] {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed) || !parsed.every(isHouse) || new Set(parsed.map((house) => house.id)).size !== parsed.length) {
    throw new Error('Die Datei enthält keine gültige Liste von Häusern.');
  }
  return parsed;
}

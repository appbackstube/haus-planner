import type { House } from '../types';
import { webUrl } from './links.ts';

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

function isHouseLink(value: unknown): boolean {
  return isRecord(value) && hasFields(value, ['id', 'titel', 'url'], isString)
    && typeof value.url === 'string' && webUrl(value.url) !== null;
}

function isMaterialAuswahl(value: unknown): boolean {
  return isRecord(value)
    && Object.entries(value).every(([field, entry]) => field === 'angaben'
      ? isMap(entry, isString)
      : ['ausfuehrung', 'energie', 'schall', 'notizen'].includes(field) && isString(entry))
    && (value.angaben !== undefined || hasFields(value, ['ausfuehrung', 'energie', 'schall', 'notizen'], isString, true));
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isString = (value: unknown): value is string => typeof value === 'string';

const betriebskostenFelder = ['heizung', 'strom', 'wasser', 'abwasser', 'muell', 'versicherung', 'grundsteuer', 'internet', 'instandhaltung'];
const finanzierungsFelder = ['grundstueckpreis', 'baukosten', 'eigenkapital', 'zins', 'laufzeit', 'sondertilgung'];
const weitereFinanzierungsFelder = ['bankgebuehren', 'grundbucheintragungen'];

function isFinanzierung(value: unknown): boolean {
  return isRecord(value) && hasFields(value, finanzierungsFelder, isNumber)
    && Object.entries(value).every(([feld, betrag]) => finanzierungsFelder.includes(feld)
      || (weitereFinanzierungsFelder.includes(feld) && isNumber(betrag) && betrag >= 0));
}

function isKosten(value: unknown, felder: string[]): boolean {
  if (!isRecord(value) || !hasFields(value, felder, isNumber)) return false;
  if (Object.keys(value).some((feld) => !felder.includes(feld) && feld !== 'eigenePosten')) return false;
  if (value.eigenePosten === undefined) return true;
  if (!Array.isArray(value.eigenePosten)) return false;
  return value.eigenePosten.every((posten: unknown) => isRecord(posten)
    && typeof posten.id === 'string' && posten.id.length > 0
    && typeof posten.name === 'string' && posten.name.trim().length > 0
    && isNumber(posten.betrag) && posten.betrag >= 0
    && Object.keys(posten).every((feld) => ['id', 'name', 'betrag'].includes(feld)))
    && new Set(value.eigenePosten.map((posten: { id: string }) => posten.id)).size === value.eigenePosten.length;
}

function isHouse(value: unknown): value is House {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string' && value.id.length > 0
    && typeof value.name === 'string' && value.name.trim().length > 0
    && isFinanzierung(value.finanzierung)
    && isKosten(value.betriebskosten, betriebskostenFelder)
    && (value.aktuelleKosten === undefined || isKosten(value.aktuelleKosten, [...betriebskostenFelder, 'wohnen', 'sonstiges']))
    && (value.bauposten === undefined || hasFields(value.bauposten, ['hauspreis', 'fundamentplatte', 'erdarbeiten', 'entsorgung', 'hausanschluesse', 'planung', 'aussenanlagen', 'reserve'], isNumber, true))
    && optionalMap(value.inkludierteLeistungen, isBoolean)
    && optionalMap(value.ausgeschlosseneLeistungen, isBoolean)
    && optionalMap(value.leistungsstatus, (entry) => ['ungeklaert', 'im_hauspreis', 'separat', 'nicht_benoetigt'].includes(String(entry)))
    && optionalMap(value.nichtBenoetigtGruende, isString)
    && optionalMap(value.ausfuehrung, (entry) => ['offen', 'hausanbieter', 'eigenleistung', 'externer_betrieb'].includes(String(entry)))
    && optionalMap(value.externeFirmen, isString)
    && optionalMap(value.leistungspreise, isNumber)
    && (value.notizen === undefined || isString(value.notizen))
    && (value.links === undefined || (Array.isArray(value.links) && value.links.every(isHouseLink)))
    && optionalMap(value.materialien, isMaterialAuswahl)
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

import type { Ausfuehrender, House, Leistungsstatus } from '../types';
import { leistungsstatus, leistungspreis } from './bauposten.ts';

export interface LeistungsFilter {
  titel: string;
  status: Leistungsstatus | 'alle' | 'ohne_preis';
  ausfuehrung: Ausfuehrender | 'nicht_benoetigt' | 'alle';
}

export function passtLeistungsFilter(house: House, leistung: { id: string; name: string }, filter: LeistungsFilter): boolean {
  if (!leistung.name.toLocaleLowerCase('de-AT').includes(filter.titel.trim().toLocaleLowerCase('de-AT'))) return false;

  const status = leistungsstatus(house, leistung.id);
  if (filter.status === 'ohne_preis') {
    if (status !== 'separat' || leistungspreis(house, leistung.id) !== 0) return false;
  } else if (filter.status !== 'alle' && status !== filter.status) {
    return false;
  }

  const ausfuehrung = status === 'nicht_benoetigt' ? 'nicht_benoetigt' : house.ausfuehrung?.[leistung.id] ?? 'offen';
  return filter.ausfuehrung === 'alle' || ausfuehrung === filter.ausfuehrung;
}

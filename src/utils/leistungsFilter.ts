import type { House } from '../types';
import { leistungsstatus, leistungspreis } from './bauposten.ts';

export type LeistungsFilter = 'alle' | 'ungeklaert' | 'ohne_preis';

export function passtLeistungsFilter(house: House, id: string, filter: LeistungsFilter): boolean {
  if (filter === 'alle') return true;
  const status = leistungsstatus(house, id);
  if (filter === 'ungeklaert') return status === 'ungeklaert';
  return status === 'separat' && leistungspreis(house, id) === 0;
}

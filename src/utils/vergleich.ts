import type { House } from '../types';
import { berechneBaukosten } from './bauposten.ts';
import { berechneFinanzierung, summeBetriebskosten } from './finanzierung.ts';

export function hausKennzahlen(house: House) {
  const baukosten = berechneBaukosten(house).baukosten;
  const { kreditbetrag, monatsrate } = berechneFinanzierung(house.finanzierung, baukosten);
  const betriebskosten = summeBetriebskosten(house.betriebskosten);

  return {
    baukosten,
    grundstueckpreis: house.finanzierung.grundstueckpreis,
    kreditbetrag,
    monatsrate,
    betriebskosten,
    gesamtMonat: monatsrate + betriebskosten,
    gesamtJahr: (monatsrate + betriebskosten) * 12,
  };
}

export function materialKurzinfo(house: House, id: string, fields: string[]): string {
  const material = house.materialien?.[id];
  if (!material) return 'Noch offen';

  const details = fields.map((field) => material.angaben?.[field]?.trim()).filter(Boolean);
  return details.length ? details.join(' · ') : material.ausfuehrung?.trim() || 'Noch offen';
}

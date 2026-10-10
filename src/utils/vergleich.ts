import type { AktuelleKosten, House } from '../types';
import { berechneBaukosten } from './bauposten.ts';
import { berechneFinanzierung, summeBetriebskosten } from './finanzierung.ts';

export function summeAktuelleKosten(data: AktuelleKosten): number {
  return summeBetriebskosten(data);
}

export function hausKennzahlen(house: House) {
  const { baukosten, kreditAusgeschlossen } = berechneBaukosten(house);
  const { kreditbetrag, monatsrate, grundstueckNebenkosten } = berechneFinanzierung(house.finanzierung, baukosten, kreditAusgeschlossen);
  const betriebskosten = summeBetriebskosten(house.betriebskosten);
  const aktuelleKosten = house.aktuelleKosten ? summeAktuelleKosten(house.aktuelleKosten) : null;
  const gesamtMonat = monatsrate + betriebskosten;

  return {
    baukosten,
    grundstueckpreis: house.finanzierung.grundstueckpreis,
    grundstueckNebenkosten,
    bankgebuehren: house.finanzierung.bankgebuehren ?? 0,
    grundbucheintragungen: house.finanzierung.grundbucheintragungen ?? 0,
    kreditbetrag,
    monatsrate,
    betriebskosten,
    aktuelleKosten,
    differenzMonat: aktuelleKosten === null || baukosten + house.finanzierung.grundstueckpreis <= 0 ? null : gesamtMonat - aktuelleKosten,
    gesamtMonat,
    gesamtJahr: gesamtMonat * 12,
  };
}

export function materialKurzinfo(house: House, id: string, fields: string[]): string {
  const material = house.materialien?.[id];
  if (!material) return 'Noch offen';

  const details = fields.map((field) => material.angaben?.[field]?.trim()).filter(Boolean);
  return details.length ? details.join(' · ') : material.ausfuehrung?.trim() || 'Noch offen';
}

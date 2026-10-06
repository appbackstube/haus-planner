import type { Finanzierung, Betriebskosten } from '../types';

export interface FinanzierungBerechnung {
  gesamtkosten: number;
  kreditbetrag: number;
  monatsrate: number;
}

export function berechneFinanzierung(data: Finanzierung, baukosten = data.baukosten): FinanzierungBerechnung {
  const gesamtkosten = data.grundstueckpreis + baukosten + (data.bankgebuehren ?? 0) + (data.grundbucheintragungen ?? 0);
  const kreditbetrag = Math.max(0, gesamtkosten - data.eigenkapital);
  const monatszins = data.zins / 100 / 12;
  const monate = data.laufzeit * 12;
  const monatsrate =
    monatszins > 0
      ? (kreditbetrag * monatszins) / (1 - Math.pow(1 + monatszins, -monate))
      : kreditbetrag / monate;
  return { gesamtkosten, kreditbetrag, monatsrate };
}

export function summeBetriebskosten(data: Betriebskosten): number {
  const { eigenePosten = [], ...fixkosten } = data;
  return Object.values(fixkosten).reduce((summe, wert) => summe + wert, 0)
    + eigenePosten.reduce((summe, posten) => summe + posten.betrag, 0);
}

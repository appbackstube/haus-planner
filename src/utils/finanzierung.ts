import type { Finanzierung, Betriebskosten } from '../types';

export interface FinanzierungBerechnung {
  gesamtkosten: number;
  grundstueckNebenkosten: number;
  bankgebuehren: number;
  kreditbasis: number;
  ausKreditAusgeschlossen: number;
  kreditbetrag: number;
  monatsrate: number;
}

export function berechneFinanzierung(data: Finanzierung, baukosten = data.baukosten, kreditAusgeschlossen = 0): FinanzierungBerechnung {
  const ausKreditAusgeschlossen = Math.min(Math.max(0, kreditAusgeschlossen), Math.max(0, baukosten));
  const basisNebenkosten = Math.round(data.grundstueckpreis * (data.grunderwerbsteuerProzent ?? 0)) / 100
    + Math.round(data.grundstueckpreis * (data.grundbuchEintragungsgebuehrProzent ?? 0)) / 100
    + (data.eingabengebuehr ?? 0)
    + (data.vertragserrichtungProzent === undefined ? (data.vertragserrichtung ?? 0) : Math.round(data.grundstueckpreis * data.vertragserrichtungProzent) / 100)
    + (data.grundstueckSonstiges ?? 0)
    + (data.grundbucheintragungen ?? 0);
  const kreditbasis = Math.max(0, data.grundstueckpreis + baukosten + basisNebenkosten - data.eigenkapital - ausKreditAusgeschlossen);
  const pfandrechtseintragung = data.pfandrechtseintragungProzent === undefined
    ? (data.pfandrechtseintragung ?? 0) : Math.round(kreditbasis * data.pfandrechtseintragungProzent) / 100;
  const bankgebuehren = data.bankgebuehrenProzent === undefined
    ? (data.bankgebuehren ?? 0) : Math.round(kreditbasis * data.bankgebuehrenProzent) / 100;
  const grundstueckNebenkosten = basisNebenkosten + pfandrechtseintragung;
  const gesamtkosten = data.grundstueckpreis + baukosten + bankgebuehren + grundstueckNebenkosten;
  const kreditbetrag = Math.max(0, gesamtkosten - data.eigenkapital - ausKreditAusgeschlossen);
  const monatszins = data.zins / 100 / 12;
  const monate = data.laufzeit * 12;
  const monatsrate =
    monatszins > 0
      ? (kreditbetrag * monatszins) / (1 - Math.pow(1 + monatszins, -monate))
      : kreditbetrag / monate;
  return { gesamtkosten, grundstueckNebenkosten, bankgebuehren, kreditbasis, ausKreditAusgeschlossen, kreditbetrag, monatsrate };
}

export function summeBetriebskosten(data: Betriebskosten): number {
  const { eigenePosten = [], ...fixkosten } = data;
  return Object.values(fixkosten).reduce((summe, wert) => summe + wert, 0)
    + eigenePosten.reduce((summe, posten) => summe + posten.betrag, 0);
}

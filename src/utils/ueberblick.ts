import type { Betriebskosten, House } from '../types';
import { baupostenFuerHaus } from './bauposten.ts';
import { hausKennzahlen } from './vergleich.ts';

export const beispielBetriebskosten: Betriebskosten = {
  heizung: 100,
  strom: 80,
  wasser: 25,
  abwasser: 20,
  muell: 20,
  versicherung: 50,
  grundsteuer: 30,
  internet: 40,
  instandhaltung: 100,
};

export function ueberblickWerte(house: House) {
  const werte = hausKennzahlen(house);
  const hatKostenbasis = werte.baukosten > 0 || werte.grundstueckpreis > 0;
  const betriebskostenUnveraendert = (house.betriebskosten.eigenePosten?.length ?? 0) === 0 && Object.entries(beispielBetriebskosten).every(
    ([name, betrag]) => house.betriebskosten[name as keyof Betriebskosten] === betrag,
  );

  return {
    baukosten: werte.baukosten > 0 ? werte.baukosten : null,
    monatsrate: hatKostenbasis ? werte.monatsrate : null,
    betriebskosten: werte.betriebskosten,
    gesamtMonat: hatKostenbasis ? werte.gesamtMonat : null,
    betriebskostenUnveraendert,
    naechsterSchritt: baupostenFuerHaus(house).hauspreis <= 0
      ? { tab: 'baukosten', titel: 'Hauspreis eintragen', beschreibung: 'Ein grober Wert reicht für den Anfang.' }
      : betriebskostenUnveraendert
        ? { tab: 'betriebskosten', titel: 'Betriebskosten prüfen', beschreibung: 'Hier stehen noch die Beispielwerte. Passe sie an dein Haus an.' }
        : null,
  };
}

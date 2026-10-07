import type { FrageAntwort, FrageKategorie, House } from '../types.ts';

export const ersetzteFrageIds: Record<string, string> = {
  'gemeinde-bebauung': 'gemeinde-hausvorgaben',
  'gemeinde-kosten': 'gemeinde-aufschliessungsabgabe',
};

export function antwortFuerFrage(antworten: House['fragenAntworten'], id: string): FrageAntwort | undefined {
  const aktuell = antworten?.[id];
  const ersetzteId = ersetzteFrageIds[id];
  const vorher = ersetzteId ? antworten?.[ersetzteId] : undefined;
  if (!vorher) return aktuell;
  if (!aktuell) return vorher;
  return {
    erledigt: aktuell.erledigt || vorher.erledigt,
    notiz: [...new Set([aktuell.notiz, vorher.notiz].filter(Boolean))].join('\n\n'),
  };
}

interface FrageVorlage {
  id: string;
  text: string;
}

export interface FrageSektion {
  id: FrageKategorie;
  titel: string;
  fragen: FrageVorlage[];
}

export const fragenSektionen: FrageSektion[] = [
  {
    id: 'gemeinde', titel: 'Gemeinde', fragen: [
      { id: 'gemeinde-bebauung', text: 'Welche Vorgaben gelten für Größe, Höhe und Lage des Hauses?' },
      { id: 'gemeinde-genehmigung', text: 'Welche Unterlagen werden für die Baubewilligung benötigt?' },
      { id: 'gemeinde-kosten', text: 'Welche Aufschließungsabgabe oder sonstigen Beiträge für Straße und Infrastruktur sind noch offen?' },
      { id: 'gemeinde-zeitplan', text: 'Wie lange dauert die Bearbeitung voraussichtlich?' },
      { id: 'gemeinde-bauland', text: 'Ist das Grundstück als Bauland gewidmet?' },
      { id: 'gemeinde-aufgeschlossen', text: 'Ist das Grundstück vollständig aufgeschlossen?' },
      { id: 'gemeinde-aufgeschlossen-fehlt', text: 'Was fehlt noch?' },
      { id: 'gemeinde-bereits-bezahlt', text: 'Was wurde bereits bezahlt?' },
      { id: 'gemeinde-bauverfahren-gebuehren', text: 'Welche Gebühren fallen für Bauantrag und Baubewilligung an?' },
      { id: 'gemeinde-bauverfahren-weitere-kosten', text: 'Gibt es weitere Kosten im Bauverfahren?' },
      { id: 'gemeinde-wasseranschluss-kosten', text: 'Was kosten der Wasseranschluss und seine Herstellung bis zum Haus?' },
      { id: 'gemeinde-bauwasser', text: 'Brauche ich während der Bauzeit einen eigenen Bauwasseranschluss?' },
      { id: 'gemeinde-kanalanschluss-kosten', text: 'Was kosten Kanalanschluss und Herstellung?' },
      { id: 'gemeinde-regenwasser', text: 'Wie muss ich Regenwasser ableiten oder versickern lassen?' },
      { id: 'gemeinde-zufahrt-gehsteig-strasse', text: 'Muss ich Kosten für eine Zufahrt, einen Gehsteig oder Arbeiten an der öffentlichen Straße einplanen?' },
      { id: 'gemeinde-laufende-gebuehren', text: 'Welche laufenden Gebühren fallen nach dem Einzug für Wasser, Abwasser und Müll an?' },
      { id: 'gemeinde-faelligkeit', text: 'Wann werden die einzelnen Beträge fällig?' },
      { id: 'gemeinde-gebuehrensaetze-schriftlich', text: 'Können Sie mir die Berechnung und die aktuellen Gebührensätze schriftlich zusenden?' },
    ],
  },
  {
    id: 'hausanbieter', titel: 'Hausanbieter / Baufirma (z. B. Malli)', fragen: [
      { id: 'hausanbieter-umfang', text: 'Welche Leistungen sind im Angebot enthalten und welche nicht?' },
      { id: 'hausanbieter-mehrkosten', text: 'Welche möglichen Mehrkosten sollten wir einplanen?' },
      { id: 'hausanbieter-zeitplan', text: 'Wann kann der Bau beginnen und wie sieht der Zeitplan aus?' },
      { id: 'hausanbieter-zahlungen', text: 'Wann sind welche Zahlungen fällig?' },
    ],
  },
  {
    id: 'bank', titel: 'Bank / Kreditmakler', fragen: [
      { id: 'bank-bedarf', text: 'Welche Kosten können über den Kredit finanziert werden?' },
      { id: 'bank-unterlagen', text: 'Welche Unterlagen benötigen Sie für ein Angebot?' },
      { id: 'bank-konditionen', text: 'Welche Zinsen, Laufzeiten und Nebenkosten gelten für das Angebot?' },
      { id: 'bank-auszahlung', text: 'Wann und unter welchen Bedingungen wird der Kredit ausgezahlt?' },
    ],
  },
  {
    id: 'strom', titel: 'Stromanbieter', fragen: [
      { id: 'strom-anschluss', text: 'Wer ist für den Stromanschluss zuständig?' },
      { id: 'strom-kosten', text: 'Was kosten Anschluss und laufende Versorgung?' },
      { id: 'strom-baustelle', text: 'Wie kann Baustrom bereitgestellt werden?' },
      { id: 'strom-termine', text: 'Welche Vorlaufzeiten und Termine sind zu beachten?' },
    ],
  },
  {
    id: 'wasser', titel: 'Wasserverband', fragen: [
      { id: 'wasser-anschluss', text: 'Wie läuft die Anmeldung für den Wasseranschluss ab?' },
      { id: 'wasser-kosten', text: 'Welche Anschlussgebühren und laufenden Kosten fallen an?' },
      { id: 'wasser-bauphase', text: 'Ist eine Wasserversorgung während der Bauphase möglich?' },
      { id: 'wasser-termine', text: 'Welche Unterlagen und Vorlaufzeiten werden benötigt?' },
    ],
  },
  {
    id: 'internet', titel: 'Internetanbieter', fragen: [
      { id: 'internet-verfuegbarkeit', text: 'Welche Anschlüsse und Geschwindigkeiten sind am Grundstück verfügbar?' },
      { id: 'internet-hausanschluss', text: 'Was wird für den Hausanschluss benötigt?' },
      { id: 'internet-kosten', text: 'Welche einmaligen und monatlichen Kosten entstehen?' },
      { id: 'internet-termine', text: 'Wann sollte der Anschluss beauftragt werden?' },
    ],
  },
];

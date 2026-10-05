export interface House {
  id: string;
  name: string;
  finanzierung: Finanzierung;
  betriebskosten: Betriebskosten;
  bauposten?: Bauposten;
  inkludierteLeistungen?: Record<string, boolean>;
  ausgeschlosseneLeistungen?: Record<string, boolean>;
  leistungsstatus?: Record<string, Leistungsstatus>;
  ausfuehrung?: Record<string, Ausfuehrender>;
  externeFirmen?: Record<string, string>;
  leistungspreise?: Record<string, number>;
  eigeneLeistungen?: EigeneLeistung[];
  notizen?: string;
  links?: HouseLink[];
}

export interface HouseLink {
  id: string;
  titel: string;
  url: string;
}

export type Leistungsstatus = 'ungeklaert' | 'im_hauspreis' | 'separat' | 'nicht_benoetigt';
export type Ausfuehrender = 'offen' | 'hausanbieter' | 'eigenleistung' | 'externer_betrieb';

export interface EigeneLeistung {
  id: string;
  name: string;
}

export interface Bauposten {
  hauspreis: number;
  fundamentplatte: number;
  erdarbeiten: number;
  entsorgung: number;
  hausanschluesse: number;
  planung: number;
  aussenanlagen: number;
  reserve: number;
}

export interface Finanzierung {
  grundstueckpreis: number;
  baukosten: number;
  eigenkapital: number;
  zins: number;
  laufzeit: number;
  sondertilgung: number;
}

export interface Betriebskosten {
  heizung: number;
  strom: number;
  wasser: number;
  abwasser: number;
  muell: number;
  versicherung: number;
  grundsteuer: number;
  internet: number;
  instandhaltung: number;
}

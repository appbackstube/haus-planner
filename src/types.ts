export interface House {
  id: string;
  name: string;
  finanzierung: Finanzierung;
  betriebskosten: Betriebskosten;
  aktuelleKosten?: AktuelleKosten;
  bauposten?: Bauposten;
  inkludierteLeistungen?: Record<string, boolean>;
  ausgeschlosseneLeistungen?: Record<string, boolean>;
  kreditAusgeschlosseneLeistungen?: Record<string, boolean>;
  leistungsstatus?: Record<string, Leistungsstatus>;
  nichtBenoetigtGruende?: Record<string, string>;
  ausfuehrung?: Record<string, Ausfuehrender>;
  externeFirmen?: Record<string, string>;
  leistungspreise?: Record<string, number>;
  eigeneLeistungen?: EigeneLeistung[];
  notizen?: string;
  links?: HouseLink[];
  todos?: Todo[];
  materialien?: Record<string, MaterialAuswahl>;
  fragenAntworten?: Record<string, FrageAntwort>;
  eigeneFragen?: EigeneFrage[];
}

export type FrageKategorie = 'gemeinde' | 'hausanbieter' | 'bank' | 'strom' | 'wasser' | 'internet';

export interface EigeneFrage {
  id: string;
  kategorie: FrageKategorie;
  text: string;
}

export interface FrageAntwort {
  erledigt: boolean;
  notiz: string;
}

export interface PlannerData {
  houses: House[];
  todos: Todo[];
}

export interface Todo {
  id: string;
  titel: string;
  beschreibung: string;
  erledigt: boolean;
}

export interface MaterialAuswahl {
  angaben?: Record<string, string>;
  ausfuehrung?: string;
  energie?: string;
  schall?: string;
  notizen?: string;
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
  bankgebuehren?: number;
  grundbucheintragungen?: number;
  grunderwerbsteuerProzent?: number;
  grundbuchEintragungsgebuehrProzent?: number;
  eingabengebuehr?: number;
  vertragserrichtung?: number;
  pfandrechtseintragung?: number;
  grundstueckSonstiges?: number;
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
  eigenePosten?: Kostenposten[];
}

export interface AktuelleKosten extends Betriebskosten {
  wohnen: number;
  sonstiges: number;
}

export interface Kostenposten {
  id: string;
  name: string;
  betrag: number;
}

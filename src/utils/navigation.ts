export type Hauptbereich = 'ueberblick' | 'kosten' | 'haus' | 'organisation' | 'vergleich';
export type Kostenbereich = 'baukosten' | 'finanzierung' | 'betriebskosten' | 'aktuelle-kosten' | 'gesamt';
export type Organisationsbereich = 'todos' | 'notizen-und-links';

export function zielFuerBereich(bereich: string): {
  hauptbereich: Hauptbereich;
  kostenbereich?: Kostenbereich;
  organisationsbereich?: Organisationsbereich;
} {
  switch (bereich) {
    case 'baukosten':
    case 'finanzierung':
    case 'betriebskosten':
    case 'aktuelle-kosten':
    case 'gesamt':
      return { hauptbereich: 'kosten', kostenbereich: bereich };
    case 'materialien':
      return { hauptbereich: 'haus' };
    case 'notizen-und-links':
    case 'todos':
      return { hauptbereich: 'organisation', organisationsbereich: bereich };
    case 'vergleich':
      return { hauptbereich: 'vergleich' };
    default:
      return { hauptbereich: 'ueberblick' };
  }
}

export type Hauptbereich = 'ueberblick' | 'kosten' | 'haus' | 'vergleich';
export type Kostenbereich = 'baukosten' | 'finanzierung' | 'betriebskosten' | 'gesamt';
export type Hausbereich = 'materialien' | 'notizen-und-links';

export function zielFuerBereich(bereich: string): {
  hauptbereich: Hauptbereich;
  kostenbereich?: Kostenbereich;
  hausbereich?: Hausbereich;
} {
  switch (bereich) {
    case 'baukosten':
    case 'finanzierung':
    case 'betriebskosten':
    case 'gesamt':
      return { hauptbereich: 'kosten', kostenbereich: bereich };
    case 'materialien':
    case 'notizen-und-links':
      return { hauptbereich: 'haus', hausbereich: bereich };
    case 'vergleich':
      return { hauptbereich: 'vergleich' };
    default:
      return { hauptbereich: 'ueberblick' };
  }
}

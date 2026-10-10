export type Hauptbereich = 'ueberblick' | 'kosten' | 'haus' | 'todos' | 'notizen' | 'links' | 'fragenkatalog' | 'vergleich';
export type Kostenbereich = 'baukosten' | 'grundstueck' | 'finanzierung' | 'betriebskosten' | 'aktuelle-kosten' | 'gesamt';

export function zielFuerBereich(bereich: string): {
  hauptbereich: Hauptbereich;
  kostenbereich?: Kostenbereich;
} {
  switch (bereich) {
    case 'baukosten':
    case 'grundstueck':
    case 'finanzierung':
    case 'betriebskosten':
    case 'aktuelle-kosten':
    case 'gesamt':
      return { hauptbereich: 'kosten', kostenbereich: bereich };
    case 'materialien':
      return { hauptbereich: 'haus' };
    case 'notizen-und-links':
      return { hauptbereich: 'notizen' };
    case 'todos':
    case 'notizen':
    case 'links':
    case 'fragenkatalog':
      return { hauptbereich: bereich };
    case 'vergleich':
      return { hauptbereich: 'vergleich' };
    default:
      return { hauptbereich: 'ueberblick' };
  }
}

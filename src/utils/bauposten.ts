import type { Bauposten, House, Leistungsstatus } from '../types';

const alteBauposten: Record<string, keyof Bauposten> = {
  bodenplatte: 'fundamentplatte',
  erdarbeiten: 'erdarbeiten',
  entsorgung: 'entsorgung',
  anschluesse: 'hausanschluesse',
  planung: 'planung',
  aussenanlagen_pauschal: 'aussenanlagen',
};

export function leereBauposten(): Bauposten {
  return {
    hauspreis: 0,
    fundamentplatte: 0,
    erdarbeiten: 0,
    entsorgung: 0,
    hausanschluesse: 0,
    planung: 0,
    aussenanlagen: 0,
    reserve: 0,
  };
}

export function baupostenFuerHaus(house: House): Bauposten {
  return house.bauposten ?? { ...leereBauposten(), hauspreis: house.finanzierung.baukosten };
}

export function leistungspreis(house: House, id: string): number {
  const alteKategorie = alteBauposten[id];
  return house.leistungspreise?.[id] ?? (alteKategorie ? baupostenFuerHaus(house)[alteKategorie] : 0);
}

export function istAusgeschlossen(house: House, id: string): boolean {
  if (house.ausgeschlosseneLeistungen?.[id] !== undefined) {
    return house.ausgeschlosseneLeistungen[id];
  }
  return Boolean(alteBauposten[id] && leistungspreis(house, id) > 0);
}

export function leistungsstatus(house: House, id: string): Leistungsstatus {
  if (house.leistungsstatus?.[id]) return house.leistungsstatus[id];
  if (istAusgeschlossen(house, id)) return 'separat';
  if (house.inkludierteLeistungen?.[id]) return 'im_hauspreis';
  return 'ungeklaert';
}

export function berechneBaukosten(house: House) {
  const bauposten = baupostenFuerHaus(house);
  const ids = new Set([...Object.keys(alteBauposten), ...Object.keys(house.leistungspreise ?? {})]);
  const zusatzkosten = [...ids].reduce(
    (summe, id) => summe + (leistungsstatus(house, id) === 'separat' ? leistungspreis(house, id) : 0),
    0,
  );
  return {
    hauspreis: bauposten.hauspreis,
    reserve: bauposten.reserve,
    zusatzkosten,
    baukosten: bauposten.hauspreis + bauposten.reserve + zusatzkosten,
  };
}

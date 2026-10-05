import type { House } from '../types';
import { hausKennzahlen, materialKurzinfo } from '../utils/vergleich';

const euro = (value: number) => `${value.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €`;

const materialPunkte = [
  { id: 'aussenwand', label: 'Außenwand', fields: ['aufbau', 'daemmung'] },
  { id: 'fenster', label: 'Fenster', fields: ['rahmen', 'verglasung'] },
  { id: 'heizung', label: 'Heizung', fields: ['system', 'leistung'] },
  { id: 'bodenbelag', label: 'Bodenbeläge', fields: ['belag'] },
];

export function Hausvergleich({ houses }: { houses: House[] }) {
  if (houses.length < 2) {
    return <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Lege ein zweites Haus an, um die Häuser hier zu vergleichen.</p>;
  }

  const kennzahlen = houses.map(hausKennzahlen);
  const kostenPunkte = [
    { label: 'Baukosten', values: kennzahlen.map((werte) => euro(werte.baukosten)) },
    { label: 'Grundstückspreis', values: kennzahlen.map((werte) => euro(werte.grundstueckpreis)) },
    { label: 'Kreditbetrag', values: kennzahlen.map((werte) => euro(werte.kreditbetrag)) },
    { label: 'Kreditrate / Monat', values: kennzahlen.map((werte) => euro(werte.monatsrate)) },
    { label: 'Betriebskosten / Monat', values: kennzahlen.map((werte) => euro(werte.betriebskosten)) },
    { label: 'Gesamt / Monat', values: kennzahlen.map((werte) => euro(werte.gesamtMonat)) },
    { label: 'Gesamt / Jahr', values: kennzahlen.map((werte) => euro(werte.gesamtJahr)) },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Häuser vergleichen</h2>
      <p className="text-sm text-slate-600">Kosten und ausgewählte Materialien nebeneinander. Fehlende Angaben erscheinen als „Noch offen“.</p>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th scope="col" className="min-w-40 p-3 font-semibold text-slate-900">Merkmal</th>
              {houses.map((house) => <th scope="col" key={house.id} className="min-w-52 p-3 font-semibold text-slate-900">{house.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr><th colSpan={houses.length + 1} scope="colgroup" className="border-t border-slate-200 bg-sky-50 px-3 py-2 text-sky-900">Kosten</th></tr>
            {kostenPunkte.map((punkt) => (
              <tr key={punkt.label} className="border-t border-slate-100">
                <th scope="row" className="p-3 font-medium text-slate-700">{punkt.label}</th>
                {houses.map((house, index) => <td key={house.id} className="p-3 text-slate-800">{punkt.values[index]}</td>)}
              </tr>
            ))}
            <tr><th colSpan={houses.length + 1} scope="colgroup" className="border-t border-slate-200 bg-sky-50 px-3 py-2 text-sky-900">Materialien</th></tr>
            {materialPunkte.map((punkt) => (
              <tr key={punkt.id} className="border-t border-slate-100">
                <th scope="row" className="p-3 font-medium text-slate-700">{punkt.label}</th>
                {houses.map((house) => <td key={house.id} className="break-words p-3 text-slate-800">{materialKurzinfo(house, punkt.id, punkt.fields)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

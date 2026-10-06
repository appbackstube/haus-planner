import type { House } from '../types';
import { hausKennzahlen } from '../utils/vergleich';

const format = (value: number) =>
  value.toLocaleString('de-AT', { maximumFractionDigits: 2 });

export function Gesamt({ house }: { house: House }) {
  const { monatsrate, betriebskosten: betriebs, gesamtMonat, aktuelleKosten, differenzMonat } = hausKennzahlen(house);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Monatlich</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p>Kreditrate: <strong>{format(monatsrate)} €</strong></p>
          <p>Betriebskosten: <strong>{format(betriebs)} €</strong></p>
          <p className="border-t border-slate-200 pt-1 text-base">
            Gesamt: <strong className="text-sky-700">{format(gesamtMonat)} €</strong>
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Jährlich</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p>Kreditrate: <strong>{format(monatsrate * 12)} €</strong></p>
          <p>Betriebskosten: <strong>{format(betriebs * 12)} €</strong></p>
          <p className="border-t border-slate-200 pt-1 text-base">
            Gesamt: <strong className="text-sky-700">{format(gesamtMonat * 12)} €</strong>
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
        <h3 className="text-sm font-semibold text-sky-900">Vor und nach dem Hausbau</h3>
        {aktuelleKosten === null || differenzMonat === null ? (
          <p className="mt-2 text-sm text-slate-700">{aktuelleKosten === null ? 'Noch keine heutigen Kosten erfasst. Trage sie unter „Heutige Kosten“ ein.' : 'Trage zuerst einen Hauspreis oder Grundstückspreis ein, damit wir die Kosten vergleichen können.'}</p>
        ) : (
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>Heute: <strong>{format(aktuelleKosten)} €/Monat</strong></p>
            <p>Geplant mit Haus: <strong>{format(gesamtMonat)} €/Monat</strong></p>
            <p className="border-t border-sky-200 pt-2 text-base font-semibold text-sky-900">
              {differenzMonat > 0 ? 'Mehrkosten' : differenzMonat < 0 ? 'Ersparnis' : 'Unterschied'}: {format(Math.abs(differenzMonat))} €/Monat
            </p>
            <p>{format(Math.abs(differenzMonat) * 12)} € {differenzMonat > 0 ? 'Mehrkosten' : differenzMonat < 0 ? 'Ersparnis' : 'Unterschied'} im Jahr</p>
          </div>
        )}
      </div>
    </div>
  );
}

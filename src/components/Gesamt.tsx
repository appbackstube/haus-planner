import type { House } from '../types';
import { berechneFinanzierung, summeBetriebskosten } from '../utils/finanzierung';
import { berechneBaukosten } from '../utils/bauposten';

const format = (value: number) =>
  value.toLocaleString('de-AT', { maximumFractionDigits: 2 });

export function Gesamt({ house }: { house: House }) {
  const { monatsrate } = berechneFinanzierung(house.finanzierung, berechneBaukosten(house).baukosten);
  const betriebs = summeBetriebskosten(house.betriebskosten);
  const gesamtMonat = monatsrate + betriebs;

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
    </div>
  );
}

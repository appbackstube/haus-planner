import type { House } from '../types';
import { baupostenFuerHaus, berechneBaukosten } from '../utils/bauposten';
import { LeistungsCheckliste } from './LeistungsCheckliste';
import { NumberInput } from './NumberInput';

interface BaukostenProps {
  house: House;
  onChange: (house: House) => void;
}

const euro = (wert: number) => wert.toLocaleString('de-AT', { maximumFractionDigits: 2 });

export function Baukosten({ house, onChange }: BaukostenProps) {
  const data = baupostenFuerHaus(house);
  const { zusatzkosten, baukosten } = berechneBaukosten(house);

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        Hauspreis und Reserve erfasst du hier. Einzelne Leistungen bearbeitest du weiter unten über ⋯.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberInput
          label="Hauspreis"
          value={data.hauspreis}
          onValueChange={(hauspreis) => onChange({ ...house, bauposten: { ...data, hauspreis } })}
        />
        <NumberInput
          label="Reserve für Unvorhergesehenes"
          value={data.reserve}
          onValueChange={(reserve) => onChange({ ...house, bauposten: { ...data, reserve } })}
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Haus + Grundstück</h3>
          <strong className="text-lg text-sky-700">{euro(baukosten + house.finanzierung.grundstueckpreis)} €</strong>
        </div>
        <details className="mt-2">
          <summary className="w-fit cursor-pointer text-sm text-sky-700">Aufschlüsselung anzeigen</summary>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-slate-500">Hauspreis</dt><dd className="font-semibold text-slate-900">{euro(data.hauspreis)} €</dd></div>
            <div><dt className="text-slate-500">Separat zu bezahlen</dt><dd className="font-semibold text-slate-900">{euro(zusatzkosten)} €</dd></div>
            <div><dt className="text-slate-500">Reserve</dt><dd className="font-semibold text-slate-900">{euro(data.reserve)} €</dd></div>
            <div><dt className="text-slate-500">Baukosten</dt><dd className="font-semibold text-slate-900">{euro(baukosten)} €</dd></div>
            <div><dt className="text-slate-500">Grundstück</dt><dd className="font-semibold text-slate-900">{euro(house.finanzierung.grundstueckpreis)} €</dd></div>
          </dl>
          <p className="mt-3 text-slate-500">Bankgebühren und Grundbucheintragungen erfasst du unter „Finanzierung“. Sammelpunkte und Details nicht doppelt bepreisen.</p>
        </details>
      </div>
      <LeistungsCheckliste house={house} onChange={onChange} />
    </div>
  );
}

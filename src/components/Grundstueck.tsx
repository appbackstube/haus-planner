import type { Finanzierung } from '../types';
import { berechneFinanzierung } from '../utils/finanzierung';
import { NumberInput } from './NumberInput';

interface GrundstueckProps {
  data: Finanzierung;
  onChange: (data: Finanzierung) => void;
}

const euro = (wert: number) => wert.toLocaleString('de-AT', { maximumFractionDigits: 2 });

export function Grundstueck({ data, onChange }: GrundstueckProps) {
  const update = (key: keyof Finanzierung) => (value: number) => onChange({ ...data, [key]: value });
  const { grundstueckNebenkosten } = berechneFinanzierung(data);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Grundstück</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput label="Grundstückspreis" value={data.grundstueckpreis} onValueChange={update('grundstueckpreis')} />
          <NumberInput label="Grunderwerbsteuer" value={data.grunderwerbsteuerProzent ?? 0} onValueChange={update('grunderwerbsteuerProzent')} unit="%" step={0.01} />
          <NumberInput label="Grundbuch-Eintragungsgebühr" value={data.grundbuchEintragungsgebuehrProzent ?? 0} onValueChange={update('grundbuchEintragungsgebuehrProzent')} unit="%" step={0.01} />
          <NumberInput label="Eingabengebühr" value={data.eingabengebuehr ?? 0} onValueChange={update('eingabengebuehr')} />
        </div>
        <p className="mt-3 text-xs text-slate-500">Die Prozentsätze werden auf den Grundstückspreis angewendet. Bitte trage deine Werte selbst ein.</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Sonstiges</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput label="Vertragserrichtung" value={data.vertragserrichtung ?? 0} onValueChange={update('vertragserrichtung')} />
          <NumberInput label="Pfandrechtseintragung" value={data.pfandrechtseintragung ?? 0} onValueChange={update('pfandrechtseintragung')} />
          <NumberInput label="Weitere Grundstückskosten" value={data.grundstueckSonstiges ?? 0} onValueChange={update('grundstueckSonstiges')} />
          {(data.grundbucheintragungen ?? 0) > 0 && <NumberInput label="Bisherige Grundbucheintragungen" value={data.grundbucheintragungen ?? 0} onValueChange={update('grundbucheintragungen')} />}
        </div>
      </section>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h3 className="font-semibold text-slate-900">Grundstückskosten</h3>
        <p className="mt-2">Grundstückspreis: <strong>{euro(data.grundstueckpreis)} €</strong></p>
        <p>Nebenkosten: <strong>{euro(grundstueckNebenkosten)} €</strong></p>
        <p className="mt-2 border-t border-slate-200 pt-2">Gesamt: <strong className="text-sky-700">{euro(data.grundstueckpreis + grundstueckNebenkosten)} €</strong></p>
      </div>
    </div>
  );
}

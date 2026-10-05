import type { Betriebskosten as BetriebskostenData } from '../types';
import { NumberInput } from './NumberInput';

interface BetriebskostenProps {
  data: BetriebskostenData;
  onChange: (data: BetriebskostenData) => void;
}

export function Betriebskosten({ data, onChange }: BetriebskostenProps) {
  const update = (key: keyof BetriebskostenData) => (value: number) => {
    onChange({ ...data, [key]: value });
  };

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberInput label="Heizung" value={data.heizung} onValueChange={update('heizung')} unit="€/Monat" />
        <NumberInput label="Strom" value={data.strom} onValueChange={update('strom')} unit="€/Monat" />
        <NumberInput label="Wasser" value={data.wasser} onValueChange={update('wasser')} unit="€/Monat" />
        <NumberInput label="Abwasser" value={data.abwasser} onValueChange={update('abwasser')} unit="€/Monat" />
        <NumberInput label="Müll" value={data.muell} onValueChange={update('muell')} unit="€/Monat" />
        <NumberInput label="Versicherung" value={data.versicherung} onValueChange={update('versicherung')} unit="€/Monat" />
        <NumberInput label="Grundsteuer" value={data.grundsteuer} onValueChange={update('grundsteuer')} unit="€/Monat" />
        <NumberInput label="Internet" value={data.internet} onValueChange={update('internet')} unit="€/Monat" />
        <NumberInput label="Instandhaltung" value={data.instandhaltung} onValueChange={update('instandhaltung')} unit="€/Monat" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Gesamt</h3>
        <p className="mt-1 text-sm text-slate-700">
          Monatskosten: <strong>{total.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</strong>
        </p>
        <p className="text-sm text-slate-700">
          Jahreskosten: <strong>{(total * 12).toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</strong>
        </p>
      </div>
    </div>
  );
}

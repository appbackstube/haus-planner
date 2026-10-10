import { NumberInput } from './NumberInput';

interface BetragOderProzentInputProps {
  label: string;
  betrag?: number;
  prozent?: number;
  basis: number;
  onChange: (betrag: number | undefined, prozent: number | undefined) => void;
}

export function BetragOderProzentInput({ label, betrag, prozent, basis, onChange }: BetragOderProzentInputProps) {
  const istProzent = prozent !== undefined;
  const ergebnis = istProzent ? Math.round(basis * prozent) / 100 : (betrag ?? 0);

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <NumberInput
            label={label}
            value={istProzent ? prozent : (betrag ?? 0)}
            onValueChange={(wert) => onChange(istProzent ? undefined : wert, istProzent ? wert : undefined)}
            unit={istProzent ? '%' : '€'}
            step={istProzent ? 0.01 : 1}
          />
        </div>
        <select
          aria-label={`${label}: Einheit`}
          className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
          value={istProzent ? 'prozent' : 'euro'}
          onChange={(event) => onChange(event.target.value === 'euro' ? 0 : undefined, event.target.value === 'prozent' ? 0 : undefined)}
        >
          <option value="euro">€</option>
          <option value="prozent">%</option>
        </select>
      </div>
      {istProzent && <p className="text-xs text-slate-500">Von {basis.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €: {ergebnis.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</p>}
    </div>
  );
}

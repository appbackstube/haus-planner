import type { Finanzierung as FinanzierungData } from '../types';
import { NumberInput } from './NumberInput';
import { BetragOderProzentInput } from './BetragOderProzentInput';
import { berechneFinanzierung } from '../utils/finanzierung';

interface FinanzierungProps {
  data: FinanzierungData;
  baukosten: number;
  kreditAusgeschlossen: number;
  onChange: (data: FinanzierungData) => void;
}

export function Finanzierung({ data, baukosten, kreditAusgeschlossen, onChange }: FinanzierungProps) {
  const update = (key: keyof FinanzierungData) => (value: number) => {
    onChange({ ...data, [key]: value });
  };

  const { gesamtkosten, grundstueckNebenkosten, bankgebuehren, kreditbasis, ausKreditAusgeschlossen, kreditbetrag, monatsrate } = berechneFinanzierung(data, baukosten, kreditAusgeschlossen);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Grundstückspreis</span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{data.grundstueckpreis.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</span>
          <span className="text-xs text-slate-500">Unter „Kosten → Grundstück“ bearbeiten</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Baukosten</span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {baukosten.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €
          </span>
          <span className="text-xs text-slate-500">Unter „Kosten → Baukosten“ bearbeiten</span>
        </div>
        <NumberInput label="Eigenkapital" value={data.eigenkapital} onValueChange={update('eigenkapital')} />
        <NumberInput label="Zinssatz" value={data.zins} onValueChange={update('zins')} unit="%" step={0.01} min={0} />
        <NumberInput label="Laufzeit" value={data.laufzeit} onValueChange={update('laufzeit')} unit="Jahre" step={1} min={1} />
        <NumberInput label="Sondertilgung" value={data.sondertilgung} onValueChange={update('sondertilgung')} unit="%/Jahr" step={1} min={0} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Einmalige Nebenkosten</h3>
        <p className="mt-1 text-sm text-slate-600">Diese Beträge zählen zu den Gesamtkosten und zum Kreditbedarf. Grundstückskosten erfasst du unter „Kosten → Grundstück“.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BetragOderProzentInput label="Bankgebühren" betrag={data.bankgebuehren} prozent={data.bankgebuehrenProzent} basis={kreditbasis} onChange={(betrag, prozent) => {
            const neu = { ...data };
            delete neu.bankgebuehren;
            delete neu.bankgebuehrenProzent;
            onChange({ ...neu, ...(betrag === undefined ? {} : { bankgebuehren: betrag }), ...(prozent === undefined ? {} : { bankgebuehrenProzent: prozent }) });
          }} />
        </div>
        <p className="mt-3 text-xs text-slate-500">Bankgebühren in % beziehen sich auf den Kreditbedarf vor Bank- und Pfandrechtsgebühren. Beim Wechsel der Einheit wird der Wert auf 0 gesetzt.</p>
      </section>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Berechnung</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p>Haus und Grundstück: <strong>{(baukosten + data.grundstueckpreis).toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</strong></p>
          <p>Bankgebühren: <strong>{bankgebuehren.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</strong></p>
          <p>Grundstücksnebenkosten: <strong>{grundstueckNebenkosten.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</strong></p>
          <p>Gesamtkosten: <strong>{gesamtkosten.toLocaleString('de-AT', { minimumFractionDigits: 0 })} €</strong></p>
          <p>Aus dem Kredit ausgeschlossen: <strong>−{ausKreditAusgeschlossen.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</strong></p>
          <p>Kreditbedarf: <strong>{kreditbetrag.toLocaleString('de-AT', { minimumFractionDigits: 0 })} €</strong></p>
          <p>Monatsrate: <strong>{monatsrate.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €</strong></p>
        </div>
      </div>
    </div>
  );
}

import type { AktuelleKosten as AktuelleKostenData } from '../types';
import { NumberInput } from './NumberInput';
import { EigeneKostenposten } from './EigeneKostenposten';
import { summeAktuelleKosten } from '../utils/vergleich';

interface AktuelleKostenProps {
  data?: AktuelleKostenData;
  onChange: (data: AktuelleKostenData | undefined) => void;
}

const leereAktuelleKosten: AktuelleKostenData = {
  wohnen: 0, heizung: 0, strom: 0, wasser: 0, abwasser: 0,
  muell: 0, versicherung: 0, grundsteuer: 0, internet: 0,
  instandhaltung: 0, sonstiges: 0,
  eigenePosten: [],
};

export function AktuelleKosten({ data, onChange }: AktuelleKostenProps) {
  const update = (key: Exclude<keyof AktuelleKostenData, 'eigenePosten'>) => (value: number) => {
    if (data) onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Heutige Kosten vor dem Hausbau</h2>
      <p className="text-sm text-slate-600">Trage deine heutigen monatlichen Wohnkosten ein. Die Werte gelten für dieses Haus und werden in der Monatsübersicht verglichen.</p>
      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberInput label="Miete oder aktuelle Kreditrate" value={data.wohnen} onValueChange={update('wohnen')} unit="€/Monat" />
            <NumberInput label="Heizung heute" value={data.heizung} onValueChange={update('heizung')} unit="€/Monat" />
            <NumberInput label="Strom heute" value={data.strom} onValueChange={update('strom')} unit="€/Monat" />
            <NumberInput label="Wasser heute" value={data.wasser} onValueChange={update('wasser')} unit="€/Monat" />
            <NumberInput label="Abwasser heute" value={data.abwasser} onValueChange={update('abwasser')} unit="€/Monat" />
            <NumberInput label="Müll heute" value={data.muell} onValueChange={update('muell')} unit="€/Monat" />
            <NumberInput label="Versicherung heute" value={data.versicherung} onValueChange={update('versicherung')} unit="€/Monat" />
            <NumberInput label="Grundsteuer heute" value={data.grundsteuer} onValueChange={update('grundsteuer')} unit="€/Monat" />
            <NumberInput label="Internet heute" value={data.internet} onValueChange={update('internet')} unit="€/Monat" />
            <NumberInput label="Instandhaltung heute" value={data.instandhaltung} onValueChange={update('instandhaltung')} unit="€/Monat" />
            <NumberInput label="Sonstige Wohnkosten heute" value={data.sonstiges} onValueChange={update('sonstiges')} unit="€/Monat" />
          </div>
          <EigeneKostenposten
            posten={data.eigenePosten ?? []}
            onChange={(eigenePosten) => onChange({ ...data, eigenePosten })}
            hinweis="Ergänze weitere monatliche Kosten. Trage denselben Betrag nicht nochmals bei „Sonstige Wohnkosten“ ein."
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Heute gesamt</h3>
            <p className="mt-1 text-sm text-slate-700"><strong>{summeAktuelleKosten(data).toLocaleString('de-AT', { maximumFractionDigits: 2 })} €/Monat</strong></p>
          </div>
          <button type="button" onClick={() => { if (window.confirm('Heutige Kosten für dieses Haus entfernen?')) onChange(undefined); }} className="text-sm text-slate-600 underline-offset-4 hover:text-sky-700 hover:underline">Heutige Kosten entfernen</button>
        </>
      ) : (
        <button type="button" onClick={() => onChange({ ...leereAktuelleKosten })} className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Heutige Kosten erfassen</button>
      )}
    </div>
  );
}

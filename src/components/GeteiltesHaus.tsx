import { useEffect, useState } from 'react';
import type { House } from '../types';
import { Gesamt } from './Gesamt';
import { berechneBaukosten } from '../utils/bauposten';
import { sharedHouseFromPayload, shareIdFromHash } from '../utils/shareLinks';
import { supabase } from '../utils/supabase';

export function GeteiltesHaus({ shareId, onImport }: { shareId: string; onImport: (house: House) => void }) {
  const [house, setHouse] = useState<House | null>(null);
  const [message, setMessage] = useState('Freigabe wird geladen …');

  useEffect(() => {
    const client = supabase;
    if (!client || !shareIdFromHash(`#share=${encodeURIComponent(shareId)}`)) {
      setMessage('Dieser Freigabe-Link ist ungültig oder Supabase ist nicht konfiguriert.');
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await client.rpc('get_shared_house', { share_id: shareId });
      if (cancelled) return;
      if (error || !data) {
        setMessage('Freigabe nicht gefunden. Der Link wurde möglicherweise widerrufen oder das Projekt ist pausiert.');
        return;
      }
      try {
        setHouse(sharedHouseFromPayload(data));
      } catch {
        setMessage('Die geteilten Daten sind ungültig.');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [shareId]);

  if (!house) return <p role="status" className="mx-auto max-w-4xl p-6 text-sm text-slate-700">{message}</p>;

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{house.name}</h1>
        <p className="mt-1 text-sm text-slate-600">Geteilte Momentaufnahme · Nur lesen</p>
      </header>
      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>Baukosten: <strong>{berechneBaukosten(house).baukosten.toLocaleString('de-AT')} €</strong></p>
        <p>Grundstück: <strong>{house.finanzierung.grundstueckpreis.toLocaleString('de-AT')} €</strong></p>
      </section>
      <Gesamt house={house} />
      {house.notizen && <section className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="mb-2 font-semibold">Notizen</h2><p className="whitespace-pre-wrap break-words text-sm">{house.notizen}</p></section>}
      <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-sky-700">Alle Angaben ansehen</summary>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-700">{JSON.stringify(house, null, 2)}</pre>
      </details>
      <button type="button" onClick={() => onImport(house)} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
        Als eigenes Haus übernehmen
      </button>
    </main>
  );
}

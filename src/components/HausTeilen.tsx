import { useEffect, useState } from 'react';
import type { House } from '../types';
import { shareLink } from '../utils/shareLinks';
import { supabase } from '../utils/supabase';

interface Freigabe {
  id: string;
  house_name: string;
  created_at: string;
}

export function HausTeilen({ house }: { house: House }) {
  const [freigaben, setFreigaben] = useState<Freigabe[]>([]);
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    const load = async () => {
      const { data: session } = await client.auth.getSession();
      if (!session.session) return;
      const { data } = await client.from('shared_houses').select('id, house_name, created_at').order('created_at', { ascending: false });
      if (!cancelled && data) setFreigaben(data);
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const teilen = async () => {
    if (!supabase || busy) return;
    if (!window.confirm(`Haus „${house.name}“ mit Preisen, Finanzierung, Notizen und Links als lesbare Momentaufnahme teilen? Jeder mit dem Link kann diese Angaben sehen.`)) return;
    setBusy(true);
    setMessage('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let user = sessionData.session?.user;
      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        user = data.user ?? undefined;
      }
      if (!user) throw new Error('Anmeldung fehlgeschlagen.');

      const { data, error } = await supabase.from('shared_houses')
        .insert({ owner_id: user.id, house_name: house.name, payload: house })
        .select('id, house_name, created_at')
        .single();
      if (error) throw error;

      const newLink = shareLink(window.location.href, data.id);
      setLink(newLink);
      setFreigaben((vorher) => [data, ...vorher]);
      try {
        await navigator.clipboard.writeText(newLink);
        setMessage('Link erstellt und kopiert.');
      } catch {
        setMessage('Link erstellt. Du kannst ihn unten kopieren.');
      }
    } catch {
      setMessage('Teilen fehlgeschlagen. Prüfe die Supabase-Einrichtung und die anonyme Anmeldung.');
    } finally {
      setBusy(false);
    }
  };

  const widerrufen = async (freigabe: Freigabe) => {
    if (!supabase || busy || !window.confirm(`Freigabe für „${freigabe.house_name}“ widerrufen? Der Link funktioniert danach nicht mehr.`)) return;
    setBusy(true);
    const { data, error } = await supabase.from('shared_houses').delete().eq('id', freigabe.id).select('id');
    if (error || !data?.length) {
      setMessage('Freigabe konnte nicht widerrufen werden.');
    } else {
      setFreigaben((vorher) => vorher.filter((eintrag) => eintrag.id !== freigabe.id));
      if (link.includes(freigabe.id)) setLink('');
      setMessage('Freigabe widerrufen.');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">{house.name} teilen</h2>
        <p className="mt-2 text-sm text-slate-600">Erstelle einen Nur-Lesen-Link. Es wird eine Momentaufnahme dieses Hauses bei Supabase gespeichert. Spätere Änderungen am Haus ändern den Link nicht.</p>
        <p className="mt-1 text-sm text-amber-800">Der Link enthält auch Finanzdaten und Notizen. Teile ihn nur mit Personen, die diese Angaben sehen dürfen.</p>
        {!supabase ? (
          <p role="alert" className="mt-3 text-sm text-red-700">Supabase ist noch nicht konfiguriert.</p>
        ) : (
          <button type="button" disabled={busy} onClick={teilen} className="mt-4 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
            {busy ? 'Bitte warten …' : 'Link erstellen'}
          </button>
        )}
        {message && <p role="status" className="mt-3 text-sm text-slate-700">{message}</p>}
        {link && (
          <label className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
            Freigabe-Link
            <input readOnly value={link} onFocus={(event) => event.target.select()} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
          </label>
        )}
      </section>
      {freigaben.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Meine Freigaben</h2>
          <p className="mt-1 text-xs text-slate-500">Ohne eigenes Login kannst du diese Links nur in diesem Browser widerrufen. Lösche Browserdaten erst nach dem Widerruf.</p>
          <ul className="mt-3 divide-y divide-slate-200">
            {freigaben.map((freigabe) => (
              <li key={freigabe.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>{freigabe.house_name} · {new Date(freigabe.created_at).toLocaleDateString('de-AT')}</span>
                <button type="button" disabled={busy} onClick={() => void widerrufen(freigabe)} className="rounded-md px-2 py-1 text-red-700 hover:bg-red-50 disabled:opacity-50">Link widerrufen</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

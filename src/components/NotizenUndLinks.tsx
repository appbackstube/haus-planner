import { lazy, Suspense, useState } from 'react';
import type { House } from '../types';
import { webUrl } from '../utils/links';

interface NotizenUndLinksProps {
  house: House;
  onChange: (house: House) => void;
  bereich: 'notizen' | 'links';
}

const MarkdownNotizen = lazy(() => import('./MarkdownNotizen'));

export function NotizenUndLinks({ house, onChange, bereich }: NotizenUndLinksProps) {
  const [titel, setTitel] = useState('');
  const [adresse, setAdresse] = useState('');
  const [fehler, setFehler] = useState('');

  const addLink = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = webUrl(adresse);
    if (!url) {
      setFehler('Bitte einen vollständigen Link mit https:// oder http:// eingeben.');
      return;
    }
    onChange({ ...house, links: [...(house.links ?? []), { id: crypto.randomUUID(), titel: titel.trim(), url }] });
    setTitel('');
    setAdresse('');
    setFehler('');
  };

  return (
    <div className="space-y-6">
      {bereich === 'notizen' && <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 id="haus-notizen-titel" className="mb-2 font-semibold text-slate-900">Notizen</h2>
        <div role="group" aria-labelledby="haus-notizen-titel">
          <Suspense fallback={<p role="status" className="text-sm text-slate-600">Editor wird geladen …</p>}>
            <MarkdownNotizen markdown={house.notizen ?? ''} onChange={(notizen) => onChange({ ...house, notizen })} />
          </Suspense>
        </div>
        <p className="mt-2 text-xs text-slate-500">Markdown mit Überschriften, Listen und Links. Der Editor wächst mit dem Text. Änderungen werden automatisch gespeichert.</p>
      </section>}

      {bereich === 'links' && <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Links</h2>
        <form onSubmit={addLink} className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-slate-700">
            Titel
            <input
              value={titel}
              onChange={(event) => setTitel(event.target.value)}
              required
              placeholder="z. B. Angebot Hausanbieter"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <label className="flex min-w-56 flex-[2] flex-col gap-1 text-sm text-slate-700">
            Webadresse
            <input
              type="url"
              value={adresse}
              onChange={(event) => { setAdresse(event.target.value); setFehler(''); }}
              required
              placeholder="https://beispiel.at"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <button type="submit" className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
            Link hinzufügen
          </button>
        </form>
        {fehler && <p role="alert" className="mt-2 text-sm text-red-700">{fehler}</p>}
        {house.links?.length ? (
          <ul className="mt-4 divide-y divide-slate-200">
            {house.links.map((link) => {
              const url = webUrl(link.url);
              return (
                <li key={link.id} className="flex items-center justify-between gap-3 py-2">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm text-sky-700 underline hover:text-sky-900">
                      {link.titel}
                    </a>
                  ) : <span className="text-sm text-slate-600">{link.titel} (ungültiger Link)</span>}
                  <button
                    type="button"
                    onClick={() => onChange({ ...house, links: house.links?.filter((entry) => entry.id !== link.id) })}
                    aria-label={`Link ${link.titel} entfernen`}
                    className="shrink-0 rounded-md px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                  >
                    Entfernen
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-4 text-sm text-slate-500">Noch keine Links gespeichert.</p>}
      </section>}
    </div>
  );
}

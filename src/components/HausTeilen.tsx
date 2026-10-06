import { useState } from 'react';

export function HausTeilen({ link }: { link: string }) {
  const [message, setMessage] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setMessage('Link kopiert.');
    } catch {
      setMessage('Kopieren nicht möglich. Bitte Link markieren und selbst kopieren.');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Planung teilen</h2>
      <p className="mt-2 text-sm text-slate-600">Das ist derselbe Link wie in der Adresszeile. Jeder mit diesem Link kann die Planung lesen und ändern. Ohne Schlüssel sind die gespeicherten Daten nicht lesbar.</p>
      <label className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
        Link zur Planung
        <input readOnly value={link} onFocus={(event) => event.target.select()} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </label>
      <button type="button" onClick={() => void copy()} className="mt-3 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">Link kopieren</button>
      {message && <p role="status" className="mt-2 text-sm text-slate-700">{message}</p>}
    </section>
  );
}

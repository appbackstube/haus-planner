import { useState } from 'react';
import type { FrageAntwort, FrageKategorie, House } from '../types';
import { antwortFuerFrage, ersetzteFrageIds, fragenSektionen } from '../utils/fragenkatalog';

interface FragenkatalogProps {
  house: House;
  onChange: (house: House) => void;
}

export function Fragenkatalog({ house, onChange }: FragenkatalogProps) {
  const [neueFragen, setNeueFragen] = useState<Partial<Record<FrageKategorie, string>>>({});

  const updateAntwort = (id: string, changes: Partial<FrageAntwort>) => {
    const fragenAntworten = { ...house.fragenAntworten };
    const ersetzteId = ersetzteFrageIds[id];
    if (ersetzteId) delete fragenAntworten[ersetzteId];
    onChange({
      ...house,
      fragenAntworten: {
        ...fragenAntworten,
        [id]: { erledigt: false, notiz: '', ...antwortFuerFrage(house.fragenAntworten, id), ...changes },
      },
    });
  };

  const addFrage = (event: React.FormEvent<HTMLFormElement>, kategorie: FrageKategorie) => {
    event.preventDefault();
    const text = neueFragen[kategorie]?.trim();
    if (!text) return;
    onChange({ ...house, eigeneFragen: [...(house.eigeneFragen ?? []), { id: `eigen-${crypto.randomUUID()}`, kategorie, text }] });
    setNeueFragen((aktuell) => ({ ...aktuell, [kategorie]: '' }));
  };

  const deleteFrage = (id: string) => {
    const frage = house.eigeneFragen?.find((entry) => entry.id === id);
    if (!frage || !window.confirm(`Frage „${frage.text}“ und ihre Antwort löschen?`)) return;
    const fragenAntworten = { ...house.fragenAntworten };
    delete fragenAntworten[id];
    onChange({
      ...house,
      eigeneFragen: (house.eigeneFragen ?? []).filter((frage) => frage.id !== id),
      fragenAntworten,
    });
  };

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">Sammle deine Fragen vor Gesprächen. Halte Antworten fest und hake geklärte Fragen ab. Die Angaben gelten für das gewählte Haus.</p>
      {fragenSektionen.map((sektion) => {
        const fragen = [...sektion.fragen, ...(house.eigeneFragen ?? []).filter((frage) => frage.kategorie === sektion.id)];
        const erledigt = fragen.filter((frage) => antwortFuerFrage(house.fragenAntworten, frage.id)?.erledigt).length;
        return (
          <details key={sektion.id} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-sky-600">
              {sektion.titel} <span className="ml-2 text-sm font-normal text-slate-500">{erledigt} von {fragen.length} geklärt</span>
            </summary>
            <ul className="mt-4 divide-y divide-slate-200">
              {fragen.map((frage) => {
                const antwort = antwortFuerFrage(house.fragenAntworten, frage.id);
                const eigen = (house.eigeneFragen ?? []).some((entry) => entry.id === frage.id);
                return (
                  <li key={frage.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-800">{frage.text}</p>
                      {eigen && <button type="button" onClick={() => deleteFrage(frage.id)} aria-label={`Frage „${frage.text}“ entfernen`} className="shrink-0 text-sm text-red-700 hover:underline focus-visible:outline-2 focus-visible:outline-red-600">Entfernen</button>}
                    </div>
                    <label className="mt-2 flex w-fit items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={antwort?.erledigt ?? false} onChange={(event) => updateAntwort(frage.id, { erledigt: event.target.checked })} className="h-4 w-4 accent-sky-700" />
                      Geklärt
                    </label>
                    <label className="mt-3 block text-sm text-slate-600">
                      Antwort / Notiz
                      <textarea value={antwort?.notiz ?? ''} onChange={(event) => updateAntwort(frage.id, { notiz: event.target.value })} rows={2} maxLength={2000} placeholder="Antwort hier festhalten" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                    </label>
                  </li>
                );
              })}
            </ul>
            <form onSubmit={(event) => addFrage(event, sektion.id)} className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium text-slate-700">
                Eigene Frage hinzufügen
                <input value={neueFragen[sektion.id] ?? ''} onChange={(event) => setNeueFragen((aktuell) => ({ ...aktuell, [sektion.id]: event.target.value }))} maxLength={300} placeholder="Deine Frage" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
              </label>
              <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-sky-600">Hinzufügen</button>
            </form>
          </details>
        );
      })}
    </div>
  );
}

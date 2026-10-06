import { useState } from 'react';
import type { Kostenposten } from '../types';
import { NumberInput } from './NumberInput';

interface EigeneKostenpostenProps {
  posten: Kostenposten[];
  onChange: (posten: Kostenposten[]) => void;
  hinweis: string;
}

function PostenZeile({ posten, onNameChange, onBetragChange, onRemove }: {
  posten: Kostenposten;
  onNameChange: (name: string) => void;
  onBetragChange: (betrag: number) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(posten.name);

  const saveName = () => {
    const neuerName = name.trim();
    if (neuerName) {
      if (neuerName !== posten.name) onNameChange(neuerName);
      setName(neuerName);
    } else {
      setName(posten.name);
    }
  };

  return (
    <li className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 p-3">
      <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-slate-700">
        Bezeichnung
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={saveName}
          maxLength={80}
          aria-label={`Bezeichnung für ${posten.name}`}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </label>
      <div className="min-w-40 flex-1">
        <NumberInput label={`Betrag für ${posten.name}`} value={posten.betrag} onValueChange={onBetragChange} unit="€/Monat" step={0.01} />
      </div>
      <button type="button" onClick={onRemove} className="rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50">Entfernen</button>
    </li>
  );
}

export function EigeneKostenposten({ posten, onChange, hinweis }: EigeneKostenpostenProps) {
  const [neuerName, setNeuerName] = useState('');
  const [neuerBetrag, setNeuerBetrag] = useState(0);

  const postenHinzufuegen = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = neuerName.trim();
    if (!name) return;
    onChange([...posten, { id: crypto.randomUUID(), name, betrag: neuerBetrag }]);
    setNeuerName('');
    setNeuerBetrag(0);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Eigene Kostenposten</h3>
      <p className="mt-1 text-sm text-slate-600">{hinweis}</p>
      {posten.length > 0 && (
        <ul className="mt-4 space-y-3">
          {posten.map((eintrag) => (
            <PostenZeile
              key={eintrag.id}
              posten={eintrag}
              onNameChange={(name) => onChange(posten.map((posten) => posten.id === eintrag.id ? { ...posten, name } : posten))}
              onBetragChange={(betrag) => onChange(posten.map((posten) => posten.id === eintrag.id ? { ...posten, betrag } : posten))}
              onRemove={() => onChange(posten.filter((posten) => posten.id !== eintrag.id))}
            />
          ))}
        </ul>
      )}
      <form onSubmit={postenHinzufuegen} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-slate-700">
          Neuer Kostenposten
          <input
            value={neuerName}
            onChange={(event) => setNeuerName(event.target.value)}
            required
            maxLength={80}
            placeholder="z. B. Parkplatz"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <div className="min-w-40 flex-1">
          <NumberInput label="Betrag" value={neuerBetrag} onValueChange={setNeuerBetrag} unit="€/Monat" step={0.01} />
        </div>
        <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Posten hinzufügen</button>
      </form>
    </section>
  );
}

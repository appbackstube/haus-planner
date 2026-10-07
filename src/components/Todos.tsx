import { useLayoutEffect, useRef, useState } from 'react';
import type { Todo } from '../types';

interface TodosProps {
  todos: Todo[];
  onChange: (todos: Todo[]) => void;
}

function BeschreibungTextarea({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={3}
      maxLength={2000}
      placeholder={placeholder}
      className="mt-1 block w-full resize-none overflow-hidden rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
    />
  );
}

export function Todos({ todos, onChange }: TodosProps) {
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [bearbeitung, setBearbeitung] = useState<string | null>(null);
  const [editTitel, setEditTitel] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');
  const offene = todos.filter((todo) => !todo.erledigt).length;

  const addTodo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const neuerTitel = titel.trim();
    if (!neuerTitel) return;
    onChange([...todos, { id: crypto.randomUUID(), titel: neuerTitel, beschreibung: beschreibung.trim(), erledigt: false }]);
    setTitel('');
    setBeschreibung('');
  };

  const updateTodo = (id: string, changes: Partial<Todo>) => {
    onChange(todos.map((todo) => todo.id === id ? { ...todo, ...changes } : todo));
  };

  const saveTodo = (event: React.FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const neuerTitel = editTitel.trim();
    if (!neuerTitel) return;
    updateTodo(id, { titel: neuerTitel, beschreibung: editBeschreibung.trim() });
    setBearbeitung(null);
  };

  const deleteTodo = (todo: Todo) => {
    if (!window.confirm(`Todo „${todo.titel}“ löschen?`)) return;
    onChange(todos.filter((entry) => entry.id !== todo.id));
    if (bearbeitung === todo.id) setBearbeitung(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Todo hinzufügen</h2>
        <form onSubmit={addTodo} className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Titel
            <input value={titel} onChange={(event) => setTitel(event.target.value)} required maxLength={120} placeholder="z. B. Anschlusskosten bei der Gemeinde erfragen" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Beschreibung (optional)
            <BeschreibungTextarea value={beschreibung} onChange={setBeschreibung} placeholder="Details und nächste Schritte" />
          </label>
          <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-sky-600">Todo hinzufügen</button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Todos</h2>
        <p className="mt-1 text-sm text-slate-600">{offene} offen · {todos.length - offene} erledigt</p>
        {todos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Noch keine Todos in dieser Planung.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {[...todos].sort((links, rechts) => Number(links.erledigt) - Number(rechts.erledigt)).map((todo) => (
              <li key={todo.id} className="py-4 first:pt-0 last:pb-0">
                {bearbeitung === todo.id ? (
                  <form onSubmit={(event) => saveTodo(event, todo.id)} className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Titel
                      <input autoFocus value={editTitel} onChange={(event) => setEditTitel(event.target.value)} required maxLength={120} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Beschreibung (optional)
                      <BeschreibungTextarea value={editBeschreibung} onChange={setEditBeschreibung} />
                    </label>
                    <div className="flex gap-3">
                      <button type="submit" className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">Speichern</button>
                      <button type="button" onClick={() => setBearbeitung(null)} className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Abbrechen</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={todo.erledigt} onChange={(event) => updateTodo(todo.id, { erledigt: event.target.checked })} aria-label={`${todo.titel} als ${todo.erledigt ? 'offen' : 'erledigt'} markieren`} className="mt-1 size-5 shrink-0 accent-sky-700" />
                    <div className="min-w-0 flex-1">
                      <p className={`break-words font-medium ${todo.erledigt ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{todo.titel}</p>
                      {todo.beschreibung && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{todo.beschreibung}</p>}
                      <div className="mt-2 flex gap-3">
                        <button type="button" onClick={() => { setBearbeitung(todo.id); setEditTitel(todo.titel); setEditBeschreibung(todo.beschreibung); }} className="text-sm text-sky-700 hover:underline">Bearbeiten</button>
                        <button type="button" onClick={() => deleteTodo(todo)} className="text-sm text-red-700 hover:underline">Löschen</button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

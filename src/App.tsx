import { useRef, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Tabs } from '@base-ui/react/tabs';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { House } from './types';
import { Finanzierung } from './components/Finanzierung';
import { Betriebskosten } from './components/Betriebskosten';
import { Gesamt } from './components/Gesamt';
import { Baukosten } from './components/Baukosten';
import { NotizenUndLinks } from './components/NotizenUndLinks';
import { Materialien } from './components/Materialien';
import { Hausvergleich } from './components/Hausvergleich';
import { HausTeilen } from './components/HausTeilen';
import { GeteiltesHaus } from './components/GeteiltesHaus';
import { berechneBaukosten, leereBauposten } from './utils/bauposten';
import { parseHouseBackup } from './utils/houseBackup';
import { copySharedHouse } from './utils/shareLinks';

function createHouse(name: string): House {
  return {
    id: crypto.randomUUID(),
    name,
    finanzierung: {
      grundstueckpreis: 0,
      baukosten: 0,
      eigenkapital: 0,
      zins: 3.5,
      laufzeit: 30,
      sondertilgung: 0,
    },
    betriebskosten: {
      heizung: 100,
      strom: 80,
      wasser: 25,
      abwasser: 20,
      muell: 20,
      versicherung: 50,
      grundsteuer: 30,
      internet: 40,
      instandhaltung: 100,
    },
    bauposten: leereBauposten(),
    inkludierteLeistungen: {},
    ausgeschlosseneLeistungen: {},
    leistungsstatus: {},
    ausfuehrung: {},
    externeFirmen: {},
    leistungspreise: {},
    eigeneLeistungen: [],
    notizen: '',
    links: [],
    materialien: {},
  };
}

function HouseNameEditor({ house, onRename }: { house: House; onRename: (name: string) => void }) {
  const [draft, setDraft] = useState(house.name);

  const save = () => {
    const name = draft.trim();
    if (!name) {
      setDraft(house.name);
      return;
    }
    setDraft(name);
    if (name !== house.name) onRename(name);
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="mb-5 flex flex-wrap items-end gap-2">
      <label className="flex min-w-48 flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Name des Hauses</span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          maxLength={80}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </label>
      <button type="submit" className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
        Namen speichern
      </button>
    </form>
  );
}

export default function App() {
  const [houses, setHouses] = useLocalStorage<House[]>('hausbau-planner-houses', []);
  const [activeHouseId, setActiveHouseId] = useState<string | null>(houses[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState('baukosten');
  const [backupMessage, setBackupMessage] = useState('');
  const [shareId, setShareId] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('share'));
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeHouse = houses.find((h) => h.id === activeHouseId) ?? houses[0] ?? null;
  const baukosten = activeHouse ? berechneBaukosten(activeHouse).baukosten : 0;

  const addHouse = () => {
    let nummer = 1;
    while (houses.some((house) => house.name === `Haus ${nummer}`)) nummer += 1;
    const house = createHouse(`Haus ${nummer}`);
    setHouses([...houses, house]);
    setActiveHouseId(house.id);
    setActiveTab('baukosten');
  };

  const removeHouse = (id: string) => {
    const houseToRemove = houses.find((house) => house.id === id);
    if (!houseToRemove || !window.confirm(`Haus „${houseToRemove.name}“ mit allen Angaben löschen? Dies kann nicht rückgängig gemacht werden.`)) return;
    const next = houses.filter((h) => h.id !== id);
    setHouses(next);
    if (activeHouseId === id) {
      setActiveHouseId(next[0]?.id ?? null);
      setActiveTab('baukosten');
    }
  };

  const updateHouse = (updated: House) => {
    setHouses(houses.map((h) => (h.id === updated.id ? updated : h)));
  };

  const exportHouses = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(houses, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hausbau-planer.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setBackupMessage('JSON-Datei wurde erstellt.');
  };

  const importHouses = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = parseHouseBackup(await file.text());
      if (!window.confirm(`Alle vorhandenen Häuser durch ${imported.length} Häuser aus der Datei ersetzen?`)) return;
      setHouses(imported);
      setActiveHouseId(imported[0]?.id ?? null);
      setActiveTab('baukosten');
      setBackupMessage(`${imported.length} Häuser importiert.`);
    } catch {
      setBackupMessage('Import fehlgeschlagen: Die JSON-Datei ist ungültig. Vorhandene Häuser bleiben erhalten.');
    } finally {
      event.target.value = '';
    }
  };

  const closeShare = () => {
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(null, '', url.href);
    setShareId(null);
  };

  const importSharedHouse = (sharedHouse: House) => {
    if (!window.confirm(`Haus „${sharedHouse.name}“ als neue Kopie übernehmen? Bestehende Häuser bleiben erhalten.`)) return;
    const house = copySharedHouse(sharedHouse, crypto.randomUUID());
    setHouses([...houses, house]);
    setActiveHouseId(house.id);
    setActiveTab('baukosten');
    closeShare();
  };

  if (shareId !== null) {
    return (
      <div>
        <GeteiltesHaus shareId={shareId} onImport={importSharedHouse} />
        <div className="mx-auto max-w-4xl px-4 pb-6 sm:px-6">
          <button type="button" onClick={closeShare} className="text-sm text-sky-700 underline hover:text-sky-900">Zur eigenen Planung</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Hausbau Planer</h1>
        <p className="text-sm text-slate-500">Finanzierung und Betriebskosten für mehrere Häuser planen</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {houses.map((house) => (
          <div key={house.id} className="flex overflow-hidden rounded-md">
            <button
              type="button"
              onClick={() => { setActiveHouseId(house.id); setActiveTab('baukosten'); }}
              aria-current={house.id === activeHouse.id ? 'true' : undefined}
              className={`px-3 py-1.5 text-sm font-medium ${
                house.id === activeHouse.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {house.name}
            </button>
            <button
              type="button"
              aria-label={`${house.name} löschen`}
              onClick={() => removeHouse(house.id)}
              className={`px-2 text-sm ${house.id === activeHouse.id ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addHouse}
          className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          + Haus
        </button>
        <div className="ml-auto">
          <Menu.Root>
            <Menu.Trigger aria-label="Weitere Optionen" className="flex size-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                <circle cx="12" cy="5" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="19" r="1.75" />
              </svg>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={6} className="z-50 outline-none">
                <Menu.Popup className="min-w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg outline-none">
                  <Menu.Item onClick={exportHouses} className="cursor-pointer rounded px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-sky-100 data-[highlighted]:text-sky-900">
                    JSON exportieren
                  </Menu.Item>
                  <Menu.Item onClick={() => importInputRef.current?.click()} className="cursor-pointer rounded px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-sky-100 data-[highlighted]:text-sky-900">
                    JSON importieren
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>

      <input ref={importInputRef} type="file" accept=".json,application/json" onChange={importHouses} className="hidden" aria-label="JSON-Datei importieren" />
      {backupMessage && <p role="status" className="mb-5 text-sm text-slate-600">{backupMessage}</p>}

      {activeHouse ? (
        <>
          <HouseNameEditor
            key={activeHouse.id}
            house={activeHouse}
            onRename={(name) => updateHouse({ ...activeHouse, name })}
          />
          <Tabs.Root value={activeTab} onValueChange={(newValue) => setActiveTab(newValue as string)}>
          <Tabs.List className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px whitespace-nowrap">
            <Tabs.Tab value="baukosten" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Baukosten
            </Tabs.Tab>
            <Tabs.Tab value="materialien" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Materialien
            </Tabs.Tab>
            <Tabs.Tab value="finanzierung" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Finanzierung
            </Tabs.Tab>
            <Tabs.Tab value="betriebskosten" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Betriebskosten
            </Tabs.Tab>
            <Tabs.Tab value="notizen-und-links" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Notizen &amp; Links
            </Tabs.Tab>
            <Tabs.Tab value="gesamt" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Gesamt
            </Tabs.Tab>
            <Tabs.Tab value="vergleich" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Vergleich
            </Tabs.Tab>
            <Tabs.Tab value="teilen" className="rounded-t-md px-4 py-2 text-sm font-medium text-slate-600 data-[active]:border-b-2 data-[active]:border-sky-600 data-[active]:bg-sky-100 data-[active]:text-sky-800">
              Teilen
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="baukosten" className="pt-4">
            <Baukosten
              key={activeHouse.id}
              house={activeHouse}
              onChange={updateHouse}
            />
          </Tabs.Panel>
          <Tabs.Panel value="materialien" className="pt-4">
            <Materialien key={activeHouse.id} house={activeHouse} onChange={updateHouse} />
          </Tabs.Panel>
          <Tabs.Panel value="finanzierung" className="pt-4">
            <Finanzierung
              data={activeHouse.finanzierung}
              baukosten={baukosten}
              onChange={(finanzierung) => updateHouse({ ...activeHouse, finanzierung })}
            />
          </Tabs.Panel>
          <Tabs.Panel value="betriebskosten" className="pt-4">
            <Betriebskosten
              data={activeHouse.betriebskosten}
              onChange={(betriebskosten) => updateHouse({ ...activeHouse, betriebskosten })}
            />
          </Tabs.Panel>
          <Tabs.Panel value="notizen-und-links" className="pt-4">
            <NotizenUndLinks key={activeHouse.id} house={activeHouse} onChange={updateHouse} />
          </Tabs.Panel>
          <Tabs.Panel value="gesamt" className="pt-4">
            <Gesamt house={activeHouse} />
          </Tabs.Panel>
          <Tabs.Panel value="vergleich" className="pt-4">
            <Hausvergleich houses={houses} />
          </Tabs.Panel>
          <Tabs.Panel value="teilen" className="pt-4">
            <HausTeilen key={activeHouse.id} house={activeHouse} />
          </Tabs.Panel>
          </Tabs.Root>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Noch kein Haus angelegt. Klicke auf „+ Haus" um zu starten.
        </p>
      )}
    </div>
  );
}

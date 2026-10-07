import { useRef, useState } from 'react';
import { usePlanner } from './hooks/usePlanner';
import type { House } from './types';
import { Finanzierung } from './components/Finanzierung';
import { Betriebskosten } from './components/Betriebskosten';
import { AktuelleKosten } from './components/AktuelleKosten';
import { Gesamt } from './components/Gesamt';
import { Baukosten } from './components/Baukosten';
import { NotizenUndLinks } from './components/NotizenUndLinks';
import { Todos } from './components/Todos';
import { Fragenkatalog } from './components/Fragenkatalog';
import { Materialien } from './components/Materialien';
import { Hausvergleich } from './components/Hausvergleich';
import { HausTeilen } from './components/HausTeilen';
import { AppShell } from './components/AppShell';
import { Ueberblick } from './components/Ueberblick';
import { berechneBaukosten, leereBauposten } from './utils/bauposten';
import { parsePlannerBackup } from './utils/houseBackup';
import { beispielBetriebskosten } from './utils/ueberblick';
import { zielFuerBereich } from './utils/navigation';
import type { Hauptbereich, Kostenbereich } from './utils/navigation';

const kostenbereiche: { id: Kostenbereich; label: string }[] = [
  { id: 'baukosten', label: 'Baukosten' },
  { id: 'finanzierung', label: 'Finanzierung' },
  { id: 'betriebskosten', label: 'Betriebskosten im Haus' },
  { id: 'aktuelle-kosten', label: 'Heutige Kosten' },
  { id: 'gesamt', label: 'Monatsübersicht' },
];

function createHouse(name: string): House {
  return {
    id: crypto.randomUUID(),
    name,
    finanzierung: {
      grundstueckpreis: 0,
      baukosten: 0,
      bankgebuehren: 0,
      grundbucheintragungen: 0,
      eigenkapital: 0,
      zins: 3.5,
      laufzeit: 30,
      sondertilgung: 0,
    },
    betriebskosten: { ...beispielBetriebskosten },
    bauposten: leereBauposten(),
    inkludierteLeistungen: {},
    ausgeschlosseneLeistungen: {},
    leistungsstatus: {},
    nichtBenoetigtGruende: {},
    ausfuehrung: {},
    externeFirmen: {},
    leistungspreise: {},
    eigeneLeistungen: [],
    notizen: '',
    links: [],
    materialien: {},
  };
}

function HouseNameEditor({ house, onRename, onClose }: { house: House; onRename: (name: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(house.name);

  const save = () => {
    const name = draft.trim();
    if (!name) {
      setDraft(house.name);
      onClose();
      return;
    }
    setDraft(name);
    if (name !== house.name) onRename(name);
    onClose();
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="mb-5 flex flex-wrap items-end gap-2">
      <label className="flex min-w-48 flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Name des Hauses</span>
        <input
          autoFocus
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
  const { planner, setPlanner, ready, loadError, status, link } = usePlanner();
  const { houses, todos } = planner;
  const setHouses = (next: House[]) => setPlanner((current) => ({ ...current, houses: next }));
  const [activeHouseId, setActiveHouseId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Hauptbereich>('ueberblick');
  const [costSection, setCostSection] = useState<Kostenbereich>('baukosten');
  const [shareOpen, setShareOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeHouse = houses.find((h) => h.id === activeHouseId) ?? houses[0] ?? null;
  const bauBerechnung = activeHouse ? berechneBaukosten(activeHouse) : null;
  const baukosten = bauBerechnung?.baukosten ?? 0;

  const showOverview = () => {
    setActiveSection('ueberblick');
    setShareOpen(false);
    setRenaming(false);
  };

  const navigateTo = (bereich: string) => {
    const ziel = zielFuerBereich(bereich);
    if (ziel.kostenbereich) setCostSection(ziel.kostenbereich);
    setActiveSection(ziel.hauptbereich);
    setShareOpen(false);
  };

  const addHouse = () => {
    let nummer = 1;
    while (houses.some((house) => house.name === `Haus ${nummer}`)) nummer += 1;
    const house = createHouse(`Haus ${nummer}`);
    setHouses([...houses, house]);
    setActiveHouseId(house.id);
    showOverview();
  };

  const removeHouse = (id: string) => {
    const houseToRemove = houses.find((house) => house.id === id);
    if (!houseToRemove || !window.confirm(`Haus „${houseToRemove.name}“ mit allen Angaben löschen? Dies kann nicht rückgängig gemacht werden.`)) return;
    const next = houses.filter((h) => h.id !== id);
    setHouses(next);
    if (activeHouseId === id) {
      setActiveHouseId(next[0]?.id ?? null);
      showOverview();
    }
  };

  const updateHouse = (updated: House) => {
    setHouses(houses.map((h) => (h.id === updated.id ? updated : h)));
  };

  const exportHouses = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(planner, null, 2)], { type: 'application/json' }));
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
      const imported = parsePlannerBackup(await file.text());
      if (!window.confirm(`Alle vorhandenen Häuser und Todos durch ${imported.houses.length} Häuser und ${imported.todos.length} Todos aus der Datei ersetzen?`)) return;
      setPlanner(imported);
      setActiveHouseId(imported.houses[0]?.id ?? null);
      showOverview();
      setBackupMessage(`${imported.houses.length} Häuser und ${imported.todos.length} Todos importiert.`);
    } catch {
      setBackupMessage('Import fehlgeschlagen: Die JSON-Datei ist ungültig. Vorhandene Häuser und Todos bleiben erhalten.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <AppShell
      loading={!ready && !loadError}
      blocked={!ready && loadError}
      status={status}
      houses={houses}
      activeHouseId={activeHouse?.id ?? null}
      onSelectHouse={(id) => { setActiveHouseId(id); showOverview(); }}
      onAddHouse={addHouse}
      canAddHouse={ready}
      shareOpen={shareOpen}
      onShare={() => setShareOpen((offen) => !offen)}
      onExport={exportHouses}
      onImport={() => importInputRef.current?.click()}
      onRename={() => setRenaming(true)}
      onDelete={() => { if (activeHouse) removeHouse(activeHouse.id); }}
      activeSection={activeSection}
      onNavigate={(section) => { setActiveSection(section); setShareOpen(false); }}
      navigationEnabled={ready}
    >
      {ready && <>

      {activeHouse && activeSection === 'kosten' && <nav aria-label="Kostenbereiche" className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {kostenbereiche.map(({ id, label }) => (
          <button key={id} type="button" aria-current={costSection === id ? 'page' : undefined} onClick={() => setCostSection(id)} className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-sky-600 ${costSection === id ? 'border-sky-700 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-800'}`}>{label}</button>
        ))}
      </nav>}
      <input ref={importInputRef} type="file" accept=".json,application/json" onChange={importHouses} className="hidden" aria-label="JSON-Datei importieren" />
      {backupMessage && <p role="status" className="mb-5 text-sm text-slate-600">{backupMessage}</p>}
      {shareOpen && <div id="teilen-bereich" className="mb-6">
        <div className="mb-2 flex justify-end"><button type="button" onClick={() => setShareOpen(false)} className="text-sm text-slate-600 underline-offset-4 hover:text-sky-700 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600">Schließen</button></div>
        <HausTeilen link={link} />
      </div>}

      {activeHouse ? (
        <>
          {renaming && <HouseNameEditor key={activeHouse.id} house={activeHouse} onRename={(name) => updateHouse({ ...activeHouse, name })} onClose={() => setRenaming(false)} />}
          {activeSection === 'ueberblick' && <section>
            <Ueberblick house={activeHouse} onNavigate={navigateTo} />
          </section>}
          {activeSection === 'kosten' && <section aria-label={kostenbereiche.find(({ id }) => id === costSection)?.label}>
            {costSection === 'baukosten' && <Baukosten key={activeHouse.id} house={activeHouse} onChange={updateHouse} />}
            {costSection === 'finanzierung' && <Finanzierung data={activeHouse.finanzierung} baukosten={baukosten} kreditAusgeschlossen={bauBerechnung?.kreditAusgeschlossen ?? 0} onChange={(finanzierung) => updateHouse({ ...activeHouse, finanzierung })} />}
            {costSection === 'betriebskosten' && <Betriebskosten data={activeHouse.betriebskosten} onChange={(betriebskosten) => updateHouse({ ...activeHouse, betriebskosten })} />}
            {costSection === 'aktuelle-kosten' && <AktuelleKosten data={activeHouse.aktuelleKosten} onChange={(aktuelleKosten) => updateHouse({ ...activeHouse, aktuelleKosten })} />}
            {costSection === 'gesamt' && <Gesamt house={activeHouse} />}
          </section>}
          {activeSection === 'haus' && <section aria-label="Materialien">
            <Materialien key={activeHouse.id} house={activeHouse} onChange={updateHouse} />
          </section>}
          {activeSection === 'vergleich' && <section>
            <Hausvergleich houses={houses} />
          </section>}
        </>
      ) : !['todos', 'notizen', 'links', 'fragenkatalog'].includes(activeSection) && (
        <section className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-sky-800 to-teal-700 px-6 py-10 text-white sm:px-10 sm:py-14">
            <p className="text-sm font-medium text-sky-100">Dein Weg zum eigenen Haus</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Endlich Klarheit bei den Hauskosten.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-sky-50">Du musst nicht alles wissen. Starte mit einem groben Hauspreis. Wir zeigen dir dann, welche Kosten dazukommen und was monatlich auf dich zukommt.</p>
            <button type="button" onClick={addHouse} className="mt-7 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-sky-900 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Erstes Haus planen
            </button>
          </div>
          <div className="grid gap-6 px-6 py-8 sm:grid-cols-3 sm:px-10">
            <div><span className="text-sm font-bold text-sky-700">01 · Haus</span><h3 className="mt-1 font-semibold text-slate-900">Grob planen</h3><p className="mt-1 text-sm leading-6 text-slate-600">Trage einen ersten Preis ein. Du kannst ihn später ändern.</p></div>
            <div><span className="text-sm font-bold text-sky-700">02 · Geld</span><h3 className="mt-1 font-semibold text-slate-900">Monatliche Rate sehen</h3><p className="mt-1 text-sm leading-6 text-slate-600">Ergänze Grundstück, Eigenkapital und Kreditdaten.</p></div>
            <div><span className="text-sm font-bold text-sky-700">03 · Alltag</span><h3 className="mt-1 font-semibold text-slate-900">Betriebskosten prüfen</h3><p className="mt-1 text-sm leading-6 text-slate-600">Passe die Beispielwerte an deine Situation an.</p></div>
          </div>
        </section>
      )}
      {activeSection === 'todos' && <section aria-label="Todos"><Todos todos={todos} onChange={(next) => setPlanner((current) => ({ ...current, todos: next }))} /></section>}
      {(activeSection === 'notizen' || activeSection === 'links') && <section aria-label={activeSection === 'notizen' ? 'Notizen' : 'Links'}>
        {activeHouse
          ? <NotizenUndLinks key={activeHouse.id} house={activeHouse} onChange={updateHouse} bereich={activeSection} />
          : <p className="text-sm text-slate-600">Lege zuerst ein Haus an, um {activeSection === 'notizen' ? 'Notizen' : 'Links'} zu speichern.</p>}
      </section>}
      {activeSection === 'fragenkatalog' && <section aria-label="Fragenkatalog">
        {activeHouse
          ? <Fragenkatalog key={activeHouse.id} house={activeHouse} onChange={updateHouse} />
          : <p className="text-sm text-slate-600">Lege zuerst ein Haus an, um Fragen und Antworten zu speichern.</p>}
      </section>}
      </>}
    </AppShell>
  );
}

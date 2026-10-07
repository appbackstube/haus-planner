import { useState } from 'react';
import type { Ausfuehrender, House } from '../types';
import { leistungsstatus, leistungspreis } from '../utils/bauposten';
import type { Leistungsstatus } from '../types';
import { passtLeistungsFilter } from '../utils/leistungsFilter';
import type { LeistungsFilter } from '../utils/leistungsFilter';

interface LeistungsChecklisteProps {
  house: House;
  onChange: (house: House) => void;
}

type Prioritaet = 'Hoch' | 'Mittel' | 'Optional';

interface Leistung {
  id: string;
  name: string;
  prioritaet: Prioritaet;
}

interface Kategorie {
  id: string;
  titel: string;
  leistungen: Leistung[];
}

const kategorien: Kategorie[] = [
  {
    id: 'planung',
    titel: 'Planung & Baugrund',
    leistungen: [
      { id: 'planung', name: 'Planung und Genehmigungen', prioritaet: 'Hoch' },
      { id: 'einreichplan', name: 'Einreichplan', prioritaet: 'Hoch' },
      { id: 'ausfuehrungsplan', name: 'Ausführungs- und Detailpläne', prioritaet: 'Hoch' },
      { id: 'vermessung', name: 'Grundstücksvermessung', prioritaet: 'Hoch' },
      { id: 'bodengutachten', name: 'Bodengutachten', prioritaet: 'Hoch' },
      { id: 'statik', name: 'Statik und Tragwerksplanung', prioritaet: 'Hoch' },
      { id: 'elektroplanung', name: 'Elektro- und Lichtplanung', prioritaet: 'Mittel' },
      { id: 'sanitaerplanung', name: 'Bad- und Sanitärplanung', prioritaet: 'Mittel' },
      { id: 'behoerdengebuehren', name: 'Behördengebühren im Angebot berücksichtigt', prioritaet: 'Mittel' },
      { id: 'energieausweis', name: 'Energieausweis', prioritaet: 'Mittel' },
    ],
  },
  {
    id: 'vertrag',
    titel: 'Vertrag & Leistungsumfang',
    leistungen: [
      { id: 'leistungsverzeichnis', name: 'Leistungsverzeichnis mit Mengen und Preisen', prioritaet: 'Hoch' },
      { id: 'materialbeschreibung', name: 'Materialien und Ausführung genau beschrieben', prioritaet: 'Hoch' },
      { id: 'leistungsgrenzen', name: 'Nicht enthaltene Leistungen ausdrücklich genannt', prioritaet: 'Hoch' },
      { id: 'vertragsplaene', name: 'Pläne und Energieausweis Vertragsbestandteil', prioritaet: 'Hoch' },
      { id: 'preisregelung', name: 'Preisregelung und Nachträge schriftlich festgelegt', prioritaet: 'Hoch' },
      { id: 'zahlungsplan', name: 'Zahlungsplan nach Baufortschritt vereinbart', prioritaet: 'Hoch' },
      { id: 'bauzeitplan', name: 'Baubeginn und Fertigstellung vereinbart', prioritaet: 'Mittel' },
      { id: 'gewaehrleistungsregelung', name: 'Gewährleistung und Mängelbearbeitung geregelt', prioritaet: 'Mittel' },
    ],
  },
  {
    id: 'baustelle',
    titel: 'Baustelle & Bauausführung',
    leistungen: [
      { id: 'baustelleneinrichtung', name: 'Baustelleneinrichtung, Gerüste und Bauzaun', prioritaet: 'Hoch' },
      { id: 'baustrom', name: 'Baustrom und Bauwasser', prioritaet: 'Hoch' },
      { id: 'baustellenzufahrt', name: 'Baustellenzufahrt und Lagerfläche', prioritaet: 'Mittel' },
      { id: 'baustellenkoordination', name: 'Baustellenkoordination / Bauaufsicht', prioritaet: 'Mittel' },
      { id: 'bauschutt', name: 'Bauschuttentsorgung', prioritaet: 'Mittel' },
      { id: 'bauversicherung', name: 'Bauversicherung im Leistungsumfang', prioritaet: 'Optional' },
    ],
  },
  {
    id: 'fundament',
    titel: 'Erdarbeiten & Fundament',
    leistungen: [
      { id: 'erdarbeiten', name: 'Erdarbeiten und Aushub', prioritaet: 'Hoch' },
      { id: 'bodenplatte', name: 'Fundamentplatte / Bodenplatte', prioritaet: 'Hoch' },
      { id: 'abdichtung', name: 'Abdichtung und Dämmung', prioritaet: 'Hoch' },
      { id: 'bodenaustausch', name: 'Bodenaustausch bei Bedarf geregelt', prioritaet: 'Mittel' },
      { id: 'baugrubensicherung', name: 'Sicherung der Baugrube bei Bedarf', prioritaet: 'Mittel' },
      { id: 'entsorgung', name: 'Abtransport und Entsorgung', prioritaet: 'Mittel' },
      { id: 'frostschutz', name: 'Frostschutz und Unterbau', prioritaet: 'Mittel' },
      { id: 'bewehrung', name: 'Bewehrung der Bodenplatte', prioritaet: 'Mittel' },
      { id: 'drainage', name: 'Drainage', prioritaet: 'Optional' },
      { id: 'keller', name: 'Keller und Kellerabdichtung', prioritaet: 'Optional' },
    ],
  },
  {
    id: 'huelle',
    titel: 'Rohbau & Gebäudehülle',
    leistungen: [
      { id: 'aussenwaende', name: 'Außenwände', prioritaet: 'Hoch' },
      { id: 'dach', name: 'Dachkonstruktion und Eindeckung', prioritaet: 'Hoch' },
      { id: 'fenster', name: 'Fenster und Außentüren', prioritaet: 'Hoch' },
      { id: 'waermedaemmung', name: 'Wärmedämmung der Gebäudehülle', prioritaet: 'Hoch' },
      { id: 'fassade', name: 'Fassade / Außenputz', prioritaet: 'Mittel' },
      { id: 'dachdaemmung', name: 'Dachdämmung und luftdichte Anschlüsse', prioritaet: 'Mittel' },
      { id: 'dachentwaesserung', name: 'Dachentwässerung', prioritaet: 'Mittel' },
      { id: 'fensterbaenke', name: 'Fensterbänke', prioritaet: 'Mittel' },
      { id: 'sonnenschutz', name: 'Rollläden oder Sonnenschutz', prioritaet: 'Optional' },
      { id: 'kamin', name: 'Kamin / Rauchfang', prioritaet: 'Optional' },
    ],
  },
  {
    id: 'technik',
    titel: 'Anschlüsse & Haustechnik',
    leistungen: [
      { id: 'anschluesse', name: 'Hausanschlüsse', prioritaet: 'Hoch' },
      { id: 'elektro', name: 'Elektroinstallation', prioritaet: 'Hoch' },
      { id: 'sanitaer', name: 'Wasser- und Sanitärinstallation', prioritaet: 'Hoch' },
      { id: 'heizung', name: 'Heizung und Warmwasser', prioritaet: 'Hoch' },
      { id: 'wasseranschluss', name: 'Wasseranschluss und Zähler', prioritaet: 'Hoch' },
      { id: 'kanalanschluss', name: 'Kanalanschluss', prioritaet: 'Hoch' },
      { id: 'stromanschluss', name: 'Stromanschluss und Zähler', prioritaet: 'Hoch' },
      { id: 'heizungsverteilung', name: 'Wärmeverteilung / Fußbodenheizung', prioritaet: 'Mittel' },
      { id: 'heizung_inbetriebnahme', name: 'Inbetriebnahme der Heizanlage', prioritaet: 'Mittel' },
      { id: 'anschlussgebuehren', name: 'Anschlussgebühren berücksichtigt', prioritaet: 'Mittel' },
      { id: 'netzwerk', name: 'Netzwerk- und Datenleitungen', prioritaet: 'Mittel' },
      { id: 'lueftung', name: 'Wohnraumlüftung', prioritaet: 'Optional' },
      { id: 'photovoltaik', name: 'Photovoltaikanlage', prioritaet: 'Optional' },
      { id: 'smart_home', name: 'Smart Home', prioritaet: 'Optional' },
      { id: 'internetanschluss', name: 'Internet-/Telekomanschluss', prioritaet: 'Optional' },
    ],
  },
  {
    id: 'innenausbau',
    titel: 'Innenausbau & Ausstattung',
    leistungen: [
      { id: 'innenausbau', name: 'Innenwände und Innentüren', prioritaet: 'Hoch' },
      { id: 'steckdosen', name: 'Anzahl der Steckdosen und Schalter festgelegt', prioritaet: 'Mittel' },
      { id: 'innenputz', name: 'Innenputz', prioritaet: 'Mittel' },
      { id: 'estrich', name: 'Estrich', prioritaet: 'Mittel' },
      { id: 'bodenbelaege', name: 'Bodenbeläge', prioritaet: 'Mittel' },
      { id: 'baeder', name: 'Badausstattung', prioritaet: 'Mittel' },
      { id: 'armaturen', name: 'Sanitärobjekte und Armaturen festgelegt', prioritaet: 'Mittel' },
      { id: 'treppe', name: 'Innentreppe', prioritaet: 'Mittel' },
      { id: 'fliesen', name: 'Fliesenarbeiten', prioritaet: 'Mittel' },
      { id: 'malerarbeiten', name: 'Malerarbeiten', prioritaet: 'Mittel' },
      { id: 'kueche', name: 'Küche', prioritaet: 'Optional' },
    ],
  },
  {
    id: 'aussenbereich',
    titel: 'Außenbereich',
    leistungen: [
      { id: 'aussenanlagen_pauschal', name: 'Außenanlagen (Pauschale)', prioritaet: 'Mittel' },
      { id: 'zufahrt', name: 'Zufahrt und Wege', prioritaet: 'Mittel' },
      { id: 'entwaesserung_aussen', name: 'Entwässerung im Außenbereich', prioritaet: 'Mittel' },
      { id: 'regenwasser', name: 'Regenwasserableitung / Versickerung', prioritaet: 'Mittel' },
      { id: 'gelaendemodellierung', name: 'Geländemodellierung und Böschungen', prioritaet: 'Mittel' },
      { id: 'terrasse', name: 'Terrasse', prioritaet: 'Optional' },
      { id: 'garage', name: 'Garage oder Carport', prioritaet: 'Optional' },
      { id: 'garten', name: 'Gartengestaltung', prioritaet: 'Optional' },
      { id: 'zaun', name: 'Zaun oder Einfriedung', prioritaet: 'Optional' },
    ],
  },
  {
    id: 'uebergabe',
    titel: 'Abnahme & Übergabe',
    leistungen: [
      { id: 'abnahmeprotokoll', name: 'Gemeinsame Abnahme mit Übergabeprotokoll', prioritaet: 'Hoch' },
      { id: 'pruefbefunde', name: 'Erforderliche Prüf- und Abnahmebefunde', prioritaet: 'Hoch' },
      { id: 'bestandsplaene', name: 'Bestandspläne und Anlagendokumentation', prioritaet: 'Mittel' },
      { id: 'fertigstellungsanzeige', name: 'Unterstützung bei Fertigstellungsanzeige / Benützungsbewilligung', prioritaet: 'Mittel' },
      { id: 'blower_door', name: 'Luftdichtheitsprüfung (Blower-Door-Test)', prioritaet: 'Mittel' },
      { id: 'endreinigung', name: 'Baustellenendreinigung', prioritaet: 'Mittel' },
      { id: 'einweisung', name: 'Einweisung in Heizung und Haustechnik', prioritaet: 'Mittel' },
    ],
  },
];

const farben: Record<Prioritaet, string> = {
  Hoch: 'bg-sky-50 text-sky-700',
  Mittel: 'bg-amber-50 text-amber-800',
  Optional: 'bg-slate-100 text-slate-600',
};

const statusNamen: Record<Leistungsstatus, string> = {
  ungeklaert: 'Ungeklärt',
  im_hauspreis: 'Im Hauspreis',
  separat: 'Separat',
  nicht_benoetigt: 'Nicht benötigt',
};

const leererFilter: LeistungsFilter = { titel: '', status: 'alle', ausfuehrung: 'alle' };

function LeistungsZeile({
  house,
  onChange,
  id,
  name,
  prioritaet,
  onRemove,
  offen,
  onToggle,
}: LeistungsChecklisteProps & { id: string; name: string; prioritaet?: Prioritaet; onRemove?: () => void; offen: boolean; onToggle: () => void }) {
  const status = leistungsstatus(house, id);
  const benoetigt = status !== 'nicht_benoetigt';
  const ausfuehrender = house.ausfuehrung?.[id] ?? 'offen';
  const preis = leistungspreis(house, id);
  const [preisEingabe, setPreisEingabe] = useState<string | null>(null);
  const detailsId = `leistung-${id}-details`;

  return (
    <div className="border-t border-slate-200 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2 py-2.5 sm:gap-3">
        <div className="flex min-w-40 flex-1 items-center gap-2 text-sm font-medium text-slate-800">
          {prioritaet && (
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-normal ${farben[prioritaet]}`}>{prioritaet}</span>
          )}
          <span className="min-w-0 break-words">{name}</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${status === 'separat' ? 'bg-amber-50 text-amber-800' : status === 'ungeklaert' ? 'bg-slate-100 text-slate-600' : 'bg-green-50 text-green-800'}`}>
          {statusNamen[status]}
        </span>
        {status === 'separat' && preis > 0 && (
          <span className="text-xs font-medium text-slate-700">{preis.toLocaleString('de-AT')} €</span>
        )}
        <button
          type="button"
          aria-label={`${name}: Details ${offen ? 'schließen' : 'bearbeiten'}`}
          aria-expanded={offen}
          aria-controls={offen ? detailsId : undefined}
          onClick={onToggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-xl leading-none text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-600"
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </div>
      {status === 'nicht_benoetigt' && house.nichtBenoetigtGruende?.[id]?.trim() && (
        <p className="break-words whitespace-pre-wrap pb-2 text-sm text-slate-600">Grund: {house.nichtBenoetigtGruende[id]}</p>
      )}
      {offen && (
      <div id={detailsId} className="mb-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => onChange({
              ...house,
              leistungsstatus: { ...house.leistungsstatus, [id]: event.target.value as Leistungsstatus },
            })}
            aria-label={`${name}: Status`}
            className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="ungeklaert">Ungeklärt</option>
            <option value="im_hauspreis">Im Hauspreis enthalten</option>
            <option value="separat">Separat zu bezahlen</option>
            <option value="nicht_benoetigt">Nicht benötigt</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600">
          <span>Ausführung durch</span>
          <select
            value={benoetigt ? ausfuehrender : 'nicht_benoetigt'}
            disabled={!benoetigt}
            onChange={(event) => onChange({
              ...house,
              ausfuehrung: { ...house.ausfuehrung, [id]: event.target.value as Ausfuehrender },
            })}
            aria-label={`${name}: Ausführung durch`}
            className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="nicht_benoetigt" disabled>Nicht benötigt</option>
            <option value="offen">Noch offen</option>
            <option value="hausanbieter">Hausanbieter</option>
            <option value="eigenleistung">Eigenleistung</option>
            <option value="externer_betrieb">Externer Betrieb</option>
          </select>
        </label>
        {status === 'nicht_benoetigt' && (
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 sm:col-span-2 xl:col-span-3">
            <span>Grund für „Nicht benötigt“</span>
            <textarea
              value={house.nichtBenoetigtGruende?.[id] ?? ''}
              onChange={(event) => onChange({
                ...house,
                nichtBenoetigtGruende: { ...house.nichtBenoetigtGruende, [id]: event.target.value },
              })}
              rows={2}
              maxLength={500}
              aria-label={`${name}: Grund für nicht benötigt`}
              placeholder="Warum wird diese Leistung nicht benötigt?"
              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </label>
        )}
        {benoetigt && ausfuehrender === 'externer_betrieb' && (
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600">
            <span>Firma</span>
            <input
              type="text"
              value={house.externeFirmen?.[id] ?? ''}
              onChange={(event) => onChange({
                ...house,
                externeFirmen: { ...house.externeFirmen, [id]: event.target.value },
              })}
              maxLength={100}
              aria-label={`${name}: Name des externen Betriebs`}
              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </label>
        )}
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600">
          <span>Preis (€)</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={preisEingabe ?? (preis === 0 ? '' : preis)}
            placeholder="0"
            onChange={(event) => {
              const eingabe = event.target.value;
              setPreisEingabe(eingabe);
              onChange({
                ...house,
                leistungspreise: { ...house.leistungspreise, [id]: Math.max(0, Number(eingabe) || 0) },
              });
            }}
            onBlur={() => setPreisEingabe(null)}
            aria-label={`${name}: Preis in Euro`}
            className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label className="flex items-center gap-2 self-end py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(house.kreditAusgeschlosseneLeistungen?.[id]) && status === 'separat'}
            disabled={status !== 'separat'}
            onChange={(event) => onChange({
              ...house,
              kreditAusgeschlosseneLeistungen: { ...house.kreditAusgeschlosseneLeistungen, [id]: event.target.checked },
            })}
            className="h-4 w-4 accent-sky-700 disabled:opacity-50"
          />
          Aus dem Kredit ausgeschlossen
        </label>
        {onRemove && (
          <button type="button" aria-label={`${name} entfernen`} onClick={onRemove} className="self-end rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50">
            Entfernen
          </button>
        )}
      </div>
      )}
    </div>
  );
}

export function LeistungsCheckliste({ house, onChange }: LeistungsChecklisteProps) {
  const [neuerPunkt, setNeuerPunkt] = useState('');
  const [offeneLeistung, setOffeneLeistung] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeistungsFilter>(leererFilter);
  const eigeneLeistungen = house.eigeneLeistungen ?? [];
  const sichtbareEigeneLeistungen = eigeneLeistungen.filter((leistung) => passtLeistungsFilter(house, leistung, filter));
  const sichtbareKategorien = kategorien.map((kategorie) => ({
    ...kategorie,
    sichtbareLeistungen: kategorie.leistungen.filter((leistung) => passtLeistungsFilter(house, leistung, filter)),
  })).filter((kategorie) => kategorie.sichtbareLeistungen.length > 0);
  const filterAktiv = filter.titel.trim() !== '' || filter.status !== 'alle' || filter.ausfuehrung !== 'alle';
  const istGeklaert = (id: string) => leistungsstatus(house, id) !== 'ungeklaert';
  const anzahl = kategorien.reduce((summe, kategorie) => summe + kategorie.leistungen.length, eigeneLeistungen.length);
  const bestaetigt = kategorien.reduce(
    (summe, kategorie) => summe + kategorie.leistungen.filter((leistung) => istGeklaert(leistung.id)).length,
    eigeneLeistungen.filter((leistung) => istGeklaert(leistung.id)).length,
  );
  const ohnePreis = [
    ...kategorien.flatMap((kategorie) => kategorie.leistungen),
    ...eigeneLeistungen,
  ].filter((leistung) => leistungsstatus(house, leistung.id) === 'separat' && leistungspreis(house, leistung.id) === 0).length;

  const punktHinzufuegen = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = neuerPunkt.trim();
    if (!name) return;
    onChange({ ...house, eigeneLeistungen: [...eigeneLeistungen, { id: `eigen-${crypto.randomUUID()}`, name }] });
    setNeuerPunkt('');
    setFilter(leererFilter);
  };

  const punktEntfernen = (id: string) => {
    const inkludierteLeistungen = { ...house.inkludierteLeistungen };
    const ausgeschlosseneLeistungen = { ...house.ausgeschlosseneLeistungen };
    const kreditAusgeschlosseneLeistungen = { ...house.kreditAusgeschlosseneLeistungen };
    const leistungsstatusWerte = { ...house.leistungsstatus };
    const nichtBenoetigtGruende = { ...house.nichtBenoetigtGruende };
    const ausfuehrung = { ...house.ausfuehrung };
    const externeFirmen = { ...house.externeFirmen };
    const leistungspreise = { ...house.leistungspreise };
    delete inkludierteLeistungen[id];
    delete ausgeschlosseneLeistungen[id];
    delete kreditAusgeschlosseneLeistungen[id];
    delete leistungsstatusWerte[id];
    delete nichtBenoetigtGruende[id];
    delete ausfuehrung[id];
    delete externeFirmen[id];
    delete leistungspreise[id];
    onChange({
      ...house,
      inkludierteLeistungen,
      ausgeschlosseneLeistungen,
      kreditAusgeschlosseneLeistungen,
      leistungsstatus: leistungsstatusWerte,
      nichtBenoetigtGruende,
      ausfuehrung,
      externeFirmen,
      leistungspreise,
      eigeneLeistungen: eigeneLeistungen.filter((leistung) => leistung.id !== id),
    });
    setOffeneLeistung(null);
  };

  const leistungUmschalten = (id: string) => {
    setOffeneLeistung((aktuell) => aktuell === id ? null : id);
  };

  return (
    <section className="space-y-4 border-t border-slate-200 pt-6" aria-labelledby="leistungscheckliste-titel">
      <div>
        <h3 id="leistungscheckliste-titel" className="text-lg font-semibold text-slate-900">Leistungen prüfen</h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          Tippe bei einer Leistung auf ⋯ für Status, Ausführung und Preis.
        </p>
        <p className="mt-2 text-sm font-medium text-sky-700" aria-live="polite">
          {bestaetigt} von {anzahl} Leistungen geklärt
        </p>
        {ohnePreis > 0 && (
          <p className="mt-1 text-sm font-medium text-amber-800" role="status">
            {ohnePreis} separat zu bezahlende {ohnePreis === 1 ? 'Leistung hat' : 'Leistungen haben'} noch keinen Preis.
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Titel suchen
            <input
              type="search"
              value={filter.titel}
              onChange={(event) => { setFilter({ ...filter, titel: event.target.value }); setOffeneLeistung(null); }}
              placeholder="Leistung suchen"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Status
            <select
              value={filter.status}
              onChange={(event) => { setFilter({ ...filter, status: event.target.value as LeistungsFilter['status'] }); setOffeneLeistung(null); }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="alle">Alle Status</option>
              <option value="ungeklaert">Ungeklärt</option>
              <option value="im_hauspreis">Im Hauspreis</option>
              <option value="separat">Separat zu bezahlen</option>
              <option value="nicht_benoetigt">Nicht benötigt</option>
              <option value="ohne_preis">Separat ohne Preis</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Ausführung durch
            <select
              value={filter.ausfuehrung}
              onChange={(event) => { setFilter({ ...filter, ausfuehrung: event.target.value as LeistungsFilter['ausfuehrung'] }); setOffeneLeistung(null); }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="alle">Alle Ausführenden</option>
              <option value="offen">Noch offen</option>
              <option value="hausanbieter">Hausanbieter</option>
              <option value="eigenleistung">Eigenleistung</option>
              <option value="externer_betrieb">Externer Betrieb</option>
              <option value="nicht_benoetigt">Nicht benötigt</option>
            </select>
          </label>
        </div>
        {filterAktiv && (
          <button type="button" onClick={() => { setFilter(leererFilter); setOffeneLeistung(null); }} className="mt-2 text-sm text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600">Filter zurücksetzen</button>
        )}
        <details className="mt-2 text-sm text-slate-600">
          <summary className="w-fit cursor-pointer text-sky-700">Wie werden Preise berechnet?</summary>
          <p className="mt-1 max-w-3xl">
            Nur Leistungen mit „Separat zu bezahlen“ erhöhen die Baukosten. Die Ausführung ändert keinen Preis.
            Prüfe bei alten Angaben, ob die Leistung wirklich im Hauspreis enthalten ist.
          </p>
        </details>
      </div>
      {sichtbareKategorien.length === 0 && sichtbareEigeneLeistungen.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Keine passenden Leistungen gefunden.</p>
      )}
      <div className="space-y-2">
        {sichtbareKategorien.map((kategorie) => {
          const anzahlBestaetigt = kategorie.leistungen.filter((leistung) => istGeklaert(leistung.id)).length;
          return (
            <section key={kategorie.id} aria-labelledby={`kategorie-${kategorie.id}`} className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-3 px-4 py-3">
                <h4 id={`kategorie-${kategorie.id}`} className="flex-1 text-sm font-semibold text-slate-900">{kategorie.titel}</h4>
                <span className="whitespace-nowrap text-xs text-slate-500">{anzahlBestaetigt}/{kategorie.leistungen.length} geklärt</span>
              </div>
              <div className="px-4 pb-2">
                {kategorie.sichtbareLeistungen.map((leistung) => (
                  <LeistungsZeile
                    key={leistung.id}
                    house={house}
                    onChange={onChange}
                    {...leistung}
                    offen={offeneLeistung === leistung.id}
                    onToggle={() => leistungUmschalten(leistung.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <section aria-labelledby="eigene-leistungen-titel" className="rounded-lg border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3 px-4 py-3">
          <h4 id="eigene-leistungen-titel" className="flex-1 text-sm font-semibold text-slate-900">Eigene Punkte</h4>
        <span className="text-xs text-slate-500">{filterAktiv ? sichtbareEigeneLeistungen.length : eigeneLeistungen.length} Punkte</span>
        </div>
        <div className="px-4 pb-4">
        <p className="text-sm text-slate-600">Ergänze Leistungen, die für dein Haus oder dein Angebot wichtig sind.</p>
        {sichtbareEigeneLeistungen.length > 0 && (
          <div className="mt-3">
            {sichtbareEigeneLeistungen.map((leistung) => (
              <LeistungsZeile
                key={leistung.id}
                house={house}
                onChange={onChange}
                {...leistung}
                onRemove={() => punktEntfernen(leistung.id)}
                offen={offeneLeistung === leistung.id}
                onToggle={() => leistungUmschalten(leistung.id)}
              />
            ))}
          </div>
        )}
        <form onSubmit={punktHinzufuegen} className="mt-3 flex flex-wrap gap-2">
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-slate-700">
            Neuer Punkt
            <input
              value={neuerPunkt}
              onChange={(event) => setNeuerPunkt(event.target.value)}
              maxLength={120}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <button type="submit" className="self-end rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
            Punkt hinzufügen
          </button>
        </form>
        </div>
      </section>
      <p className="text-sm text-slate-500">
        Prüfe zusätzlich Grundstückskauf, Kaufnebenkosten und Finanzierungsgebühren im Budget.
        Lass den Leistungsumfang für dein Bauvorhaben prüfen: Diese Liste kann nicht für jedes Haus
        und jedes Bundesland vollständig sein.
      </p>
    </section>
  );
}

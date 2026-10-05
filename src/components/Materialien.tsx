import { useState } from 'react';
import type { House } from '../types';
import { hatOffeneAngaben } from '../utils/materialien';

interface MaterialienProps {
  house: House;
  onChange: (house: House) => void;
}

const bereiche = [
  {
    titel: 'Wände',
    punkte: [
      { id: 'aussenwand', name: 'Außenwand', felder: [
        ['aufbau', 'Wandaufbau', 'z. B. Ziegel mit Außendämmung'],
        ['daemmung', 'Dämmstoff und Stärke', 'z. B. Mineralwolle, 20 cm'],
        ['waermewert', 'Wärmedämmwert laut Angebot', 'z. B. U-Wert der gesamten Wand'],
        ['aussenlaerm', 'Schutz vor Außenlärm', 'z. B. Angaben zum Wandaufbau'],
      ] },
      { id: 'innenwand', name: 'Innenwände', felder: [
        ['bauweise', 'Bauweise und Material', 'z. B. Ziegel oder Trockenbau'],
        ['raumtrennung', 'Raumtrennung', 'z. B. zwischen Schlaf- und Wohnbereich'],
        ['schallschutz', 'Schallschutz zwischen Räumen', 'z. B. Wandaufbau und Anschlüsse'],
      ] },
      { id: 'trennwand', name: 'Trennwand zu anderen Wohneinheiten', felder: [
        ['aufbau', 'Wandaufbau', 'z. B. getrennte Wandschalen'],
        ['schallschutz', 'Schallschutznachweis', 'z. B. Angaben des Anbieters'],
        ['anschluesse', 'Anschlüsse und Entkopplung', 'z. B. zu Decke und Boden'],
      ] },
    ],
  },
  {
    titel: 'Fenster & Türen',
    punkte: [
      { id: 'fenster', name: 'Fenster', felder: [
        ['rahmen', 'Rahmenmaterial', 'z. B. Holz-Alu'],
        ['verglasung', 'Verglasung', 'z. B. Dreifachverglasung'],
        ['uw', 'Uw-Wert des gesamten Fensters', 'Angabe aus dem Angebot'],
        ['laerm', 'Schutz vor Außenlärm', 'z. B. Schallschutzverglasung'],
      ] },
      { id: 'aussentuer', name: 'Außentüren', felder: [
        ['material', 'Türblatt und Rahmen', 'z. B. Holz oder Aluminium'],
        ['dichtung', 'Dichtung und Einbau', 'z. B. luftdichter Anschluss'],
        ['waerme', 'Wärmedämmwert der Tür', 'Angabe aus dem Angebot'],
        ['laerm', 'Schutz vor Außenlärm', 'Falls relevant'],
      ] },
      { id: 'innentuer', name: 'Innentüren', felder: [
        ['material', 'Türblatt und Zarge', 'z. B. Vollspan mit Holzzarge'],
        ['schall', 'Schutz vor Geräuschen zwischen Räumen', 'z. B. Dichtungen oder absenkbare Bodendichtung'],
      ] },
      { id: 'sonnenschutz', name: 'Sonnenschutz', felder: [
        ['system', 'System und Position', 'z. B. außenliegende Raffstores'],
        ['steuerung', 'Bedienung und Steuerung', 'z. B. manuell oder automatisch'],
        ['raeume', 'Betroffene Räume / Fenster', 'z. B. Südseite'],
      ] },
    ],
  },
  {
    titel: 'Technik',
    punkte: [
      { id: 'heizung', name: 'Heizung & Warmwasser', felder: [
        ['system', 'Heizsystem', 'z. B. Wärmepumpe'],
        ['leistung', 'Leistung und Auslegung', 'Angaben aus dem Angebot'],
        ['warmwasser', 'Warmwasserbereitung', 'z. B. Speicher und Volumen'],
        ['standort', 'Aufstellort und Geräusche', 'z. B. Außengerät und Abstand'],
      ] },
      { id: 'lueftung', name: 'Lüftung', felder: [
        ['system', 'Lüftungssystem', 'z. B. zentral oder dezentral'],
        ['rueckgewinnung', 'Wärmerückgewinnung', 'Angaben des Herstellers'],
        ['geraesch', 'Geräusche in Wohnräumen', 'z. B. Schalldämpfer und Gerätepegel'],
        ['wartung', 'Filter und Wartung', 'z. B. Wechselintervalle'],
      ] },
      { id: 'photovoltaik', name: 'Photovoltaik & Speicher', felder: [
        ['module', 'Module und Anlagenleistung', 'z. B. Leistung in kWp'],
        ['wechselrichter', 'Wechselrichter', 'z. B. Typ und Auslegung'],
        ['speicher', 'Speicher', 'z. B. Kapazität in kWh oder keiner'],
        ['nutzung', 'Geplante Nutzung', 'z. B. Eigenverbrauch oder Einspeisung'],
      ] },
      { id: 'leitungen', name: 'Leitungen & Installationen', felder: [
        ['fuehrung', 'Leitungsführung', 'z. B. Installationsschacht'],
        ['rohre', 'Wasser- und Abwasserleitungen', 'z. B. Rohrmaterial und Dämmung'],
        ['geraesch', 'Geräusche durch Leitungen', 'z. B. entkoppelte Rohrschellen'],
      ] },
    ],
  },
  {
    titel: 'Böden',
    punkte: [
      { id: 'bodenplatte', name: 'Bodenplatte', felder: [
        ['aufbau', 'Aufbau der Bodenplatte', 'z. B. Stärke und Schichten'],
        ['daemmung', 'Dämmung unter / auf der Bodenplatte', 'z. B. Material und Stärke'],
        ['abdichtung', 'Abdichtung gegen Feuchtigkeit', 'z. B. geplante Ausführung'],
      ] },
      { id: 'geschossdecke', name: 'Geschossdecke & Estrich', felder: [
        ['decke', 'Deckenkonstruktion', 'z. B. Stahlbeton oder Holz'],
        ['estrich', 'Estrich und Aufbau', 'z. B. schwimmender Estrich'],
        ['trittschall', 'Trittschalldämmung', 'z. B. Material und Entkopplung'],
      ] },
      { id: 'bodenbelag', name: 'Bodenbeläge', felder: [
        ['belag', 'Belag und Raum', 'z. B. Parkett im Wohnbereich'],
        ['heizung', 'Eignung für Fußbodenheizung', 'Angabe des Herstellers'],
        ['unterlage', 'Unterlage und Gehschall', 'z. B. Aufbau unter dem Belag'],
      ] },
    ],
  },
  {
    titel: 'Dach & Decken',
    punkte: [
      { id: 'dach', name: 'Dach', felder: [
        ['aufbau', 'Dachaufbau und Eindeckung', 'z. B. Ziegel oder Blech'],
        ['daemmung', 'Dämmung', 'z. B. Material und Stärke'],
        ['sommer', 'Schutz vor Hitze im Sommer', 'z. B. Aufbau und Verschattung'],
        ['regen', 'Regengeräusche', 'Besonders bei leichten Eindeckungen'],
      ] },
      { id: 'oberste_decke', name: 'Oberste Geschossdecke', felder: [
        ['aufbau', 'Deckenaufbau', 'z. B. Betondecke oder Holzbalkendecke'],
        ['daemmung', 'Dämmstoff und Stärke', 'z. B. Mineralwolle'],
        ['luftdicht', 'Luftdichte Anschlüsse', 'z. B. Dachbodenzugang'],
      ] },
    ],
  },
] as const;

const alteFelder = [
  ['ausfuehrung', 'Material / Ausführung'],
  ['energie', 'Wärmeschutz / Energie'],
  ['schall', 'Schallschutz'],
  ['notizen', 'Notizen / offene Fragen'],
] as const;

export function Materialien({ house, onChange }: MaterialienProps) {
  const [nurOffene, setNurOffene] = useState(false);
  const update = (id: string, field: string, value: string) => {
    const bisher = house.materialien?.[id];
    onChange({
      ...house,
      materialien: {
        ...house.materialien,
        [id]: { ...bisher, angaben: { ...bisher?.angaben, [field]: value } },
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Materialien &amp; Ausführung</h2>
        <p className="mt-1">Halte fest, was geplant oder angeboten ist. Jedes Bauteil hat passende Fragen. Die Angaben werden für dieses Haus automatisch gespeichert.</p>
      </div>
      <label className="flex w-fit items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={nurOffene} onChange={(event) => setNurOffene(event.target.checked)} className="size-4 accent-sky-600" />
        Nur Bauteile mit fehlenden Angaben anzeigen
      </label>
      {nurOffene && !bereiche.some((bereich) => bereich.punkte.some((punkt) => hatOffeneAngaben(house.materialien?.[punkt.id], punkt.felder))) && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Alle Bauteile sind ausgefüllt.</p>
      )}
      {bereiche.map((bereich) => {
        const punkte = bereich.punkte.filter((punkt) => !nurOffene || hatOffeneAngaben(house.materialien?.[punkt.id], punkt.felder));
        return punkte.length > 0 && (
        <section key={bereich.titel} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{bereich.titel}</h2>
          <div className="space-y-3">
            {punkte.map((punkt) => {
              const auswahl = house.materialien?.[punkt.id];
              const fruehereAngaben = alteFelder.filter(([field]) => auswahl?.[field]?.trim());
              const ausgefuellt = fruehereAngaben.length > 0
                || Object.values(auswahl?.angaben ?? {}).some((value) => value.trim());
              return (
                <details key={punkt.id} className="rounded-md border border-slate-200 p-3">
                  <summary className="cursor-pointer font-medium text-slate-900">
                    {punkt.name} {ausgefuellt && <span className="ml-2 text-xs font-normal text-sky-700">Erfasst</span>}
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {punkt.felder.map(([field, label, placeholder]) => (
                      <label key={field} className="flex flex-col gap-1 text-sm text-slate-700">
                        {label}
                        <input
                          type="text"
                          value={auswahl?.angaben?.[field] ?? ''}
                          onChange={(event) => update(punkt.id, field, event.target.value)}
                          placeholder={placeholder}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </label>
                    ))}
                  </div>
                  {fruehereAngaben.length > 0 && (
                    <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                      <h3 className="font-medium">Frühere Angaben</h3>
                      <p className="mb-2 text-xs text-slate-500">Diese Einträge bleiben erhalten. Du kannst die passenden Angaben oben neu eintragen.</p>
                      {fruehereAngaben.map(([field, label]) => (
                        <p key={field} className="mb-1 whitespace-pre-wrap break-words"><span className="font-medium">{label}:</span> {auswahl?.[field]}</p>
                      ))}
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </section>
      );
      })}
    </div>
  );
}

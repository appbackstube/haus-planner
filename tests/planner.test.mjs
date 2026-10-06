import assert from 'node:assert/strict';
import test from 'node:test';
import { berechneBaukosten } from '../src/utils/bauposten.ts';
import { berechneFinanzierung } from '../src/utils/finanzierung.ts';
import { parseHouseBackup } from '../src/utils/houseBackup.ts';
import { passtLeistungsFilter } from '../src/utils/leistungsFilter.ts';
import { hatOffeneAngaben } from '../src/utils/materialien.ts';
import { hausKennzahlen, materialKurzinfo } from '../src/utils/vergleich.ts';
import { readStoredValue, writeStoredValue } from '../src/utils/localStorage.ts';
import { canInitializeDocument, createIdentity, identityFromPath, plannerLink, resolveIdentity, encryptHouses, decryptHouses, writeToken } from '../src/utils/plannerStorage.ts';
import { beispielBetriebskosten, ueberblickWerte } from '../src/utils/ueberblick.ts';
import { zielFuerBereich } from '../src/utils/navigation.ts';

function house() {
  return {
    id: 'haus-1', name: 'Haus 1',
    finanzierung: { grundstueckpreis: 50000, baukosten: 200000, eigenkapital: 65000, zins: 0, laufzeit: 20, sondertilgung: 0 },
    betriebskosten: { heizung: 0, strom: 100, wasser: 0, abwasser: 0, muell: 0, versicherung: 0, grundsteuer: 0, internet: 0, instandhaltung: 0 },
    bauposten: { hauspreis: 200000, fundamentplatte: 0, erdarbeiten: 0, entsorgung: 0, hausanschluesse: 0, planung: 0, aussenanlagen: 0, reserve: 10000 },
    leistungsstatus: { fenster: 'separat', dach: 'im_hauspreis', heizung: 'separat' },
    leistungspreise: { fenster: 5000, dach: 3000, heizung: 0 },
  };
}

test('Baukosten rechnen nur separate Preise einmalig ein', () => {
  assert.equal(berechneBaukosten(house()).baukosten, 215000);
  assert.equal(berechneBaukosten({ ...house(), leistungsstatus: { fenster: 'ungeklaert' } }).baukosten, 210000);
});

test('Kredit und Vergleich rechnen mit Baukosten und Betriebskosten', () => {
  const werte = hausKennzahlen(house());
  assert.equal(werte.kreditbetrag, 200000);
  assert.equal(werte.monatsrate, 200000 / 240);
  assert.equal(werte.gesamtMonat, 200000 / 240 + 100);
  assert.equal(werte.gesamtJahr, werte.gesamtMonat * 12);
  assert.equal(berechneFinanzierung(house().finanzierung, 215000).gesamtkosten, 265000);
});

test('Leistungsfilter berücksichtigt Status und fehlenden Preis', () => {
  assert.equal(passtLeistungsFilter(house(), 'fenster', 'alle'), true);
  assert.equal(passtLeistungsFilter(house(), 'fenster', 'ohne_preis'), false);
  assert.equal(passtLeistungsFilter(house(), 'heizung', 'ohne_preis'), true);
  assert.equal(passtLeistungsFilter(house(), 'fenster', 'ungeklaert'), false);
  assert.equal(passtLeistungsFilter(house(), 'planung', 'ungeklaert'), true);
});

test('Materialfilter findet leere und unvollständige Angaben', () => {
  const fields = [['aufbau'], ['daemmung']];
  assert.equal(hatOffeneAngaben(undefined, fields), true);
  assert.equal(hatOffeneAngaben({ angaben: { aufbau: 'Ziegel' } }, fields), true);
  assert.equal(hatOffeneAngaben({ angaben: { aufbau: 'Ziegel', daemmung: 'Wolle' } }, fields), false);
  assert.equal(materialKurzinfo({ ...house(), materialien: { fenster: { angaben: { rahmen: 'Holz', verglasung: '3-fach' } } } }, 'fenster', ['rahmen', 'verglasung']), 'Holz · 3-fach');
});

test('JSON-Import akzeptiert alte, neue und gemischte Materialangaben', () => {
  const alt = { ...house(), materialien: { fenster: { ausfuehrung: 'Holz', energie: '', schall: '', notizen: '' } } };
  const neu = { ...house(), id: 'haus-2', materialien: { fenster: { angaben: { rahmen: 'Alu' } } } };
  const gemischt = { ...house(), id: 'haus-3', materialien: { fenster: { ...alt.materialien.fenster, angaben: { rahmen: 'Holz' } } } };
  assert.deepEqual(parseHouseBackup(JSON.stringify([alt, neu, gemischt])), [alt, neu, gemischt]);
  assert.equal(materialKurzinfo(alt, 'fenster', ['rahmen']), 'Holz');
});

test('Ungültiges Backup wird vor dem Überschreiben zurückgewiesen', () => {
  assert.throws(() => parseHouseBackup(JSON.stringify([house(), house()])), /keine gültige Liste/);
  assert.throws(() => parseHouseBackup(JSON.stringify([{ ...house(), materialien: { fenster: { angaben: { uw: 7 } } } }])), /keine gültige Liste/);
  assert.throws(() => parseHouseBackup('{'), SyntaxError);
});

test('Fehlender oder gesperrter Browser-Speicher führt zu sicherem Fallback', () => {
  const blockedStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.deepEqual(readStoredValue(() => blockedStorage, 'houses', []), []);
  assert.equal(writeStoredValue(() => blockedStorage, 'houses', [house()]), false);
  assert.deepEqual(readStoredValue(() => { throw new Error('no access'); }, 'houses', []), []);
  assert.equal(writeStoredValue(() => { throw new Error('no access'); }, 'houses', [house()]), false);
  assert.deepEqual(readStoredValue(() => ({ getItem: () => 'invalid json' }), 'houses', []), []);
  assert.equal(writeStoredValue(() => ({ setItem: () => {} }), 'houses', [house()]), true);
});

test('Link verwendet den App-Basispfad und bleibt im Browser gespeichert', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const initial = resolveIdentity(storage, 'https://beispiel.github.io/haus-planner/', '/haus-planner/');
  const url = plannerLink('https://beispiel.github.io/haus-planner/?utm=1#alt', '/haus-planner/', initial);
  assert.equal(new URL(url).pathname, `/haus-planner/${initial.id}/${initial.key}`);
  assert.equal(new URL(url).search, '');
  assert.deepEqual(identityFromPath(new URL(url).pathname, '/haus-planner/'), initial);
  assert.deepEqual(resolveIdentity(storage, 'https://beispiel.github.io/haus-planner/', '/haus-planner/'), initial);
  assert.equal(canInitializeDocument(storage, initial), true);
  assert.equal(identityFromPath('/haus-planner/ungueltig/schluessel', '/haus-planner/'), null);
  const shared = createIdentity();
  assert.deepEqual(resolveIdentity(storage, plannerLink(url, '/haus-planner/', shared), '/haus-planner/'), shared);
  assert.deepEqual(resolveIdentity(storage, 'https://beispiel.github.io/haus-planner/', '/haus-planner/'), initial);
  const visitorValues = new Map();
  const visitorStorage = { getItem: (key) => visitorValues.get(key) ?? null, setItem: (key, value) => visitorValues.set(key, value) };
  resolveIdentity(visitorStorage, plannerLink(url, '/haus-planner/', shared), '/haus-planner/');
  assert.equal(canInitializeDocument(visitorStorage, shared), false);
  const visitorOwn = resolveIdentity(visitorStorage, 'https://beispiel.github.io/haus-planner/', '/haus-planner/');
  assert.notEqual(visitorOwn.id, shared.id);
  assert.equal(canInitializeDocument(visitorStorage, visitorOwn), true);
});

test('Nur der korrekte Schlüssel entschlüsselt die Daten', async () => {
  const identity = createIdentity();
  const payload = await encryptHouses([house()], identity);
  assert.deepEqual(await decryptHouses(payload, identity), [house()]);
  assert.notEqual(payload.data, JSON.stringify([house()]));
  assert.notDeepEqual(await encryptHouses([house()], identity), payload);
  await assert.rejects(decryptHouses(payload, { ...identity, key: createIdentity().key }));
  await assert.rejects(decryptHouses({ ...payload, data: `${payload.data.slice(0, -2)}AA` }, identity));
  await assert.rejects(decryptHouses({ ...payload, iv: 'invalid' }, identity));
  assert.notEqual(await writeToken(identity), identity.key);
});

test('Überblick zeigt bei neuem Haus keine erfundenen Baukosten oder Kreditrate', () => {
  const neu = {
    ...house(),
    finanzierung: { ...house().finanzierung, grundstueckpreis: 0, baukosten: 0, eigenkapital: 0 },
    bauposten: { hauspreis: 0, fundamentplatte: 0, erdarbeiten: 0, entsorgung: 0, hausanschluesse: 0, planung: 0, aussenanlagen: 0, reserve: 0 },
    leistungsstatus: {},
    leistungspreise: {},
    betriebskosten: { ...beispielBetriebskosten },
  };
  const leer = ueberblickWerte(neu);
  assert.equal(leer.baukosten, null);
  assert.equal(leer.monatsrate, null);
  assert.equal(leer.gesamtMonat, null);
  assert.equal(leer.betriebskostenUnveraendert, true);
  assert.equal(leer.naechsterSchritt.tab, 'baukosten');

  const mitPreis = ueberblickWerte({ ...neu, bauposten: { ...neu.bauposten, hauspreis: 200000 } });
  assert.equal(mitPreis.baukosten, 200000);
  assert.equal(mitPreis.naechsterSchritt.tab, 'betriebskosten');
  assert.ok(mitPreis.gesamtMonat > mitPreis.monatsrate);

  const angepasst = ueberblickWerte({ ...neu, bauposten: { ...neu.bauposten, hauspreis: 200000 }, betriebskosten: { ...neu.betriebskosten, heizung: 120 } });
  assert.equal(angepasst.betriebskostenUnveraendert, false);
  assert.equal(angepasst.naechsterSchritt, null);
  assert.equal(angepasst.gesamtMonat, angepasst.monatsrate + angepasst.betriebskosten);
});

test('Alle bisherigen Detailbereiche bleiben über die neue Navigation erreichbar', () => {
  for (const bereich of ['baukosten', 'finanzierung', 'betriebskosten', 'gesamt']) {
    assert.deepEqual(zielFuerBereich(bereich), { hauptbereich: 'kosten', kostenbereich: bereich });
  }
  for (const bereich of ['materialien', 'notizen-und-links']) {
    assert.deepEqual(zielFuerBereich(bereich), { hauptbereich: 'haus', hausbereich: bereich });
  }
  assert.deepEqual(zielFuerBereich('vergleich'), { hauptbereich: 'vergleich' });
  assert.deepEqual(zielFuerBereich('ueberblick'), { hauptbereich: 'ueberblick' });
});

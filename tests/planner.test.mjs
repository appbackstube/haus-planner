import assert from 'node:assert/strict';
import test from 'node:test';
import { berechneBaukosten } from '../src/utils/bauposten.ts';
import { berechneFinanzierung } from '../src/utils/finanzierung.ts';
import { parseHouseBackup } from '../src/utils/houseBackup.ts';
import { passtLeistungsFilter } from '../src/utils/leistungsFilter.ts';
import { hatOffeneAngaben } from '../src/utils/materialien.ts';
import { hausKennzahlen, materialKurzinfo } from '../src/utils/vergleich.ts';
import { readStoredValue, writeStoredValue } from '../src/utils/localStorage.ts';
import { copySharedHouse, shareIdFromHash, shareLink, sharedHouseFromPayload } from '../src/utils/shareLinks.ts';

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

test('Freigabe-Link bleibt im App-Pfad und sendet die ID nur im Fragment', () => {
  const id = 'd81aec22-c73d-42cd-9fac-015af8e7bf49';
  const url = new URL(shareLink('https://beispiel.github.io/haus-planner/?utm=1#alt', id));
  assert.equal(url.pathname, '/haus-planner/');
  assert.equal(url.search, '?utm=1');
  assert.equal(url.hash, `#share=${id}`);
  assert.equal(shareIdFromHash(url.hash), id);
  assert.equal(shareIdFromHash('#share=ungueltig'), null);
});

test('Geteiltes Haus wird validiert und nur als neue ID übernommen', () => {
  const original = house();
  assert.deepEqual(sharedHouseFromPayload(original), original);
  assert.throws(() => sharedHouseFromPayload({ ...original, name: '' }), /keine gültige Liste/);
  const copied = copySharedHouse(original, 'neue-id');
  assert.equal(copied.id, 'neue-id');
  assert.equal(original.id, 'haus-1');
  assert.equal(copied.finanzierung.baukosten, original.finanzierung.baukosten);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { berechneBaukosten, leistungspreis } from '../src/utils/bauposten.ts';
import { berechneFinanzierung, summeBetriebskosten } from '../src/utils/finanzierung.ts';
import { parseHouseBackup, parsePlannerBackup } from '../src/utils/houseBackup.ts';
import { passtLeistungsFilter } from '../src/utils/leistungsFilter.ts';
import { hatOffeneAngaben } from '../src/utils/materialien.ts';
import { hausKennzahlen, materialKurzinfo, summeAktuelleKosten } from '../src/utils/vergleich.ts';
import { readStoredValue, writeStoredValue } from '../src/utils/localStorage.ts';
import { canInitializeDocument, createIdentity, identityFromPath, plannerLink, resolveIdentity, encryptHouses, decryptHouses, encryptPlannerData, decryptPlannerData, writeToken } from '../src/utils/plannerStorage.ts';
import { beispielBetriebskosten, ueberblickWerte } from '../src/utils/ueberblick.ts';
import { zielFuerBereich } from '../src/utils/navigation.ts';
import { antwortFuerFrage, fragenSektionen } from '../src/utils/fragenkatalog.ts';

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

test('Geleertes Preisfeld zählt als null, auch wenn ein alter Bauposten einen Preis hatte', () => {
  const mitAltpreis = { ...house(), bauposten: { ...house().bauposten, planung: 3000 }, leistungsstatus: { ...house().leistungsstatus, planung: 'separat' } };
  assert.equal(leistungspreis(mitAltpreis, 'planung'), 3000);
  const geleert = { ...mitAltpreis, leistungspreise: { ...mitAltpreis.leistungspreise, planung: 0 } };
  assert.equal(leistungspreis(geleert, 'planung'), 0);
  assert.equal(berechneBaukosten(geleert).baukosten, berechneBaukosten(mitAltpreis).baukosten - 3000);
});

test('Kredit und Vergleich rechnen mit Baukosten und Betriebskosten', () => {
  const werte = hausKennzahlen(house());
  assert.equal(werte.kreditbetrag, 200000);
  assert.equal(werte.monatsrate, 200000 / 240);
  assert.equal(werte.gesamtMonat, 200000 / 240 + 100);
  assert.equal(werte.gesamtJahr, werte.gesamtMonat * 12);
  assert.equal(berechneFinanzierung(house().finanzierung, 215000).gesamtkosten, 265000);
  assert.equal(werte.aktuelleKosten, null);
  assert.equal(werte.differenzMonat, null);
});

test('Nur markierte separate Leistungen mit Preis werden aus dem Kredit ausgeschlossen', () => {
  const mitAusschluss = {
    ...house(),
    kreditAusgeschlosseneLeistungen: { fenster: true, heizung: true, dach: true, 'eigen-extra': true },
    eigeneLeistungen: [{ id: 'eigen-extra', name: 'Zusatzleistung' }],
    leistungsstatus: { ...house().leistungsstatus, 'eigen-extra': 'separat' },
    leistungspreise: { ...house().leistungspreise, 'eigen-extra': 2000 },
  };
  const { baukosten, kreditAusgeschlossen } = berechneBaukosten(mitAusschluss);
  assert.equal(baukosten, 217000);
  assert.equal(kreditAusgeschlossen, 7000);
  const berechnung = berechneFinanzierung(mitAusschluss.finanzierung, baukosten, kreditAusgeschlossen);
  assert.equal(berechnung.gesamtkosten, 267000);
  assert.equal(berechnung.ausKreditAusgeschlossen, 7000);
  assert.equal(berechnung.kreditbetrag, 195000);
  assert.equal(berechnung.monatsrate, 195000 / 240);
  assert.equal(hausKennzahlen(mitAusschluss).kreditbetrag, 195000);
  assert.equal(ueberblickWerte(mitAusschluss).monatsrate, berechnung.monatsrate);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitAusschluss])), [mitAusschluss]);
  const ohneHaken = { ...mitAusschluss, kreditAusgeschlosseneLeistungen: { ...mitAusschluss.kreditAusgeschlosseneLeistungen, fenster: false } };
  assert.equal(berechneBaukosten(ohneHaken).kreditAusgeschlossen, 2000);
  const nichtSeparat = { ...mitAusschluss, leistungsstatus: { ...mitAusschluss.leistungsstatus, fenster: 'im_hauspreis' } };
  assert.equal(berechneBaukosten(nichtSeparat).kreditAusgeschlossen, 2000);
  assert.equal(berechneFinanzierung(mitAusschluss.finanzierung, 215000, 999999).ausKreditAusgeschlossen, 215000);
  assert.equal(berechneFinanzierung(mitAusschluss.finanzierung, 215000, -100).kreditbetrag, 200000);
  for (const ungueltig of ['true', 1, null]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitAusschluss, kreditAusgeschlosseneLeistungen: { fenster: ungueltig } }])), /keine gültige Liste/);
  }
  assert.deepEqual(parseHouseBackup(JSON.stringify([house()])), [house()]);
});

test('Bankgebühren und Grundbucheintragungen erhöhen den Finanzierungsbedarf nur einmal', async () => {
  const finanzierung = { ...house().finanzierung, bankgebuehren: 1200, grundbucheintragungen: 900 };
  const mitGebuehren = { ...house(), finanzierung };
  const berechnung = berechneFinanzierung(finanzierung, 215000);
  assert.equal(berechnung.gesamtkosten, 267100);
  assert.equal(berechnung.kreditbetrag, 202100);
  assert.equal(berechnung.monatsrate, 202100 / 240);
  const werte = hausKennzahlen(mitGebuehren);
  assert.equal(werte.bankgebuehren, 1200);
  assert.equal(werte.grundbucheintragungen, 900);
  assert.equal(werte.kreditbetrag, berechnung.kreditbetrag);
  assert.equal(werte.gesamtMonat, berechnung.monatsrate + 100);
  assert.equal(berechneFinanzierung({ ...finanzierung, eigenkapital: 300000 }, 215000).kreditbetrag, 0);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitGebuehren])), [mitGebuehren]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitGebuehren], identity), identity), [mitGebuehren]);
  for (const ungueltig of [
    { bankgebuehren: '1200' },
    { bankgebuehren: -1 },
    { grundbucheintragungen: null },
    { erfundeneGebuehr: 500 },
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitGebuehren, finanzierung: { ...finanzierung, ...ungueltig } }])), /keine gültige Liste/);
  }
  assert.deepEqual(parseHouseBackup(JSON.stringify([house()])), [house()]);
});

test('Grundstücksgebühren werden aus dem Grundstückspreis berechnet und einmal finanziert', () => {
  const finanzierung = {
    ...house().finanzierung,
    grundbucheintragungen: 900,
    grunderwerbsteuerProzent: 3.5,
    grundbuchEintragungsgebuehrProzent: 1.1,
    eingabengebuehr: 50,
    vertragserrichtung: 1200,
    pfandrechtseintragung: 300,
    grundstueckSonstiges: 100,
  };
  const mitGrundstueck = { ...house(), finanzierung };
  const berechnung = berechneFinanzierung(finanzierung, 215000);
  assert.equal(berechnung.grundstueckNebenkosten, 4850);
  assert.equal(berechnung.gesamtkosten, 269850);
  assert.equal(berechnung.kreditbetrag, 204850);
  assert.equal(berechnung.monatsrate, 204850 / 240);
  assert.equal(hausKennzahlen(mitGrundstueck).grundstueckNebenkosten, 4850);
  assert.equal(hausKennzahlen(mitGrundstueck).kreditbetrag, berechnung.kreditbetrag);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitGrundstueck])), [mitGrundstueck]);
  assert.equal(zielFuerBereich('grundstueck').kostenbereich, 'grundstueck');

  const teureresGrundstueck = { ...finanzierung, grundstueckpreis: 100000 };
  assert.equal(berechneFinanzierung(teureresGrundstueck, 215000).grundstueckNebenkosten, 7150);
  for (const ungueltig of [
    { grunderwerbsteuerProzent: -1 },
    { grundbuchEintragungsgebuehrProzent: '1.1' },
    { eingabengebuehr: null },
    { vertragserrichtung: -1 },
    { pfandrechtseintragung: Infinity },
    { grundstueckSonstiges: -1 },
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitGrundstueck, finanzierung: { ...finanzierung, ...ungueltig } }])), /keine gültige Liste/);
  }
  assert.equal(berechneFinanzierung(house().finanzierung, 215000).grundstueckNebenkosten, 0);
});

test('Vertragserrichtung, Pfandrechtseintragung und Bankgebühren können prozentual berechnet werden', async () => {
  const finanzierung = {
    ...house().finanzierung,
    vertragserrichtungProzent: 2,
    pfandrechtseintragungProzent: 1.2,
    bankgebuehrenProzent: 0.5,
  };
  const mitProzent = { ...house(), finanzierung };
  const berechnung = berechneFinanzierung(finanzierung, 215000);
  assert.equal(berechnung.kreditbasis, 201000);
  assert.equal(berechnung.grundstueckNebenkosten, 3412);
  assert.equal(berechnung.bankgebuehren, 1005);
  assert.equal(berechnung.gesamtkosten, 269417);
  assert.equal(berechnung.kreditbetrag, 204417);
  assert.equal(hausKennzahlen(mitProzent).bankgebuehren, 1005);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitProzent])), [mitProzent]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitProzent], identity), identity), [mitProzent]);

  const mehrEigenkapital = { ...finanzierung, eigenkapital: 100000 };
  assert.equal(berechneFinanzierung(mehrEigenkapital, 215000).bankgebuehren, 830);
  assert.equal(berechneFinanzierung({ ...finanzierung, eigenkapital: 500000 }, 215000).bankgebuehren, 0);
  assert.equal(berechneFinanzierung({ ...finanzierung, grundstueckpreis: 100000 }, 215000).grundstueckNebenkosten, 5024);

  const mitAltbetrag = { ...finanzierung, vertragserrichtung: 9999, pfandrechtseintragung: 9999, bankgebuehren: 9999 };
  assert.equal(berechneFinanzierung(mitAltbetrag, 215000).gesamtkosten, berechnung.gesamtkosten);
  for (const ungueltig of [
    { vertragserrichtungProzent: -1 },
    { pfandrechtseintragungProzent: '1.2' },
    { bankgebuehrenProzent: Infinity },
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitProzent, finanzierung: { ...finanzierung, ...ungueltig } }])), /keine gültige Liste/);
  }
});

test('Schätzgebühr und Kontoführungsgebühr zählen als einmalige Euro- oder Prozentgebühren', async () => {
  const finanzierung = {
    ...house().finanzierung,
    bankgebuehren: 1000,
    pfandrechtseintragungProzent: 1,
    schaetzgebuehrProzent: 0.3,
    kontofuehrungsgebuehr: 75,
  };
  const mitGebuehren = { ...house(), finanzierung };
  const berechnung = berechneFinanzierung(finanzierung, 215000);
  assert.equal(berechnung.kreditbasis, 200000);
  assert.equal(berechnung.schaetzgebuehr, 600);
  assert.equal(berechnung.kontofuehrungsgebuehr, 75);
  assert.equal(berechnung.gesamtkosten, 268675);
  assert.equal(berechnung.kreditbetrag, 203675);
  assert.equal(berechnung.monatsrate, 203675 / 240);
  assert.equal(hausKennzahlen(mitGebuehren).schaetzgebuehr, 600);
  assert.equal(hausKennzahlen(mitGebuehren).kontofuehrungsgebuehr, 75);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitGebuehren])), [mitGebuehren]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitGebuehren], identity), identity), [mitGebuehren]);

  const mitProzent = { ...finanzierung, schaetzgebuehr: 9999, kontofuehrungsgebuehr: 9999, kontofuehrungsgebuehrProzent: 0.125 };
  assert.equal(berechneFinanzierung(mitProzent, 215000).schaetzgebuehr, 600);
  assert.equal(berechneFinanzierung(mitProzent, 215000).kontofuehrungsgebuehr, 250);
  assert.equal(berechneFinanzierung({ ...finanzierung, eigenkapital: 500000 }, 215000).schaetzgebuehr, 0);
  assert.equal(berechneFinanzierung(house().finanzierung, 215000).kontofuehrungsgebuehr, 0);
  for (const ungueltig of [
    { schaetzgebuehr: -1 },
    { schaetzgebuehrProzent: '0.3' },
    { kontofuehrungsgebuehr: Infinity },
    { kontofuehrungsgebuehrProzent: -1 },
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitGebuehren, finanzierung: { ...finanzierung, ...ungueltig } }])), /keine gültige Liste/);
  }
});

test('Ein Zinssatz mit zwei Nachkommastellen wirkt sich auf die Monatsrate aus', () => {
  const finanzierung = { ...house().finanzierung, zins: 3.65 };
  const { monatsrate, kreditbetrag } = berechneFinanzierung(finanzierung, 215000);
  const monatszins = 3.65 / 100 / 12;
  assert.ok(Math.abs(monatsrate - kreditbetrag * monatszins / (1 - (1 + monatszins) ** -(finanzierung.laufzeit * 12))) < 0.001);
  assert.notEqual(monatsrate, berechneFinanzierung({ ...finanzierung, zins: 3.6 }, 215000).monatsrate);
});

test('Heutige Wohnkosten werden mit geplanten Monatskosten verglichen und gesichert', async () => {
  const aktuelleKosten = {
    wohnen: 850, heizung: 90, strom: 60, wasser: 20, abwasser: 15,
    muell: 15, versicherung: 20, grundsteuer: 0, internet: 30,
    instandhaltung: 0, sonstiges: 100,
  };
  const mitHeute = { ...house(), aktuelleKosten };
  const werte = hausKennzahlen(mitHeute);
  assert.equal(werte.aktuelleKosten, 1200);
  assert.equal(werte.differenzMonat, werte.gesamtMonat - 1200);
  assert.ok(werte.differenzMonat < 0);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitHeute])), [mitHeute]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitHeute], identity), identity), [mitHeute]);
  assert.equal(hausKennzahlen({ ...house(), aktuelleKosten: { ...aktuelleKosten, wohnen: 0 } }).differenzMonat, werte.differenzMonat + 850);
  const ohneBaupreis = { ...mitHeute, bauposten: { ...mitHeute.bauposten, hauspreis: 0, reserve: 0 }, finanzierung: { ...mitHeute.finanzierung, grundstueckpreis: 0 }, leistungsstatus: {} };
  assert.equal(hausKennzahlen(ohneBaupreis).differenzMonat, null);
  assert.throws(() => parseHouseBackup(JSON.stringify([{ ...house(), aktuelleKosten: { ...aktuelleKosten, wohnen: '850' } }])), /keine gültige Liste/);
  assert.throws(() => parseHouseBackup(JSON.stringify([{ ...house(), aktuelleKosten: { ...aktuelleKosten, erfunden: 5 } }])), /keine gültige Liste/);
  assert.deepEqual(parseHouseBackup(JSON.stringify([house()])), [house()]);
});

test('Eigene heutige Kostenposten fließen einmalig in Vergleich und Sicherung ein', async () => {
  const aktuelleKosten = {
    wohnen: 850, heizung: 90, strom: 60, wasser: 20, abwasser: 15,
    muell: 15, versicherung: 20, grundsteuer: 0, internet: 30,
    instandhaltung: 0, sonstiges: 100,
    eigenePosten: [
      { id: 'parkplatz', name: 'Parkplatz', betrag: 65 },
      { id: 'stellplatz', name: 'Stellplatz', betrag: 12.5 },
    ],
  };
  const mitPosten = { ...house(), aktuelleKosten };
  assert.equal(summeAktuelleKosten(aktuelleKosten), 1277.5);
  assert.equal(hausKennzahlen(mitPosten).aktuelleKosten, 1277.5);
  assert.equal(hausKennzahlen(mitPosten).differenzMonat, hausKennzahlen(house()).gesamtMonat - 1277.5);
  assert.equal(summeAktuelleKosten({ ...aktuelleKosten, eigenePosten: aktuelleKosten.eigenePosten.slice(1) }), 1212.5);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitPosten])), [mitPosten]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitPosten], identity), identity), [mitPosten]);
  for (const eigenePosten of [
    [{ id: 'a', name: '', betrag: 10 }],
    [{ id: 'a', name: 'Test', betrag: '10' }],
    [{ id: 'a', name: 'Test', betrag: -1 }],
    [{ id: 'a', name: 'Test', betrag: 10 }, { id: 'a', name: 'Noch ein Test', betrag: 20 }],
    [{ id: 'a', name: 'Test', betrag: 10, extra: true }],
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitPosten, aktuelleKosten: { ...aktuelleKosten, eigenePosten } }])), /keine gültige Liste/);
  }
});

test('Eigene Haus-Betriebskosten zählen zum Monatsvergleich und bleiben im Backup erhalten', async () => {
  const betriebskosten = {
    ...house().betriebskosten,
    eigenePosten: [
      { id: 'wartung', name: 'Wartung', betrag: 29.5 },
      { id: 'pflege', name: 'Gartenpflege', betrag: 40 },
    ],
  };
  const mitPosten = { ...house(), betriebskosten };
  assert.equal(summeBetriebskosten(betriebskosten), 169.5);
  assert.equal(hausKennzahlen(mitPosten).betriebskosten, 169.5);
  assert.equal(hausKennzahlen(mitPosten).gesamtMonat, hausKennzahlen(house()).gesamtMonat + 69.5);
  assert.equal(summeBetriebskosten({ ...betriebskosten, eigenePosten: betriebskosten.eigenePosten.slice(1) }), 140);
  const mitHeute = { ...mitPosten, aktuelleKosten: { ...beispielBetriebskosten, wohnen: 900, sonstiges: 0 } };
  assert.equal(hausKennzahlen(mitHeute).differenzMonat, hausKennzahlen(mitHeute).gesamtMonat - summeAktuelleKosten(mitHeute.aktuelleKosten));
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitPosten])), [mitPosten]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitPosten], identity), identity), [mitPosten]);
  for (const eigenePosten of [
    [{ id: 'a', name: '', betrag: 10 }],
    [{ id: 'a', name: 'Wartung', betrag: '10' }],
    [{ id: 'a', name: 'Wartung', betrag: -1 }],
    [{ id: 'a', name: 'Wartung', betrag: 10 }, { id: 'a', name: 'Wartung', betrag: 20 }],
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitPosten, betriebskosten: { ...betriebskosten, eigenePosten } }])), /keine gültige Liste/);
  }
  assert.deepEqual(parseHouseBackup(JSON.stringify([house()])), [house()]);
});

test('Leistungsfilter berücksichtigt Status und fehlenden Preis', () => {
  const fenster = { id: 'fenster', name: 'Fenster und Türen' };
  const heizung = { id: 'heizung', name: 'Heizung' };
  const planung = { id: 'planung', name: 'Planung' };
  const alle = { titel: '', status: 'alle', ausfuehrung: 'alle' };
  assert.equal(passtLeistungsFilter(house(), fenster, alle), true);
  assert.equal(passtLeistungsFilter(house(), fenster, { ...alle, status: 'ohne_preis' }), false);
  assert.equal(passtLeistungsFilter(house(), heizung, { ...alle, status: 'ohne_preis' }), true);
  assert.equal(passtLeistungsFilter(house(), fenster, { ...alle, status: 'ungeklaert' }), false);
  assert.equal(passtLeistungsFilter(house(), planung, { ...alle, status: 'ungeklaert' }), true);
  assert.equal(passtLeistungsFilter(house(), fenster, { ...alle, status: 'im_hauspreis' }), false);
  assert.equal(passtLeistungsFilter(house(), fenster, { ...alle, status: 'separat' }), true);
  assert.equal(passtLeistungsFilter(house(), { id: 'dach', name: 'Dach' }, { ...alle, status: 'im_hauspreis' }), true);
  const zugeteilt = { ...house(), ausfuehrung: { fenster: 'externer_betrieb', heizung: 'eigenleistung' } };
  assert.equal(passtLeistungsFilter(zugeteilt, fenster, { titel: ' FENSTER ', status: 'separat', ausfuehrung: 'externer_betrieb' }), true);
  assert.equal(passtLeistungsFilter(zugeteilt, fenster, { titel: 'Heizung', status: 'separat', ausfuehrung: 'externer_betrieb' }), false);
  assert.equal(passtLeistungsFilter(zugeteilt, fenster, { titel: 'fenster', status: 'ohne_preis', ausfuehrung: 'externer_betrieb' }), false);
  assert.equal(passtLeistungsFilter(zugeteilt, heizung, { ...alle, ausfuehrung: 'eigenleistung' }), true);
  assert.equal(passtLeistungsFilter(zugeteilt, planung, { ...alle, ausfuehrung: 'offen' }), true);
  assert.equal(passtLeistungsFilter(zugeteilt, { id: 'eigen-1', name: 'Eigener Punkt' }, { ...alle, titel: 'EIGENER' }), true);
  const nichtBenoetigt = { ...zugeteilt, leistungsstatus: { ...zugeteilt.leistungsstatus, fenster: 'nicht_benoetigt' } };
  assert.equal(passtLeistungsFilter(nichtBenoetigt, fenster, { ...alle, status: 'nicht_benoetigt', ausfuehrung: 'nicht_benoetigt' }), true);
  assert.equal(passtLeistungsFilter(nichtBenoetigt, fenster, { ...alle, ausfuehrung: 'externer_betrieb' }), false);
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

test('Grund für nicht benötigte Leistung bleibt erhalten und ändert keine Kosten', async () => {
  const mitGrund = {
    ...house(),
    leistungsstatus: { ...house().leistungsstatus, fenster: 'nicht_benoetigt' },
    nichtBenoetigtGruende: { fenster: 'Fenster bereits vorhanden' },
  };
  assert.equal(berechneBaukosten(mitGrund).baukosten, 210000);
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitGrund])), [mitGrund]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitGrund], identity), identity), [mitGrund]);
  assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitGrund, nichtBenoetigtGruende: { fenster: 42 } }])), /keine gültige Liste/);
  assert.deepEqual(parseHouseBackup(JSON.stringify([house()])), [house()]);
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

  const mitEigenemPosten = ueberblickWerte({ ...neu, bauposten: { ...neu.bauposten, hauspreis: 200000 }, betriebskosten: { ...beispielBetriebskosten, eigenePosten: [{ id: 'wartung', name: 'Wartung', betrag: 25 }] } });
  assert.equal(mitEigenemPosten.betriebskostenUnveraendert, false);
  assert.equal(mitEigenemPosten.betriebskosten, 25 + Object.values(beispielBetriebskosten).reduce((summe, wert) => summe + wert, 0));
  assert.equal(mitEigenemPosten.naechsterSchritt, null);
});

test('Alle bisherigen Detailbereiche bleiben über die neue Navigation erreichbar', () => {
  for (const bereich of ['baukosten', 'finanzierung', 'betriebskosten', 'aktuelle-kosten', 'gesamt']) {
    assert.deepEqual(zielFuerBereich(bereich), { hauptbereich: 'kosten', kostenbereich: bereich });
  }
  assert.deepEqual(zielFuerBereich('materialien'), { hauptbereich: 'haus' });
  for (const bereich of ['todos', 'notizen', 'links', 'fragenkatalog']) {
    assert.deepEqual(zielFuerBereich(bereich), { hauptbereich: bereich });
  }
  assert.deepEqual(zielFuerBereich('notizen-und-links'), { hauptbereich: 'notizen' });
  assert.deepEqual(zielFuerBereich('vergleich'), { hauptbereich: 'vergleich' });
  assert.deepEqual(zielFuerBereich('ueberblick'), { hauptbereich: 'ueberblick' });
});

test('Fragenkatalog hat sechs Bereiche und sichert Antworten sowie eigene Fragen je Haus', async () => {
  assert.deepEqual(fragenSektionen.map((sektion) => sektion.id), ['gemeinde', 'hausanbieter', 'bank', 'strom', 'wasser', 'internet']);
  assert.ok(fragenSektionen.every((sektion) => sektion.fragen.length > 0));
  const gemeindeFragen = fragenSektionen.find((sektion) => sektion.id === 'gemeinde').fragen;
  assert.equal(gemeindeFragen.length, 18);
  assert.equal(gemeindeFragen.find((frage) => frage.id === 'gemeinde-bebauung')?.text, 'Welche Vorgaben gelten für Größe, Höhe und Lage des Hauses?');
  assert.equal(gemeindeFragen.find((frage) => frage.id === 'gemeinde-kosten')?.text, 'Welche Aufschließungsabgabe oder sonstigen Beiträge für Straße und Infrastruktur sind noch offen?');
  assert.equal(gemeindeFragen.filter((frage) => frage.text.includes('Vorgaben gelten')).length, 1);
  assert.equal(gemeindeFragen.filter((frage) => frage.text.includes('Aufschließungsabgabe')).length, 1);
  for (const thema of ['Bauland', 'Aufschließungsabgabe', 'Bauantrag', 'Bauwasseranschluss', 'Kanalanschluss', 'Regenwasser', 'Gehsteig', 'Gebührensätze']) {
    assert.ok(gemeindeFragen.some((frage) => frage.text.includes(thema)), thema);
  }
  const alleIds = fragenSektionen.flatMap((sektion) => sektion.fragen.map((frage) => frage.id));
  assert.equal(new Set(alleIds).size, alleIds.length);
  const alleFragen = fragenSektionen.flatMap((sektion) => sektion.fragen.map((frage) => frage.text.toLocaleLowerCase('de-AT').trim()));
  assert.equal(new Set(alleFragen).size, alleFragen.length);
  assert.deepEqual(antwortFuerFrage({ 'gemeinde-hausvorgaben': { erledigt: true, notiz: 'Alte Antwort' } }, 'gemeinde-bebauung'), { erledigt: true, notiz: 'Alte Antwort' });
  assert.deepEqual(antwortFuerFrage({
    'gemeinde-kosten': { erledigt: false, notiz: 'Bereits notiert' },
    'gemeinde-aufschliessungsabgabe': { erledigt: true, notiz: 'Neue Antwort' },
  }, 'gemeinde-kosten'), { erledigt: true, notiz: 'Bereits notiert\n\nNeue Antwort' });
  const mitFragen = {
    ...house(),
    fragenAntworten: { 'gemeinde-bebauung': { erledigt: true, notiz: 'Bei der Gemeinde nachfragen' }, 'gemeinde-kosten': { erledigt: true, notiz: 'Beiträge erfragt' }, 'eigen-123': { erledigt: false, notiz: '' } },
    eigeneFragen: [{ id: 'eigen-123', kategorie: 'wasser', text: 'Wo ist die Anschlussstelle?' }],
  };
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitFragen, { ...house(), id: 'haus-2' }])), [mitFragen, { ...house(), id: 'haus-2' }]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitFragen], identity), identity), [mitFragen]);
  for (const invalid of [
    { fragenAntworten: { 'gemeinde-bebauung': { erledigt: 'ja', notiz: '' } } },
    { fragenAntworten: { 'gemeinde-bebauung': { erledigt: true, notiz: '', andere: 1 } } },
    { eigeneFragen: [{ id: 'eigen-1', kategorie: 'falsch', text: 'Frage?' }] },
    { eigeneFragen: [{ id: 'eigen-1', kategorie: 'wasser', text: '' }] },
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...mitFragen, ...invalid }])), /keine gültige Liste/);
  }
});

test('Todos bleiben beim Export und in verschlüsselten Planungen erhalten', async () => {
  const mitTodos = { ...house(), todos: [
    { id: 'todo-1', titel: 'Gemeinde fragen', beschreibung: 'Anschlusskosten klären', erledigt: false },
    { id: 'todo-2', titel: 'Angebot prüfen', beschreibung: '', erledigt: true },
  ] };
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitTodos])), [mitTodos]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitTodos], identity), identity), [mitTodos]);
  assert.deepEqual(parseHouseBackup(JSON.stringify([house()])), [house()]);
});

test('Gemeinsame Todos bleiben ohne Haus und beim Verschlüsseln erhalten', async () => {
  const planner = { houses: [], todos: [{ id: 'todo-1', titel: 'Gemeinde fragen', beschreibung: 'Anschlusskosten klären', erledigt: false }] };
  assert.deepEqual(parsePlannerBackup(JSON.stringify(planner)), planner);
  const identity = createIdentity();
  assert.deepEqual(await decryptPlannerData(await encryptPlannerData(planner, identity), identity), planner);
  assert.deepEqual(parsePlannerBackup(JSON.stringify([house()])), { houses: [house()], todos: [] });
});

test('Bestehende Todos aller Häuser werden ohne Verlust zusammengeführt', async () => {
  const erstes = { ...house(), todos: [{ id: 'todo-1', titel: 'Gemeinde fragen', beschreibung: '', erledigt: false }] };
  const zweites = { ...house(), id: 'haus-2', todos: [{ id: 'todo-1', titel: 'Angebot prüfen', beschreibung: 'Anrufen', erledigt: true }] };
  const identity = createIdentity();
  const migrated = await decryptPlannerData(await encryptHouses([erstes, zweites], identity), identity);
  assert.deepEqual(migrated.houses, [{ ...house() }, { ...house(), id: 'haus-2' }]);
  assert.deepEqual(migrated.todos.map(({ titel, beschreibung, erledigt }) => ({ titel, beschreibung, erledigt })), [
    { titel: 'Gemeinde fragen', beschreibung: '', erledigt: false },
    { titel: 'Angebot prüfen', beschreibung: 'Anrufen', erledigt: true },
  ]);
  assert.equal(new Set(migrated.todos.map((todo) => todo.id)).size, 2);
  assert.deepEqual(parsePlannerBackup(JSON.stringify(migrated)), migrated);
  assert.deepEqual({ ...migrated, houses: migrated.houses.slice(1) }.todos, migrated.todos);

  const withGlobalTodo = parsePlannerBackup(JSON.stringify({ houses: [erstes], todos: [zweites.todos[0]] }));
  assert.deepEqual(withGlobalTodo.todos.map((todo) => todo.titel), ['Angebot prüfen', 'Gemeinde fragen']);
  assert.equal(new Set(withGlobalTodo.todos.map((todo) => todo.id)).size, 2);
});

test('Ungültige globale Todos werden beim Import abgelehnt', () => {
  const todo = { id: 'todo-1', titel: 'Gemeinde fragen', beschreibung: '', erledigt: false };
  for (const todos of [
    [{ ...todo, titel: '  ' }],
    [{ ...todo, erledigt: 'nein' }],
    [todo, todo],
  ]) {
    assert.throws(() => parsePlannerBackup(JSON.stringify({ houses: [house()], todos })), /keine gültige Planung/);
  }
});

test('Markdown-Notizen bleiben beim Import und verschlüsselten Speichern unverändert', async () => {
  const mitNotiz = { ...house(), notizen: '# Fragen an die Gemeinde\n\n- Wasseranschluss\n- Kanal\n\n[Formular](https://beispiel.at)' };
  assert.deepEqual(parseHouseBackup(JSON.stringify([mitNotiz])), [mitNotiz]);
  const identity = createIdentity();
  assert.deepEqual(await decryptHouses(await encryptHouses([mitNotiz], identity), identity), [mitNotiz]);
});

test('Ungültige Todos werden beim Import abgelehnt', () => {
  const gültig = { id: 'todo-1', titel: 'Gemeinde fragen', beschreibung: '', erledigt: false };
  for (const todos of [
    [{ ...gültig, titel: '   ' }],
    [{ ...gültig, erledigt: 'nein' }],
    [{ ...gültig, beschreibung: null }],
    [{ ...gültig, unerwartet: true }],
    [gültig, { ...gültig }],
  ]) {
    assert.throws(() => parseHouseBackup(JSON.stringify([{ ...house(), todos }])), /keine gültige Liste/);
  }
});

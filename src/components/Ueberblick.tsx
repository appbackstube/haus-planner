import type { House } from '../types';
import { ueberblickWerte } from '../utils/ueberblick';

function euro(betrag: number | null): string {
  return betrag === null ? 'Noch offen' : `${betrag.toLocaleString('de-AT', { maximumFractionDigits: 2 })} €`;
}

export function Ueberblick({ house, onNavigate }: { house: House; onNavigate: (tab: string) => void }) {
  const werte = ueberblickWerte(house);
  const startTab = werte.naechsterSchritt?.tab ?? 'finanzierung';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-sky-800 to-teal-700 px-6 py-8 text-white sm:px-8 sm:py-10">
        <p className="text-sm font-medium text-sky-100">Dein Überblick</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">Was kostet dein Haus bisher?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-50 sm:text-base">
          Hier siehst du deine bisherigen Angaben. Starte mit einem groben Hauspreis. Weitere Zahlen kannst du später ergänzen.
        </p>
        <button type="button" onClick={() => onNavigate(startTab)} className="mt-6 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          {werte.naechsterSchritt?.titel ?? 'Finanzierung ansehen'}
        </button>
      </section>

      <section aria-labelledby="zahlen-titel">
        <div className="mb-4">
          <h2 id="zahlen-titel" className="text-lg font-semibold text-slate-900">Dein Haus in Zahlen</h2>
          <p className="mt-1 text-sm text-slate-600">Bisher erfasst, nicht die endgültigen Kosten.</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <dt className="text-sm font-medium text-slate-600">Baukosten</dt>
            <dd className="mt-2 text-2xl font-bold text-slate-900">{euro(werte.baukosten)}</dd>
            <p className="mt-2 text-xs leading-5 text-slate-500">Haus und Bau, ohne Grundstück.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <dt className="text-sm font-medium text-slate-600">Kreditrate / Monat</dt>
            <dd className="mt-2 text-2xl font-bold text-slate-900">{euro(werte.monatsrate)}</dd>
            <p className="mt-2 text-xs leading-5 text-slate-500">Aus Kosten, Eigenkapital, Zins und Laufzeit berechnet.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <dt className="text-sm font-medium text-slate-600">Betriebskosten / Monat</dt>
            <dd className="mt-2 text-2xl font-bold text-slate-900">{euro(werte.betriebskosten)}</dd>
            <p className="mt-2 text-xs leading-5 text-slate-500">{werte.betriebskostenUnveraendert ? 'Beispielwerte – bitte prüfen.' : 'Vorläufige Werte aus deiner Planung.'}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <dt className="text-sm font-medium text-sky-900">Zusammen / Monat</dt>
            <dd className="mt-2 text-2xl font-bold text-sky-900">{euro(werte.gesamtMonat)}</dd>
            <p className="mt-2 text-xs leading-5 text-sky-800">Kreditrate + Betriebskosten. Weitere Ausgaben sind möglich.</p>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Als Nächstes</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{werte.naechsterSchritt?.titel ?? 'Deine Planung vertiefen'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{werte.naechsterSchritt?.beschreibung ?? 'Prüfe Zins, Eigenkapital und Laufzeit. So wird die Monatsrate aussagekräftiger.'}</p>
          <button type="button" onClick={() => onNavigate(startTab)} className="mt-4 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600">
            {werte.naechsterSchritt ? 'Jetzt eintragen' : 'Finanzierung prüfen'} →
          </button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Wie entstehen diese Zahlen?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Die Baukosten setzen sich aus Hauspreis, Reserve und separat bezahlten Leistungen zusammen. Für die monatliche Summe rechnen wir Kreditrate und Betriebskosten zusammen.</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Fehlende Angaben und Beispielwerte machen das Ergebnis unsicher. Du kannst alle Werte jederzeit ändern.</p>
        </div>
      </section>
    </div>
  );
}

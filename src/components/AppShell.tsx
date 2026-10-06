import type { ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import type { Hauptbereich } from '../utils/navigation';

interface AppShellProps {
  children: ReactNode;
  loading: boolean;
  blocked: boolean;
  status: string;
  houses: { id: string; name: string }[];
  activeHouseId: string | null;
  onSelectHouse: (id: string) => void;
  onAddHouse: () => void;
  canAddHouse: boolean;
  shareOpen: boolean;
  onShare: () => void;
  onExport: () => void;
  onImport: () => void;
  onRename: () => void;
  onDelete: () => void;
  activeSection: Hauptbereich;
  onNavigate: (section: Hauptbereich) => void;
  navigationEnabled: boolean;
}

const bereiche: { id: Hauptbereich; label: string }[] = [
  { id: 'ueberblick', label: 'Überblick' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'haus', label: 'Haus' },
  { id: 'vergleich', label: 'Vergleich' },
];

function Icon({ bereich }: { bereich: Hauptbereich }) {
  const pfade: Record<Hauptbereich, ReactNode> = {
    ueberblick: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-8h6v8" /></>,
    kosten: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    haus: <><path d="m3 10 9-7 9 7v10H3V10Z" /><path d="M3 10h18M9 21v-8h6v8" /></>,
    vergleich: <><rect x="3" y="9" width="7" height="12" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">
      {pfade[bereich]}
    </svg>
  );
}

function NavigationItem({ bereich, label, active, enabled, onNavigate, mobile }: {
  bereich: Hauptbereich;
  label: string;
  active: boolean;
  enabled: boolean;
  onNavigate: (section: Hauptbereich) => void;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      aria-current={active && enabled ? 'page' : undefined}
      onClick={() => onNavigate(bereich)}
      className={`${mobile ? 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px]' : 'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm'} font-medium transition-colors focus-visible:outline-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-40 ${active && enabled ? 'bg-sky-50 text-sky-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <Icon bereich={bereich} />
      <span>{label}</span>
    </button>
  );
}

function LoadingPlaceholder() {
  return (
    <div aria-hidden="true" className="space-y-6 animate-pulse motion-reduce:animate-none">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="h-56 rounded-2xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-36 rounded-xl bg-slate-200" />
        <div className="h-36 rounded-xl bg-slate-200" />
        <div className="h-36 rounded-xl bg-slate-200" />
        <div className="h-36 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function AppShell({ children, loading, blocked, status, houses, activeHouseId, onSelectHouse, onAddHouse, canAddHouse, shareOpen, onShare, onExport, onImport, onRename, onDelete, activeSection, onNavigate, navigationEnabled }: AppShellProps) {
  const saving = status.startsWith('Speichere');
  const selectedHouseName = houses.find((house) => house.id === activeHouseId)?.name ?? 'Meine Planung';

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafb] text-slate-900">
      <a href="#hauptinhalt" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sky-800 focus:shadow-lg">
        Zum Inhalt springen
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:flex-nowrap sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-700 text-white"><Icon bereich="ueberblick" /></span>
          <h1 className="shrink-0 text-sm font-semibold tracking-tight sm:text-base">Hausbau Planer</h1>
          </div>
          <div className="order-3 flex w-full min-w-0 items-center gap-2 border-t border-slate-100 pt-2 sm:order-none sm:w-auto sm:flex-1 sm:border-t-0 sm:pt-0">
            <span aria-hidden="true" className="hidden text-slate-300 sm:inline">/</span>
            <Menu.Root>
              <Menu.Trigger disabled={!canAddHouse} aria-label={`Haus auswählen, aktuell ${selectedHouseName}`} className="flex min-h-9 min-w-0 max-w-64 flex-1 items-center justify-between gap-2 rounded-lg border border-transparent bg-white px-2 text-sm font-medium text-slate-700 hover:border-slate-200 focus-visible:outline-2 focus-visible:outline-sky-600 disabled:opacity-60 sm:flex-none">
                <span className="truncate">{loading ? 'Lädt …' : selectedHouseName}</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4 shrink-0"><path d="m5 7 5 5 5-5" /></svg>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner align="start" sideOffset={6} className="z-50 outline-none">
                  <Menu.Popup className="max-h-[70vh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg outline-none">
                    <Menu.Item onClick={onAddHouse} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 outline-none data-[highlighted]:bg-sky-50 data-[highlighted]:text-sky-900">
                      + Neues Haus anlegen
                    </Menu.Item>
                    {houses.length > 0 && <div aria-hidden="true" className="my-1 border-t border-slate-100" />}
                    {houses.map((house) => (
                      <Menu.Item key={house.id} onClick={() => onSelectHouse(house.id)} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-sky-50 data-[highlighted]:text-sky-900">
                        <span className="min-w-0 truncate">{house.name}</span>
                        {house.id === activeHouseId && <span aria-label="Aktuelles Haus" className="font-semibold text-sky-700">✓</span>}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {activeHouseId && <button type="button" aria-expanded={shareOpen} aria-controls="teilen-bereich" onClick={onShare} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-sky-600">Teilen</button>}
            <Menu.Root>
              <Menu.Trigger disabled={!canAddHouse} aria-label="Weitere Optionen" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-600 disabled:opacity-50">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5"><circle cx="12" cy="5" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="12" cy="19" r="1.75" /></svg>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner align="end" sideOffset={6} className="z-50 outline-none">
                  <Menu.Popup className="min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none">
                    <Menu.Item onClick={onExport} className="cursor-pointer rounded px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-sky-50 data-[highlighted]:text-sky-900">JSON exportieren</Menu.Item>
                    <Menu.Item onClick={onImport} className="cursor-pointer rounded px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-sky-50 data-[highlighted]:text-sky-900">JSON importieren</Menu.Item>
                    {activeHouseId && <Menu.Item onClick={onRename} className="cursor-pointer rounded px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-sky-50 data-[highlighted]:text-sky-900">Haus umbenennen</Menu.Item>}
                    {activeHouseId && <Menu.Item onClick={onDelete} className="cursor-pointer rounded px-3 py-2 text-sm text-red-700 outline-none data-[highlighted]:bg-red-50 data-[highlighted]:text-red-900">Aktives Haus löschen</Menu.Item>}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1">
        <aside className="hidden w-52 shrink-0 border-r border-slate-200 bg-white md:block">
          <nav aria-label="Hauptbereiche" className="sticky top-16 flex flex-col gap-1 px-3 py-5">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Planung</p>
            {bereiche.map(({ id, label }) => (
              <NavigationItem key={id} bereich={id} label={label} active={activeSection === id} enabled={navigationEnabled} onNavigate={onNavigate} />
            ))}
          </nav>
        </aside>

        <main id="hauptinhalt" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-28 pt-6 outline-none sm:px-8 md:pb-12 lg:px-10 lg:pt-8">
          <div className="mx-auto max-w-6xl">
            {!loading && status && <p role={saving ? 'status' : 'alert'} className={`mb-5 rounded-lg border p-3 text-sm ${saving ? 'border-sky-200 bg-sky-50 text-sky-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>{status}</p>}
            {loading ? (
              <div role="status" aria-label="Planung wird geladen">
                <p className="mb-5 text-sm text-slate-600">Planung wird geladen …</p>
                <LoadingPlaceholder />
              </div>
            ) : blocked ? (
              <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800">Erneut versuchen</button>
            ) : children}
          </div>
        </main>
      </div>

      <nav aria-label="Hauptbereiche" className="fixed bottom-0 z-30 grid w-full grid-cols-4 gap-1 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_20px_rgba(15,23,42,0.04)] backdrop-blur-sm md:hidden">
        {bereiche.map(({ id, label }) => (
          <NavigationItem key={id} bereich={id} label={label} active={activeSection === id} enabled={navigationEnabled} onNavigate={onNavigate} mobile />
        ))}
      </nav>
    </div>
  );
}

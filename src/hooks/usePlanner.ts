import { useEffect, useRef, useState } from 'react';
import type { PlannerData } from '../types';
import { supabase } from '../utils/supabase';
import { canInitializeDocument, clearLegacyHouses, decryptPlannerData, encryptPlannerData, plannerLink, readLegacyHouses, resolveIdentity, writeToken } from '../utils/plannerStorage';
import { parsePlannerBackup } from '../utils/houseBackup';

export function usePlanner() {
  const [identity] = useState(() => resolveIdentity(window.localStorage, window.location.href, import.meta.env.BASE_URL));
  const [planner, setPlanner] = useState<PlannerData>({ houses: [], todos: [] });
  const [status, setStatus] = useState('Lade verschlüsselte Daten …');
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const initial = useRef(true);
  const queue = useRef(Promise.resolve());
  const revision = useRef(0);
  const pending = useRef(false);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!pending.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  useEffect(() => {
    const link = plannerLink(window.location.href, import.meta.env.BASE_URL, identity);
    if (window.location.href !== link) window.history.replaceState(null, '', link);
    if (!supabase) {
      setStatus('Supabase ist nicht konfiguriert. Speichern ist nicht möglich.');
      setLoadError(true);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase!.rpc('get_planner_document', { document_id: identity.id });
        if (error) throw error;
        if (cancelled) return;
        if (data) {
          const loaded = await decryptPlannerData(data, identity);
          if (cancelled) return;
          setPlanner(loaded);
        } else {
          if (!canInitializeDocument(window.localStorage, identity)) throw new Error('Planung nicht gefunden.');
          const legacy = readLegacyHouses(window.localStorage);
          const loaded = parsePlannerBackup(JSON.stringify(legacy ?? []));
          const payload = await encryptPlannerData(loaded, identity);
          const token = await writeToken(identity);
          const { data: saved, error: saveError } = await supabase!.rpc('save_planner_document', { document_id: identity.id, document_payload: payload, write_secret: token });
          if (saveError || !saved) throw saveError ?? new Error('Speichern fehlgeschlagen.');
          if (cancelled) return;
          if (legacy) clearLegacyHouses(window.localStorage);
          setPlanner(loaded);
        }
        setReady(true);
        setStatus('');
      } catch {
        if (!cancelled) {
          setStatus('Daten konnten nicht geladen werden. Prüfe Link, Schlüssel und Supabase. Lade die Seite erneut.');
          setLoadError(true);
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [identity]);

  useEffect(() => {
    if (!ready) return;
    if (initial.current) { initial.current = false; return; }
    pending.current = true;
    const currentRevision = ++revision.current;
    setStatus('Speichere Änderungen …');
    const timer = window.setTimeout(() => {
      queue.current = queue.current.then(async () => {
        const payload = await encryptPlannerData(planner, identity);
        const token = await writeToken(identity);
        const { data, error } = await supabase!.rpc('save_planner_document', { document_id: identity.id, document_payload: payload, write_secret: token });
        if (error || !data) throw error ?? new Error('Speichern fehlgeschlagen.');
        if (currentRevision === revision.current) {
          pending.current = false;
          setStatus('');
        }
      }).catch(() => { setStatus('Speichern fehlgeschlagen. Daten nicht gesichert. Bitte erneut ändern oder JSON exportieren.'); });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [planner, identity, ready]);

  return { planner, setPlanner, ready, loadError, status, link: plannerLink(window.location.href, import.meta.env.BASE_URL, identity) };
}

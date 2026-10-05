# Hausbau Planer

React-App für Hausbaukosten, Finanzierung und Betriebskosten. Die Eingaben werden im `localStorage` des verwendeten Browsers gespeichert. Sie werden nicht zwischen Geräten synchronisiert und nicht durch GitHub Pages gesichert.

Im Tab **Materialien** kannst du je Haus Angaben zu Wänden, Fenstern und Türen, Technik, Böden sowie Dach und Decken erfassen. Die Felder sind auf das jeweilige Bauteil abgestimmt, etwa Verglasung beim Fenster oder Speicher bei der Photovoltaik. Frühere Einträge bleiben sichtbar und werden beim JSON-Export mitgesichert. Die Angaben sind Planungshilfen, keine technische Bewertung.

Der Tab **Vergleich** stellt die Kosten und ausgewählte Materialien aller Häuser gegenüber. In den Tabs **Baukosten** und **Materialien** kannst du offene Angaben filtern. Das Löschen eines Hauses erfordert eine Bestätigung.

Im Tab **Teilen** kannst du einen Nur-Lesen-Link für ein Haus erstellen. Der Link zeigt eine Momentaufnahme: Spätere Änderungen werden nicht übertragen. Jeder mit dem Link sieht auch Preise, Finanzierung und Notizen. Empfänger können das Haus als neue Kopie in ihren Browser übernehmen. Links lassen sich im ursprünglichen Browser widerrufen. Nach dem Löschen der Browserdaten ist die anonyme Freigabe-Verwaltung ohne Login nicht mehr erreichbar.

Über **JSON exportieren** kannst du alle Häuser als Datei sichern. Mit **JSON importieren** kannst du diese Datei wieder laden. Der Import ersetzt nach einer Bestätigung alle aktuell gespeicherten Häuser; ungültige Dateien ändern keine Daten.

## Lokal starten

Benötigt Node.js 22.6 oder neuer.

```sh
npm ci
npm run dev
npm test
```

## Supabase für Freigaben einrichten

1. Im Supabase-Projekt unter **Authentication → Providers** die **anonyme Anmeldung** aktivieren.
2. Die Datei `supabase-share-links.sql` im **SQL Editor** des Projekts einmal vollständig ausführen. Sie erstellt die Tabelle mit Besitzerrechten und eine auf einzelne Links beschränkte Lese-Funktion. Beliebige Hauslisten sind nicht öffentlich lesbar.
3. Für den lokalen Start die Projekt-URL und den Publishable Key in `.env.local` als `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` eintragen. Die Datei wird nicht eingecheckt; `.env.example` zeigt das Format. **Keinen Secret Key oder Service-Role-Key verwenden.**
4. Für GitHub Pages dieselben zwei Werte in **Settings → Secrets and variables → Actions → Variables** des GitHub-Repositories anlegen. Der Build übernimmt sie automatisch. Danach einen neuen Deploy-Workflow starten.

Ohne Supabase-Einrichtung bleibt der Rest der App nutzbar, aber „Teilen“ zeigt eine Fehlermeldung. Ein Link enthält die ID im URL-Fragment (`#share=…`); er gibt nur die ausdrücklich geteilte Momentaufnahme frei. Supabase Free kann bei geringer Aktivität pausieren. Solange das Projekt pausiert ist, funktionieren Freigabe-Links nicht.

Teste nach der Einrichtung: Erstelle einen Link, öffne ihn in einem privaten Browserfenster und widerrufe ihn im ursprünglichen Browser. Danach darf der Link keine Hausdaten mehr anzeigen.

## Auf GitHub Pages veröffentlichen

1. In `appbackstube/haus-planner` unter **Settings → Pages → Build and deployment** die Quelle **GitHub Actions** auswählen.
2. Falls noch kein `origin` eingerichtet ist, den Remote verbinden und die Dateien auf `main` veröffentlichen:

   ```sh
   git remote add origin git@github.com:appbackstube/haus-planner.git
   git add .
   git commit -m "Set up house planner and Pages deployment"
   git push -u origin main
   ```

   Dabei `package-lock.json` und `.github/workflows/deploy.yml` mit einchecken. Ein Push oder ein manueller Start unter **Actions → Deploy to GitHub Pages** löst den Build aus.
3. Nach erfolgreichem Workflow ist die Website voraussichtlich unter `https://appbackstube.github.io/haus-planner/` erreichbar. Falls GitHub Pages einen anderen Link zeigt, gilt die URL des Deployments.

Der Workflow verwendet `npm ci`, baut mit `npm run build -- --mode github-pages` und veröffentlicht nur `dist`. Der Modus setzt den Vite-Basispfad `/haus-planner/`; `npm run dev` bleibt unter `/` erreichbar. `dist`, `node_modules` und TypeScript-Builddateien werden nicht eingecheckt.

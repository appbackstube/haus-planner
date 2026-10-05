# Hausbau Planer

React-App für Hausbaukosten, Finanzierung und Betriebskosten. Die Eingaben werden im `localStorage` des verwendeten Browsers gespeichert. Sie werden nicht zwischen Geräten synchronisiert und nicht durch GitHub Pages gesichert.

Über **JSON exportieren** kannst du alle Häuser als Datei sichern. Mit **JSON importieren** kannst du diese Datei wieder laden. Der Import ersetzt nach einer Bestätigung alle aktuell gespeicherten Häuser; ungültige Dateien ändern keine Daten.

## Lokal starten

```sh
npm ci
npm run dev
```

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

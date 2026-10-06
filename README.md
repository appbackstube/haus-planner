# Hausbau Planer

React-App für Hausbaukosten, Finanzierung und Betriebskosten. Beim ersten Aufruf erhält die Planung eine ID und einen 256-Bit-Schlüssel. Beide stehen in der URL (`/<id>/<schlüssel>`) und im `localStorage`. Die Hausdaten werden im Browser mit AES-256-GCM verschlüsselt und nur verschlüsselt in Supabase gespeichert. Der Schlüssel wird nicht an Supabase gesendet. Mit demselben Link können andere Browser die Planung öffnen und ändern.

Der Einstieg zeigt zuerst **Überblick** statt eines Formulars. Neue Nutzer sehen einen einfachen Start mit drei Schritten. Für ein angelegtes Haus zeigt die Seite bisher erfasste Baukosten, monatliche Kreditrate, laufende Kosten und deren Summe. Fehlende Werte werden als „Noch offen“ angezeigt; die vorbelegten Betriebskosten sind als Beispielwerte markiert. Ein Knopf führt zum nächsten sinnvollen Schritt. Die Hauptnavigation hat vier Bereiche: **Überblick**, **Kosten**, **Haus** und **Vergleich**. Die Unterbereiche von **Kosten** und **Haus** stehen oben in der Arbeitsfläche.

Unter **Haus → Materialien** kannst du je Haus Angaben zu Wänden, Fenstern und Türen, Technik, Böden sowie Dach und Decken erfassen. Die Felder sind auf das jeweilige Bauteil abgestimmt, etwa Verglasung beim Fenster oder Speicher bei der Photovoltaik. Frühere Einträge bleiben sichtbar und werden beim JSON-Export mitgesichert. Die Angaben sind Planungshilfen, keine technische Bewertung.

**Vergleich** stellt die Kosten und ausgewählte Materialien aller Häuser gegenüber. Unter **Kosten → Baukosten** und **Haus → Materialien** kannst du offene Angaben filtern. Das Löschen eines Hauses erfordert eine Bestätigung.

Die Leistungsgruppen unter **Kosten → Baukosten** folgen grob dem Bauablauf: Planung, Vertrag, Baustelleneinrichtung, Fundament, Gebäudehülle, Haustechnik, Innenausbau, Außenbereich und Übergabe. Einzelne Arbeiten können sich zeitlich überschneiden.

Die App Shell hat eine feste Kopfzeile mit Hausauswahl, **Teilen** und Optionsmenü. Der Hausname und die Bereichstitel werden nicht im Arbeitsbereich wiederholt. Speicher- und Fehlermeldungen erscheinen dort nur bei Bedarf. Am Desktop liegen die vier Hauptbereiche in einer Seitenleiste mit Symbolen und Text; am Smartphone stehen sie in einer Leiste am unteren Bildschirmrand. Beim Laden erscheint ein Platzhalter; bei Fehlern ein Knopf zum erneuten Laden. Dies ist eine sichtbare Oberfläche, **kein Offline-Modus**: Ohne Supabase können keine Planungsdaten geöffnet oder gespeichert werden.

In der Kopfzeile öffnet der Hausname ein Dropdown mit allen Häusern und „Neues Haus anlegen“. Das aktive Haus lässt sich über das Optionsmenü nach Bestätigung löschen.

Über **Teilen** oben rechts siehst du denselben Link wie in der Adresszeile. Jeder mit dem Link kann alle Häuser, Preise und Notizen lesen und ändern. Änderungen werden nach kurzer Wartezeit gespeichert. Bei gleichzeitigem Bearbeiten gilt der letzte Speicherstand. Gib den Link nur an vertrauenswürdige Personen weiter. Ohne Link und ohne Browserdaten ist der Schlüssel verloren; die Daten können dann nicht wiederhergestellt werden.

Über **JSON exportieren** kannst du alle Häuser als unverschlüsselte Datei sichern. Schütze diese Datei selbst. Mit **JSON importieren** kannst du sie wieder laden. Der Import ersetzt nach Bestätigung alle Häuser; ungültige Dateien ändern keine Daten. Alte lokale Hausdaten werden beim ersten erfolgreichen Upload übernommen und danach aus dem `localStorage` entfernt. Falls der Upload fehlschlägt, bleiben die alten Daten zur Wiederholung erhalten.

## Lokal starten

Benötigt Node.js 22.6 oder neuer.

```sh
npm ci
npm run dev
npm test
```

## Supabase für verschlüsselte Speicherung einrichten

1. Die Datei `supabase-share-links.sql` im **SQL Editor** des Projekts vollständig ausführen. Sie erstellt die Tabelle `planner_documents` und zwei Funktionen zum Lesen und Schreiben. Anonyme Anmeldung ist nicht erforderlich. Bei einem früheren Setup sperrt das Skript den Zugriff auf alte unverschlüsselte Freigaben. Sichere und lösche die alte Tabelle `shared_houses` separat, wenn diese Daten nicht mehr benötigt werden.
3. Für den lokalen Start die Projekt-URL und den Publishable Key in `.env.local` als `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` eintragen. Die Datei wird nicht eingecheckt; `.env.example` zeigt das Format. **Keinen Secret Key oder Service-Role-Key verwenden.**
4. Für GitHub Pages dieselben zwei Werte in **Settings → Secrets and variables → Actions → Variables** des GitHub-Repositories anlegen. Der Build übernimmt sie automatisch. Danach einen neuen Deploy-Workflow starten.

Ohne Supabase-Einrichtung kann die App keine Hausdaten laden oder speichern. Ein fehlender oder falscher Schlüssel kann vorhandene Daten nicht öffnen. Der Server speichert nur verschlüsselten Inhalt und einen Prüfwert für Schreibrechte. **Wichtige Grenze:** Da der Schlüssel auf Wunsch im URL-Pfad steht, erhält der Webhost den vollständigen Pfad beim Aufruf. Der Webhost oder dessen Zugriffsprotokolle können deshalb den Schlüssel sehen. „Nur der Browser kennt den Schlüssel“ gilt gegenüber Supabase, nicht gegenüber dem Webhost. Der `Referrer-Policy`-Eintrag verhindert, dass der Pfad als Referrer an externe Seiten geht. Für echte Geheimhaltung gegenüber dem Webhost müsste der Schlüssel statt im Pfad hinter `#` stehen.

Teste nach der Einrichtung: Lege ein Haus an, warte bis „Speichere Änderungen“ verschwindet und öffne denselben Link in einem privaten Browserfenster. Ein geänderter Schlüssel darf keine Hausdaten anzeigen.

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

Der Workflow verwendet `npm ci`, baut mit `npm run build -- --mode github-pages` und veröffentlicht nur `dist`. Der Modus setzt den Vite-Basispfad `/haus-planner/`; `npm run dev` bleibt unter `/` erreichbar. Die Datei `404.html` lädt Direktlinks zu Planungen auf GitHub Pages. `dist`, `node_modules` und TypeScript-Builddateien werden nicht eingecheckt.

# AGENTS.md

## Projekt und Branches

- `master`: **Herzklang**, eine Partnerbörse für Personen.
- `tiere`: **Pfotenmatch**, eine Tier-Matching-Variante für Hunde und Katzen.
- Frontend: Vue 2, Vuex, Vue Router und Vuetify 2.
- Backend: Node.js, Express und SQLite (`better-sqlite3`).
- Die Branches teilen Grundstruktur und Authentifizierung, besitzen aber unterschiedliche
  Datenmodelle. Branch-spezifische Felder, Routen und Begriffe dürfen nicht ungeprüft in den
  jeweils anderen Branch übertragen werden.

## Arbeitsregeln

- Vor Änderungen `git status --short --branch` prüfen und bestehende Nutzeränderungen erhalten.
- Keine Datenbankdateien, Uploads, Secrets, Build-Ausgaben oder `node_modules` committen.
- API- und UI-Änderungen immer gemeinsam prüfen: Routenparameter, Response-Felder und Vuex-
  Actions müssen exakt zusammenpassen.
- IDs semantisch eindeutig benennen. Insbesondere `matchId` und `conversationId` sind nicht
  austauschbar.
- Neue Datenbankschemata benötigen eine Migration für vorhandene Datenbanken; `CREATE TABLE IF
  NOT EXISTS` migriert existierende Tabellen nicht.
- Autorisierung serverseitig erzwingen. UI-Sperren allein sind kein Zugriffsschutz.
- Nutzereingaben serverseitig validieren und sinnvolle Längenlimits setzen. Fehlerantworten
  dürfen keine internen Details offenlegen.
- Personenbezogene Daten und besonders die politische Angabe im `master`-Branch sparsam
  verarbeiten. Einwilligungs- und Löschkonzept bei entsprechenden Änderungen mitprüfen.

## Lokales Setup

Node.js 20.10 oder neuer ist erforderlich; vor npm-Befehlen `nvm use` ausführen.

```bash
npm install
npm run server:install
cp server/.env.example server/.env
npm run server:seed
npm run dev
```

Frontend: `http://localhost:8080`; API: `http://localhost:4000/api/`.
`npm run server:seed` schreibt Demo-Daten und sollte nicht gegen erhaltenswerte Datenbanken
ausgeführt werden.

## Prüfungen vor Abschluss

```bash
npm run lint
npm run test:unit -- --runInBand
npm run test:api
npm run build
```

Zusätzlich mindestens folgende Abläufe gegen eine separate Testdatenbank prüfen:

1. Registrierung mit gültigen und ungültigen Daten, doppelter E-Mail und doppeltem Namen.
2. Login, abgelaufenes/ungültiges Token und Logout.
3. Profil bzw. Tier anlegen, bearbeiten, Bild hochladen und löschen.
4. Like/Pass, gegenseitiges Like, Match und Unmatch.
5. Unterhaltung starten, Nachricht senden/empfangen/löschen sowie Fremdzugriff verweigern.
6. Blockieren und Entblockieren samt Auswirkungen auf Suche, Entdecken und Chat.
7. Direkte Navigation und Browser-Reload auf allen geschützten Vue-Routen.

Die Unit-Tests decken derzeit nur erste Konstanten-Invarianten ab. Neue Fehlerbehebungen sollen
gezielte Regressionstests für die realen Auth-, Chat- und Matching-Flows ergänzen.

## Bekannte branchübergreifende Stolperstellen

- Nach einem gegenseitigen Like liefern die APIs sowohl `matchId` als auch `conversationId`.
  Die Chat-Route erwartet die `conversationId`.
- Chat nutzt Server-Sent Events und 30-Sekunden-Fallback-Polling. EventSource und Timer müssen
  beim Verlassen der View beendet werden.
- Erlaubte CORS-Origins werden über `CORS_ORIGINS` konfiguriert. In Produktion nur
  vertrauenswürdige Origins eintragen.
- Auth-JWTs dürfen nicht an JavaScript oder `localStorage` zurückgegeben werden. Cookies bleiben
  `HttpOnly`, `SameSite` und in Produktion `Secure`.

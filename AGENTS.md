# AGENTS.md

## Projekt

Dieser Arbeitsbaum enthält den Branch `tiere` (Pfotenmatch). Profile sind Tiere, Authentifizierung
und Chats gehören jedoch den Haltern. `petId`, `matchId`, `userId` und `conversationId` sind
unterschiedliche Identitäten und dürfen nicht ausgetauscht werden.

## Arbeitsregeln

- Node.js 20.10 oder neuer verwenden (`nvm use`).
- Vor Änderungen den Git-Status prüfen und bestehende Nutzeränderungen erhalten.
- Keine Datenbanken, Uploads, Secrets, Builds oder `node_modules` committen.
- Schemaänderungen migrationssicher und mehrschrittige Löschungen transaktional umsetzen.
- Autorisierung, Besitzprüfung und Längenlimits immer serverseitig erzwingen.
- Auth-JWTs bleiben in `HttpOnly`-/`SameSite`-Cookies und in Produktion zusätzlich `Secure`.
- Neue Chat-Funktionen müssen Blockierung, SSE, Pagination und Ungelesen-Status berücksichtigen.
- Tierlöschung entfernt Tier-Matches und -Likes, aber nicht automatisch Halter-Unterhaltungen.

## Pflichtprüfungen

```bash
npm run lint
npm run test:unit -- --runInBand
npm run test:api
npm run build
npm audit --omit=dev
npm --prefix server audit --omit=dev
```

Für Tests `DB_PATH` auf eine isolierte temporäre SQLite-Datei setzen. `npm run server:seed`
niemals gegen erhaltenswerte Daten ausführen.

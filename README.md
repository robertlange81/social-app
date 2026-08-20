# Herzklang - Partnerbörse

Eine Partnerbörsen-Anwendung (analog zu Parship/ElitePartner) mit Vue 2 / Vuetify im Frontend
und einem eigenen Node/Express-Backend mit SQLite-Datenbank.

Kernfeature: Bei der Registrierung ist die Angabe der Partei, die man wählt, **Pflicht** und wird
ganz oben auf dem Profil angezeigt.

## Setup

Voraussetzung: Node.js 20.10 oder neuer (`nvm use` liest `.nvmrc`).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run seed   # legt 100 Demo-Profile mit generierten Comic-Avataren an (Login: <handle>@example.com / "password123")
npm run dev    # startet die API auf http://localhost:4000
```

### 2. Frontend

Im Projekt-Root (in einem zweiten Terminal):

```bash
npm install
npm run serve  # startet die App auf http://localhost:8080
```

Alternativ startet `npm run dev` im Root Backend und Frontend zusammen (nach `npm run server:install`
und `npm run server:seed` einmalig).

## Funktionen

- Registrierung mit Pflichtangaben: Name, E-Mail, Passwort, Geburtsdatum (Mindestalter 18),
  Geschlecht, gesuchtes Geschlecht, Wohnort, **Partei** (Pflicht, alphabetisch sortiertes
  Dropdown, eigene Einwilligung erforderlich)
- Profil mit Partei-Banner ganz oben, Profilbild-Upload, Bio, bearbeitbare Angaben
- Hochgeladene Profilbilder werden automatisch serverseitig in einen Comic-Stil umgewandelt
  (kräftige Farben, geglättete Flächen, betonte Konturen - `server/lib/cartoonify.js`)
- 100 generierte Demo-Profile mit prozedural erzeugten Comic-Avataren (`server/lib/avatarGenerator.js`)
- Schnell-Likes direkt auf der Startseite samt Match-Dialog und Chat-Einstieg
- Soziale Pinnwand mit Statusbeiträgen, Likes und „Anstupsen“; blockierte Nutzer bleiben ausgeblendet
- Der Demo-Seed ergänzt zwölf Beispielbeiträge für eine sofort gefüllte Pinnwand
- Resonanz-Check mit acht Situationsfragen und transparentem Profilvergleich
- Community-Gruppen mit Mitgliedschaften und eigener Gruppen-Pinnwand
- Chat-Antworten, Emoji-Reaktionen und gemeinsamer Date-Planer mit Zu-/Absage
- Echtzeit-Benachrichtigungen für Likes, Matches, Nachrichten, Reaktionen, Anstupser und Dates
- Chat-Suche, Tippen-Anzeige, Bearbeiten/Löschen und Kalenderexport (`.ics`)
- Gewichtete oder private Resonanzantworten
- Passwort-Reset, E-Mail-Bestätigung, Spam-/Linkschutz und auditierte Moderationsansicht
- Installierbare PWA mit Offline-App-Shell und mobiler Bottom-Navigation
- Sichere Bild- und Sprachnachrichten: Bildmetadaten werden entfernt, Dateien validiert und Bilder auf Wunsch erst nach bewusster Freigabe sichtbar
- OpenLayers-/OpenStreetMap-Karte mit freiwilligen, auf ungefähr 1 km vergröberten Standorten und Umkreissuche
- "Entdecken": Swipe-Deck (Ziehen per Maus/Touch oder Buttons) mit Like/Pass
- Gegenseitiges Like erzeugt ein Match
- Match-Liste, freie Unterhaltungen, Echtzeit-Chat via Server-Sent Events, Ungelesen-Zähler
- Nutzer blockieren und melden
- Datenschutzbereich mit JSON-Datenexport und passwortbestätigter Accountlöschung
- Psychedelischer Hintergrund im gesamten UI (`src/assets/psychedelic-bg.svg`)

## Datenschutz-Hinweis

Herzklang enthält öffentliche Seiten für Impressum, Datenschutz, Nutzungsbedingungen und Community-Regeln. Angemeldete Mitglieder verwalten unter `/settings` Benachrichtigungen, Dark Mode sowie versionierte Einwilligungen für politische Profildaten und Kartenanzeige. Ein Widerruf der politischen Einwilligung neutralisiert die Parteipräferenz und entfernt Resonanzdaten; Kartenfreigaben werden beim Widerruf sofort deaktiviert.

Automatische Aufbewahrungsregeln entfernen gelesene Benachrichtigungen nach 90 Tagen, Profilbesuche nach 180 Tagen und verbrauchte oder abgelaufene Authentifizierungslinks nach sieben weiteren Tagen. Rechtstexte und Fristen müssen vor einem Produktivbetrieb anwaltlich sowie anhand des tatsächlichen Hostings und aller eingesetzten Auftragsverarbeiter geprüft werden.

Die Partei-Angabe zählt als besondere Kategorie personenbezogener Daten (Art. 9 DSGVO).
Registrierung verlangt daher eine separate, klar beschriftete Einwilligung dafür - unabhängig
von der allgemeinen Zustimmung zu den Nutzungsbedingungen.

## Stack

* Vue 2, Vuex, Vue Router, Vuetify 2
* Node.js, Express, better-sqlite3, JWT, bcryptjs, multer

## Branches

- `master`: Herzklang, Matching und Chats zwischen Personen.
- `tiere`: Pfotenmatch, Matching zwischen Hunden und Katzen; Chats finden zwischen den
  zugehörigen Haltern statt.

Remote-Branches vor einem Vergleich aktualisieren:

```bash
git fetch origin
git branch -a
git diff --stat origin/master...origin/tiere
```

Beim Branch-Wechsel keine Datenbank des anderen Datenmodells weiterverwenden. `master` nutzt
`server/data/app.db`, `tiere` nutzt `server/data/pets.db`. Für reproduzierbare Tests pro Branch
eine eigene, frisch geseedete Datenbank einsetzen.

## Entwicklung und Qualitätsprüfung

Versionierte SQLite-Migrationen laufen beim Serverstart automatisch und erstellen vor offenen Änderungen an einer bestehenden Datenbank ein konsistentes Backup. Status, Erweiterungsregeln und Restore-Ablauf stehen in [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md). Das Verfahren für Datenschutzanfragen, Dienstleister und Löschkontrolle steht in [`docs/PRIVACY_OPERATIONS.md`](docs/PRIVACY_OPERATIONS.md).

```bash
npm run lint
npm run test:unit -- --runInBand
npm run test:api
npm run build
```

Der Produktions-Build funktioniert, meldet aber Größenwarnungen für den Vuetify-Vendor-Chunk.
Unit- und isolierte API-Tests laufen lokal und in GitHub Actions.

Manuelle Smoke-Tests sollten mindestens abdecken:

1. Registrierung inklusive Pflichtfeldern, Mindestalter und Einwilligungen (`master`).
2. Login mit korrekten und falschen Zugangsdaten sowie Logout.
3. Profil-/Tierverwaltung inklusive Upload und Löschen.
4. Like, Pass, Match, Unmatch und Wechsel in den zugehörigen Chat.
5. Nachrichten in beiden Richtungen, Leernachrichten, Fremdzugriff und Blockierung.
6. Suche, Merkliste und Profilbesucher mit mehreren Testkonten.

## Bekannte technische Risiken

- `matchId` und `conversationId` bezeichnen unterschiedliche Datensätze und dürfen in neuen
  Flows nicht verwechselt werden.
- Schemaänderungen benötigen echte Migrationen; die Umstellung alter Match-Nachrichten auf
  Unterhaltungen wird beim Serverstart automatisch migriert.
- Globale und Auth-spezifische Rate-Limits sind aktiv. Erlaubte CORS-Origins werden über
  `CORS_ORIGINS` konfiguriert und sind standardmäßig auf `http://localhost:8080` begrenzt.
- Sessions verwenden signierte JWTs in `HttpOnly`-/`SameSite`-Cookies; in Produktion zusätzlich
  `Secure`. Helmet setzt Security-Header und die API gibt Request-IDs aus.
- Nachrichten, Namen und Freitextfelder besitzen serverseitige Längenlimits; neue Felder
  müssen diesem Muster folgen.
- Der Chat nutzt Server-Sent Events und nur noch ein 30-Sekunden-Fallback-Polling. Bei mehreren
  Backendinstanzen muss der Event-Bus durch Redis/PubSub ersetzt werden.
- Der Backend-Produktions-Audit ist sauber. Vue 2/Vuetify 2 bleiben trotz kompatibler Updates
  EOL; die verbleibenden moderaten Frontend-Hinweise erfordern eine eigene Vue-3-/Vuetify-3-
  Migration. Der betroffene `VDatePicker` wird in dieser Anwendung nicht verwendet.

Weitere verbindliche Hinweise für Arbeiten am Repository stehen in `AGENTS.md`.

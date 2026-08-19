# Pfotenmatch - Tinder für Hunde (und Katzen)

Eine Matching-App für Tierhalter in Deutschland: Zucht- oder Spielpartner für den eigenen Hund
oder die eigene Katze finden - Swipe, Match und Chat, niedrigschwellig statt professionelles
Zuchtmanagement. Vue 2 / Vuetify im Frontend, eigenes Node/Express-Backend mit SQLite.

Dies ist ein eigener Branch (`tiere`), abgezweigt vom Partnerbörsen-Projekt auf `master` - gleiche
technische Basis, komplett anderes Datenmodell (Tier statt Person als Profil, mehrere Tiere pro
Halter möglich).

## Setup

Voraussetzung: Node.js 20.10 oder neuer (`nvm use` liest `.nvmrc`).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run seed   # legt ~70 Demo-Halter mit ~90 Demo-Tieren (Comic-Avataren) an
npm run dev    # startet die API auf http://localhost:4000
```

Demo-Login: `<vorname>@example.com` / Passwort `password123` (siehe Ausgabe von `npm run seed`).

### 2. Frontend

Im Projekt-Root (in einem zweiten Terminal):

```bash
npm install
npm run serve  # startet die App auf http://localhost:8080
```

Alternativ startet `npm run dev` im Root Backend und Frontend zusammen (nach `npm run server:install`
und `npm run server:seed` einmalig).

## Funktionen

- Halter-Konto (Name, E-Mail, Passwort, Wohnort), danach beliebig viele Tierprofile anlegen
  (Name, Art, Rasse, Geschlecht, Geburtsdatum, **Zweck**: Zuchtpartner/Spielpartner/beides, Foto, Bio)
- Hochgeladene Tierfotos werden automatisch serverseitig in Comic-Style umgewandelt
  (`server/lib/cartoonify.js`)
- "Entdecken": Swipe-Deck pro aktivem Tier, Matching-Logik nach Art, Zweck-Überschneidung und
  (bei reinem Zuchtwunsch) Geschlecht (`server/routes/discover.js`)
- Gegenseitiges Like erzeugt ein Match zwischen zwei Tieren
- **Chat ist nicht an ein Match gebunden**: Über jedes Tierprofil kann direkt eine Unterhaltung mit
  dem Halter gestartet werden ("Nachricht senden"), unabhängig vom Swipe-Status
  (`server/routes/conversations.js`)
- Nutzer blockieren: blockierte Halter tauchen nicht mehr in Suche/Entdecken auf und können nicht
  mehr schreiben (`server/routes/blocks.js`)
- Echtzeit-Chat via Server-Sent Events, Ungelesen-Zähler und paginierte Nachrichten
- Nutzer melden sowie Datenschutzbereich mit Datenexport und vollständiger Accountlöschung
- Suche mit Filtern (Art, Rasse, Zweck, Geschlecht, Alter, Ort), vorbelegt mit dem aktiven Tier
- Merkliste, Profilbesucher, gesendete/erhaltene Likes
- ~90 generierte Demo-Tiere mit prozedural erzeugten Comic-Avataren (`server/lib/avatarGenerator.js`)
- Psychedelischer Hintergrund im gesamten UI (`src/assets/psychedelic-bg.svg`)

## Stack

* Vue 2, Vuex, Vue Router, Vuetify 2
* Node.js, Express, better-sqlite3, JWT, bcryptjs, multer, sharp

## Qualität und Sicherheit

```bash
npm run lint
npm run test:unit -- --runInBand
npm run test:api
npm run build
```

Die CI führt diese Prüfungen sowie Produktions-Dependency-Audits unter Node 20 aus. Sessions
liegen in `HttpOnly`-/`SameSite`-Cookies, Helmet setzt Sicherheitsheader, Login und API sind
rate-limitiert, CORS wird über `CORS_ORIGINS` eingeschränkt. Der Backend-Audit ist sauber.
Vue 2/Vuetify 2 bleiben EOL und sollen in einem eigenen Migrationsprojekt durch Vue 3,
Vuetify 3 und Vite ersetzt werden.

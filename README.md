# Herzklang - Partnerbörse

Eine Partnerbörsen-Anwendung (analog zu Parship/ElitePartner) mit Vue 2 / Vuetify im Frontend
und einem eigenen Node/Express-Backend mit SQLite-Datenbank.

Kernfeature: Bei der Registrierung ist die Angabe der Partei, die man wählt, **Pflicht** und wird
ganz oben auf dem Profil angezeigt.

## Setup

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
- "Entdecken": Swipe-Deck (Ziehen per Maus/Touch oder Buttons) mit Like/Pass
- Gegenseitiges Like erzeugt ein Match
- Match-Liste und Chat pro Match (aktualisiert sich alle 3 Sekunden)
- Psychedelischer Hintergrund im gesamten UI (`src/assets/psychedelic-bg.svg`)

## Datenschutz-Hinweis

Die Partei-Angabe zählt als besondere Kategorie personenbezogener Daten (Art. 9 DSGVO).
Registrierung verlangt daher eine separate, klar beschriftete Einwilligung dafür - unabhängig
von der allgemeinen Zustimmung zu den Nutzungsbedingungen.

## Stack

* Vue 2, Vuex, Vue Router, Vuetify 2
* Node.js, Express, better-sqlite3, JWT, bcryptjs, multer

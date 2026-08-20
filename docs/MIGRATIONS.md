# Datenbankmigrationen

Beim Start führt `server/db/migrate.js` alle noch offenen Migrationen nach Versionsnummer aus. Jede Migration läuft in einer SQLite-Transaktion. Version, Name, SHA-256-Prüfsumme und Zeitpunkt werden in `schema_migrations` gespeichert. Eine nachträgliche Änderung einer bereits angewandten Migration führt absichtlich zum Startabbruch.

`schema.sql` ist seit Version 2 der unveränderliche Baseline-Stand. Weitere Schemaänderungen werden ausschließlich als neue Migration mit höherer Version in `server/db/migrate.js` ergänzt; die Baseline darf nicht mehr bearbeitet werden.

## Betrieb

Status anzeigen:

```bash
npm --prefix server run migrate:status
```

Vor der ersten offenen Migration einer bestehenden Dateidatenbank erzeugt der Runner per SQLite `VACUUM INTO` ein konsistentes Backup in `server/data/backups/`. Die Dateien enthalten personenbezogene Daten, dürfen nicht committed werden und benötigen dieselben Zugriffs- und Verschlüsselungsmaßnahmen wie die Hauptdatenbank.

## Rollback und Wiederherstellung

Produktionsmigrationen sind vorwärtsgerichtet. Ein automatisches `down` ist bewusst nicht vorgesehen, weil destruktive Rückmigrationen Daten unbemerkt verlieren können. Bei einem Fehler:

1. Schreibzugriffe beziehungsweise den Server stoppen.
2. Fehlerhafte Migration und Logs sichern; nicht erneut gegen die Produktionsdatei experimentieren.
3. Das unmittelbar vor der Migration erzeugte `.bak` an einen separaten Pfad kopieren.
4. Integrität mit `sqlite3 BACKUP_DATEI 'PRAGMA integrity_check;'` prüfen.
5. `DB_PATH` zunächst auf die geprüfte Kopie setzen und Anwendungstests durchführen.
6. Erst danach die fehlerhafte Datenbank ersetzen oder eine neue korrigierende Vorwärtsmigration ausrollen.

Backups und Restore-Verfahren müssen regelmäßig auf einer isolierten Umgebung getestet werden.

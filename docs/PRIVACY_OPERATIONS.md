# Datenschutz-Betriebskonzept

Dieses Dokument ergänzt die öffentliche Datenschutzerklärung um den internen, überprüfbaren Ablauf. Vor einem Produktivstart müssen alle Punkte durch den Betreiber bestätigt werden.

## Dienstleisterverzeichnis

Die öffentlichen Angaben werden über `server/.env` gepflegt: `LEGAL_HOSTING_PROVIDER`, `LEGAL_HOSTING_LOCATION`, `LEGAL_EMAIL_PROVIDER`, `LEGAL_PROCESSORS`, `LEGAL_LOG_RETENTION_DAYS`, `LEGAL_BACKUP_RETENTION_DAYS` und `PRIVACY_REQUEST_EMAIL`. Verträge zur Auftragsverarbeitung, Löschkonzepte und Angaben zu Unterauftragsverarbeitern werden außerhalb des Repositories sicher abgelegt. Änderungen an einem Dienstleister erfordern vor dessen Einsatz eine Datenschutzprüfung und gegebenenfalls eine Aktualisierung der Datenschutzerklärung.

## Auskunft, Berichtigung, Export und Löschung

1. Eingang an `PRIVACY_REQUEST_EMAIL` mit Datum, gewünschtem Recht und Bearbeitungsstatus dokumentieren. Keine sensiblen Inhalte in frei zugänglichen Tickets ablegen.
2. Identität datensparsam über die bestätigte Konto-E-Mail prüfen. Zusätzliche Nachweise nur verlangen, wenn begründete Zweifel bestehen; Nachweiskopien anschließend löschen.
3. Eingang unverzüglich bestätigen. Regelfrist: ein Monat. Eine notwendige Verlängerung und deren Grund innerhalb des ersten Monats mitteilen.
4. Für Auskunft/Übertragbarkeit den Export unter `/settings` verwenden und ergänzend Moderations-, Sicherheits- oder Logdaten prüfen, soweit sie der Person zugeordnet werden können.
5. Berichtigungen im Profil oder administrativ nachvollziehbar vornehmen. Bei Löschung die Kontolöschung ausführen, verwaiste Uploads prüfen und den Zeitpunkt notieren, zu dem die Daten aus rotierenden Backups verschwunden sein werden.
6. Daten Dritter, Geschäftsgeheimnisse und laufende Missbrauchsermittlungen vor einer Herausgabe rechtlich prüfen. Ablehnungen oder Einschränkungen begründen und Rechtsbehelf nennen.
7. Abschlussdatum, getroffene Maßnahmen und minimale Nachweisdaten dokumentieren. Den eigentlichen Export nicht länger als notwendig vorhalten.

## Aufbewahrung und Löschkontrolle

- verbrauchte/abgelaufene Authentifizierungslinks: sieben Tage Nachlauf;
- gelesene Benachrichtigungen: 90 Tage;
- Profilbesuche: 180 Tage;
- Konto, Chats und Medien: bis zur Löschung durch das Mitglied;
- Serverlogs und Backups: gemäß den veröffentlichten Umgebungsvariablen;
- gesetzlich erforderliche Sperr- oder Nachweisdaten: getrennt, zugriffsbeschränkt und mit dokumentierter Rechtsgrundlage.

Der automatische Retention-Lauf wird beim Serverstart ausgeführt. Im Produktionsmonitoring ist zu prüfen, dass er regelmäßig erfolgreich läuft. Restore-Tests müssen auch bestätigen, dass bereits abgelaufene Daten nach Wiederherstellung erneut vom Retention-Lauf entfernt werden.

## Sicherheitsvorfälle

Verdachtsfälle werden mit Zeitpunkt, betroffenen Systemen/Daten, Umfang, Maßnahmen und Entscheidung zur Meldepflicht dokumentiert. Eine mögliche Meldung an die Aufsicht ist unverzüglich und grundsätzlich binnen 72 Stunden zu bewerten; bei hohem Risiko ist zusätzlich die Benachrichtigung betroffener Personen zu prüfen.

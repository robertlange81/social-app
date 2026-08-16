// Wählbare Parteien bei der Registrierung. Pflichtfeld - bewusst keine
// "keine Angabe"-Option, da die Angabe laut Anforderung verpflichtend ist.
module.exports = [
  'CDU/CSU',
  'SPD',
  'Bündnis 90/Die Grünen',
  'FDP',
  'AfD',
  'Die Linke',
  'BSW',
  'Freie Wähler',
  'Sonstige Partei'
].sort((a, b) => a.localeCompare(b, 'de'))

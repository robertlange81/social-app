// Muss zur Liste in server/constants/parties.js passen (Inhalt, nicht Reihenfolge).
export const PARTIES = [
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

export const PARTY_COLORS = {
  'CDU/CSU': '#000000',
  SPD: '#E3000F',
  'Bündnis 90/Die Grünen': '#1AA037',
  FDP: '#FFED00',
  AfD: '#009EE0',
  'Die Linke': '#BE3075',
  BSW: '#7D1D46',
  'Freie Wähler': '#FF8C00',
  'Sonstige Partei': '#607D8B'
}

export function partyTextColor (party) {
  return party === 'FDP' ? '#191C1E' : '#FFFFFF'
}

export const GENDERS = [
  { value: 'male', text: 'Mann' },
  { value: 'female', text: 'Frau' },
  { value: 'diverse', text: 'Divers' }
]

export const SEEKING_GENDERS = [
  { value: 'male', text: 'Männer' },
  { value: 'female', text: 'Frauen' },
  { value: 'diverse', text: 'Diverse Personen' },
  { value: 'all', text: 'Alle' }
]

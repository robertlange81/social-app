export const SPECIES = [
  { value: 'dog', text: 'Hund' },
  { value: 'cat', text: 'Katze' }
]

export const SPECIES_ICON = { dog: '🐶', cat: '🐱' }

export const GENDERS = [
  { value: 'male', text: 'Rüde / Kater' },
  { value: 'female', text: 'Hündin / Kätzin' }
]

export const PURPOSES = [
  { value: 'breeding', text: 'Zuchtpartner' },
  { value: 'playmate', text: 'Spielpartner' },
  { value: 'both', text: 'Beides' }
]

export const PURPOSE_COLORS = {
  breeding: '#e84393',
  playmate: '#00b894',
  both: '#0984e3'
}

export function purposeLabel (value) {
  const found = PURPOSES.find(p => p.value === value)
  return found ? found.text : value
}

export function speciesLabel (value) {
  const found = SPECIES.find(s => s.value === value)
  return found ? found.text : value
}

export const BREEDS = {
  dog: [
    'Labrador Retriever', 'Golden Retriever', 'Deutscher Schäferhund', 'Mischling',
    'Dackel', 'Pudel', 'Beagle', 'Border Collie', 'Bernhardiner', 'Boxer',
    'Jack Russell Terrier', 'Rhodesian Ridgeback', 'Australian Shepherd', 'Chihuahua',
    'Malinois', 'Husky', 'Cocker Spaniel', 'Dobermann', 'Rottweiler', 'Sonstige Rasse'
  ],
  cat: [
    'Europäisch Kurzhaar', 'Maine Coon', 'Britisch Kurzhaar', 'Perserkatze', 'Siamkatze',
    'Norwegische Waldkatze', 'Bengalkatze', 'Ragdoll', 'Sphynx', 'Sibirische Katze',
    'Mischling', 'Sonstige Rasse'
  ]
}

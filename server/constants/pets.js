const SPECIES = ['dog', 'cat']

const PURPOSES = ['breeding', 'playmate', 'both']

const GENDERS = ['male', 'female']

const BREEDS = {
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

module.exports = { SPECIES, PURPOSES, GENDERS, BREEDS }

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const db = require('./db')
const { createUser } = require('./lib/users')
const { createPet } = require('./lib/pets')
const { generatePetAvatarJpeg } = require('./lib/avatarGenerator')
const { mulberry32, hashString, pick } = require('./lib/rng')
const { BREEDS } = require('./constants/pets')

const OWNER_COUNT = 70
const rng = mulberry32(hashString('tiermatch-seed-v1'))

const OWNER_NAMES = ['Anna', 'Ben', 'Clara', 'David', 'Emma', 'Finn', 'Greta', 'Hannes', 'Ida', 'Jonas', 'Kim', 'Lea', 'Mats', 'Nina', 'Ole', 'Paula', 'Quirin', 'Rosa', 'Sven', 'Tessa', 'Uwe', 'Vera', 'Willi', 'Xenia', 'Yannick', 'Zoe', 'Alexander', 'Bettina', 'Carsten', 'Diana']
const DOG_NAMES = ['Bella', 'Rex', 'Luna', 'Max', 'Nala', 'Balu', 'Frieda', 'Bruno', 'Emma', 'Rocky', 'Lotte', 'Milo', 'Zoe', 'Bear', 'Ronja', 'Buddy', 'Ida', 'Cooper', 'Mia', 'Leo']
const CAT_NAMES = ['Minka', 'Findus', 'Luna', 'Simba', 'Mia', 'Felix', 'Nala', 'Whiskers', 'Kira', 'Tiger', 'Lilly', 'Momo', 'Kitty', 'Oskar', 'Cleo', 'Salem']

const CITIES = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Mannheim', 'Bielefeld', 'Münster', 'Karlsruhe', 'Augsburg', 'Wiesbaden', 'Mönchengladbach', 'Freiburg']

const DOG_BIOS = ['verspielt und verträglich mit anderen Hunden', 'ruhig, aber lauffreudig', 'gesundgeprüft (HD/ED frei)', 'stammt aus geprüfter Zuchtlinie', 'liebt lange Spaziergänge im Wald', 'ist verschmust und menschenbezogen', 'ist ausgeglichen und gut sozialisiert', 'hat schon Grunderziehung und ist stubenrein']
const CAT_BIOS = ['reinrassig mit Stammbaum', 'verschmust und verspielt', 'Wohnungskatze, kennt keinen Freigang', 'gesundgeprüft und geimpft', 'ruhig und menschenbezogen', 'verträgt sich gut mit anderen Katzen', 'ist neugierig und verspielt']

function pickPurpose () {
  const roll = rng()
  if (roll < 0.35) return 'breeding'
  if (roll < 0.75) return 'playmate'
  return 'both'
}

function randomBirthdate () {
  // Welpen/Kitten bis ausgewachsene Tiere, ~3 Monate bis 9 Jahre alt
  const ageMonths = 3 + Math.floor(rng() * 105)
  const date = new Date()
  date.setMonth(date.getMonth() - ageMonths)
  return date.toISOString().slice(0, 10)
}

function buildPets (count) {
  const pets = []
  for (let i = 0; i < count; i++) {
    const species = rng() < 0.65 ? 'dog' : 'cat'
    const pool = species === 'dog' ? DOG_NAMES : CAT_NAMES
    const name = pick(rng, pool)
    const gender = rng() < 0.5 ? 'male' : 'female'
    const breed = pick(rng, BREEDS[species])
    const bio = pick(rng, species === 'dog' ? DOG_BIOS : CAT_BIOS)
    pets.push({
      name,
      species,
      breed,
      gender,
      purpose: pickPurpose(),
      birthdate: randomBirthdate(),
      bio: bio.charAt(0).toUpperCase() + bio.slice(1) + '.',
      city: pick(rng, CITIES)
    })
  }
  return pets
}

async function run () {
  const uploadsDir = path.join(__dirname, 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  let createdOwners = 0
  let createdPets = 0
  let skipped = 0
  const usedHandles = new Map()

  for (let i = 0; i < OWNER_COUNT; i++) {
    const firstName = pick(rng, OWNER_NAMES)
    const baseHandle = firstName.toLowerCase()
    const n = (usedHandles.get(baseHandle) || 0) + 1
    usedHandles.set(baseHandle, n)
    const handle = n === 1 ? baseHandle : `${baseHandle}${n}`
    const email = `${handle}@example.com`
    const city = pick(rng, CITIES)

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      skipped++
      continue
    }

    const owner = createUser({ handle, email, password: 'password123', city })
    createdOwners++

    const petCount = rng() < 0.35 ? 2 : 1
    for (const petData of buildPets(petCount)) {
      const avatarBuffer = await generatePetAvatarJpeg(`${handle}-${petData.name}-${createdPets}`, petData.species)
      const filename = `seed-pet-${handle}-${createdPets}.jpg`
      fs.writeFileSync(path.join(uploadsDir, filename), avatarBuffer)

      createPet(owner.id, Object.assign({}, petData, { photoUrl: `/uploads/${filename}` }))
      createdPets++
    }
  }

  console.log(`Seed abgeschlossen: ${createdOwners} Halter (${skipped} bereits vorhanden), ${createdPets} Tiere angelegt.`)
  console.log('Login für alle Demo-Halter: Passwort "password123" (E-Mail: <handle>@example.com).')
}

run()

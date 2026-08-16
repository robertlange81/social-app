require('dotenv').config()
const fs = require('fs')
const path = require('path')
const db = require('./db')
const { createUser } = require('./lib/users')
const { generateAvatarJpeg } = require('./lib/avatarGenerator')
const { mulberry32, hashString, pick } = require('./lib/rng')
const PARTIES = require('./constants/parties')

const PROFILE_COUNT = 100
const rng = mulberry32(hashString('herzklang-seed-v1'))

const MALE_NAMES = ['Finn', 'Paul', 'Leon', 'Ben', 'Jonas', 'Elias', 'Noah', 'Luca', 'Felix', 'Max', 'Tom', 'Julian', 'David', 'Niklas', 'Simon', 'Jan', 'Moritz', 'Tim', 'Erik', 'Lukas', 'Philipp', 'Sebastian', 'Daniel', 'Christian', 'Alexander']
const FEMALE_NAMES = ['Mia', 'Emma', 'Hannah', 'Lena', 'Lea', 'Sophia', 'Marie', 'Laura', 'Julia', 'Anna', 'Lisa', 'Sarah', 'Nina', 'Clara', 'Emilia', 'Johanna', 'Katharina', 'Sophie', 'Amelie', 'Charlotte', 'Frieda', 'Greta', 'Ida', 'Luisa', 'Paula']
const DIVERSE_NAMES = ['Kim', 'Robin', 'Alex', 'Sam', 'Charlie', 'Toni', 'Nico', 'Mika', 'Ariel', 'Jule']

const CITIES = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Mannheim', 'Bielefeld', 'Münster', 'Karlsruhe', 'Augsburg', 'Wiesbaden', 'Mönchengladbach', 'Freiburg']

const PROFESSIONS = ['arbeitet als Ingenieur', 'ist Lehrer', 'arbeitet in der IT', 'ist Arzt', 'führt ein kleines Café', 'arbeitet im Marketing', 'ist Handwerker', 'studiert Psychologie', 'arbeitet als Anwalt', 'ist selbstständig', 'arbeitet in der Pflege', 'ist Architekt', 'arbeitet als Designer', 'ist Physiotherapeut', 'arbeitet im Vertrieb']
const HOBBIES = ['reist gern durch Europa', 'kocht leidenschaftlich italienisch', 'joggt jeden Morgen am Fluss', 'liest am liebsten Krimis', 'spielt seit Jahren Gitarre', 'geht regelmäßig klettern', 'liebt lange Radtouren', 'fotografiert gern Architektur', 'backt am Wochenende Kuchen', 'macht Yoga zum Ausgleich', 'ist Hobby-Winzer', 'spielt in einer Amateur-Fußballmannschaft', 'malt in der Freizeit', 'sammelt Vinylplatten', 'wandert gern in den Alpen', 'probiert immer neue Cafés aus', 'segelt im Sommer auf dem See', 'ist begeisterter Hobbygärtner', 'tanzt Salsa', 'schreibt Kurzgeschichten']

const SEEKING = ['male', 'female', 'diverse', 'all']

// Realistische Verteilung: Frauen suchen zu ~99% Männer und umgekehrt (die
// weit überwiegende Mehrheit in der Bevölkerung), der Rest streut breiter.
function pickSeekingGender (gender) {
  if (gender === 'male') return rng() < 0.99 ? 'female' : pick(rng, ['male', 'diverse', 'all'])
  if (gender === 'female') return rng() < 0.99 ? 'male' : pick(rng, ['female', 'diverse', 'all'])
  return pick(rng, SEEKING)
}

function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function buildBio () {
  return `${capitalize(pick(rng, PROFESSIONS))}, ${pick(rng, HOBBIES)}.`
}

function randomBirthdate () {
  const year = 1977 + Math.floor(rng() * 28) // ~21 bis 49 Jahre alt
  const month = 1 + Math.floor(rng() * 12)
  const day = 1 + Math.floor(rng() * 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildProfiles (count) {
  const usedHandles = new Map()
  const profiles = []
  for (let i = 0; i < count; i++) {
    const genderRoll = rng()
    const gender = genderRoll < 0.46 ? 'male' : genderRoll < 0.92 ? 'female' : 'diverse'
    const pool = gender === 'male' ? MALE_NAMES : gender === 'female' ? FEMALE_NAMES : DIVERSE_NAMES
    const firstName = pick(rng, pool)
    const baseHandle = firstName.toLowerCase()
    const count2 = (usedHandles.get(baseHandle) || 0) + 1
    usedHandles.set(baseHandle, count2)
    const handle = count2 === 1 ? baseHandle : `${baseHandle}${count2}`

    profiles.push({
      handle,
      email: `${handle}@example.com`,
      gender,
      seekingGender: pickSeekingGender(gender),
      party: PARTIES[i % PARTIES.length],
      city: pick(rng, CITIES),
      birthdate: randomBirthdate(),
      bio: buildBio()
    })
  }
  return profiles
}

async function run () {
  const uploadsDir = path.join(__dirname, 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const profiles = buildProfiles(PROFILE_COUNT)
  let created = 0
  let skipped = 0

  for (const profile of profiles) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(profile.email)
    if (existing) {
      skipped++
      continue
    }

    const avatarBuffer = await generateAvatarJpeg(profile.handle)
    const filename = `seed-${profile.handle}.jpg`
    fs.writeFileSync(path.join(uploadsDir, filename), avatarBuffer)

    createUser({
      ...profile,
      password: 'password123',
      photoUrl: `/uploads/${filename}`,
      consentTos: true,
      consentPolitical: true
    })
    created++
  }

  console.log(`Seed abgeschlossen: ${created} Profile angelegt, ${skipped} bereits vorhanden.`)
  console.log('Login für alle Demo-Nutzer: Passwort "password123" (E-Mail: <handle>@example.com).')
}

run()

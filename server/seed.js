require('dotenv').config()
const fs = require('fs')
const path = require('path')
const db = require('./db')
const { createUser } = require('./lib/users')
const { generateAvatarJpeg } = require('./lib/avatarGenerator')
const { mulberry32, hashString, pick } = require('./lib/rng')
const PARTIES = require('./constants/parties')
const { v4: uuidv4 } = require('uuid')

const PROFILE_COUNT = 100
const rng = mulberry32(hashString('herzklang-seed-v1'))

const MALE_NAMES = ['Finn', 'Paul', 'Leon', 'Ben', 'Jonas', 'Elias', 'Noah', 'Luca', 'Felix', 'Max', 'Tom', 'Julian', 'David', 'Niklas', 'Simon', 'Jan', 'Moritz', 'Tim', 'Erik', 'Lukas', 'Philipp', 'Sebastian', 'Daniel', 'Christian', 'Alexander']
const FEMALE_NAMES = ['Mia', 'Emma', 'Hannah', 'Lena', 'Lea', 'Sophia', 'Marie', 'Laura', 'Julia', 'Anna', 'Lisa', 'Sarah', 'Nina', 'Clara', 'Emilia', 'Johanna', 'Katharina', 'Sophie', 'Amelie', 'Charlotte', 'Frieda', 'Greta', 'Ida', 'Luisa', 'Paula']
const DIVERSE_NAMES = ['Kim', 'Robin', 'Alex', 'Sam', 'Charlie', 'Toni', 'Nico', 'Mika', 'Ariel', 'Jule']

const CITIES = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Mannheim', 'Bielefeld', 'Münster', 'Karlsruhe', 'Augsburg', 'Wiesbaden', 'Mönchengladbach', 'Freiburg']
const CITY_COORDINATES = {
  Berlin: [52.52, 13.405], Hamburg: [53.55, 10.0], München: [48.14, 11.58], Köln: [50.94, 6.96], 'Frankfurt am Main': [50.11, 8.68], Stuttgart: [48.78, 9.18], Düsseldorf: [51.23, 6.78], Leipzig: [51.34, 12.37], Dortmund: [51.51, 7.47], Essen: [51.46, 7.01], Bremen: [53.08, 8.8], Dresden: [51.05, 13.74], Hannover: [52.38, 9.73], Nürnberg: [49.45, 11.08], Duisburg: [51.43, 6.76], Bochum: [51.48, 7.22], Wuppertal: [51.26, 7.15], Mannheim: [49.49, 8.47], Bielefeld: [52.03, 8.53], Münster: [51.96, 7.63], Karlsruhe: [49.01, 8.4], Augsburg: [48.37, 10.9], Wiesbaden: [50.08, 8.24], Mönchengladbach: [51.19, 6.44], Freiburg: [48.0, 7.85]
}

const PROFESSIONS = ['arbeitet als Ingenieur', 'ist Lehrer', 'arbeitet in der IT', 'ist Arzt', 'führt ein kleines Café', 'arbeitet im Marketing', 'ist Handwerker', 'studiert Psychologie', 'arbeitet als Anwalt', 'ist selbstständig', 'arbeitet in der Pflege', 'ist Architekt', 'arbeitet als Designer', 'ist Physiotherapeut', 'arbeitet im Vertrieb']
const HOBBIES = ['reist gern durch Europa', 'kocht leidenschaftlich italienisch', 'joggt jeden Morgen am Fluss', 'liest am liebsten Krimis', 'spielt seit Jahren Gitarre', 'geht regelmäßig klettern', 'liebt lange Radtouren', 'fotografiert gern Architektur', 'backt am Wochenende Kuchen', 'macht Yoga zum Ausgleich', 'ist Hobby-Winzer', 'spielt in einer Amateur-Fußballmannschaft', 'malt in der Freizeit', 'sammelt Vinylplatten', 'wandert gern in den Alpen', 'probiert immer neue Cafés aus', 'segelt im Sommer auf dem See', 'ist begeisterter Hobbygärtner', 'tanzt Salsa', 'schreibt Kurzgeschichten']

const SEEKING = ['male', 'female', 'diverse', 'all']
const STATUS_TEXTS = [
  'Wer kennt ein gemütliches Café mit guter Musik?',
  'Heute spontan am See gewesen – manchmal sind die ungeplanten Tage die besten.',
  'Suche noch eine Begleitung fürs Straßenfest am Wochenende.',
  'Mein neues Lieblingsrezept: selbstgemachte Pasta. Was kocht ihr gern?',
  'Kleine Radtour nach Feierabend geschafft 🚲',
  'Welches Buch hat euch zuletzt richtig gepackt?',
  'Konzertkarten sind da! Jetzt fehlt nur noch die passende Begleitung.',
  'Sonntag ist Museums- und Kuchentag. Wer ist dabei?',
  'Gerade erst hergezogen – verratet mir eure Lieblingsorte!',
  'Die Sonne scheint. Zeit für einen langen Spaziergang.',
  'Heute mal etwas Neues ausprobiert und direkt begeistert.',
  'Gute Gespräche, schlechter Kaffee – oder andersherum? ☕'
]
const GROUPS = [
  ['Neu in der Stadt', 'Gemeinsam Lieblingsorte entdecken und Anschluss finden.', null],
  ['Wandern statt Club', 'Touren, Natur und gute Gespräche an der frischen Luft.', null],
  ['Politik ohne Stammtisch', 'Respektvoll diskutieren, neugierig bleiben.', null],
  ['Nur noch eine Folge', 'Für Serienfans mit chronisch zu wenig Schlaf.', null]
]
const RESONANCE_OPTIONS = {
  free_sunday: ['Unterwegs sein', 'Gemütlich zuhause', 'Freunde treffen', 'Spontan entscheiden'],
  conflict: ['Direkt aussprechen', 'Erst nachdenken', 'Humor hilft', 'Kompromiss suchen'],
  planning: ['Lange im Voraus', 'Ein paar Tage vorher', 'Am liebsten spontan', 'Eine Mischung'],
  politics: ['Sehr wichtig', 'Gern diskutieren', 'Respekt reicht mir', 'Kaum eine Rolle'],
  social_energy: ['Unter Menschen', 'In Ruhe allein', 'In der Natur', 'Kommt auf den Tag an'],
  future: ['Familie', 'Freiheit', 'Sicherheit', 'Gemeinsame Abenteuer'],
  affection: ['Mit Worten', 'Durch gemeinsame Zeit', 'Durch kleine Gesten', 'Durch Nähe'],
  train_delay: ['Neue Route suchen', 'Café entdecken', 'Spaziergang machen', 'Darüber lachen und improvisieren']
}

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

  if (db.prepare('SELECT COUNT(*) AS count FROM status_posts').get().count === 0) {
    const users = db.prepare('SELECT id FROM users ORDER BY created_at LIMIT ?').all(STATUS_TEXTS.length)
    const insertPost = db.prepare(`
      INSERT INTO status_posts (id, user_id, body, created_at)
      VALUES (?, ?, ?, datetime('now', ?))
    `)
    users.forEach((user, index) => insertPost.run(uuidv4(), user.id, STATUS_TEXTS[index], `-${index} hours`))
  }

  const seedUsers = db.prepare('SELECT id FROM users ORDER BY created_at LIMIT 20').all()
  if (seedUsers.length && db.prepare('SELECT COUNT(*) AS count FROM community_groups').get().count === 0) {
    const insertGroup = db.prepare('INSERT INTO community_groups (id, name, description, city, created_by) VALUES (?, ?, ?, ?, ?)')
    const insertMember = db.prepare('INSERT OR IGNORE INTO community_group_members (group_id, user_id) VALUES (?, ?)')
    GROUPS.forEach(([name, description, city], groupIndex) => {
      const groupId = uuidv4(); insertGroup.run(groupId, name, description, city, seedUsers[groupIndex].id)
      seedUsers.slice(groupIndex, groupIndex + 10).forEach(user => insertMember.run(groupId, user.id))
    })
  }
  const insertAnswer = db.prepare('INSERT OR IGNORE INTO resonance_answers (user_id, question_id, answer) VALUES (?, ?, ?)')
  seedUsers.forEach((user, userIndex) => Object.entries(RESONANCE_OPTIONS).forEach(([questionId, options], questionIndex) => {
    insertAnswer.run(user.id, questionId, options[(userIndex + questionIndex) % options.length])
  }))
  const insertSecurity = db.prepare("INSERT OR IGNORE INTO user_security (user_id, email_verified_at, verification_level) VALUES (?, datetime('now'), 'email')")
  seedUsers.forEach(user => insertSecurity.run(user.id))
  const insertLocation = db.prepare('INSERT OR IGNORE INTO user_locations (user_id,latitude,longitude,share_on_map) VALUES (?,?,?,1)')
  db.prepare('SELECT id,city FROM users').all().forEach((user, index) => {
    const coordinates = CITY_COORDINATES[user.city]
    if (coordinates) insertLocation.run(user.id, Math.round((coordinates[0] + ((index % 5) - 2) * 0.01) * 100) / 100, Math.round((coordinates[1] + ((index % 7) - 3) * 0.01) * 100) / 100)
  })
  if (seedUsers.length > 2 && db.prepare('SELECT COUNT(*) AS count FROM notifications').get().count === 0) {
    const insertNotification = db.prepare('INSERT INTO notifications (id, user_id, actor_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?, ?)')
    insertNotification.run(uuidv4(), seedUsers[0].id, seedUsers[1].id, 'like', 'Du hast ein neues Like erhalten', null, '/likes')
    insertNotification.run(uuidv4(), seedUsers[0].id, seedUsers[2].id, 'poke', 'Du wurdest angestupst', 'Schau doch mal auf das Profil.', '/feed')
  }

  console.log(`Seed abgeschlossen: ${created} Profile angelegt, ${skipped} bereits vorhanden.`)
  console.log('Login für alle Demo-Nutzer: Passwort "password123" (E-Mail: <handle>@example.com).')
}

run()

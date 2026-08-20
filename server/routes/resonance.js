const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { isBlocked } = require('../lib/conversations')

const router = express.Router()
const QUESTIONS = [
  { id: 'free_sunday', text: 'Wie sieht dein perfekter Sonntag aus?', options: ['Unterwegs sein', 'Gemütlich zuhause', 'Freunde treffen', 'Spontan entscheiden'] },
  { id: 'conflict', text: 'Wie gehst du mit Meinungsverschiedenheiten um?', options: ['Direkt aussprechen', 'Erst nachdenken', 'Humor hilft', 'Kompromiss suchen'] },
  { id: 'planning', text: 'Wie planst du gemeinsame Zeit?', options: ['Lange im Voraus', 'Ein paar Tage vorher', 'Am liebsten spontan', 'Eine Mischung'] },
  { id: 'politics', text: 'Welche Rolle spielt Politik in einer Beziehung?', options: ['Sehr wichtig', 'Gern diskutieren', 'Respekt reicht mir', 'Kaum eine Rolle'] },
  { id: 'social_energy', text: 'Wo lädst du deine Energie auf?', options: ['Unter Menschen', 'In Ruhe allein', 'In der Natur', 'Kommt auf den Tag an'] },
  { id: 'future', text: 'Was ist dir für die Zukunft besonders wichtig?', options: ['Familie', 'Freiheit', 'Sicherheit', 'Gemeinsame Abenteuer'] },
  { id: 'affection', text: 'Wie zeigst du Zuneigung?', options: ['Mit Worten', 'Durch gemeinsame Zeit', 'Durch kleine Gesten', 'Durch Nähe'] },
  { id: 'train_delay', text: 'Euer Zug fällt aus – was macht ihr?', options: ['Neue Route suchen', 'Café entdecken', 'Spaziergang machen', 'Darüber lachen und improvisieren'] }
]

function answersFor (userId) {
  return Object.fromEntries(db.prepare('SELECT question_id, answer FROM resonance_answers WHERE user_id = ?').all(userId).map(row => [row.question_id, row.answer]))
}
function preferencesFor (userId) {
  return Object.fromEntries(db.prepare('SELECT question_id, importance, is_private FROM resonance_preferences WHERE user_id = ?').all(userId).map(row => [row.question_id, { importance: row.importance, isPrivate: !!row.is_private }]))
}

router.get('/questions', requireAuth, (req, res) => res.json({ questions: QUESTIONS }))
router.get('/me', requireAuth, (req, res) => res.json({ answers: answersFor(req.user.id), preferences: preferencesFor(req.user.id) }))

router.put('/me', requireAuth, (req, res) => {
  const answers = req.body && req.body.answers
  const preferences = req.body && req.body.preferences || {}
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return res.status(400).json({ error: 'Antworten fehlen.' })
  const valid = new Map(QUESTIONS.map(question => [question.id, question.options]))
  for (const [questionId, answer] of Object.entries(answers)) {
    if (!valid.has(questionId) || !valid.get(questionId).includes(answer)) return res.status(400).json({ error: 'Eine Resonanz-Antwort ist ungültig.' })
  }
  for (const [questionId, preference] of Object.entries(preferences)) {
    if (!valid.has(questionId) || ![1, 2, 3].includes(Number(preference.importance)) || typeof preference.isPrivate !== 'boolean') return res.status(400).json({ error: 'Eine Resonanz-Einstellung ist ungültig.' })
  }
  db.transaction(() => {
    const statement = db.prepare(`INSERT INTO resonance_answers (user_id, question_id, answer) VALUES (?, ?, ?)
      ON CONFLICT(user_id, question_id) DO UPDATE SET answer = excluded.answer, updated_at = datetime('now')`)
    Object.entries(answers).forEach(([questionId, answer]) => statement.run(req.user.id, questionId, answer))
    const prefStatement = db.prepare(`INSERT INTO resonance_preferences (user_id, question_id, importance, is_private) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, question_id) DO UPDATE SET importance=excluded.importance, is_private=excluded.is_private`)
    Object.entries(preferences).forEach(([questionId, preference]) => prefStatement.run(req.user.id, questionId, preference.importance, preference.isPrivate ? 1 : 0))
  })()
  res.json({ answers: answersFor(req.user.id), answered: Object.keys(answersFor(req.user.id)).length })
})

router.get('/compare/:userId', requireAuth, (req, res) => {
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(req.params.userId)) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })
  if (isBlocked(req.user.id, req.params.userId)) return res.status(403).json({ error: 'Dieses Profil ist nicht verfügbar.' })
  const mine = answersFor(req.user.id)
  const theirs = answersFor(req.params.userId)
  const myPreferences = preferencesFor(req.user.id); const theirPreferences = preferencesFor(req.params.userId)
  const comparisons = QUESTIONS.filter(question => mine[question.id] && theirs[question.id]).map(question => ({
    questionId: question.id, question: question.text,
    mine: myPreferences[question.id] && myPreferences[question.id].isPrivate ? null : mine[question.id],
    theirs: theirPreferences[question.id] && theirPreferences[question.id].isPrivate ? null : theirs[question.id],
    isPrivate: !!((myPreferences[question.id] && myPreferences[question.id].isPrivate) || (theirPreferences[question.id] && theirPreferences[question.id].isPrivate)),
    importance: Math.max((myPreferences[question.id] || {}).importance || 1, (theirPreferences[question.id] || {}).importance || 1),
    matches: mine[question.id] === theirs[question.id]
  }))
  const totalWeight = comparisons.reduce((sum, item) => sum + item.importance, 0)
  const matchWeight = comparisons.filter(item => item.matches).reduce((sum, item) => sum + item.importance, 0)
  res.json({ compared: comparisons.length, score: totalWeight ? Math.round(matchWeight / totalWeight * 100) : null, comparisons })
})

module.exports = router

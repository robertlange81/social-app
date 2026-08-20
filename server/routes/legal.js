const express = require('express')

const router = express.Router()

function configuredValue (name, developmentFallback) {
  const value = String(process.env[name] || '').trim()
  if (value) return value
  return process.env.NODE_ENV === 'production' ? 'Noch nicht veröffentlicht' : developmentFallback
}

router.get('/config', (req, res) => {
  const hostingProvider = configuredValue('LEGAL_HOSTING_PROVIDER', 'Lokale Entwicklungsumgebung (localhost)')
  const hostingLocation = configuredValue('LEGAL_HOSTING_LOCATION', 'Lokales Entwicklungssystem')
  const emailProvider = configuredValue('LEGAL_EMAIL_PROVIDER', process.env.EMAIL_WEBHOOK_URL ? 'Konfigurierter E-Mail-Webhook-Dienst' : 'Kein externer Mailversand aktiv')
  const processors = configuredValue('LEGAL_PROCESSORS', 'Keine weiteren externen Auftragsverarbeiter konfiguriert')
  const incomplete = [hostingProvider, hostingLocation, emailProvider, processors].some(value => value === 'Noch nicht veröffentlicht')
  res.json({
    controller: { name: 'Robert Lange', address: 'Martin-Herrmann-Straße 10, 04249 Leipzig, Deutschland', email: 'lange@web-app-it.de' },
    hostingProvider, hostingLocation, emailProvider, processors,
    logRetentionDays: Number(process.env.LEGAL_LOG_RETENTION_DAYS || 14),
    backupRetentionDays: Number(process.env.LEGAL_BACKUP_RETENTION_DAYS || 30),
    privacyRequestEmail: process.env.PRIVACY_REQUEST_EMAIL || 'lange@web-app-it.de',
    configured: !incomplete,
    updatedAt: '2026-08-20'
  })
})

module.exports = router

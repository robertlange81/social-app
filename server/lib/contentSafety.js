function validateUserContent (body, { maxLinks = 3 } = {}) {
  const links = String(body).match(/https?:\/\/|www\./gi) || []
  if (links.length > maxLinks) return 'Zu viele Links in einem Beitrag.'
  if (/(.)\1{19,}/u.test(body)) return 'Bitte vermeide lange Zeichenwiederholungen.'
  return null
}
module.exports = { validateUserContent }

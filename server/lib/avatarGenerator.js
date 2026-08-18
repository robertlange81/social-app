const sharp = require('sharp')
const { hashString, mulberry32, pick } = require('./rng')

const SIZE = 640
const BG_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8', '#55efc4', '#74b9ff', '#fab1a0', '#81ecec', '#ffb703']
const DOG_FUR = ['#8d5524', '#c68642', '#e8b975', '#2c1b18', '#f5f0e6', '#a9a9a9', '#d2691e']
const CAT_FUR = ['#e8b975', '#2c1b18', '#f5f0e6', '#a9a9a9', '#d2691e', '#ffffff', '#7a6a5a']

function dogEars (style, cx, cy, r, color) {
  if (style === 0) {
    // Schlappohren
    return `
      <ellipse cx="${cx - r * 0.85}" cy="${cy - r * 0.1}" rx="${r * 0.32}" ry="${r * 0.55}" fill="${color}" stroke="#1a1a1a" stroke-width="6" transform="rotate(-15 ${cx - r * 0.85} ${cy - r * 0.1})"/>
      <ellipse cx="${cx + r * 0.85}" cy="${cy - r * 0.1}" rx="${r * 0.32}" ry="${r * 0.55}" fill="${color}" stroke="#1a1a1a" stroke-width="6" transform="rotate(15 ${cx + r * 0.85} ${cy - r * 0.1})"/>
    `
  }
  // Stehohren
  return `
    <path d="M ${cx - r * 0.9} ${cy - r * 0.4} L ${cx - r * 0.55} ${cy - r * 1.25} L ${cx - r * 0.25} ${cy - r * 0.55} Z" fill="${color}" stroke="#1a1a1a" stroke-width="6"/>
    <path d="M ${cx + r * 0.9} ${cy - r * 0.4} L ${cx + r * 0.55} ${cy - r * 1.25} L ${cx + r * 0.25} ${cy - r * 0.55} Z" fill="${color}" stroke="#1a1a1a" stroke-width="6"/>
  `
}

function catEars (cx, cy, r, color) {
  return `
    <path d="M ${cx - r * 0.75} ${cy - r * 0.5} L ${cx - r * 0.55} ${cy - r * 1.35} L ${cx - r * 0.15} ${cy - r * 0.65} Z" fill="${color}" stroke="#1a1a1a" stroke-width="6"/>
    <path d="M ${cx + r * 0.75} ${cy - r * 0.5} L ${cx + r * 0.55} ${cy - r * 1.35} L ${cx + r * 0.15} ${cy - r * 0.65} Z" fill="${color}" stroke="#1a1a1a" stroke-width="6"/>
    <path d="M ${cx - r * 0.5} ${cy - r * 0.9} L ${cx - r * 0.42} ${cy - r * 1.15} L ${cx - r * 0.24} ${cy - r * 0.78} Z" fill="#ffc2d1"/>
    <path d="M ${cx + r * 0.5} ${cy - r * 0.9} L ${cx + r * 0.42} ${cy - r * 1.15} L ${cx + r * 0.24} ${cy - r * 0.78} Z" fill="#ffc2d1"/>
  `
}

function patches (rng, cx, cy, r, color) {
  if (rng() < 0.5) return ''
  return Array.from({ length: 2 }).map(() => {
    const x = cx + (rng() - 0.5) * r * 1.3
    const y = cy + (rng() - 0.3) * r * 1.3
    const pr = r * (0.18 + rng() * 0.12)
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${pr.toFixed(1)}" fill="${color}" opacity="0.85"/>`
  }).join('')
}

function generatePetAvatarSvg (seedString, species) {
  const rng = mulberry32(hashString(seedString))
  const cx = SIZE / 2
  const cy = SIZE / 2 + 20
  const r = 150

  const bg = pick(rng, BG_COLORS)
  const furPalette = species === 'cat' ? CAT_FUR : DOG_FUR
  const fur = pick(rng, furPalette)
  const patchColor = pick(rng, furPalette.filter(c => c !== fur)) || '#ffffff'
  const earStyle = Math.floor(rng() * 2)

  const ears = species === 'cat' ? catEars(cx, cy, r, fur) : dogEars(earStyle, cx, cy, r, fur)
  const snout = species === 'cat'
    ? `<ellipse cx="${cx}" cy="${cy + r * 0.35}" rx="${r * 0.42}" ry="${r * 0.34}" fill="${fur}" stroke="#1a1a1a" stroke-width="5"/>`
    : `<ellipse cx="${cx}" cy="${cy + r * 0.5}" rx="${r * 0.5}" ry="${r * 0.38}" fill="${fur}" stroke="#1a1a1a" stroke-width="5"/>`
  const nose = species === 'cat'
    ? `<path d="M ${cx - 10} ${cy + r * 0.25} L ${cx + 10} ${cy + r * 0.25} L ${cx} ${cy + r * 0.4} Z" fill="#ff8fa3"/>`
    : `<ellipse cx="${cx}" cy="${cy + r * 0.28}" rx="22" ry="16" fill="#1a1a1a"/>`
  const whiskers = species === 'cat'
    ? `
      <line x1="${cx - r * 0.5}" y1="${cy + r * 0.35}" x2="${cx - r * 0.05}" y2="${cy + r * 0.32}" stroke="#1a1a1a" stroke-width="3"/>
      <line x1="${cx - r * 0.5}" y1="${cy + r * 0.48}" x2="${cx - r * 0.05}" y2="${cy + r * 0.45}" stroke="#1a1a1a" stroke-width="3"/>
      <line x1="${cx + r * 0.5}" y1="${cy + r * 0.35}" x2="${cx + r * 0.05}" y2="${cy + r * 0.32}" stroke="#1a1a1a" stroke-width="3"/>
      <line x1="${cx + r * 0.5}" y1="${cy + r * 0.48}" x2="${cx + r * 0.05}" y2="${cy + r * 0.45}" stroke="#1a1a1a" stroke-width="3"/>
    `
    : ''
  const mouth = species === 'dog'
    ? `<path d="M ${cx - 30} ${cy + r * 0.68} Q ${cx} ${cy + r * 0.85} ${cx + 30} ${cy + r * 0.68}" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : ''

  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
    ${ears}
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.05}" fill="${fur}" stroke="#1a1a1a" stroke-width="8"/>
    ${patches(rng, cx, cy, r, patchColor)}
    ${snout}
    <circle cx="${cx - 60}" cy="${cy - 10}" r="16" fill="#1a1a1a"/>
    <circle cx="${cx + 60}" cy="${cy - 10}" r="16" fill="#1a1a1a"/>
    <circle cx="${cx - 56}" cy="${cy - 14}" r="5" fill="#ffffff"/>
    <circle cx="${cx + 64}" cy="${cy - 14}" r="5" fill="#ffffff"/>
    ${nose}
    ${mouth}
    ${whiskers}
  </svg>`
}

async function generatePetAvatarJpeg (seedString, species) {
  const svg = generatePetAvatarSvg(seedString, species)
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
}

module.exports = { generatePetAvatarSvg, generatePetAvatarJpeg }

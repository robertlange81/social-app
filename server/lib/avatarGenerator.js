const sharp = require('sharp')
const { hashString, mulberry32, pick } = require('./rng')

const SIZE = 640
const SKIN_TONES = ['#ffe0bd', '#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524']
const HAIR_COLORS = ['#2c1b18', '#4a2c14', '#a52a2a', '#f2c14e', '#1c1c1c', '#7b3f00', '#d9d9d9', '#c77dff']
const BG_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8', '#55efc4', '#74b9ff', '#fab1a0', '#81ecec', '#ffb703']

function hairPath (style, cx, cy, r, color) {
  switch (style) {
    case 0: // kurzer Cap-Schnitt
      return `<path d="M ${cx - r - 4} ${cy - 5} A ${r + 4} ${r + 4} 0 0 1 ${cx + r + 4} ${cy - 5} L ${cx + r + 4} ${cy - r * 0.3} A ${r + 4} ${r + 4} 0 0 0 ${cx - r - 4} ${cy - r * 0.3} Z" fill="${color}" stroke="#1a1a1a" stroke-width="6"/>`
    case 1: // lang
      return `<path d="M ${cx - r - 6} ${cy - 12} A ${r + 6} ${r + 6} 0 0 1 ${cx + r + 6} ${cy - 12} L ${cx + r + 12} ${cy + r + 40} L ${cx + r - 14} ${cy + r + 40} L ${cx + r - 14} ${cy + 10} L ${cx - r + 14} ${cy + 10} L ${cx - r + 14} ${cy + r + 40} L ${cx - r - 12} ${cy + r + 40} Z" fill="${color}" stroke="#1a1a1a" stroke-width="6"/>`
    case 2: // lockig
      return Array.from({ length: 10 })
        .map((_, i) => {
          const angle = (i / 9) * Math.PI - Math.PI
          const x = cx + Math.cos(angle) * (r + 6)
          const y = cy + Math.sin(angle) * (r + 6) - 6
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18" fill="${color}" stroke="#1a1a1a" stroke-width="4"/>`
        })
        .join('')
    case 3: // Glatze
      return ''
    default: // Scheitel / schulterlang
      return `<path d="M ${cx - r - 4} ${cy - 4} A ${r + 4} ${r + 4} 0 0 1 ${cx + r + 4} ${cy - 4} L ${cx + r + 4} ${cy + 48} L ${cx + r - 8} ${cy + 24} L ${cx - r + 8} ${cy + 24} L ${cx - r - 4} ${cy + 48} Z" fill="${color}" stroke="#1a1a1a" stroke-width="6"/>`
  }
}

function generateAvatarSvg (seedString) {
  const rng = mulberry32(hashString(seedString))
  const cx = SIZE / 2
  const cy = SIZE / 2 + 15
  const r = 160

  const bg = pick(rng, BG_COLORS)
  const skin = pick(rng, SKIN_TONES)
  const hair = pick(rng, HAIR_COLORS)
  const hairStyle = Math.floor(rng() * 5)
  const hasGlasses = rng() < 0.3
  const mouthStyle = Math.floor(rng() * 3)
  const eyeOffsetX = 55
  const eyeY = cy - 10

  const mouth = mouthStyle === 0
    ? `<path d="M ${cx - 45} ${cy + 70} Q ${cx} ${cy + 112} ${cx + 45} ${cy + 70}" stroke="#5c2b29" stroke-width="9" fill="none" stroke-linecap="round"/>`
    : mouthStyle === 1
      ? `<ellipse cx="${cx}" cy="${cy + 86}" rx="30" ry="20" fill="#5c2b29"/>`
      : `<path d="M ${cx - 35} ${cy + 80} Q ${cx} ${cy + 95} ${cx + 35} ${cy + 80}" stroke="#5c2b29" stroke-width="8" fill="none" stroke-linecap="round"/>`

  const glasses = hasGlasses
    ? `<circle cx="${cx - eyeOffsetX}" cy="${eyeY}" r="30" fill="none" stroke="#1a1a1a" stroke-width="6"/>
       <circle cx="${cx + eyeOffsetX}" cy="${eyeY}" r="30" fill="none" stroke="#1a1a1a" stroke-width="6"/>
       <line x1="${cx - eyeOffsetX + 30}" y1="${eyeY}" x2="${cx + eyeOffsetX - 30}" y2="${eyeY}" stroke="#1a1a1a" stroke-width="6"/>`
    : ''

  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
    ${hairPath(hairStyle, cx, cy, r, hair)}
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.1}" fill="${skin}" stroke="#1a1a1a" stroke-width="8"/>
    <circle cx="${cx - 72}" cy="${cy + 50}" r="22" fill="#ff8fa3" opacity="0.35"/>
    <circle cx="${cx + 72}" cy="${cy + 50}" r="22" fill="#ff8fa3" opacity="0.35"/>
    <circle cx="${cx - eyeOffsetX}" cy="${eyeY}" r="14" fill="#1a1a1a"/>
    <circle cx="${cx + eyeOffsetX}" cy="${eyeY}" r="14" fill="#1a1a1a"/>
    <circle cx="${cx - eyeOffsetX + 4}" cy="${eyeY - 4}" r="4" fill="#ffffff"/>
    <circle cx="${cx + eyeOffsetX + 4}" cy="${eyeY - 4}" r="4" fill="#ffffff"/>
    ${mouth}
    ${glasses}
  </svg>`
}

async function generateAvatarJpeg (seedString) {
  const svg = generateAvatarSvg(seedString)
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
}

module.exports = { generateAvatarSvg, generateAvatarJpeg }

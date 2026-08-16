const sharp = require('sharp')

const AVATAR_SIZE = 640

// Deterministic, offline "comic style" filter: flattens colour regions,
// boosts saturation and overlays bold black ink edges - a lightweight,
// dependency-free cartoonify. No external AI service/API key required.
//
// The edge mask is built in explicit, separately-materialised steps
// (raw buffer -> new sharp() instance -> next op) rather than one chained
// pipeline: sharp's normalise() behaves inconsistently when chained
// directly after convolve() in the same pipeline (empirically verified -
// it can silently collapse the whole mask to zero), but is reliable once
// the convolve output is round-tripped through a fresh raw buffer first.
// The mask is composited as a real alpha-channel overlay (transparent
// everywhere except at detected edges) rather than a 'multiply' blend,
// since 'multiply' turned out to depend on the edge image's incidental
// band count (1 vs 3), which silently varies with the input photo and
// previously produced solid-black output for some real-world photos.
async function cartoonify (input) {
  const size = AVATAR_SIZE
  const base = sharp(input).rotate().resize(size, size, { fit: 'cover' })

  const colorBuffer = await base
    .clone()
    .median(6)
    .modulate({ saturation: 2, brightness: 1.05 })
    .linear(1.08, -8)
    .png()
    .toBuffer()

  const convolved = await base
    .clone()
    .greyscale()
    .blur(1.3)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
    })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const thresholded = await sharp(convolved.data, {
    raw: { width: size, height: size, channels: convolved.info.channels }
  })
    .normalise()
    .threshold(24)
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Slight dilate so thin edge fragments read as bolder, continuous ink strokes.
  const mask = await sharp(thresholded.data, {
    raw: { width: size, height: size, channels: thresholded.info.channels }
  })
    .blur(0.8)
    .threshold(60)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = Buffer.alloc(size * size * 4)
  for (let i = 0, px = 0; i < mask.data.length; i += mask.info.channels, px++) {
    rgba[px * 4 + 3] = mask.data[i] // black ink (rgb stays 0,0,0), alpha = edge strength
  }
  const edgeOverlay = await sharp(rgba, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toBuffer()

  return sharp(colorBuffer)
    .composite([{ input: edgeOverlay }])
    .jpeg({ quality: 90 })
    .toBuffer()
}

module.exports = { cartoonify, AVATAR_SIZE }

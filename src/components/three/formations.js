/**
 * "The Thriving Network": formation layouts.
 *
 * Every node is one person. The scroll story moves them through five states:
 *   0 · scatter   individuals floating on their own          (Hero)
 *   1 · clusters  small connected teams                      (About)
 *   2 · curve     rising together along a growth curve       (Impact)
 *   3 · globe     spread across a globe, hubs in PK/CA/US/ID (Experience)
 *   4 · ring      a calm, connected ring around the CTA      (Contact)
 *
 * Static formations are stored as flat Float32Arrays (x,y,z per node).
 * The globe and ring are stored parametrically because they rotate slowly
 * and are evaluated every frame in ThrivingNetwork.
 */

/** Small deterministic PRNG so the layout is identical on every visit. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gaussian = (rand) => {
  // Box–Muller, clamped to avoid long tails
  const u = Math.max(rand(), 1e-6)
  const v = rand()
  return Math.max(-2.5, Math.min(2.5, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)))
}

/** Palette for nodes (sRGB hex). Mostly warm greys, terracotta accents, a touch of teal. */
export const NODE_PALETTE = [
  { hex: '#D3CDC6', weight: 0.3 }, // light warm grey
  { hex: '#B9B1A8', weight: 0.28 }, // mid warm grey
  { hex: '#948A80', weight: 0.17 }, // deep warm grey
  { hex: '#C8473A', weight: 0.19 }, // terracotta
  { hex: '#2C5E5F', weight: 0.06 }, // teal
]
export const TERRACOTTA_INDEX = 3

/** Locations for the globe formation (lat, lon in degrees). */
export const HUBS = [
  { name: 'Karachi, Pakistan', lat: 24.86, lon: 67.0 },
  { name: 'Ohio, USA', lat: 39.96, lon: -82.99 },
  { name: 'Toronto, Canada', lat: 43.65, lon: -79.38 },
  { name: 'Jakarta, Indonesia', lat: -6.2, lon: 106.85 },
]

/** Globe orientation: which longitude faces the viewer, and northward tilt. */
export const GLOBE_CENTER_LON = 12
export const GLOBE_TILT = 0.32

const DEG = Math.PI / 180

export function latLonToUnit(lat, lon, out = [0, 0, 0]) {
  const la = lat * DEG
  const lo = lon * DEG
  out[0] = Math.cos(la) * Math.sin(lo)
  out[1] = Math.sin(la)
  out[2] = Math.cos(la) * Math.cos(lo)
  return out
}

/**
 * Per-node properties that never change: colour, size, stagger delay,
 * drift phases. Seeded so they are stable between renders.
 */
export function buildNodeMeta(count) {
  const rand = mulberry32(2020) // the year her HR career started
  const colorIndex = new Uint8Array(count)
  const scale = new Float32Array(count)
  const delay = new Float32Array(count)
  const phase = new Float32Array(count * 3)
  const speed = new Float32Array(count)

  const totalWeight = NODE_PALETTE.reduce((a, c) => a + c.weight, 0)
  for (let i = 0; i < count; i++) {
    let r = rand() * totalWeight
    let idx = 0
    for (; idx < NODE_PALETTE.length - 1; idx++) {
      r -= NODE_PALETTE[idx].weight
      if (r <= 0) break
    }
    colorIndex[i] = idx
    scale[i] = 0.075 + rand() * 0.085 + (idx === TERRACOTTA_INDEX ? 0.02 : 0)
    delay[i] = rand()
    phase[i * 3] = rand() * Math.PI * 2
    phase[i * 3 + 1] = rand() * Math.PI * 2
    phase[i * 3 + 2] = rand() * Math.PI * 2
    speed[i] = 0.6 + rand() * 0.8
  }
  return { count, colorIndex, scale, delay, phase, speed }
}

/** k-nearest-neighbour links within an optional group, deduplicated. */
function knnLinks(positions, count, k, maxDist, groupOf = null, filter = null) {
  const pairs = []
  const rest = []
  const seen = new Set()
  for (let i = 0; i < count; i++) {
    if (filter && !filter(i)) continue
    const best = []
    for (let j = 0; j < count; j++) {
      if (i === j) continue
      if (groupOf && groupOf[i] !== groupOf[j]) continue
      if (filter && !filter(j)) continue
      const dx = positions[i * 3] - positions[j * 3]
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d > maxDist) continue
      if (best.length < k) {
        best.push([d, j])
        best.sort((a, b) => a[0] - b[0])
      } else if (d < best[k - 1][0]) {
        best[k - 1] = [d, j]
        best.sort((a, b) => a[0] - b[0])
      }
    }
    for (const [d, j] of best) {
      const key = i < j ? i * 100000 + j : j * 100000 + i
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push(i, j)
      rest.push(d)
    }
  }
  return { pairs: Uint16Array.from(pairs), rest: Float32Array.from(rest) }
}

/**
 * Build all five formations for the current viewport.
 * @param meta    result of buildNodeMeta
 * @param view    { vw, vh } visible world size at z = 0
 * @param isMobile
 */
export function buildFormations(meta, view, isMobile) {
  const { count } = meta
  const { vw, vh } = view
  const rand = mulberry32(138) // the 138 participants in her thesis experiment

  /* 0 · Scatter: individuals, spread through depth */
  const scatter = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    scatter[i * 3] = (rand() - 0.5) * vw * 1.08
    scatter[i * 3 + 1] = (rand() - 0.5) * vh * 1.08
    scatter[i * 3 + 2] = -5.5 + rand() * 7.5
  }

  /* 1 · Clusters: small teams, each a connected knot */
  const teamCount = isMobile ? 6 : 12
  const cols = isMobile ? 2 : 4
  const rows = Math.ceil(teamCount / cols)
  const centers = []
  for (let c = 0; c < teamCount; c++) {
    const cx = ((c % cols) + 0.5) / cols - 0.5
    const cy = (Math.floor(c / cols) + 0.5) / rows - 0.5
    centers.push([
      (cx + (rand() - 0.5) * 0.12) * vw * 0.88,
      (cy + (rand() - 0.5) * 0.14) * vh * 0.82,
      -4.2 + rand() * 3,
    ])
  }
  const team = new Uint8Array(count)
  const clusters = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // Uneven team sizes feel more human than equal buckets
    const t = Math.min(teamCount - 1, Math.floor(Math.pow(rand(), 1.15) * teamCount))
    team[i] = t
    const spread = isMobile ? 0.42 : 0.55
    clusters[i * 3] = centers[t][0] + gaussian(rand) * spread * 0.55
    clusters[i * 3 + 1] = centers[t][1] + gaussian(rand) * spread * 0.55
    clusters[i * 3 + 2] = centers[t][2] + gaussian(rand) * spread * 0.45
  }

  /* 2 · Curve: rising together; the band widens as it grows */
  const curve = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const t = rand()
    const x = (-0.47 + t * 0.94) * vw
    const y = (-0.4 + Math.pow(t, 2.1) * 0.74) * vh
    // Normal to the curve so the jitter follows its direction
    const slope = (2.1 * Math.pow(Math.max(t, 0.001), 1.1) * 0.74 * vh) / (0.94 * vw)
    const len = Math.sqrt(1 + slope * slope)
    const nx = -slope / len
    const ny = 1 / len
    const band = gaussian(rand) * (0.12 + t * 0.42)
    curve[i * 3] = x + nx * band
    curve[i * 3 + 1] = y + ny * band
    curve[i * 3 + 2] = -0.8 + gaussian(rand) * (0.35 + t * 0.5)
  }

  /* 3 · Globe: unit vectors + hub assignment (rotated per frame) */
  const globeUnit = new Float32Array(count * 3)
  const hub = new Int8Array(count).fill(-1)
  // Terracotta nodes become the four country hubs
  const accentNodes = []
  for (let i = 0; i < count; i++) if (meta.colorIndex[i] === TERRACOTTA_INDEX) accentNodes.push(i)
  const perHub = Math.max(4, Math.floor(accentNodes.length / HUBS.length))
  accentNodes.slice(0, perHub * HUBS.length).forEach((nodeIndex, n) => {
    hub[nodeIndex] = n % HUBS.length
  })
  const golden = Math.PI * (3 - Math.sqrt(5))
  const tmp = [0, 0, 0]
  let fib = 0
  let surfaceCount = 0
  for (let i = 0; i < count; i++) if (hub[i] < 0) surfaceCount++
  for (let i = 0; i < count; i++) {
    if (hub[i] >= 0) {
      const h = HUBS[hub[i]]
      latLonToUnit(h.lat + gaussian(rand) * 3.2, h.lon + gaussian(rand) * 4, tmp)
    } else {
      // Fibonacci sphere: even, calm distribution
      const y = 1 - ((fib + 0.5) / Math.max(1, surfaceCount)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const th = golden * fib
      tmp[0] = Math.cos(th) * r
      tmp[1] = y
      tmp[2] = Math.sin(th) * r
      fib++
    }
    const lift = hub[i] >= 0 ? 1.02 + rand() * 0.05 : 1
    globeUnit[i * 3] = tmp[0] * lift
    globeUnit[i * 3 + 1] = tmp[1] * lift
    globeUnit[i * 3 + 2] = tmp[2] * lift
  }
  const globe = isMobile
    ? { cx: 0, cy: vh * 0.04, cz: -2.2, radius: Math.min(vw * 0.44, vh * 0.3) }
    : { cx: vw * 0.24, cy: 0, cz: -1.2, radius: Math.min(vh * 0.34, vw * 0.22) }

  /* 4 · Ring: an elliptical ring around the contact headline */
  const ringAngle = new Float32Array(count)
  const ringOffset = new Float32Array(count * 2) // radial jitter, z
  for (let i = 0; i < count; i++) {
    ringAngle[i] = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.05
    ringOffset[i * 2] = gaussian(rand) * 0.09
    ringOffset[i * 2 + 1] = -0.6 + gaussian(rand) * 0.3
  }
  const ring = isMobile
    ? { cx: 0, cy: 0, rx: vw * 0.46, ry: vh * 0.36 }
    : { cx: 0, cy: vh * 0.02, rx: vw * 0.43, ry: vh * 0.39 }

  /* Structural links per formation (scatter has none: everyone starts alone) */
  const clusterLinks = knnLinks(clusters, count, 2, 1.4, team)
  const curveLinks = knnLinks(curve, count, 2, 0.75)

  // Globe links are computed on the unit sphere, then scaled
  const globeScaled = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i++) globeScaled[i] = globeUnit[i] * globe.radius
  const hubLinks = knnLinks(globeScaled, count, 2, globe.radius * 0.4, null, (i) => hub[i] >= 0)
  const surfaceLinks = knnLinks(globeScaled, count, 1, globe.radius * 0.35, null, (i) => hub[i] < 0 && i % 3 !== 0)
  const globeLinks = {
    pairs: Uint16Array.from([...hubLinks.pairs, ...surfaceLinks.pairs]),
    rest: Float32Array.from([...hubLinks.rest, ...surfaceLinks.rest]),
  }

  // Ring: neighbours along the ring (indices are already in angle order)
  const ringPairs = []
  const ringRest = []
  const per = (2 * Math.PI * Math.sqrt((ring.rx * ring.rx + ring.ry * ring.ry) / 2)) / count
  for (let i = 0; i < count; i++) {
    ringPairs.push(i, (i + 1) % count)
    ringRest.push(per)
    if (i % 2 === 0) {
      ringPairs.push(i, (i + 3) % count)
      ringRest.push(per * 3)
    }
  }
  const ringLinks = { pairs: Uint16Array.from(ringPairs), rest: Float32Array.from(ringRest) }

  return {
    scatter,
    clusters,
    curve,
    globeUnit,
    hub,
    globe,
    ringAngle,
    ringOffset,
    ring,
    links: [null, clusterLinks, curveLinks, globeLinks, ringLinks],
    /** How much each node wanders in each formation */
    drift: [0.32, 0.1, 0.07, 0.035, 0.05],
  }
}

export type Pt = { x: number; y: number }

export type TanId = 'big1' | 'big2' | 'medium' | 'small1' | 'small2' | 'square' | 'para'

export type Pose = { x: number; y: number; rot: number; flip: boolean }

export const TAN_IDS: TanId[] = ['big1', 'big2', 'medium', 'small1', 'small2', 'square', 'para']

export const TAN_COLOR: Record<TanId, string> = {
  big1: '#FF5A5F',
  big2: '#FF8A1E',
  medium: '#FFD000',
  small1: '#22C55E',
  small2: '#38BDF8',
  square: '#3B82F6',
  para: '#A855F7',
}

export const TAN_NAME: Record<TanId, string> = {
  big1: 'большой треугольник',
  big2: 'второй большой треугольник',
  medium: 'средний треугольник',
  small1: 'маленький треугольник',
  small2: 'второй маленький треугольник',
  square: 'квадрат',
  para: 'параллелограмм',
}

const S = Math.SQRT2

const LOCAL: Record<TanId, Pt[]> = {
  big1: [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ],
  big2: [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ],
  medium: [
    { x: 0, y: 0 },
    { x: S, y: 0 },
    { x: 0, y: S },
  ],
  small1: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
  small2: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
  square: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  para: [
    { x: 0, y: 0 },
    { x: S, y: 0 },
    { x: S + S / 2, y: S / 2 },
    { x: S / 2, y: S / 2 },
  ],
}

export type Figure = {
  id: string
  name: string
  polys: Record<TanId, Pt[]>
  poses: Record<TanId, Pose>
}

/** A piece sticks when its middle is about this close to the right spot. */
export const SNAP = 0.26

function pts(values: number[]): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < values.length; i += 2) out.push({ x: values[i], y: values[i + 1] })
  return out
}

function scale(poly: Pt[], factor: number): Pt[] {
  return poly.map((p) => ({ x: p.x * factor, y: p.y * factor }))
}

export function centroid(poly: readonly Pt[]): Pt {
  let x = 0
  let y = 0
  for (const p of poly) {
    x += p.x
    y += p.y
  }
  return { x: x / poly.length, y: y / poly.length }
}

export function place(id: TanId, pose: Pose): Pt[] {
  const local = LOCAL[id]
  const center = centroid(local)
  const rad = (pose.rot * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return local.map((point) => {
    let x = point.x - center.x
    let y = point.y - center.y
    if (pose.flip) x = -x
    return {
      x: x * cos - y * sin + pose.x,
      y: x * sin + y * cos + pose.y,
    }
  })
}

export function polygonsMatch(a: readonly Pt[], b: readonly Pt[], eps = 0.08): boolean {
  if (a.length !== b.length) return false
  const near = (p: Pt, poly: readonly Pt[]) => poly.some((q) => Math.hypot(p.x - q.x, p.y - q.y) <= eps)
  return a.every((p) => near(p, b)) && b.every((p) => near(p, a))
}

export function derivePose(id: TanId, world: readonly Pt[]): Pose | null {
  const target = centroid(world)
  for (const flip of [false, true]) {
    for (let step = 0; step < 8; step += 1) {
      const rot = step * 45
      const posed = place(id, { x: target.x, y: target.y, rot, flip })
      if (polygonsMatch(posed, world)) return { x: target.x, y: target.y, rot, flip }
    }
  }
  return null
}

function edgeLengths(poly: readonly Pt[]): number[] {
  return poly.map((point, index) => {
    const next = poly[(index + 1) % poly.length]
    return Math.hypot(point.x - next.x, point.y - next.y)
  })
}

function polyArea(poly: readonly Pt[]): number {
  let sum = 0
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

function pointInPoly(p: Pt, poly: readonly Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const a = poly[i]
    const b = poly[j]
    const cross = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    if (cross) inside = !inside
  }
  return inside
}

function nearEdge(p: Pt, poly: readonly Pt[], eps: number): boolean {
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = dx * dx + dy * dy
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len))
    if (Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)) < eps) return true
  }
  return false
}

type RawKind = 'large' | 'medium' | 'small' | 'square' | 'para'

function classify(poly: Pt[]): RawKind {
  if (poly.length === 4) {
    const sides = edgeLengths(poly).sort((a, b) => a - b)
    const even = sides[3] - sides[0] < 0.12 * sides[0]
    const diagonalA = Math.hypot(poly[0].x - poly[2].x, poly[0].y - poly[2].y)
    const diagonalB = Math.hypot(poly[1].x - poly[3].x, poly[1].y - poly[3].y)
    if (even && Math.abs(diagonalA - diagonalB) < 0.12 * diagonalA) return 'square'
    return 'para'
  }
  const area = polyArea(poly)
  const smallArea = polyArea(LOCAL.small1)
  const ratio = area / smallArea
  if (ratio < 1.5) return 'small'
  if (ratio < 3) return 'medium'
  return 'large'
}

function byCentroid(a: Pt[], b: Pt[]): number {
  const ca = centroid(a)
  const cb = centroid(b)
  return ca.x - cb.x || ca.y - cb.y
}

function assign(polys: Pt[][]): Record<TanId, Pt[]> {
  const larges: Pt[][] = []
  const smalls: Pt[][] = []
  let medium: Pt[] | null = null
  let square: Pt[] | null = null
  let para: Pt[] | null = null
  for (const poly of polys) {
    const kind = classify(poly)
    if (kind === 'large') larges.push(poly)
    else if (kind === 'small') smalls.push(poly)
    else if (kind === 'medium') medium = poly
    else if (kind === 'square') square = poly
    else para = poly
  }
  if (larges.length !== 2 || smalls.length !== 2 || !medium || !square || !para) {
    throw new Error('tangram pieces do not match the seven tans')
  }
  larges.sort(byCentroid)
  smalls.sort(byCentroid)
  return {
    big1: larges[0],
    big2: larges[1],
    medium,
    small1: smalls[0],
    small2: smalls[1],
    square,
    para,
  }
}

function shift(polys: Record<TanId, Pt[]>, dx: number, dy: number): Record<TanId, Pt[]> {
  const next = {} as Record<TanId, Pt[]>
  for (const id of TAN_IDS) next[id] = polys[id].map((p) => ({ x: p.x + dx, y: p.y + dy }))
  return next
}

function prepare(raw: Pt[][], scaleBy: number): { polys: Record<TanId, Pt[]>; poses: Record<TanId, Pose> } {
  const scaled = raw.map((poly) => scale(poly, scaleBy))
  let polys = assign(scaled)
  let minX = Infinity
  let minY = Infinity
  for (const id of TAN_IDS) {
    for (const point of polys[id]) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
    }
  }
  polys = shift(polys, 0.35 - minX, 0.35 - minY)
  const poses = {} as Record<TanId, Pose>
  for (const id of TAN_IDS) {
    const pose = derivePose(id, polys[id])
    if (!pose) throw new Error(`piece ${id} is not a rigid tangram tan`)
    poses[id] = pose
  }
  return { polys, poses }
}

function raw(values: number[]): Pt[] {
  return pts(values)
}

const PIXEL = 1 / (100 * S)

const SQUARE = prepare(
  [
    raw([0, 0, 0, 2.828427, 1.414214, 1.414214]),
    raw([0, 2.828427, 2.828427, 2.828427, 1.414214, 1.414214]),
    raw([1.414214, 0, 2.828427, 0, 2.828427, 1.414214]),
    raw([0.707107, 0.707107, 2.12132, 0.707107, 1.414214, 1.414214]),
    raw([2.828427, 1.414214, 2.828427, 2.828427, 2.12132, 2.12132]),
    raw([1.414214, 1.414214, 2.12132, 0.707107, 2.828427, 1.414214, 2.12132, 2.12132]),
    raw([0, 0, 1.414214, 0, 2.12132, 0.707107, 0.707107, 0.707107]),
  ],
  1,
)

const ROCKET = prepare(
  [
    raw([691, 601, 408, 601, 408, 319]),
    raw([691, 601, 408, 319, 691, 319]),
    raw([408, 319, 550, 177, 691, 319]),
    raw([791, 501, 691, 601, 691, 401]),
    raw([408, 403, 408, 603, 308, 503]),
    raw([620, 743, 479, 743, 479, 601, 620, 601]),
    raw([543, 943, 543, 743, 643, 843, 643, 1043]),
  ],
  PIXEL,
)

const SHIP = prepare(
  [
    raw([817, 251, 617, 451, 417, 251]),
    raw([317, 351, 417, 251, 517, 351, 417, 451]),
    raw([617, 451, 417, 451, 517, 351]),
    raw([597, 151, 697, 251, 497, 251]),
    raw([817, 451, 617, 451, 717, 351, 917, 351]),
    raw([617, 451, 817, 451, 817, 651]),
    raw([1117, 351, 717, 351, 917, 151]),
  ],
  PIXEL,
)

const SPACEMAN = prepare(
  [
    raw([-509.69543825171, 132.60804791749743, -792.538150726329, 132.60804791749746, -792.538150726329, -150.23466455712153]),
    raw([-509.69543825170996, 132.6080479174974, -792.538150726329, -150.23466455712156, -509.69543825171, -150.23466455712162]),
    raw([-758.7364660480775, -250.2346645571216, -658.7364660480775, -350.2346645571216, -558.7364660480775, -250.2346645571216, -658.7364660480775, -150.2346645571216]),
    raw([-786.9117537356276, 332.60804791749746, -786.9117537356276, 132.60804791749746, -586.9117537356276, 132.60804791749743]),
    raw([-509.69543825171, 274.0294041548069, -651.1167944890195, 415.4507603921164, -651.1167944890195, 274.0294041548069, -509.69543825171, 132.6080479174974]),
    raw([-551.1390317802368, 315.4729976833337, -451.1390317802368, 415.4729976833337, -651.1390317802368, 415.4729976833337]),
    raw([-786.9117537356276, 222.96536029209165, -786.9117537356276, 422.96536029209165, -886.9117537356276, 322.96536029209165]),
  ],
  PIXEL,
)

export const FIGURES: Array<Figure & { name: string }> = [
  { id: 'square', name: 'Квадрат', ...SQUARE },
  { id: 'rocket', name: 'Ракета', ...ROCKET },
  { id: 'ship', name: 'Корабль', ...SHIP },
  { id: 'pilot', name: 'Космонавт', ...SPACEMAN },
]

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

export function boundsOf(polys: readonly Pt[][]): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const poly of polys) {
    for (const point of poly) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
  }
  return { minX, minY, maxX, maxY }
}

export function orientationMatches(id: TanId, rot: number, flip: boolean, target: Pose): boolean {
  const aimed = place(id, { x: target.x, y: target.y, rot, flip })
  const goal = place(id, target)
  return polygonsMatch(aimed, goal)
}

export function canSnap(id: TanId, pose: Pose, target: Pose): boolean {
  const dx = pose.x - target.x
  const dy = pose.y - target.y
  if (dx * dx + dy * dy > SNAP * SNAP) return false
  return orientationMatches(id, pose.rot, pose.flip, target)
}

export function auditFigure(figure: Figure): string[] {
  const issues: string[] = []
  for (const id of TAN_IDS) {
    if (!derivePose(id, figure.polys[id])) issues.push(`${figure.id} ${id} is not a tan`)
  }
  const polys = TAN_IDS.map((id) => figure.polys[id])
  const box = boundsOf(polys)
  let overlap = 0
  let covered = 0
  const step = 0.035
  for (let x = box.minX; x <= box.maxX; x += step) {
    for (let y = box.minY; y <= box.maxY; y += step) {
      const point = { x, y }
      if (polys.some((poly) => nearEdge(point, poly, 0.03))) continue
      const hits = polys.filter((poly) => pointInPoly(point, poly)).length
      if (hits > 1) overlap += 1
      if (hits > 0) covered += 1
    }
  }
  if (covered > 0 && overlap / covered > 0.012) issues.push(`${figure.id} overlaps ${overlap}/${covered}`)
  return issues
}

export function pickFigure(rng: () => number = Math.random): Figure {
  return FIGURES[Math.floor(rng() * FIGURES.length)]
}

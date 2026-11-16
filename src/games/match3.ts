import type { AgeId, StarScore } from '../types'

/** Cells up to two steps away, including diagonals, plus the bomb itself. */
export const BLAST_RADIUS = 2

export type BallColor = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange'

export const BALL_HEX: Record<BallColor, string> = {
  red: '#FF4D4F',
  yellow: '#FFD000',
  green: '#22C55E',
  blue: '#2563EB',
  purple: '#8B5CF6',
  orange: '#FF8A1E',
}

export const BALL_NAME: Record<BallColor, string> = {
  red: 'красный',
  yellow: 'жёлтый',
  green: 'зелёный',
  blue: 'синий',
  purple: 'фиолетовый',
  orange: 'оранжевый',
}

export type Piece =
  | { id: number; kind: 'ball'; color: BallColor }
  | { id: number; kind: 'bomb' }

export type Grid = Array<Array<Piece | null>>

export type Pos = { r: number; c: number }

export type Ids = { next: number }

export type Setup = {
  rows: number
  cols: number
  colors: BallColor[]
  goal: number
  bombChance: number
  maxBombs: number
}

export type Wave = {
  pops: string[]
  balls: number
  grid: Grid
}

export type MoveResult = {
  ok: boolean
  balls: number
  grid: Grid
  waves: Wave[]
}

const SETUPS: Record<'y5' | 'y6' | 'y79' | 'y10', Setup> = {
  y5: {
    rows: 6,
    cols: 6,
    colors: ['red', 'yellow', 'green', 'blue'],
    goal: 30,
    bombChance: 0.16,
    maxBombs: 2,
  },
  y6: {
    rows: 6,
    cols: 6,
    colors: ['red', 'yellow', 'green', 'blue', 'purple'],
    goal: 36,
    bombChance: 0.14,
    maxBombs: 2,
  },
  y79: {
    rows: 6,
    cols: 6,
    colors: ['red', 'yellow', 'green', 'blue', 'purple'],
    goal: 42,
    bombChance: 0.12,
    maxBombs: 2,
  },
  y10: {
    rows: 6,
    cols: 6,
    colors: ['red', 'yellow', 'green', 'blue', 'purple', 'orange'],
    goal: 48,
    bombChance: 0.12,
    maxBombs: 2,
  },
}

export function setupFor(age: AgeId): Setup {
  if (age === 'y6' || age === 'y79' || age === 'y10') return SETUPS[age]
  return SETUPS.y5
}

export function makeIds(start = 1): Ids {
  return { next: start }
}

export function keyOf(pos: Pos): string {
  return `${pos.r},${pos.c}`
}

export function adjacent(a: Pos, b: Pos): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
}

function pieceId(ids: Ids): number {
  const id = ids.next
  ids.next += 1
  return id
}

function ball(ids: Ids, color: BallColor): Piece {
  return { id: pieceId(ids), kind: 'ball', color }
}

function bomb(ids: Ids): Piece {
  return { id: pieceId(ids), kind: 'bomb' }
}

function clone(grid: Grid): Grid {
  return grid.map((row) => row.slice())
}

export function matchCells(grid: Grid): Set<string> {
  const hit = new Set<string>()
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  for (let r = 0; r < rows; r += 1) {
    let run = 1
    for (let c = 1; c <= cols; c += 1) {
      const prev = grid[r][c - 1]
      const current = c < cols ? grid[r][c] : null
      const same =
        prev?.kind === 'ball' &&
        current?.kind === 'ball' &&
        prev.color === current.color
      if (same) run += 1
      else {
        if (prev?.kind === 'ball' && run >= 3) {
          for (let step = 0; step < run; step += 1) hit.add(`${r},${c - 1 - step}`)
        }
        run = 1
      }
    }
  }
  for (let c = 0; c < cols; c += 1) {
    let run = 1
    for (let r = 1; r <= rows; r += 1) {
      const prev = grid[r - 1][c]
      const current = r < rows ? grid[r][c] : null
      const same =
        prev?.kind === 'ball' &&
        current?.kind === 'ball' &&
        prev.color === current.color
      if (same) run += 1
      else {
        if (prev?.kind === 'ball' && run >= 3) {
          for (let step = 0; step < run; step += 1) hit.add(`${r - 1 - step},${c}`)
        }
        run = 1
      }
    }
  }
  return hit
}

export function swapped(grid: Grid, a: Pos, b: Pos): Grid {
  const next = clone(grid)
  const hold = next[a.r][a.c]
  next[a.r][a.c] = next[b.r][b.c]
  next[b.r][b.c] = hold
  return next
}

function createsMatch(grid: Grid, a: Pos, b: Pos): boolean {
  return matchCells(swapped(grid, a, b)).size > 0
}

export function hasMove(grid: Grid): boolean {
  for (const row of grid) {
    if (row.some((piece) => piece?.kind === 'bomb')) return true
  }
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (c + 1 < cols && createsMatch(grid, { r, c }, { r, c: c + 1 })) return true
      if (r + 1 < rows && createsMatch(grid, { r, c }, { r: r + 1, c })) return true
    }
  }
  return false
}

export function detonate(grid: Grid, seeds: readonly Pos[]): { grid: Grid; balls: number; pops: string[] } {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const exploded = new Set<string>()
  const cleared = new Set<string>()
  const queue = seeds.filter((pos) => grid[pos.r]?.[pos.c]?.kind === 'bomb')
  while (queue.length > 0) {
    const pos = queue.shift()
    if (!pos) break
    const origin = keyOf(pos)
    if (exploded.has(origin)) continue
    exploded.add(origin)
    for (let dr = -BLAST_RADIUS; dr <= BLAST_RADIUS; dr += 1) {
      for (let dc = -BLAST_RADIUS; dc <= BLAST_RADIUS; dc += 1) {
        const r = pos.r + dr
        const c = pos.c + dc
        if (r < 0 || c < 0 || r >= rows || c >= cols) continue
        const key = `${r},${c}`
        cleared.add(key)
        if (grid[r][c]?.kind === 'bomb' && !exploded.has(key)) queue.push({ r, c })
      }
    }
  }
  const next = clone(grid)
  let balls = 0
  for (const key of cleared) {
    const [r, c] = key.split(',').map(Number)
    if (next[r][c]?.kind === 'ball') balls += 1
    next[r][c] = null
  }
  return { grid: next, balls, pops: [...cleared] }
}

function erase(grid: Grid, keys: readonly string[]): { grid: Grid; balls: number } {
  const next = clone(grid)
  let balls = 0
  for (const key of keys) {
    const [r, c] = key.split(',').map(Number)
    if (next[r][c]?.kind === 'ball') balls += 1
    next[r][c] = null
  }
  return { grid: next, balls }
}

function collapse(grid: Grid): Grid {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const next: Grid = Array.from({ length: rows }, () => Array<Piece | null>(cols).fill(null))
  for (let c = 0; c < cols; c += 1) {
    let write = rows - 1
    for (let r = rows - 1; r >= 0; r -= 1) {
      const piece = grid[r][c]
      if (!piece) continue
      next[write][c] = piece
      write -= 1
    }
  }
  return next
}

function countBombs(grid: Grid): number {
  let total = 0
  for (const row of grid) {
    for (const piece of row) if (piece?.kind === 'bomb') total += 1
  }
  return total
}

function fillHoles(grid: Grid, setup: Setup, rng: () => number, ids: Ids): Grid {
  const next = clone(grid)
  let bombs = countBombs(next)
  for (let r = 0; r < next.length; r += 1) {
    for (let c = 0; c < next[r].length; c += 1) {
      if (next[r][c]) continue
      if (bombs < setup.maxBombs && rng() < setup.bombChance) {
        next[r][c] = bomb(ids)
        bombs += 1
      } else {
        const color = setup.colors[Math.floor(rng() * setup.colors.length)]
        next[r][c] = ball(ids, color)
      }
    }
  }
  return next
}

function shuffleColors(grid: Grid, rng: () => number): Grid {
  const colors: BallColor[] = []
  for (const row of grid) {
    for (const piece of row) if (piece?.kind === 'ball') colors.push(piece.color)
  }
  for (let index = colors.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const hold = colors[index]
    colors[index] = colors[swap]
    colors[swap] = hold
  }
  const next = clone(grid)
  let cursor = 0
  for (let r = 0; r < next.length; r += 1) {
    for (let c = 0; c < next[r].length; c += 1) {
      const piece = next[r][c]
      if (piece?.kind !== 'ball') continue
      next[r][c] = { ...piece, color: colors[cursor] }
      cursor += 1
    }
  }
  return next
}

function paintStable(grid: Grid, setup: Setup): Grid {
  const next = clone(grid)
  for (let r = 0; r < next.length; r += 1) {
    for (let c = 0; c < next[r].length; c += 1) {
      const piece = next[r][c]
      if (piece?.kind !== 'ball') continue
      next[r][c] = { ...piece, color: setup.colors[(r + c) % setup.colors.length] }
    }
  }
  return next
}

function ensurePlayable(grid: Grid, setup: Setup, rng: () => number): Grid {
  if (matchCells(grid).size > 0 || hasMove(grid)) return grid
  let current = grid
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const mixed = shuffleColors(current, rng)
    if (matchCells(mixed).size === 0 && hasMove(mixed)) return mixed
    current = mixed
  }
  return paintStable(current, setup)
}

function settle(start: Grid, seeds: readonly Pos[], setup: Setup, rng: () => number, ids: Ids): MoveResult {
  let current = start
  let balls = 0
  const waves: Wave[] = []
  const take = (removed: Grid, pops: string[], gained: number) => {
    balls += gained
    const filled = ensurePlayable(fillHoles(collapse(removed), setup, rng, ids), setup, rng)
    waves.push({ pops, balls: gained, grid: filled })
    current = filled
  }
  if (seeds.length > 0) {
    const boom = detonate(current, seeds)
    take(boom.grid, boom.pops, boom.balls)
  }
  for (let guard = 0; guard < 24; guard += 1) {
    const hit = [...matchCells(current)]
    if (hit.length === 0) break
    const cleared = erase(current, hit)
    take(cleared.grid, hit, cleared.balls)
  }
  if (matchCells(current).size > 0) {
    current = paintStable(current, setup)
    if (waves.length > 0) waves[waves.length - 1] = { ...waves[waves.length - 1], grid: current }
  }
  return { ok: true, balls, grid: current, waves }
}

export function resolveSwap(
  grid: Grid,
  a: Pos,
  b: Pos,
  setup: Setup,
  rng: () => number,
  ids: Ids,
): MoveResult {
  if (!adjacent(a, b)) return { ok: false, balls: 0, grid, waves: [] }
  const moved = swapped(grid, a, b)
  const seeds: Pos[] = []
  if (grid[a.r][a.c]?.kind === 'bomb') seeds.push(b)
  if (grid[b.r][b.c]?.kind === 'bomb') seeds.push(a)
  if (seeds.length === 0 && matchCells(moved).size === 0) return { ok: false, balls: 0, grid, waves: [] }
  return settle(moved, seeds, setup, rng, ids)
}

export function resolveBomb(grid: Grid, pos: Pos, setup: Setup, rng: () => number, ids: Ids): MoveResult {
  if (grid[pos.r]?.[pos.c]?.kind !== 'bomb') return { ok: false, balls: 0, grid, waves: [] }
  return settle(grid, [pos], setup, rng, ids)
}

function recolorMatches(grid: Grid, setup: Setup, rng: () => number, ids: Ids): Grid {
  let current = clone(grid)
  for (let guard = 0; guard < 16; guard += 1) {
    const hit = matchCells(current)
    if (hit.size === 0) break
    for (const key of hit) {
      const [r, c] = key.split(',').map(Number)
      const piece = current[r][c]
      if (piece?.kind !== 'ball') continue
      const avoid = new Set<BallColor>([piece.color])
      const left = current[r][c - 1]
      const up = current[r - 1]?.[c]
      if (left?.kind === 'ball') avoid.add(left.color)
      if (up?.kind === 'ball') avoid.add(up.color)
      const choices = setup.colors.filter((color) => !avoid.has(color))
      const pool = choices.length > 0 ? choices : setup.colors
      current[r][c] = ball(ids, pool[Math.floor(rng() * pool.length)])
    }
  }
  return current
}

export function createBoard(setup: Setup, rng: () => number, ids: Ids): Grid {
  const blank = (): Grid =>
    Array.from({ length: setup.rows }, () =>
      Array.from({ length: setup.cols }, () => ball(ids, setup.colors[Math.floor(rng() * setup.colors.length)])),
    )
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const grid = blank()
    if (matchCells(grid).size === 0 && hasMove(grid)) return grid
  }
  let grid = recolorMatches(blank(), setup, rng, ids)
  for (let attempt = 0; attempt < 40 && (matchCells(grid).size > 0 || !hasMove(grid)); attempt += 1) {
    grid = ensurePlayable(recolorMatches(grid, setup, rng, ids), setup, rng)
  }
  return grid
}

export function starsForMoves(moves: number, goal: number): StarScore {
  const par = Math.max(8, Math.round(goal / 3) + 4)
  if (moves <= par) return 3
  if (moves <= par * 2) return 2
  return 1
}

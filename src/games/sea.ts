import { randInt } from '../random'

// Classic fleet on a 10×10 field. Ships may not touch, even by a corner.
// A hit gives another shot. Sinking a ship paints every cell around it.

export const SIZE = 10
export const FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1] as const
export const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'] as const

export type Dir = 'h' | 'v'
export type Mark = 'miss' | 'hit' | 'sunk' | 'block'

export type Ship = {
  id: string
  len: number
  dir: Dir
  row: number | null
  col: number | null
}

export type Sea = {
  ships: Ship[]
  shots: Array<Array<Mark | null>>
}

export type ShotResult = 'miss' | 'hit' | 'sunk'

export function makeFleet(prefix: string): Ship[] {
  const seen = new Map<number, number>()
  return FLEET.map((len) => {
    const index = seen.get(len) ?? 0
    seen.set(len, index + 1)
    return { id: `${prefix}-${len}-${index}`, len, dir: 'h', row: null, col: null }
  })
}

export function freshSea(ships: Ship[]): Sea {
  return {
    ships: ships.map((ship) => ({ ...ship })),
    shots: Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null)),
  }
}

export function occupies(ship: Ship): Array<{ r: number; c: number }> {
  if (ship.row == null || ship.col == null) return []
  return Array.from({ length: ship.len }, (_, index) =>
    ship.dir === 'h'
      ? { r: ship.row as number, c: (ship.col as number) + index }
      : { r: (ship.row as number) + index, c: ship.col as number },
  )
}

function fits(len: number, dir: Dir, row: number, col: number): boolean {
  if (dir === 'h') return row >= 0 && row < SIZE && col >= 0 && col + len <= SIZE
  return col >= 0 && col < SIZE && row >= 0 && row + len <= SIZE
}

export function canPlace(ships: Ship[], id: string, row: number, col: number, dir: Dir, len: number): boolean {
  if (!fits(len, dir, row, col)) return false
  const blocked = new Set<string>()
  for (const ship of ships) {
    if (ship.id === id) continue
    for (const cell of occupies(ship)) {
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) blocked.add(`${cell.r + dr},${cell.c + dc}`)
      }
    }
  }
  for (let index = 0; index < len; index += 1) {
    const r = dir === 'h' ? row : row + index
    const c = dir === 'h' ? col + index : col
    if (blocked.has(`${r},${c}`)) return false
  }
  return true
}

export function placeShip(ships: Ship[], id: string, row: number, col: number, dir: Dir): Ship[] | null {
  const ship = ships.find((item) => item.id === id)
  if (!ship || !canPlace(ships, id, row, col, dir, ship.len)) return null
  return ships.map((item) => (item.id === id ? { ...item, row, col, dir } : item))
}

export function dockShip(ships: Ship[], id: string): Ship[] {
  return ships.map((item) => (item.id === id ? { ...item, row: null, col: null } : item))
}

export function rotateShip(ships: Ship[], id: string, grab: number): Ship[] | null {
  const ship = ships.find((item) => item.id === id)
  if (!ship) return null
  const dir: Dir = ship.dir === 'h' ? 'v' : 'h'
  if (ship.row == null || ship.col == null) {
    return ships.map((item) => (item.id === id ? { ...item, dir } : item))
  }
  const index = Math.max(0, Math.min(ship.len - 1, grab))
  const anchorR = ship.dir === 'h' ? ship.row : ship.row + index
  const anchorC = ship.dir === 'h' ? ship.col + index : ship.col
  const order = [index, ...Array.from({ length: ship.len }, (_, item) => item).filter((item) => item !== index)]
  for (const offset of order) {
    const row = dir === 'h' ? anchorR : anchorR - offset
    const col = dir === 'h' ? anchorC - offset : anchorC
    if (canPlace(ships, id, row, col, dir, ship.len)) {
      return ships.map((item) => (item.id === id ? { ...item, dir, row, col } : item))
    }
  }
  return null
}

function placeAll(prefix: string, pick: (spots: Array<{ row: number; col: number; dir: Dir }>) => number): Ship[] | null {
  const ships: Ship[] = []
  for (let index = 0; index < FLEET.length; index += 1) {
    const len = FLEET[index]
    const spots: Array<{ row: number; col: number; dir: Dir }> = []
    for (const dir of ['h', 'v'] as const) {
      for (let row = 0; row < SIZE; row += 1) {
        for (let col = 0; col < SIZE; col += 1) {
          if (canPlace(ships, '', row, col, dir, len)) spots.push({ row, col, dir })
        }
      }
    }
    if (spots.length === 0) return null
    const spot = spots[pick(spots)]
    ships.push({ id: `${prefix}-${index}`, len, dir: spot.dir, row: spot.row, col: spot.col })
  }
  return ships
}

export function randomFleet(prefix: string): Ship[] {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const fleet = placeAll(prefix, (spots) => randInt(0, spots.length - 1))
    if (fleet) return fleet
  }
  const fallback = placeAll(prefix, () => 0)
  if (!fallback) throw new Error('Не удалось расставить корабли')
  return fallback
}

export function shipAt(ships: Ship[], r: number, c: number): { ship: Ship; index: number } | null {
  for (const ship of ships) {
    const index = occupies(ship).findIndex((cell) => cell.r === r && cell.c === c)
    if (index >= 0) return { ship, index }
  }
  return null
}

export function applyShot(sea: Sea, r: number, c: number): { sea: Sea; result: ShotResult } | null {
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE || sea.shots[r][c]) return null
  const shots = sea.shots.map((row) => [...row])
  const found = shipAt(sea.ships, r, c)
  if (!found) {
    shots[r][c] = 'miss'
    return { sea: { ships: sea.ships, shots }, result: 'miss' }
  }
  shots[r][c] = 'hit'
  const cells = occupies(found.ship)
  if (!cells.every((cell) => shots[cell.r][cell.c] === 'hit')) {
    return { sea: { ships: sea.ships, shots }, result: 'hit' }
  }
  for (const cell of cells) shots[cell.r][cell.c] = 'sunk'
  for (const cell of cells) {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const nr = cell.r + dr
        const nc = cell.c + dc
        if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE || shots[nr][nc]) continue
        shots[nr][nc] = 'block'
      }
    }
  }
  return { sea: { ships: sea.ships, shots }, result: 'sunk' }
}

export function sunkCount(sea: Sea): number {
  return sea.ships.filter((ship) => occupies(ship).every((cell) => sea.shots[cell.r][cell.c] === 'sunk')).length
}

export function allSunk(sea: Sea): boolean {
  return sea.ships.length > 0 && sunkCount(sea) === sea.ships.length
}

function open(sea: Sea, r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < SIZE && c < SIZE && sea.shots[r][c] == null
}

function targetCells(sea: Sea): Array<{ r: number; c: number }> {
  const hits: Array<{ r: number; c: number }> = []
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (sea.shots[r][c] === 'hit') hits.push({ r, c })
    }
  }
  const hitKey = new Set(hits.map((cell) => `${cell.r},${cell.c}`))
  const found: Array<{ r: number; c: number }> = []
  const used = new Set<string>()
  const add = (r: number, c: number) => {
    if (!open(sea, r, c) || found.some((cell) => cell.r === r && cell.c === c)) return
    found.push({ r, c })
  }
  for (const hit of hits) {
    const horizontal = hitKey.has(`${hit.r},${hit.c - 1}`) || hitKey.has(`${hit.r},${hit.c + 1}`)
    const vertical = hitKey.has(`${hit.r - 1},${hit.c}`) || hitKey.has(`${hit.r + 1},${hit.c}`)
    if (horizontal) {
      let left = hit.c
      let right = hit.c
      while (hitKey.has(`${hit.r},${left - 1}`)) left -= 1
      while (hitKey.has(`${hit.r},${right + 1}`)) right += 1
      const key = `h${hit.r}:${left}`
      if (!used.has(key)) {
        used.add(key)
        add(hit.r, left - 1)
        add(hit.r, right + 1)
      }
    }
    if (vertical) {
      let top = hit.r
      let bottom = hit.r
      while (hitKey.has(`${top - 1},${hit.c}`)) top -= 1
      while (hitKey.has(`${bottom + 1},${hit.c}`)) bottom += 1
      const key = `v${hit.c}:${top}`
      if (!used.has(key)) {
        used.add(key)
        add(top - 1, hit.c)
        add(bottom + 1, hit.c)
      }
    }
    if (!horizontal && !vertical) {
      add(hit.r - 1, hit.c)
      add(hit.r + 1, hit.c)
      add(hit.r, hit.c - 1)
      add(hit.r, hit.c + 1)
    }
  }
  return found
}

function canHost(sea: Sea, r: number, c: number, len: number): boolean {
  for (const dir of ['h', 'v'] as const) {
    for (let offset = 0; offset < len; offset += 1) {
      const row = dir === 'h' ? r : r - offset
      const col = dir === 'h' ? c - offset : c
      if (!fits(len, dir, row, col)) continue
      let ok = true
      for (let index = 0; index < len; index += 1) {
        const nr = dir === 'h' ? row : row + index
        const nc = dir === 'h' ? col + index : col
        const mark = sea.shots[nr][nc]
        if (mark === 'miss' || mark === 'block' || mark === 'sunk') ok = false
      }
      if (ok) return true
    }
  }
  return false
}

function huntCells(sea: Sea): Array<{ r: number; c: number }> {
  const lengths = sea.ships
    .filter((ship) => occupies(ship).some((cell) => sea.shots[cell.r][cell.c] !== 'sunk'))
    .map((ship) => ship.len)
  const pool: Array<{ r: number; c: number }> = []
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (sea.shots[r][c] != null) continue
      if (lengths.some((len) => canHost(sea, r, c, len))) pool.push({ r, c })
    }
  }
  return pool
}

export function chooseShot(sea: Sea, random: () => number = Math.random): { r: number; c: number } | null {
  const targets = targetCells(sea)
  const pool = targets.length > 0 ? targets : huntCells(sea)
  if (pool.length === 0) return null
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}

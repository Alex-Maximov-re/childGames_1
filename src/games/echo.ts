import type { AgeId, StarScore } from '../types'

export const LEVELS = 10
export const STEPS_PER_LEVEL = 3
export const TOTAL_STEPS = LEVELS * STEPS_PER_LEVEL

export type EchoColor = {
  id: string
  name: string
  hex: string
  freq: number
}

const RED: EchoColor = { id: 'red', name: 'красный', hex: '#FF4D4F', freq: 262 }
const YELLOW: EchoColor = { id: 'yellow', name: 'жёлтый', hex: '#FFD000', freq: 330 }
const GREEN: EchoColor = { id: 'green', name: 'зелёный', hex: '#22C55E', freq: 392 }
const BLUE: EchoColor = { id: 'blue', name: 'синий', hex: '#2563EB', freq: 494 }
const PURPLE: EchoColor = { id: 'purple', name: 'фиолетовый', hex: '#8B5CF6', freq: 587 }

const FOUR = [RED, YELLOW, GREEN, BLUE]
const FIVE = [RED, YELLOW, GREEN, BLUE, PURPLE]

export function paletteFor(age: AgeId): EchoColor[] {
  return age === 'y79' ? FIVE : FOUR
}

export function pace(age: AgeId, level: number): { on: number; gap: number } {
  const base = age === 'y79' ? 500 : age === 'y6' ? 620 : 740
  const on = Math.max(300, base - (level - 1) * 36)
  return { on, gap: Math.max(140, Math.round(on * 0.4)) }
}

export function levelFor(solved: number): number {
  if (solved >= TOTAL_STEPS) return LEVELS
  return 1 + Math.floor(Math.max(0, solved) / STEPS_PER_LEVEL)
}

export function roundInLevel(solved: number): number {
  if (solved >= TOTAL_STEPS) return STEPS_PER_LEVEL
  return Math.max(0, solved) % STEPS_PER_LEVEL
}

export function nextColor(palette: readonly EchoColor[], rng: () => number = Math.random): string {
  const index = Math.min(palette.length - 1, Math.floor(rng() * palette.length))
  return palette[index].id
}

export type TapResult = 'wrong' | 'next' | 'grow' | 'clear'

export function judgeTap(sequence: readonly string[], cursor: number, colorId: string): TapResult {
  if (sequence[cursor] !== colorId) return 'wrong'
  if (cursor + 1 < sequence.length) return 'next'
  if (sequence.length >= TOTAL_STEPS) return 'clear'
  return 'grow'
}

export function starsForMistakes(mistakes: number): StarScore {
  if (mistakes <= 0) return 3
  if (mistakes <= 3) return 2
  return 1
}

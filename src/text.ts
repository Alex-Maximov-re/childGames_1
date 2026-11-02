import type { StarScore } from './types'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(' ')
}

export function plural(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last > 1 && last < 5) return few
  if (last === 1) return one
  return many
}

export function starsFrom(correct: number, total: number): StarScore {
  if (total <= 0) return 1
  const ratio = correct / total
  if (ratio >= 0.8) return 3
  if (ratio >= 0.5) return 2
  return 1
}

import type { StarScore } from '../types'

/** One course. Obstacles come in short phrases, always leave a lane, and keep a gap long enough to move. */
export const SEGMENT_LENGTH = 200
export const RUN_SEGMENTS = 150
export const TAIL_SEGMENTS = 80
export const TRACK_SEGMENTS = RUN_SEGMENTS + TAIL_SEGMENTS
export const HIT_DISTANCE = 640
export const LANE_OFFSET = 0.62
export const SPEED = 1100

export type Lane = 0 | 1 | 2
export type ObstacleKind = 'cone' | 'crate' | 'bush'

export type TrackSegment = {
  curve: number
  blocks: Lane[]
  kind: ObstacleKind
  finish: boolean
}

const LANES: Lane[] = [0, 1, 2]

function openLanes(blocks: readonly Lane[]): Lane[] {
  return LANES.filter((lane) => !blocks.includes(lane))
}

function roll(rng: () => number, count: number): number {
  return Math.floor(rng() * count)
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[roll(rng, items.length)]
}

function applyCurves(segments: TrackSegment[], rng: () => number): void {
  let index = 0
  while (index < segments.length) {
    const hold = 16 + roll(rng, 8)
    const straight = rng() < 0.38
    const sign = rng() < 0.5 ? -1 : 1
    const peak = straight ? 0 : sign * (9 + rng() * 5)
    const ramp = 6
    for (let step = 0; step < hold && index + step < segments.length; step += 1) {
      let curve = peak
      if (step < ramp) curve = (peak * step) / ramp
      else if (step > hold - 1 - ramp) curve = (peak * (hold - 1 - step)) / ramp
      segments[index + step].curve = curve
    }
    index += hold
  }
}

type Phrase = Lane[][]

function phraseKey(phrase: Phrase): string {
  return phrase.map((row) => [...row].sort().join('')).join('|')
}

function fits(phrase: Phrase, prevOpen: readonly Lane[], gapBefore: number): boolean {
  let open = prevOpen
  let gap = gapBefore
  for (const row of phrase) {
    if (row.length < 1 || row.length > 2) return false
    const keepsWay = open.some((lane) => !row.includes(lane))
    if (!keepsWay && gap < 6) return false
    open = openLanes(row)
    gap = 4
  }
  return true
}

function pool(rng: () => number, curvy: boolean): Phrase[] {
  const singles: Phrase[] = [[[0]], [[1]], [[2]]]
  if (curvy || rng() < 0.46) return singles
  const rollKind = rng()
  if (rollKind < 0.46) {
    return [
      [[0], [2]],
      [[2], [0]],
      [[0], [1]],
      [[1], [0]],
      [[1], [2]],
      [[2], [1]],
    ]
  }
  if (rollKind < 0.72) return [[[0], [0]], [[1], [1]], [[2], [2]]]
  return [[[0, 2]], [[0, 1]], [[1, 2]]]
}

function fallbackRow(prevOpen: readonly Lane[], rng: () => number): Lane[] {
  const choices = LANES.filter((lane) => !(prevOpen.length === 1 && prevOpen[0] === lane))
  return [pick(rng, choices.length > 0 ? choices : LANES)]
}

export function buildTrack(rng: () => number = Math.random): TrackSegment[] {
  const segments: TrackSegment[] = Array.from({ length: TRACK_SEGMENTS }, () => ({
    curve: 0,
    blocks: [] as Lane[],
    kind: 'cone' as ObstacleKind,
    finish: false,
  }))
  applyCurves(segments, rng)

  const kinds: ObstacleKind[] = ['cone', 'crate', 'bush']
  let kind = 0
  let cursor = 16
  let prevOpen: Lane[] = [0, 1, 2]
  let gapBefore = 99
  let lastKey = ''
  let repeats = 0
  const lastPlay = RUN_SEGMENTS - 12

  while (cursor < lastPlay) {
    const curvy = Math.abs(segments[cursor].curve) > 7
    let options = pool(rng, curvy)
    let phrase = pick(rng, options)
    let guard = 0
    while (
      guard < 18 &&
      (!fits(phrase, prevOpen, gapBefore) || (phraseKey(phrase) === lastKey && repeats >= 2))
    ) {
      options = pool(rng, curvy)
      phrase = pick(rng, options)
      guard += 1
    }
    if (!fits(phrase, prevOpen, gapBefore)) phrase = [fallbackRow(prevOpen, rng)]
    const key = phraseKey(phrase)
    repeats = key === lastKey ? repeats + 1 : 1
    lastKey = key

    for (let row = 0; row < phrase.length && cursor < lastPlay; row += 1) {
      segments[cursor].blocks = [...phrase[row]]
      segments[cursor].kind = kinds[kind % kinds.length]
      prevOpen = openLanes(phrase[row])
      const between = row < phrase.length - 1
      const step = between ? 4 : curvy ? 6 + roll(rng, 2) : 4 + roll(rng, 2)
      gapBefore = step
      cursor += step
    }
    if (rng() < 0.75) kind += 1
  }

  for (let index = RUN_SEGMENTS - 10; index < TRACK_SEGMENTS; index += 1) segments[index].blocks = []
  segments[RUN_SEGMENTS - 4].finish = true
  return segments
}

export function starsForBumps(bumps: number): StarScore {
  if (bumps <= 0) return 3
  if (bumps <= 2) return 2
  return 1
}

export function finishIndex(track: readonly TrackSegment[]): number {
  const index = track.findIndex((segment) => segment.finish)
  return index < 0 ? RUN_SEGMENTS - 4 : index
}

export function auditTrack(track: readonly TrackSegment[]): string[] {
  const issues: string[] = []
  const obstacles: number[] = []
  const goal = finishIndex(track)
  track.forEach((segment, index) => {
    if (segment.blocks.length >= 3) issues.push(`full block at ${index}`)
    if (new Set(segment.blocks).size !== segment.blocks.length) issues.push(`duplicate lane at ${index}`)
    if (segment.blocks.some((lane) => lane < 0 || lane > 2)) issues.push(`bad lane at ${index}`)
    if (segment.blocks.length > 0) obstacles.push(index)
    if (index > 0 && Math.abs(segment.curve - track[index - 1].curve) > 2.6) issues.push(`curve jump at ${index}`)
  })
  if (obstacles.some((index) => index < 12)) issues.push('obstacle in the opening')
  if (obstacles.some((index) => index >= goal - 6)) issues.push('obstacle too close to the finish')
  if (obstacles.length < 10) issues.push(`too few obstacles: ${obstacles.length}`)
  for (let index = 1; index < obstacles.length; index += 1) {
    const previous = obstacles[index - 1]
    const current = obstacles[index]
    const gap = current - previous
    if (gap < 4) issues.push(`tight gap ${previous}->${current}`)
    const open = openLanes(track[previous].blocks)
    if (gap < 6 && open.length === 1 && track[current].blocks.includes(open[0])) {
      issues.push(`closed the only lane at ${current}`)
    }
  }
  return issues
}

export type Platform = 'web' | 'android' | 'ios'

export const AGE_IDS = ['y12', 'y3', 'y4', 'y5', 'y6', 'y79', 'y10'] as const

export type AgeId = (typeof AGE_IDS)[number]

export type GameId =
  | 'colors'
  | 'shapes'
  | 'voices'
  | 'memory'
  | 'count'
  | 'odd'
  | 'math'
  | 'sequence'
  | 'puzzle'
  | 'mole'
  | 'halves'
  | 'bubbles'
  | 'ducks'
  | 'tictactoe'

export type ShapeId = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond'

export type StarScore = 1 | 2 | 3

export type NextGame = {
  title: string
  emoji: string
  onGo: () => void
}

export type GameProps = {
  age: AgeId
  onExit: () => void
  onReplay: () => void
  next?: NextGame
}

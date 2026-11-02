export type Platform = 'web' | 'android' | 'ios'

export type AgeId = 'little' | 'middle' | 'big'

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

export type ShapeId = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond'

export type StarScore = 1 | 2 | 3

export type NextGame = {
  title: string
  onGo: () => void
}

export type GameProps = {
  onExit: () => void
  onReplay: () => void
  next?: NextGame
}

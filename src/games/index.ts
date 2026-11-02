import type { ComponentType } from 'react'
import type { GameId, GameProps } from '../types'
import { ColorGame } from './ColorGame'
import { CountGame } from './CountGame'
import { MathGame } from './MathGame'
import { MemoryGame } from './MemoryGame'
import { MoleGame } from './MoleGame'
import { OddGame } from './OddGame'
import { PuzzleGame } from './PuzzleGame'
import { SequenceGame } from './SequenceGame'
import { ShapeGame } from './ShapeGame'
import { VoiceGame } from './VoiceGame'

export const gameViews: Record<GameId, ComponentType<GameProps>> = {
  colors: ColorGame,
  shapes: ShapeGame,
  voices: VoiceGame,
  memory: MemoryGame,
  count: CountGame,
  odd: OddGame,
  math: MathGame,
  sequence: SequenceGame,
  puzzle: PuzzleGame,
  mole: MoleGame,
}

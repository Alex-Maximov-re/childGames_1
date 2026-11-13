import type { ComponentType } from 'react'
import type { GameId, GameProps } from '../types'
import { ColorGame } from './ColorGame'
import { CountGame } from './CountGame'
import { MathGame } from './MathGame'
import { MemoryGame } from './MemoryGame'
import { HalvesGame } from './HalvesGame'
import { MoleGame } from './MoleGame'
import { BubbleGame } from './BubbleGame'
import { DuckGame } from './DuckGame'
import { TicTacToeGame } from './TicTacToeGame'
import { SeaGame } from './SeaGame'
import { ChessGame } from './ChessGame'
import { WipeGame } from './WipeGame'
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
  halves: HalvesGame,
  bubbles: BubbleGame,
  ducks: DuckGame,
  tictactoe: TicTacToeGame,
  ships: SeaGame,
  chess: ChessGame,
  wipe: WipeGame,
}

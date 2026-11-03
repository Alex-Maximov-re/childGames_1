import { useEffect, useRef, useState } from 'react'
import { progressKey } from '../catalog'
import { useSave } from '../save'
import { cx } from '../text'
import type { GameProps, StarScore } from '../types'
import { Shell } from '../ui'

type Mark = 'x' | 'o'
type Cell = Mark | null
type Board = Cell[]
type Mode = 'duo' | 'ai'
type Outcome = Mark | 'draw'

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const EMPTY: Board = Array.from({ length: 9 }, () => null)

function outcomeOf(board: Board): Outcome | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  if (board.every(Boolean)) return 'draw'
  return null
}

function winningLine(board: Board): number[] | null {
  for (const line of LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line
  }
  return null
}

function score(board: Board): number | null {
  const result = outcomeOf(board)
  if (result === 'o') return 1
  if (result === 'x') return -1
  if (result === 'draw') return 0
  return null
}

function minimax(board: Board, player: Mark): number {
  const done = score(board)
  if (done !== null) return done
  let best = player === 'o' ? -Infinity : Infinity
  for (let index = 0; index < 9; index += 1) {
    if (board[index]) continue
    board[index] = player
    const value = minimax(board, player === 'o' ? 'x' : 'o')
    board[index] = null
    best = player === 'o' ? Math.max(best, value) : Math.min(best, value)
  }
  return best
}

function bestMove(source: Board): number {
  const board = [...source]
  let best = -Infinity
  let move = -1
  for (let index = 0; index < 9; index += 1) {
    if (board[index]) continue
    board[index] = 'o'
    const value = minimax(board, 'x')
    board[index] = null
    if (value > best) {
      best = value
      move = index
    }
  }
  return move
}

function starsFor(mode: Mode, result: Outcome): StarScore {
  if (mode === 'duo') return 2
  if (result === 'x') return 3
  if (result === 'draw') return 2
  return 1
}

function resultText(mode: Mode, result: Outcome): string {
  if (result === 'draw') return 'Ничья'
  if (mode === 'ai') return result === 'x' ? 'Ты победил!' : 'Победил компьютер'
  return result === 'x' ? 'Победили крестики' : 'Победили нолики'
}

export function TicTacToeGame({ age, onExit, onReplay, next }: GameProps) {
  const { record } = useSave()
  const [mode, setMode] = useState<Mode | null>(null)
  const [board, setBoard] = useState<Board>(EMPTY)
  const [turn, setTurn] = useState<Mark>('x')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const saved = useRef(false)

  function resetBoard() {
    setBoard(EMPTY)
    setTurn('x')
    setOutcome(null)
    saved.current = false
  }

  function finish(result: Outcome, played: Mode) {
    setOutcome(result)
    if (saved.current) return
    saved.current = true
    record(progressKey(age, 'tictactoe'), starsFor(played, result))
  }

  function play(index: number) {
    if (!mode || outcome || board[index]) return
    if (mode === 'ai' && turn !== 'x') return
    const nextBoard = [...board]
    nextBoard[index] = turn
    setBoard(nextBoard)
    const result = outcomeOf(nextBoard)
    if (result) {
      finish(result, mode)
      return
    }
    setTurn(turn === 'x' ? 'o' : 'x')
  }

  useEffect(() => {
    if (mode !== 'ai' || turn !== 'o' || outcome) return
    const id = window.setTimeout(() => {
      setBoard((current) => {
        if (outcomeOf(current)) return current
        const nextBoard = [...current]
        const move = bestMove(nextBoard)
        if (move >= 0) nextBoard[move] = 'o'
        const result = outcomeOf(nextBoard)
        if (result) {
          window.setTimeout(() => finish(result, 'ai'), 0)
        } else {
          setTurn('x')
        }
        return nextBoard
      })
    }, 450)
    return () => window.clearTimeout(id)
  }, [mode, turn, outcome])

  const line = winningLine(board)
  const status = !mode
    ? 'Как играем?'
    : outcome
      ? resultText(mode, outcome)
      : mode === 'ai' && turn === 'o'
        ? 'Компьютер думает…'
        : turn === 'x'
          ? 'Ход крестиков'
          : 'Ход ноликов'

  return (
    <Shell
      title="Крестики-нолики"
      onExit={mode ? () => { resetBoard(); setMode(null) } : onExit}
      onRestart={mode ? resetBoard : onReplay}
    >
      <p className="prompt">{status}</p>
      {mode ? (
        <>
          <BoardView
            board={board}
            line={line}
            disabled={Boolean(outcome) || (mode === 'ai' && turn === 'o')}
            onPlay={play}
          />
          {outcome && (
            <div className="xo-actions">
              <button type="button" className="btn primary" onClick={resetBoard}>
                Ещё раз
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  resetBoard()
                  setMode(null)
                }}
              >
                Другой режим
              </button>
              {next && (
                <button type="button" className="btn next-game" onClick={next.onGo}>
                  <span className="next-kicker">Дальше</span>
                  <span className="next-title">
                    <span className="next-emoji" aria-hidden="true">
                      {next.emoji}
                    </span>
                    {next.title}
                  </span>
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="xo-modes">
          <button
            type="button"
            className="btn primary xo-mode"
            onClick={() => {
              resetBoard()
              setMode('duo')
            }}
          >
            Игра вдвоём
          </button>
          <button
            type="button"
            className="btn xo-mode"
            onClick={() => {
              resetBoard()
              setMode('ai')
            }}
          >
            Играть одному против ИИ
          </button>
        </div>
      )}
    </Shell>
  )
}

function BoardView({
  board,
  line,
  disabled,
  onPlay,
}: {
  board: Board
  line: number[] | null
  disabled: boolean
  onPlay: (index: number) => void
}) {
  return (
    <div className="xo-board">
      {board.map((cell, index) => (
        <button
          key={index}
          type="button"
          className={cx('xo-cell', cell === 'x' && 'x', cell === 'o' && 'o', line?.includes(index) && 'win')}
          aria-label={cell === 'x' ? 'Крестик' : cell === 'o' ? 'Нолик' : 'Пустая клетка'}
          disabled={disabled || Boolean(cell)}
          onClick={() => onPlay(index)}
        >
          {cell === 'x' ? '✕' : cell === 'o' ? '○' : ''}
        </button>
      ))}
    </div>
  )
}

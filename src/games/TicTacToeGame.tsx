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

function DuoPicture() {
  return (
    <svg className="xo-pic" viewBox="0 0 96 56" aria-hidden="true">
      <circle cx="18" cy="16" r="8" fill="#f6c7a1" />
      <ellipse cx="18" cy="12" rx="8" ry="5" fill="#6b4428" />
      <rect x="8" y="26" width="20" height="18" rx="9" fill="#ff7a5c" />
      <rect x="36" y="28" width="24" height="18" rx="4" fill="#fff8ee" />
      <path d="M40 32 H56 M40 37 H56 M40 42 H56 M44 29 V45 M52 29 V45" stroke="#e4d3bc" strokeWidth="1.2" />
      <circle cx="78" cy="16" r="8" fill="#f3d2b0" />
      <ellipse cx="78" cy="12" rx="8" ry="5" fill="#2a2340" />
      <rect x="68" y="26" width="20" height="18" rx="9" fill="#4aa8ef" />
    </svg>
  )
}

function AiPicture() {
  return (
    <svg className="xo-pic" viewBox="0 0 96 56" aria-hidden="true">
      <circle cx="20" cy="16" r="8" fill="#f6c7a1" />
      <ellipse cx="20" cy="12" rx="8" ry="5" fill="#6b4428" />
      <rect x="10" y="26" width="20" height="18" rx="9" fill="#7dce6a" />
      <rect x="46" y="12" width="40" height="28" rx="5" fill="#2a2340" />
      <rect x="50" y="16" width="32" height="18" rx="2" fill="#d7f3ff" />
      <path d="M55 20 L61 28 M61 20 L55 28" fill="none" stroke="#ff6b4a" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="72" cy="25" r="4" fill="none" stroke="#1f8fe0" strokeWidth="1.8" />
      <rect x="62" y="40" width="8" height="3" rx="1" fill="#8d879c" />
      <rect x="54" y="43" width="24" height="4" rx="2" fill="#5c566e" />
    </svg>
  )
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
            <DuoPicture />
            <span>Игра вдвоём</span>
          </button>
          <button
            type="button"
            className="btn xo-mode"
            onClick={() => {
              resetBoard()
              setMode('ai')
            }}
          >
            <AiPicture />
            <span>Играть одному против ИИ</span>
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

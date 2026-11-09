import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { playGood, playTap } from '../sound'
import { cx } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell } from '../ui'
import {
  chooseMove,
  ending,
  inCheck,
  legalMoves,
  play,
  squareName,
  startGame,
  type Game,
  type Kind,
  type Level,
  type Move,
  type Side,
} from './chess'

const LEVELS: Array<{ id: Level; title: string; text: string }> = [
  { id: 'easy', title: 'Лёгкий', text: 'Ходит без плана, но защищает свои фигуры.' },
  { id: 'mid', title: 'Средний', text: 'Чередует простые ходы и небольшие шахматные идеи.' },
  { id: 'hard', title: 'Тяжёлый', text: 'Держится стратегий и почти не ошибается.' },
]

type Mode = 'pvp' | 'ai' | null

const PIECE: Record<Kind, string> = {
  k: 'король',
  q: 'ферзь',
  r: 'ладья',
  b: 'слон',
  n: 'конь',
  p: 'пешка',
}

export function ChessGame({ age, onExit, onReplay, next }: GameProps) {
  const [mode, setMode] = useState<Mode>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [game, setGame] = useState<Game>(startGame)
  const [selected, setSelected] = useState<number | null>(null)
  const [pending, setPending] = useState<Move[] | null>(null)
  const [last, setLast] = useState<{ from: number; to: number } | null>(null)
  const [over, setOver] = useState(false)
  const moves = useMemo(() => (level && !over ? legalMoves(game) : []), [game, level, over])

  function resetBoard() {
    setGame(startGame())
    setSelected(null)
    setPending(null)
    setLast(null)
    setOver(false)
  }

  function finishIfNeeded(nextGame: Game) {
    if (ending(nextGame)) setOver(true)
  }

  function commit(move: Move) {
    const nextGame = play(game, move)
    setGame(nextGame)
    setLast({ from: move.from, to: move.to })
    setSelected(null)
    setPending(null)
    if (move.capture) playGood()
    else playTap()
    finishIfNeeded(nextGame)
  }

  useEffect(() => {
    if (mode !== 'ai' || !level || over || game.side !== 'b') return
    let cancel = false
    const id = window.setTimeout(() => {
      const move = chooseMove(game, level)
      if (cancel) return
      const nextGame = play(game, move)
      setGame(nextGame)
      setLast({ from: move.from, to: move.to })
      if (ending(nextGame)) setOver(true)
    }, 280)
    return () => {
      cancel = true
      window.clearTimeout(id)
    }
  }, [game, level, mode, over])

  function onSquare(index: number) {
    if (over) return
    const piece = game.board[index]
    
    // Проверяем, можно ли ходить в эту клетку (из уже выбранной фигуры)
    if (selected != null) {
      const fromHere = moves.filter((move) => move.from === selected && move.to === index)
      if (fromHere.length > 0) {
        commit(fromHere[0])
        return
      }
    }
    
    // Если кликнули на свою фигуру — выбираем её
    if (piece?.side === game.side) {
      setPending(null)
      setSelected(selected === index ? null : index)
      return
    }
    
    // Иначе сбрасываем выделение
    setPending(null)
    setSelected(null)
  }

  const done = over ? ending(game) : null
  const stars: StarScore = done?.winner === 'w' ? 3 : done?.winner === 'draw' ? 2 : 1
  const status = !mode
    ? 'Как играем?'
    : done
      ? resultText(done.kind, done.winner, mode === 'pvp')
      : game.side === 'b'
        ? mode === 'pvp'
          ? 'Ход чёрных'
          : 'Компьютер думает…'
        : inCheck(game)
          ? 'Шах. Твой ход'
          : 'Твой ход'

  return (
    <Shell
      title="Шахматы"
      onExit={mode ? () => { setMode(null); resetBoard() } : onExit}
      onRestart={mode && !done ? resetBoard : onReplay}
      meta={mode === 'ai' && level ? <span className="meta">{LEVELS.find((item) => item.id === level)?.title}</span> : undefined}
    >
      <p className="prompt chess-prompt" aria-live="polite">
        {status}
      </p>
      {mode ? (
        level ? (
          <>
            <ChessBoard
              game={game}
              selected={selected}
              last={last}
              targets={selected == null ? [] : moves.filter((move) => move.from === selected)}
              onSquare={onSquare}
            />
            {pending && (
              <div className="chess-promo">
                {pending.map((move) => (
                  <button key={move.promo} type="button" className="chess-promo-btn" onClick={() => commit(move)}>
                    <PieceIcon side="w" kind={move.promo ?? 'q'} />
                  </button>
                ))}
              </div>
            )}
            {done && (
              <Finish
                age={age}
                gameId="chess"
                stars={stars}
                detail={resultText(done.kind, done.winner, mode === 'pvp')}
                onReplay={onReplay}
                onExit={onExit}
                next={next}
              />
            )}
          </>
        ) : mode === 'ai' ? (
          <div className="chess-levels">
            <p className="hint">Ты играешь белыми. Компьютер — чёрными.</p>
            {LEVELS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cx('btn chess-level', item.id === 'hard' && 'primary')}
                onClick={() => {
                  resetBoard()
                  setLevel(item.id)
                }}
              >
                <span className="chess-level-title">{item.title}</span>
                <span className="chess-level-text">{item.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <ChessBoard
            game={game}
            selected={selected}
            last={last}
            targets={selected == null ? [] : moves.filter((move) => move.from === selected)}
            onSquare={onSquare}
          />
        )
      ) : (
        <div className="chess-modes">
          <button
            type="button"
            className="btn primary chess-mode"
            onClick={() => {
              resetBoard()
              setMode('pvp')
            }}
          >
            <span className="chess-mode-icon" aria-hidden="true">👥</span>
            <span className="chess-mode-title">Вдвоём</span>
            <span className="chess-mode-subtitle">Игра против друга</span>
          </button>
          <button
            type="button"
            className="btn chess-mode"
            onClick={() => {
              resetBoard()
              setMode('ai')
            }}
          >
            <span className="chess-mode-icon" aria-hidden="true">🤖</span>
            <span className="chess-mode-title">Против компьютера</span>
            <span className="chess-mode-subtitle">Выбери сложность</span>
          </button>
        </div>
      )}
    </Shell>
  )
}

function resultText(kind: 'mate' | 'stalemate' | 'material', winner: Side | 'draw', isPvp: boolean): string {
  if (kind === 'mate') return isPvp ? (winner === 'w' ? 'Шах и мат. Победили белые.' : 'Шах и мат. Победили чёрные.') : (winner === 'w' ? 'Шах и мат. Ты победил.' : 'Шах и мат. Победил компьютер.')
  if (kind === 'stalemate') return 'Пат. Ничья.'
  return isPvp ? 'Ничья: фигур слишком мало, чтобы поставить мат.' : 'Ничья: фигур слишком мало, чтобы поставить мат.'
}

function ChessBoard({
  game,
  selected,
  last,
  targets,
  onSquare,
}: {
  game: Game
  selected: number | null
  last: { from: number; to: number } | null
  targets: Move[]
  onSquare: (index: number) => void
}) {
  const targetSet = new Set(targets.map((move) => move.to))
  const captureSet = new Set(targets.filter((move) => move.capture).map((move) => move.to))
  const nodes: ReactNode[] = []
  for (let rank = 7; rank >= 0; rank -= 1) {
    nodes.push(
      <div key={`r${rank}`} className="chess-label">
        {rank + 1}
      </div>,
    )
    for (let file = 0; file < 8; file += 1) {
      const index = rank * 8 + file
      const piece = game.board[index]
      const dark = (file + rank) % 2 === 0
      const checked = piece?.kind === 'k' && piece.side === game.side && inCheck(game)
      nodes.push(
        <button
          key={index}
          type="button"
          className={cx(
            'chess-sq',
            dark ? 'dark' : 'light',
            selected === index && 'sel',
            (last?.from === index || last?.to === index) && 'last',
            checked && 'check',
          )}
          aria-label={piece ? `${PIECE[piece.kind]} ${piece.side === 'w' ? 'белых' : 'чёрных'}, ${squareName(index)}` : squareName(index)}
          onClick={() => onSquare(index)}
        >
          {piece && <PieceIcon side={piece.side} kind={piece.kind} />}
          {targetSet.has(index) && <i className={captureSet.has(index) ? 'chess-capture' : 'chess-dot'} />}
        </button>,
      )
    }
  }
  nodes.push(<div key="corner" className="chess-label" />)
  for (let file = 0; file < 8; file += 1) {
    nodes.push(
      <div key={`f${file}`} className="chess-label">
        {'abcdefgh'[file]}
      </div>,
    )
  }
  return <div className="chess-board">{nodes}</div>
}

function PieceIcon({ side, kind }: { side: Side; kind: Kind }) {
  const fill = side === 'w' ? '#fffaf3' : '#2c3148'
  const ink = side === 'w' ? '#6a4632' : '#10141c'
  const shape = { fill, stroke: ink, strokeWidth: 1.7, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 40 40" className="chess-icon" aria-hidden="true">
      {kind === 'p' && (
        <>
          <circle cx="20" cy="13" r="5" {...shape} />
          <path d="M13.5 33h13L24 22a6.5 6.5 0 0 0-8 0Z" {...shape} />
        </>
      )}
      {kind === 'r' && <path d="M10 13h4.5V9H10Zm7.2 0h5.2V9h-5.2Zm7.3 0H30V9h-5.5ZM10 15h20v4H10Zm0 5h20v12H10Z" {...shape} />}
      {kind === 'n' && <path d="M11 33h17l-2-7 5-4-3-6 4-5-6 2-2-4-4 5c-5 1-8 6-8 11 0 2-1 5-1 8Z" {...shape} />}
      {kind === 'b' && (
        <>
          <circle cx="20" cy="8.5" r="2.5" {...shape} />
          <path d="M20 12c5 2.2 8 7 8 12.2 0 2.2-1.6 3.6-3.6 4.4L26 33H14l1.6-4.4C13.6 27.8 12 26.4 12 24.2 12 19 15 14.2 20 12Z" {...shape} />
          <path d="M20 16.5v7" stroke={ink} strokeWidth="1.7" />
        </>
      )}
      {kind === 'q' && (
        <>
          <circle cx="9" cy="14" r="2.2" {...shape} />
          <circle cx="16" cy="10" r="2.2" {...shape} />
          <circle cx="24" cy="10" r="2.2" {...shape} />
          <circle cx="31" cy="14" r="2.2" {...shape} />
          <path d="M8 17 13 33h14l5-16-6 5-4-6-4 6Z" {...shape} />
        </>
      )}
      {kind === 'k' && (
        <>
          <path d="M18 3h4v4h4v4h-4v4h-4v-4h-4V7h4Z" {...shape} />
          <path d="M12 33h16l-2.2-9.2c3.2-1.8 5.2-4.6 5.2-8 0-1.2-3.4.6-6.2.6S17 14.4 14.8 15.8c-2.6 0-6.4-1.6-6.4-.8 0 3.4 2 6.2 5.2 8Z" {...shape} />
        </>
      )}
    </svg>
  )
}

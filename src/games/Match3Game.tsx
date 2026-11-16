import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { playBad, playNote } from '../sound'
import { cx, plural } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell } from '../ui'
import {
  BALL_HEX,
  BALL_NAME,
  adjacent,
  createBoard,
  keyOf,
  makeIds,
  resolveBomb,
  resolveSwap,
  setupFor,
  starsForMoves,
  type MoveResult,
  type Piece,
  type Pos,
} from './match3'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function BombFace() {
  return (
    <svg className="match-bomb" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="36" r="18" fill="#2A2340" />
      <path d="M32 20 C35 14 42 13 45 8" fill="none" stroke="#FF8A1E" strokeWidth="4" strokeLinecap="round" />
      <circle cx="46" cy="8" r="3.2" fill="#FFD000" />
      <circle cx="26" cy="34" r="2.3" fill="white" />
      <circle cx="38" cy="34" r="2.3" fill="white" />
      <path d="M27 42 Q32 47 37 42" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function boom() {
  playNote(156, 0.16)
  playNote(96, 0.2)
}

export function Match3Game({ age, onExit, onReplay, next }: GameProps) {
  const setup = setupFor(age)
  const ids = useRef(makeIds())
  const [grid, setGrid] = useState(() => createBoard(setup, Math.random, ids.current))
  const [selected, setSelected] = useState<Pos | null>(null)
  const [pop, setPop] = useState<Set<string>>(new Set())
  const [shake, setShake] = useState<Set<string>>(new Set())
  const [cleared, setCleared] = useState(0)
  const [moves, setMoves] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const known = useRef(new Set<number>())
  const busy = useRef(false)
  const alive = useRef(true)
  const clearedRef = useRef(0)
  const movesRef = useRef(0)
  const gridRef = useRef(grid)
  const drag = useRef<{ pos: Pos; x: number; y: number } | null>(null)
  const swiped = useRef(false)

  gridRef.current = grid

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    const nextIds = new Set<number>()
    grid.forEach((row) => row.forEach((piece) => piece && nextIds.add(piece.id)))
    known.current = nextIds
  }, [grid])

  async function play(result: MoveResult, shakeKeys: string[]) {
    if (!alive.current) return
    if (!result.ok) {
      setShake(new Set(shakeKeys))
      playBad()
      await wait(280)
      if (alive.current) setShake(new Set())
      return
    }
    let shown = gridRef.current
    let balls = clearedRef.current
    for (const wave of result.waves) {
      if (!alive.current) return
      setPop(new Set(wave.pops))
      const poppedBomb = wave.pops.some((key) => {
        const [r, c] = key.split(',').map(Number)
        return shown[r]?.[c]?.kind === 'bomb'
      })
      if (poppedBomb) boom()
      else playNote(523, 0.12)
      await wait(180)
      if (!alive.current) return
      shown = wave.grid
      gridRef.current = wave.grid
      setGrid(wave.grid)
      setPop(new Set())
      balls += wave.balls
      clearedRef.current = balls
      setCleared(Math.min(setup.goal, balls))
      await wait(140)
    }
    movesRef.current += 1
    setMoves(movesRef.current)
    if (balls >= setup.goal) {
      setStars(starsForMoves(movesRef.current, setup.goal))
      setDone(true)
    }
  }

  async function actSwap(a: Pos, b: Pos) {
    if (busy.current || done || !adjacent(a, b)) return
    busy.current = true
    setSelected(null)
    const current = gridRef.current
    const moved = current.map((row) => row.slice())
    const hold = moved[a.r][a.c]
    moved[a.r][a.c] = moved[b.r][b.c]
    moved[b.r][b.c] = hold
    gridRef.current = moved
    setGrid(moved)
    await wait(140)
    const result = resolveSwap(current, a, b, setup, Math.random, ids.current)
    if (!result.ok) {
      gridRef.current = current
      if (alive.current) setGrid(current)
    }
    try {
      await play(result, [keyOf(a), keyOf(b)])
    } finally {
      busy.current = false
    }
  }

  async function actBomb(pos: Pos) {
    if (busy.current || done) return
    busy.current = true
    setSelected(null)
    const result = resolveBomb(gridRef.current, pos, setup, Math.random, ids.current)
    try {
      await play(result, [keyOf(pos)])
    } finally {
      busy.current = false
    }
  }

  function choose(pos: Pos) {
    if (busy.current || done) return
    const piece = gridRef.current[pos.r][pos.c]
    if (piece?.kind === 'bomb') {
      void actBomb(pos)
      return
    }
    if (!selected) {
      setSelected(pos)
      return
    }
    if (selected.r === pos.r && selected.c === pos.c) {
      setSelected(null)
      return
    }
    if (adjacent(selected, pos)) {
      void actSwap(selected, pos)
      return
    }
    setSelected(pos)
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, pos: Pos) {
    drag.current = { pos, x: event.clientX, y: event.clientY }
    swiped.current = false
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const origin = drag.current
    drag.current = null
    if (!origin) return
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    if (Math.hypot(dx, dy) < 28) return
    swiped.current = true
    const next = Math.abs(dx) > Math.abs(dy)
      ? { r: origin.pos.r, c: origin.pos.c + (dx > 0 ? 1 : -1) }
      : { r: origin.pos.r + (dy > 0 ? 1 : -1), c: origin.pos.c }
    if (next.r < 0 || next.c < 0 || next.r >= setup.rows || next.c >= setup.cols) return
    void actSwap(origin.pos, next)
  }

  const goal = setup.goal
  const shown = Math.min(cleared, goal)

  return (
    <Shell
      title="Три в ряд"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={<span className="meta">Шарики: {shown} из {goal}</span>}
    >
      {done ? (
        <Finish
          age={age}
          gameId="match3"
          stars={stars}
          detail={`Потрачено ${moves} ${plural(moves, 'ход', 'хода', 'ходов')}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <div className="match-progress" aria-hidden="true">
            <span style={{ width: `${(shown / goal) * 100}%` }} />
          </div>
          <div
            className="match-board"
            style={{ gridTemplateColumns: `repeat(${setup.cols}, 1fr)` }}
          >
            {grid.map((row, r) =>
              row.map((piece, c) => {
                const pos = { r, c }
                const key = keyOf(pos)
                const pressed = selected?.r === r && selected?.c === c
                return (
                  <button
                    key={piece?.id ?? key}
                    type="button"
                    className={cx('match-cell', pressed && 'selected', pop.has(key) && 'popping', shake.has(key) && 'shake')}
                    data-kind={piece?.kind ?? 'empty'}
                    data-color={piece?.kind === 'ball' ? piece.color : piece?.kind ?? 'empty'}
                    data-r={r}
                    data-c={c}
                    aria-label={piece?.kind === 'bomb' ? 'бомба' : piece?.kind === 'ball' ? `${BALL_NAME[piece.color]} шарик` : 'пусто'}
                    aria-pressed={pressed}
                    onPointerDown={(event) => onPointerDown(event, pos)}
                    onPointerUp={onPointerUp}
                    onClick={() => {
                      if (swiped.current) {
                        swiped.current = false
                        return
                      }
                      choose(pos)
                    }}
                  >
                    {piece ? <Face piece={piece} fresh={!known.current.has(piece.id)} /> : null}
                  </button>
                )
              }),
            )}
          </div>
          <p className="hint">Поменяй соседние шарики. Бомба лопает всё на два шарика вокруг.</p>
        </>
      )}
    </Shell>
  )
}

function Face({ piece, fresh }: { piece: Piece; fresh: boolean }) {
  if (piece.kind === 'bomb') return <span className={cx('match-face', fresh && 'fresh')}><BombFace /></span>
  return <span className={cx('match-face ball', fresh && 'fresh')} style={{ background: BALL_HEX[piece.color] }} />
}

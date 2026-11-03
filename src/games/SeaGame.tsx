import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from 'react'
import { playBad, playGood, playTap } from '../sound'
import { cx } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'
import {
  LETTERS,
  allSunk,
  applyShot,
  canPlace,
  chooseShot,
  dockShip,
  freshSea,
  makeFleet,
  placeShip,
  randomFleet,
  rotateShip,
  shipAt,
  sunkCount,
  type Dir,
  type Sea,
  type Ship,
} from './sea'

const SEG = 28
const GAP = 2
const PAD = 4

type Turn = 'player' | 'cpu' | 'hold'
type Preview = { cells: Array<{ r: number; c: number }>; ok: boolean }
type Drag = {
  id: string
  pointerId: number
  dir: Dir
  grab: number
  len: number
  moved: boolean
  x: number
  y: number
  x0: number
  y0: number
}
type Flash = { side: 'player' | 'enemy'; r: number; c: number }

function ghostPos(dir: Dir, grab: number, clientX: number, clientY: number) {
  const along = PAD + grab * (SEG + GAP) + SEG / 2
  const cross = PAD + SEG / 2
  return {
    x: clientX - (dir === 'h' ? along : cross),
    y: clientY - (dir === 'v' ? along : cross),
  }
}

function covered(row: number, col: number, dir: Dir, len: number): Array<{ r: number; c: number }> {
  const cells: Array<{ r: number; c: number }> = []
  for (let index = 0; index < len; index += 1) {
    const r = dir === 'h' ? row : row + index
    const c = dir === 'h' ? col + index : col
    if (r >= 0 && r < 10 && c >= 0 && c < 10) cells.push({ r, c })
  }
  return cells
}

function samePreview(a: Preview | null, b: Preview | null): boolean {
  if (a === b) return true
  if (!a || !b || a.ok !== b.ok || a.cells.length !== b.cells.length) return false
  return a.cells.every((cell, index) => cell.r === b.cells[index].r && cell.c === b.cells[index].c)
}

function afloat(sea: Sea): number {
  return sea.ships.length - sunkCount(sea)
}

export function SeaGame({ age, onExit, onReplay, next }: GameProps) {
  const [ships, setShips] = useState<Ship[]>(() => makeFleet('you'))
  const [phase, setPhase] = useState<'place' | 'fight'>('place')
  const [player, setPlayer] = useState<Sea | null>(null)
  const [enemy, setEnemy] = useState<Sea | null>(null)
  const [turn, setTurn] = useState<Turn>('player')
  const [note, setNote] = useState('')
  const [hint, setHint] = useState('')
  const [winner, setWinner] = useState<'player' | 'cpu' | null>(null)
  const [volley, setVolley] = useState(0)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragMoved, setDragMoved] = useState(false)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<Flash | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const shipsRef = useRef(ships)
  const playerRef = useRef(player)
  const turnRef = useRef(turn)
  const hintTimer = useRef(0)
  const endTimer = useRef(0)
  const shakeTimer = useRef(0)
  shipsRef.current = ships
  playerRef.current = player
  turnRef.current = turn

  const placed = ships.filter((ship) => ship.row != null).length
  const ready = placed === ships.length
  const spoken = winner ? '' : phase === 'place' ? 'Расставь корабли на своём поле' : 'Стреляй по клеткам компьютера'
  useSpeak(spoken)

  const endDragRef = useRef<(x: number, y: number) => void>(() => {})

  function showHint(text: string) {
    setHint(text)
    window.clearTimeout(hintTimer.current)
    if (text) hintTimer.current = window.setTimeout(() => setHint(''), 1700)
  }

  function reject(text: string) {
    playBad()
    showHint(text)
    setShake(true)
    window.clearTimeout(shakeTimer.current)
    shakeTimer.current = window.setTimeout(() => setShake(false), 480)
  }

  function closeAs(result: 'player' | 'cpu') {
    setTurn('hold')
    setNote(result === 'player' ? 'Все корабли компьютера потоплены' : 'Все твои корабли потоплены')
    window.clearTimeout(endTimer.current)
    endTimer.current = window.setTimeout(() => setWinner(result), 900)
  }

  function cellUnder(x: number, y: number): { r: number; c: number } | null {
    const board = boardRef.current
    if (!board) return null
    const boardRect = board.getBoundingClientRect()
    if (x < boardRect.left || y < boardRect.top || x > boardRect.right || y > boardRect.bottom) return null
    const origin = board.querySelector<HTMLElement>('[data-r="0"][data-c="0"]')
    const across = board.querySelector<HTMLElement>('[data-r="0"][data-c="1"]')
    const down = board.querySelector<HTMLElement>('[data-r="1"][data-c="0"]')
    if (!origin || !across || !down) return null
    const rect = origin.getBoundingClientRect()
    const stepX = across.getBoundingClientRect().left - rect.left
    const stepY = down.getBoundingClientRect().top - rect.top
    if (stepX <= 0 || stepY <= 0) return null
    const c = Math.round((x - (rect.left + rect.width / 2)) / stepX)
    const r = Math.round((y - (rect.top + rect.height / 2)) / stepY)
    if (r < 0 || c < 0 || r > 9 || c > 9) return null
    return { r, c }
  }

  function originAt(x: number, y: number, drag: Drag): { row: number; col: number } | null {
    const cell = cellUnder(x, y)
    if (!cell) return null
    return {
      row: drag.dir === 'v' ? cell.r - drag.grab : cell.r,
      col: drag.dir === 'h' ? cell.c - drag.grab : cell.c,
    }
  }

  function previewAt(x: number, y: number, drag: Drag): Preview | null {
    const origin = originAt(x, y, drag)
    if (!origin) return null
    const cells = covered(origin.row, origin.col, drag.dir, drag.len)
    const inside = cells.length === drag.len
    const ok = inside && canPlace(shipsRef.current, drag.id, origin.row, origin.col, drag.dir, drag.len)
    return { cells, ok }
  }

  endDragRef.current = (x, y) => {
    const drag = dragRef.current
    dragRef.current = null
    setDragId(null)
    setDragMoved(false)
    setPreview(null)
    if (!drag) return
    const current = shipsRef.current
    const ship = current.find((item) => item.id === drag.id)
    if (!ship) return
    if (!drag.moved) {
      const turned = rotateShip(current, ship.id, drag.grab)
      if (!turned) {
        reject('Так корабль не поворачивается')
        return
      }
      playTap()
      setShips(turned)
      setHint('')
      return
    }
    const origin = originAt(x, y, drag)
    if (!origin) {
      if (ship.row != null) {
        playTap()
        setShips(dockShip(current, ship.id))
        setHint('')
      }
      return
    }
    const next = placeShip(current, ship.id, origin.row, origin.col, drag.dir)
    if (!next) {
      reject('Корабли не касаются друг друга и не выходят за поле')
      return
    }
    playTap()
    setHint('')
    setShips(next)
  }

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const pos = ghostPos(drag.dir, drag.grab, event.clientX, event.clientY)
      drag.x = pos.x
      drag.y = pos.y
      if (ghostRef.current) ghostRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      const distance = Math.hypot(event.clientX - drag.x0, event.clientY - drag.y0)
      if (!drag.moved && distance > 8) {
        drag.moved = true
        setDragMoved(true)
      }
      if (!drag.moved) return
      const next = previewAt(event.clientX, event.clientY, drag)
      setPreview((current) => (samePreview(current, next) ? current : next))
    }
    const up = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      endDragRef.current(event.clientX, event.clientY)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.clearTimeout(hintTimer.current)
      window.clearTimeout(endTimer.current)
      window.clearTimeout(shakeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'fight' || turn !== 'cpu' || winner) return
    const id = window.setTimeout(() => {
      const current = playerRef.current
      if (!current || turnRef.current !== 'cpu') return
      const shot = chooseShot(current)
      if (!shot) {
        setTurn('player')
        return
      }
      const applied = applyShot(current, shot.r, shot.c)
      if (!applied) {
        setTurn('player')
        return
      }
      setPlayer(applied.sea)
      setFlash({ side: 'player', r: shot.r, c: shot.c })
      if (allSunk(applied.sea)) {
        playBad()
        closeAs('cpu')
        return
      }
      if (applied.result === 'miss') {
        playGood()
        setNote('Компьютер промахнулся. Твой ход')
        setTurn('player')
        return
      }
      playBad()
      setNote(applied.result === 'sunk' ? 'Твой корабль потоплен. Компьютер стреляет ещё' : 'Компьютер попал и стреляет ещё')
      setVolley((value) => value + 1)
    }, 700)
    return () => window.clearTimeout(id)
  }, [phase, turn, winner, volley])

  function beginDrag(event: ReactPointerEvent<HTMLElement>, ship: Ship, grab: number) {
    if (phase !== 'place') return
    if (dragRef.current) {
      dragRef.current = null
      setDragId(null)
      setDragMoved(false)
      setPreview(null)
    }
    const pos = ghostPos(ship.dir, grab, event.clientX, event.clientY)
    dragRef.current = {
      id: ship.id,
      pointerId: event.pointerId,
      dir: ship.dir,
      grab,
      len: ship.len,
      moved: false,
      x: pos.x,
      y: pos.y,
      x0: event.clientX,
      y0: event.clientY,
    }
    setDragId(ship.id)
    setDragMoved(false)
  }

  function shoot(r: number, c: number) {
    if (turn !== 'player' || !enemy) return
    const applied = applyShot(enemy, r, c)
    if (!applied) return
    setEnemy(applied.sea)
    setFlash({ side: 'enemy', r, c })
    if (applied.result === 'miss') playBad()
    else playGood()
    if (allSunk(applied.sea)) {
      setNote(applied.result === 'sunk' ? 'Корабль потоплен!' : 'Попадание!')
      closeAs('player')
      return
    }
    if (applied.result === 'miss') {
      setNote('Мимо. Ходит компьютер')
      setTurn('cpu')
      return
    }
    setNote(applied.result === 'sunk' ? 'Корабль потоплен! Стреляй ещё' : 'Попадание! Стреляй ещё')
  }

  function startFight() {
    if (!ready) return
    setPlayer(freshSea(ships))
    setEnemy(freshSea(randomFleet('cpu')))
    setPhase('fight')
    setTurn('player')
    setNote('')
    setHint('')
    setFlash(null)
  }

  const prompt =
    phase === 'place' ? 'Расставь корабли' : turn === 'cpu' ? 'Компьютер стреляет…' : note || 'Твой выстрел'
  const drag = dragId ? ships.find((ship) => ship.id === dragId) ?? null : null
  const stars: StarScore = winner === 'player' ? 3 : 1

  return (
    <Shell
      title="Морской бой"
      onExit={onExit}
      onRestart={winner ? undefined : onReplay}
      meta={
        <span className="meta">
          {phase === 'place' ? `На поле ${placed} из ${ships.length}` : enemy ? `Потоплено ${sunkCount(enemy)} из ${enemy.ships.length}` : ''}
        </span>
      }
    >
      {winner && player && enemy ? (
        <Finish
          age={age}
          gameId="ships"
          stars={stars}
          detail={`Ты потопил ${sunkCount(enemy)} из ${enemy.ships.length}. Компьютер потопил ${sunkCount(player)} из ${player.ships.length}.`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <div className="sea">
          <p className="prompt sea-prompt" aria-live="polite">
            {prompt}
          </p>
          <p className="hint">
            {phase === 'place'
              ? hint || 'Перетащи корабль на поле. Нажми на него, чтобы повернуть.'
              : 'Попадание даёт ещё выстрел. Вокруг потопленного корабля клетки закрашиваются сами.'}
          </p>
          {phase === 'place' ? (
            <>
              <p className="sea-caption">Твоё поле</p>
              <SeaBoard
                boardRef={boardRef}
                ships={ships}
                shots={null}
                preview={preview}
                hiddenId={dragMoved ? dragId : null}
                mode="place"
                flash={null}
                shake={shake}
                onGrab={beginDrag}
              />
              <div className="sea-dock">
                {ships
                  .filter((ship) => ship.row == null)
                  .map((ship) => (
                    <ShipToken
                      key={ship.id}
                      ship={ship}
                      dragging={dragId === ship.id}
                      onPointerDown={(event) => {
                        const target = event.currentTarget.getBoundingClientRect()
                        const local = ship.dir === 'h' ? event.clientX - target.left : event.clientY - target.top
                        const grab = Math.max(0, Math.min(ship.len - 1, Math.floor((local - PAD) / (SEG + GAP))))
                        beginDrag(event, ship, grab)
                      }}
                    />
                  ))}
              </div>
              <div className="sea-actions">
                <button type="button" className="btn primary" disabled={!ready} onClick={startFight}>
                  В бой
                </button>
              </div>
            </>
          ) : (
            player &&
            enemy && (
              <>
                <p className="sea-caption">Поле компьютера · осталось {afloat(enemy)}</p>
                <SeaBoard
                  ships={null}
                  shots={enemy.shots}
                  preview={null}
                  hiddenId={null}
                  mode="aim"
                  flash={flash?.side === 'enemy' ? flash : null}
                  shake={false}
                  onShoot={turn === 'player' ? shoot : undefined}
                />
                <p className="sea-caption">Твои корабли · осталось {afloat(player)}</p>
                <SeaBoard
                  ships={player.ships}
                  shots={player.shots}
                  preview={null}
                  hiddenId={null}
                  mode="own"
                  compact
                  flash={flash?.side === 'player' ? flash : null}
                  shake={false}
                />
              </>
            )
          )}
          {drag && dragMoved && dragRef.current && (
            <div
              ref={ghostRef}
              className={cx('sea-ghost', 'sea-token', drag.dir)}
              style={{ transform: `translate(${dragRef.current.x}px, ${dragRef.current.y}px)` }}
            >
              {Array.from({ length: drag.len }, (_, index) => (
                <i key={index} className={index === 0 ? 'bow' : undefined} />
              ))}
            </div>
          )}
        </div>
      )}
    </Shell>
  )
}

function ShipToken({
  ship,
  dragging,
  onPointerDown,
}: {
  ship: Ship
  dragging: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
}) {
  const name = ship.len === 1 ? 'Корабль из 1 клетки' : `Корабль из ${ship.len} клеток`
  return (
    <button
      type="button"
      className={cx('sea-token', ship.dir, dragging && 'dragging')}
      aria-label={name}
      onPointerDown={onPointerDown}
    >
      {Array.from({ length: ship.len }, (_, index) => (
        <i key={index} className={index === 0 ? 'bow' : undefined} />
      ))}
    </button>
  )
}

function SeaBoard({
  ships,
  shots,
  preview,
  hiddenId,
  mode,
  flash,
  shake,
  compact,
  onGrab,
  onShoot,
  boardRef,
}: {
  ships: Ship[] | null
  shots: Sea['shots'] | null
  preview: Preview | null
  hiddenId: string | null
  mode: 'place' | 'own' | 'aim'
  flash: { r: number; c: number } | null
  shake: boolean
  compact?: boolean
  onGrab?: (event: ReactPointerEvent<HTMLButtonElement>, ship: Ship, index: number) => void
  onShoot?: (r: number, c: number) => void
  boardRef?: Ref<HTMLDivElement>
}) {
  const previewKey = new Set(preview?.cells.map((cell) => `${cell.r},${cell.c}`) ?? [])
  const nodes: ReactNode[] = [
    <div key="corner" className="sea-label" />,
    ...Array.from({ length: 10 }, (_, col) => (
      <div key={`n${col}`} className="sea-label">
        {col + 1}
      </div>
    )),
  ]
  for (let r = 0; r < 10; r += 1) {
    nodes.push(
      <div key={`l${r}`} className="sea-label">
        {LETTERS[r]}
      </div>,
    )
    for (let c = 0; c < 10; c += 1) {
      const found = ships ? shipAt(ships, r, c) : null
      const hidden = Boolean(found && found.ship.id === hiddenId)
      const mark = shots?.[r]?.[c] ?? null
      const aimed = previewKey.has(`${r},${c}`)
      const showShip = Boolean(found && !hidden && mark !== 'hit' && mark !== 'sunk')
      const label = `${LETTERS[r]}${c + 1}`
      const className = cx(
        'sea-cell',
        showShip && 'ship',
        showShip && found?.ship.dir === 'v' && 'v',
        aimed && (preview?.ok ? 'preview-ok' : 'preview-bad'),
        mark === 'miss' && 'miss',
        mark === 'hit' && 'hit',
        mark === 'sunk' && 'sunk',
        mark === 'block' && 'block',
        mode === 'aim' && !mark && 'aim',
        flash?.r === r && flash.c === c && 'flash',
      )
      const body = (
        <>
          {showShip && found?.index === 0 && <i className="sea-bow" />}
          {mark === 'miss' && <i className="sea-dot" />}
          {(mark === 'hit' || mark === 'sunk') && <span className="sea-cross">✕</span>}
        </>
      )
      if (mode === 'place' && found && !hidden && onGrab) {
        nodes.push(
          <button
            key={`${r}-${c}`}
            type="button"
            data-r={r}
            data-c={c}
            className={className}
            aria-label={`${label}, корабль`}
            onPointerDown={(event) => onGrab(event, found.ship, found.index)}
          >
            {body}
          </button>,
        )
      } else if (mode === 'aim' && !mark && onShoot) {
        nodes.push(
          <button
            key={`${r}-${c}`}
            type="button"
            data-r={r}
            data-c={c}
            className={className}
            aria-label={`${label}, выстрел`}
            onClick={() => onShoot(r, c)}
          >
            {body}
          </button>,
        )
      } else {
        nodes.push(
          <div key={`${r}-${c}`} data-r={r} data-c={c} className={className}>
            {body}
          </div>,
        )
      }
    }
  }
  return (
    <div ref={boardRef} className={cx('sea-board', compact && 'compact', shake && 'shake')}>
      {nodes}
    </div>
  )
}

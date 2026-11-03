import { useLayoutEffect, useRef, useState } from 'react'
import { randInt, shuffle } from '../random'
import { playBad, playGood } from '../sound'
import { cx, starsFrom } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'

type ColorId = 'yellow' | 'blue' | 'coral'
type Kind = 'duck' | 'frog' | 'fish' | 'chick' | 'turtle' | 'bunny'
type Piece = { id: string; color: ColorId; kind: Kind }

const COLORS: ColorId[] = ['yellow', 'blue', 'coral']
const OTHERS: Kind[] = ['frog', 'fish', 'chick', 'turtle', 'bunny']
const LEVELS = 5

const LOOK: Record<ColorId, { name: string; fill: string; water: string }> = {
  yellow: { name: 'жёлтого цвета', fill: '#ffd24a', water: '#ffe89a' },
  blue: { name: 'синего цвета', fill: '#4aa8ef', water: '#b7e2fb' },
  coral: { name: 'красного цвета', fill: '#ff6b4a', water: '#ffc3b6' },
}

const ACCUSATIVE: Record<Kind, string> = {
  duck: 'уточку',
  frog: 'лягушку',
  fish: 'рыбку',
  chick: 'цыплёнка',
  turtle: 'черепашку',
  bunny: 'зайчика',
}

const LABEL: Record<Kind, string> = {
  duck: 'Уточка',
  frog: 'Лягушка',
  fish: 'Рыбка',
  chick: 'Цыплёнок',
  turtle: 'Черепашка',
  bunny: 'Зайчик',
}

function makePlan(): Kind[] {
  return ['duck', ...shuffle(OTHERS).slice(0, LEVELS - 1)]
}

function makeRound(kind: Kind): { pieces: Piece[]; tubs: ColorId[] } {
  const pieces = shuffle(
    COLORS.flatMap((color) => [
      { id: `${kind}-${color}-a-${randInt(1, 9999)}`, color, kind },
      { id: `${kind}-${color}-b-${randInt(1, 9999)}`, color, kind },
    ]),
  )
  return { pieces, tubs: shuffle(COLORS) }
}

function AnimalFace({ kind, fill }: { kind: Kind; fill: string }) {
  return (
    <svg className="sorter-face" viewBox="0 0 80 80" aria-hidden="true">
      {kind === 'duck' && (
        <>
          <ellipse cx="40" cy="54" rx="24" ry="16" fill={fill} />
          <circle cx="40" cy="32" r="14" fill={fill} />
          <ellipse cx="40" cy="37" rx="11" ry="5" fill="#f28c28" />
          <circle cx="34" cy="29" r="2.2" fill="#2a2340" />
          <circle cx="46" cy="29" r="2.2" fill="#2a2340" />
        </>
      )}
      {kind === 'frog' && (
        <>
          <ellipse cx="40" cy="52" rx="22" ry="16" fill={fill} />
          <circle cx="27" cy="34" r="9" fill={fill} />
          <circle cx="53" cy="34" r="9" fill={fill} />
          <circle cx="27" cy="34" r="4" fill="#fff" />
          <circle cx="53" cy="34" r="4" fill="#fff" />
          <circle cx="28" cy="35" r="2" fill="#2a2340" />
          <circle cx="54" cy="35" r="2" fill="#2a2340" />
        </>
      )}
      {kind === 'fish' && (
        <>
          <ellipse cx="34" cy="42" rx="20" ry="15" fill={fill} />
          <polygon points="72,42 50,26 50,58" fill={fill} />
          <circle cx="24" cy="38" r="2.4" fill="#2a2340" />
          <path d="M18 44 H42" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === 'chick' && (
        <>
          <circle cx="40" cy="46" r="20" fill={fill} />
          <polygon points="32,48 48,48 40,58" fill="#f28c28" />
          <circle cx="33" cy="42" r="2.2" fill="#2a2340" />
          <circle cx="47" cy="42" r="2.2" fill="#2a2340" />
        </>
      )}
      {kind === 'turtle' && (
        <>
          <circle cx="20" cy="48" r="9" fill={fill} />
          <ellipse cx="46" cy="48" rx="22" ry="16" fill={fill} />
          <ellipse cx="46" cy="48" rx="13" ry="9" fill="rgba(255,255,255,0.38)" />
          <circle cx="17" cy="46" r="1.8" fill="#2a2340" />
        </>
      )}
      {kind === 'bunny' && (
        <>
          <ellipse cx="30" cy="26" rx="6" ry="16" fill={fill} />
          <ellipse cx="50" cy="26" rx="6" ry="16" fill={fill} />
          <ellipse cx="30" cy="28" rx="3" ry="10" fill="#f4b7c4" />
          <ellipse cx="50" cy="28" rx="3" ry="10" fill="#f4b7c4" />
          <circle cx="40" cy="50" r="16" fill={fill} />
          <circle cx="34" cy="48" r="2" fill="#2a2340" />
          <circle cx="46" cy="48" r="2" fill="#2a2340" />
        </>
      )}
    </svg>
  )
}

type Drag = { id: string; dx: number; dy: number; w: number; h: number; x: number; y: number }

function tubUnder(x: number, y: number): ColorId | null {
  const nodes = document.querySelectorAll<HTMLElement>('[data-tub]')
  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    const pad = 28
    if (x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad) {
      return node.dataset.tub as ColorId
    }
  }
  return null
}

export function DuckGame({ age, onExit, onReplay, next }: GameProps) {
  const [plan] = useState(makePlan)
  const [level, setLevel] = useState(0)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [tubs, setTubs] = useState<ColorId[]>(COLORS)
  const [placed, setPlaced] = useState<string[]>([])
  const [wrong, setWrong] = useState<ColorId | null>(null)
  const [over, setOver] = useState<ColorId | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const missed = useRef(new Set<string>())
  const cleanRef = useRef(0)
  const totalRef = useRef(0)
  const lock = useRef(false)
  const kind = plan[level] ?? 'duck'
  const prompt = done ? '' : `Посади ${ACCUSATIVE[kind]} в тазик такого же цвета`
  useSpeak(prompt)

  useLayoutEffect(() => {
    const round = makeRound(plan[level] ?? 'duck')
    setPieces(round.pieces)
    setTubs(round.tubs)
    setPlaced([])
    setWrong(null)
    setOver(null)
    setDragId(null)
    dragRef.current = null
    lock.current = false
  }, [level, plan])

  function moveGhost(x: number, y: number) {
    const ghost = ghostRef.current
    if (ghost) ghost.style.transform = `translate(${x}px, ${y}px)`
  }

  function dropPiece(id: string, tub: ColorId | null) {
    const piece = pieces.find((item) => item.id === id)
    if (!piece || !tub || lock.current || placed.includes(id)) return
    if (piece.color !== tub) {
      missed.current.add(id)
      setWrong(tub)
      playBad()
      window.setTimeout(() => setWrong((current) => (current === tub ? null : current)), 480)
      return
    }
    playGood()
    if (!missed.current.has(id)) cleanRef.current += 1
    totalRef.current += 1
    const nextPlaced = [...placed, id]
    setPlaced(nextPlaced)
    if (nextPlaced.length < pieces.length) return
    lock.current = true
    if (level >= LEVELS - 1) {
      setStars(starsFrom(cleanRef.current, totalRef.current))
      window.setTimeout(() => setDone(true), 700)
      return
    }
    window.setTimeout(() => setLevel((value) => value + 1), 700)
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (event.pointerType === 'mouse' || lock.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = {
      id,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      w: rect.width,
      h: rect.height,
      x: rect.left,
      y: rect.top,
    }
    setDragId(id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag) return
    drag.x = event.clientX - drag.dx
    drag.y = event.clientY - drag.dy
    moveGhost(drag.x, drag.y)
    const nextOver = tubUnder(drag.x + drag.w / 2, drag.y + drag.h / 2)
    setOver((value) => (value === nextOver ? value : nextOver))
  }

  function onPointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    setDragId(null)
    setOver(null)
    if (!drag) return
    dropPiece(drag.id, tubUnder(drag.x + drag.w / 2, drag.y + drag.h / 2))
  }

  const dragging = pieces.find((item) => item.id === dragId)

  return (
    <Shell
      title="Уточки"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={<span className="meta">Уровень {level + 1} из {LEVELS}</span>}
    >
      {done ? (
        <Finish
          age={age}
          gameId="ducks"
          stars={stars}
          detail={`С первой попытки: ${cleanRef.current} из ${totalRef.current}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <p className="prompt" aria-live="polite">
            {prompt}
          </p>
          <div className="tubs">
            {tubs.map((color) => {
              const look = LOOK[color]
              const seated = pieces.filter((item) => placed.includes(item.id) && item.color === color)
              return (
                <div
                  key={color}
                  data-tub={color}
                  className={cx('tub', over === color && 'over', wrong === color && 'shake')}
                  aria-label={`Тазик ${look.name}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setOver(color)
                  }}
                  onDragLeave={() => setOver((value) => (value === color ? null : value))}
                  onDrop={(event) => {
                    event.preventDefault()
                    setOver(null)
                    dropPiece(event.dataTransfer.getData('text/plain'), color)
                  }}
                >
                  <span className="tub-water" style={{ background: look.water }} />
                  <div className="tub-seats">
                    {seated.map((item) => (
                      <span key={item.id} className="sorter-seat">
                        <AnimalFace kind={item.kind} fill={look.fill} />
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="sorter-tray">
            {pieces
              .filter((item) => !placed.includes(item.id))
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  className={cx('sorter-piece', dragId === item.id && 'dragging')}
                  data-piece={item.id}
                  aria-label={`${LABEL[item.kind]} ${LOOK[item.color].name}`}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', item.id)
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                  onPointerDown={(event) => onPointerDown(event, item.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <AnimalFace kind={item.kind} fill={LOOK[item.color].fill} />
                </button>
              ))}
          </div>
          {dragging && dragRef.current && (
            <div
              ref={ghostRef}
              className="sorter-ghost"
              style={{
                width: dragRef.current.w,
                height: dragRef.current.h,
                transform: `translate(${dragRef.current.x}px, ${dragRef.current.y}px)`,
              }}
            >
              <AnimalFace kind={dragging.kind} fill={LOOK[dragging.color].fill} />
            </div>
          )}
        </>
      )}
    </Shell>
  )
}

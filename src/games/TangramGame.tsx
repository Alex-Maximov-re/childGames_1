import { useRef, useState, type PointerEvent } from 'react'
import { playNote } from '../sound'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell } from '../ui'
import {
  TAN_COLOR,
  TAN_IDS,
  TAN_NAME,
  boundsOf,
  canSnap,
  pickFigure,
  place,
  type Figure,
  type Pose,
  type Pt,
  type TanId,
} from './tangram'

type Piece = Pose & { id: TanId; snapped: boolean }

function pointsOf(poly: readonly Pt[]): string {
  return poly.map((point) => `${point.x},${point.y}`).join(' ')
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swap]
    copy[swap] = current
  }
  return copy
}

function scatter(figure: Figure): Piece[] {
  const box = boundsOf(TAN_IDS.map((id) => figure.polys[id]))
  const slots = [
    { x: box.minX + 0.35, y: box.maxY + 1.85 },
    { x: box.minX + 1.85, y: box.maxY + 1.85 },
    { x: box.minX + 3.35, y: box.maxY + 1.85 },
    { x: box.minX + 4.85, y: box.maxY + 1.85 },
    { x: box.minX + 0.9, y: box.maxY + 3.45 },
    { x: box.minX + 2.55, y: box.maxY + 3.45 },
    { x: box.minX + 4.2, y: box.maxY + 3.45 },
  ]
  return shuffle(TAN_IDS).map((id, index) => ({
    id,
    x: slots[index].x,
    y: slots[index].y,
    rot: Math.floor(Math.random() * 8) * 45,
    flip: id === 'para' && Math.random() < 0.5,
    snapped: false,
  }))
}

function starsFor(misses: number): StarScore {
  if (misses <= 8) return 3
  if (misses <= 18) return 2
  return 1
}

export function TangramGame({ age, onExit, onReplay, next }: GameProps) {
  const [figure] = useState(pickFigure)
  const [pieces, setPieces] = useState(() => scatter(figure))
  const [selected, setSelected] = useState<TanId | null>(null)
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const svgRef = useRef<SVGSVGElement>(null)
  const piecesRef = useRef(pieces)
  const missesRef = useRef(0)
  const drag = useRef<{ id: TanId; dx: number; dy: number; x: number; y: number; moved: boolean } | null>(null)

  piecesRef.current = pieces

  const box = boundsOf(TAN_IDS.map((id) => figure.polys[id]))
  const viewX = Math.min(box.minX, box.minX) - 0.55
  const viewY = box.minY - 0.45
  const viewRight = Math.max(box.maxX, box.minX + 5.7)
  const viewBottom = box.maxY + 5.15
  const view = `${viewX} ${viewY} ${viewRight - viewX} ${viewBottom - viewY}`
  const preview = `${box.minX - 0.15} ${box.minY - 0.15} ${box.maxX - box.minX + 0.3} ${box.maxY - box.minY + 0.3}`

  function toSvg(event: PointerEvent<SVGPolygonElement>): Pt {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const matrix = svg.getScreenCTM()
    if (!matrix) return { x: 0, y: 0 }
    const mapped = point.matrixTransform(matrix.inverse())
    return { x: mapped.x, y: mapped.y }
  }

  function commit(next: Piece[]) {
    piecesRef.current = next
    setPieces(next)
    if (next.every((piece) => piece.snapped)) {
      setStars(starsFor(missesRef.current))
      setDone(true)
    }
  }

  function onDown(event: PointerEvent<SVGPolygonElement>, id: TanId) {
    const piece = piecesRef.current.find((item) => item.id === id)
    if (!piece || piece.snapped || done) return
    const point = toSvg(event)
    drag.current = { id, dx: point.x - piece.x, dy: point.y - piece.y, x: point.x, y: point.y, moved: false }
    setSelected(id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onMove(event: PointerEvent<SVGPolygonElement>) {
    const current = drag.current
    if (!current) return
    const point = toSvg(event)
    if (Math.hypot(point.x - current.x, point.y - current.y) > 0.08) current.moved = true
    const x = point.x - current.dx
    const y = point.y - current.dy
    const next = piecesRef.current.map((piece) => (piece.id === current.id ? { ...piece, x, y } : piece))
    piecesRef.current = next
    setPieces(next)
  }

  function onUp() {
    const current = drag.current
    drag.current = null
    if (!current || !current.moved) return
    const piece = piecesRef.current.find((item) => item.id === current.id)
    if (!piece || piece.snapped) return
    const target = figure.poses[piece.id]
    if (canSnap(piece.id, piece, target)) {
      playNote(659, 0.09)
      commit(piecesRef.current.map((item) => (item.id === piece.id ? { ...item, x: target.x, y: target.y, snapped: true } : item)))
      return
    }
    missesRef.current += 1
    setMisses(missesRef.current)
  }

  function turn(kind: 'rot' | 'flip') {
    if (!selected || done) return
    const piece = piecesRef.current.find((item) => item.id === selected)
    if (!piece || piece.snapped) return
    const pose = kind === 'rot' ? { ...piece, rot: (piece.rot + 45) % 360 } : { ...piece, flip: !piece.flip }
    const target = figure.poses[piece.id]
    const snapped = canSnap(piece.id, pose, target)
    if (snapped) playNote(659, 0.09)
    commit(
      piecesRef.current.map((item) =>
        item.id === piece.id
          ? { ...pose, x: snapped ? target.x : pose.x, y: snapped ? target.y : pose.y, snapped }
          : item,
      ),
    )
  }

  const placed = pieces.filter((piece) => piece.snapped).length
  const ordered = [...pieces.filter((piece) => piece.snapped), ...pieces.filter((piece) => !piece.snapped)]
  const active = ordered.find((piece) => piece.id === selected)
  if (active && !active.snapped) {
    const index = ordered.findIndex((piece) => piece.id === selected)
    ordered.splice(index, 1)
    ordered.push(active)
  }

  return (
    <Shell
      title="Танграм"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={<span className="meta">Собрано {placed} из 7</span>}
    >
      {done ? (
        <Finish
          age={age}
          gameId="tangram"
          stars={stars}
          detail={misses === 0 ? 'Все кусочки встали на место' : `Лишних попыток: ${misses}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <div className="tan-head">
          <svg className="tan-preview" viewBox={preview} aria-label={`Образец: ${figure.name}`}>
            {TAN_IDS.map((id) => (
              <polygon key={id} points={pointsOf(figure.polys[id])} fill={TAN_COLOR[id]} stroke="white" strokeWidth={0.035} strokeLinejoin="round" />
            ))}
          </svg>
          <p className="prompt">{figure.name}</p>
          </div>
          <svg ref={svgRef} className="tan-board" viewBox={view}>
            {TAN_IDS.map((id) => (
              <polygon key={`ghost-${id}`} data-ghost={id} points={pointsOf(figure.polys[id])} fill="#eadfce" />
            ))}
            {ordered.map((piece) => {
              const ready = !piece.snapped && canSnap(piece.id, piece, figure.poses[piece.id])
              return (
                <polygon
                  key={piece.id}
                  points={pointsOf(place(piece.id, piece))}
                  fill={TAN_COLOR[piece.id]}
                  stroke={piece.snapped ? 'white' : ready ? '#167a45' : piece.id === selected ? '#2A2340' : 'white'}
                  strokeWidth={piece.id === selected || ready ? 0.07 : 0.04}
                  strokeLinejoin="round"
                  data-tan={piece.id}
                  aria-label={TAN_NAME[piece.id]}
                  onPointerDown={(event) => onDown(event, piece.id)}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                />
              )
            })}
          </svg>
          <div className="tan-actions">
            <button type="button" className="btn" onClick={() => turn('rot')} disabled={!selected}>
              Повернуть
            </button>
            <button type="button" className="btn" onClick={() => turn('flip')} disabled={!selected}>
              Отразить
            </button>
          </div>
          <p className="hint">Поверни кусочек и поднеси к месту. Если он рядом и смотрит правильно, то прилипнет.</p>
        </>
      )}
    </Shell>
  )
}

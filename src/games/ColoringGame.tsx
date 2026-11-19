import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { playNote } from '../sound'
import { cx } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'
import { PAINT_PICTURES } from './coloring-art'

const COLORS = [
  { id: 'red', hex: '#FF4D4F', freq: 262 },
  { id: 'orange', hex: '#FF8A1E', freq: 294 },
  { id: 'yellow', hex: '#FFD000', freq: 330 },
  { id: 'green', hex: '#22C55E', freq: 392 },
  { id: 'cyan', hex: '#38BDF8', freq: 440 },
  { id: 'blue', hex: '#2563EB', freq: 494 },
  { id: 'purple', hex: '#8B5CF6', freq: 523 },
  { id: 'pink', hex: '#F472B6', freq: 587 },
] as const

const COLOR_NAME: Record<(typeof COLORS)[number]['id'], string> = {
  red: 'красный',
  orange: 'оранжевый',
  yellow: 'жёлтый',
  green: 'зелёный',
  cyan: 'голубой',
  blue: 'синий',
  purple: 'фиолетовый',
  pink: 'розовый',
}

type PaintColor = (typeof COLORS)[number]

function rgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  }
}

function paintCanvas(canvas: HTMLCanvasElement, color: string) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function drawOutline(canvas: HTMLCanvasElement, paths: readonly string[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = canvas.width
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.scale(size / 200, size / 200)
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#2A2340'
  for (const d of paths) ctx.stroke(new Path2D(d))
  ctx.restore()
}

function wallMask(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const size = canvas.width
  const mask = new Uint8Array(size * size)
  if (!ctx) return mask
  const data = ctx.getImageData(0, 0, size, size).data
  for (let pixel = 0, index = 3; pixel < mask.length; pixel += 1, index += 4) {
    if (data[index] > 48) mask[pixel] = 1
  }
  return mask
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  walls: Uint8Array,
  startX: number,
  startY: number,
  color: { r: number; g: number; b: number },
) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const x = Math.floor(startX)
  const y = Math.floor(startY)
  if (x < 0 || y < 0 || x >= width || y >= height || walls[y * width + x]) return
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  const origin = (y * width + x) * 4
  const sr = data[origin]
  const sg = data[origin + 1]
  const sb = data[origin + 2]
  if (Math.abs(sr - color.r) < 6 && Math.abs(sg - color.g) < 6 && Math.abs(sb - color.b) < 6) return

  const matches = (px: number, py: number) => {
    if (px < 0 || py < 0 || px >= width || py >= height || walls[py * width + px]) return false
    const index = (py * width + px) * 4
    return Math.abs(data[index] - sr) < 36 && Math.abs(data[index + 1] - sg) < 36 && Math.abs(data[index + 2] - sb) < 36
  }

  const seen = new Uint8Array(width * height)
  const stack = [x, y]
  while (stack.length > 0) {
    const py = stack.pop() ?? 0
    const px = stack.pop() ?? 0
    if (!matches(px, py) || seen[py * width + px]) continue
    let left = px
    while (left > 0 && matches(left - 1, py) && !seen[py * width + left - 1]) left -= 1
    let right = px
    while (right + 1 < width && matches(right + 1, py) && !seen[py * width + right + 1]) right += 1
    for (let ix = left; ix <= right; ix += 1) {
      const cell = py * width + ix
      seen[cell] = 1
      const index = cell * 4
      data[index] = color.r
      data[index + 1] = color.g
      data[index + 2] = color.b
      data[index + 3] = 255
      if (py > 0 && matches(ix, py - 1) && !seen[cell - width]) stack.push(ix, py - 1)
      if (py + 1 < height && matches(ix, py + 1) && !seen[cell + width]) stack.push(ix, py + 1)
    }
  }
  ctx.putImageData(image, 0, 0)
}

function brush(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, radius: number) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = radius * 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x1, y1, radius, 0, Math.PI * 2)
  ctx.fill()
}

function coverage(ctx: CanvasRenderingContext2D): number {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height).data
  let colored = 0
  let total = 0
  for (let index = 0; index < data.length; index += 16) {
    total += 1
    if (data[index] < 248 || data[index + 1] < 248 || data[index + 2] < 248) colored += 1
  }
  return total === 0 ? 0 : colored / total
}

function starsFor(amount: number): StarScore {
  if (amount >= 0.05) return 3
  if (amount >= 0.012) return 2
  return 1
}

export function ColoringGame({ age, onExit, onReplay, next }: GameProps) {
  const [mode, setMode] = useState<'draw' | 'outline'>('outline')
  const [index, setIndex] = useState(0)
  const [color, setColor] = useState<PaintColor>(COLORS[2])
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const paintRef = useRef<HTMLCanvasElement>(null)
  const lineRef = useRef<HTMLCanvasElement>(null)
  const wallsRef = useRef<Uint8Array | null>(null)
  const colorRef = useRef(color)
  const modeRef = useRef(mode)
  const drawing = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const picture = PAINT_PICTURES[index] ?? PAINT_PICTURES[0]

  colorRef.current = color
  modeRef.current = mode
  useSpeak(done ? '' : mode === 'outline' ? picture.name : 'Рисуй пальчиком')

  useEffect(() => {
    const stage = stageRef.current
    const paint = paintRef.current
    const line = lineRef.current
    if (!stage || !paint || !line) return
    const fit = () => {
      const width = Math.max(1, Math.round(stage.clientWidth * Math.min(2, window.devicePixelRatio || 1)))
      const key = `${mode}:${picture.id}:${width}`
      if (paint.dataset.sheet === key) return
      paint.dataset.sheet = key
      paint.width = width
      paint.height = width
      line.width = width
      line.height = width
      paintCanvas(paint, '#ffffff')
      if (mode === 'outline') {
        drawOutline(line, picture.paths)
        wallsRef.current = wallMask(line)
      } else {
        line.getContext('2d')?.clearRect(0, 0, width, width)
        wallsRef.current = null
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [picture, mode])

  function resetSheet() {
    const paint = paintRef.current
    const line = lineRef.current
    if (!paint || !line) return
    paintCanvas(paint, '#ffffff')
    if (mode === 'outline') {
      drawOutline(line, picture.paths)
      wallsRef.current = wallMask(line)
    }
  }

  function pointOf(event: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const canvas = paintRef.current
    if (!canvas) return null
    const bounds = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    }
  }

  function onDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const point = pointOf(event)
    if (!point) return
    drawing.current = { ...point, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = drawing.current
    const point = pointOf(event)
    const canvas = paintRef.current
    if (!stroke || !point || !canvas) return
    if (Math.hypot(point.x - stroke.x, point.y - stroke.y) < 4) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    stroke.moved = true
    brush(ctx, stroke.x, stroke.y, point.x, point.y, colorRef.current.hex, Math.max(10, canvas.width * 0.035))
    stroke.x = point.x
    stroke.y = point.y
  }

  function onUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = drawing.current
    drawing.current = null
    if (!stroke || stroke.moved || modeRef.current !== 'outline') {
      if (stroke && !stroke.moved && modeRef.current === 'draw') {
        const canvas = paintRef.current
        const ctx = canvas?.getContext('2d', { willReadFrequently: true })
        if (canvas && ctx) brush(ctx, stroke.x, stroke.y, stroke.x, stroke.y, colorRef.current.hex, Math.max(10, canvas.width * 0.035))
      }
      return
    }
    const canvas = paintRef.current
    const walls = wallsRef.current
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !walls || !ctx) return
    const point = pointOf(event) ?? stroke
    floodFill(ctx, walls, point.x, point.y, rgb(colorRef.current.hex))
  }

  function finish() {
    const canvas = paintRef.current
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    setStars(ctx ? starsFor(coverage(ctx)) : 1)
    setDone(true)
  }

  return (
    <Shell title="Раскраска" onExit={onExit} onRestart={done ? undefined : onReplay}>
      {done ? (
        <Finish
          age={age}
          gameId="paint"
          stars={stars}
          detail={stars === 3 ? 'Лист стал цветным' : 'Можно закрасить ещё больше'}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <div className="paint-modes">
            <button type="button" className={cx('btn', mode === 'draw' && 'primary')} onClick={() => setMode('draw')}>
              Рисовать
            </button>
            <button type="button" className={cx('btn', mode === 'outline' && 'primary')} onClick={() => setMode('outline')}>
              Картинки
            </button>
          </div>
          {mode === 'outline' && (
            <div className="paint-pick">
              <button
                type="button"
                className="icon-btn"
                aria-label="Предыдущая картинка"
                onClick={() => setIndex((value) => (value + PAINT_PICTURES.length - 1) % PAINT_PICTURES.length)}
              >
                ←
              </button>
              <p className="prompt paint-name">{picture.name}</p>
              <button
                type="button"
                className="icon-btn"
                aria-label="Следующая картинка"
                onClick={() => setIndex((value) => (value + 1) % PAINT_PICTURES.length)}
              >
                →
              </button>
            </div>
          )}
          <div className="paint-colors">
            {COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cx('paint-color', color.id === item.id && 'on')}
                style={{ background: item.hex }}
                aria-label={COLOR_NAME[item.id]}
                aria-pressed={color.id === item.id}
                onClick={() => {
                  setColor(item)
                  playNote(item.freq, 0.12)
                }}
              />
            ))}
          </div>
          <div className="paint-stage" ref={stageRef}>
            <canvas ref={paintRef} className="paint-layer" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
            <canvas ref={lineRef} className={cx('paint-layer paint-lines', mode !== 'outline' && 'gone')} aria-hidden="true" />
          </div>
          <div className="paint-actions">
            <button type="button" className="btn" onClick={resetSheet}>
              Стереть
            </button>
            <button type="button" className="btn primary" onClick={finish}>
              Готово
            </button>
          </div>
          {mode === 'outline' && (
            <div className="paint-pics" aria-label="Контуры">
              {PAINT_PICTURES.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  className={cx('paint-pic', itemIndex === index && 'on')}
                  aria-label={item.name}
                  aria-current={itemIndex === index ? 'true' : undefined}
                  onClick={() => setIndex(itemIndex)}
                >
                  <svg viewBox="0 0 200 200" aria-hidden="true">
                    {item.paths.map((d, pathIndex) => (
                      <path key={pathIndex} d={d} fill="none" stroke="#2A2340" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                  </svg>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Shell>
  )
}

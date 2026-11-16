import { useEffect, useRef, useState } from 'react'
import { playBad } from '../sound'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'
import {
  HIT_DISTANCE,
  LANE_OFFSET,
  SEGMENT_LENGTH,
  SPEED,
  TRACK_SEGMENTS,
  buildTrack,
  finishIndex,
  starsForBumps,
  type Lane,
  type ObstacleKind,
  type TrackSegment,
} from './run'

const ROAD_WIDTH = 2000
const CAMERA_HEIGHT = 1000
const CAMERA_DEPTH = 0.84
const DRAW_DISTANCE = 72
const HORIZON = 0.34

const GRASS: Array<[number, number, number]> = [
  [111, 196, 112],
  [78, 168, 92],
]
const ROAD: Array<[number, number, number]> = [
  [108, 116, 132],
  [88, 96, 112],
]
const RUMBLE: Array<[number, number, number]> = [
  [244, 244, 244],
  [226, 78, 68],
]
const FOG: [number, number, number] = [186, 224, 255]

type Point = { x: number; y: number; w: number; scale: number }

type Slice = {
  index: number
  depth: number
  far: Point
  sprite: Point
  roadNear: Point
  segment: TrackSegment
}

type World = {
  position: number
  displayLane: number
  targetLane: number
  bumps: number
  stun: number
  flash: number
  resolved: Uint8Array
  finished: boolean
  last: number
  time: number
}

function fog(color: [number, number, number], depth: number): string {
  const mix = Math.max(0, Math.min(1, (depth - 6) / 48))
  const red = Math.round(color[0] + (FOG[0] - color[0]) * mix)
  const green = Math.round(color[1] + (FOG[1] - color[1]) * mix)
  const blue = Math.round(color[2] + (FOG[2] - color[2]) * mix)
  return `rgb(${red}, ${green}, ${blue})`
}

function project(
  worldX: number,
  worldZ: number,
  cameraX: number,
  cameraZ: number,
  width: number,
  height: number,
  horizon: number,
): Point | null {
  const depth = worldZ - cameraZ
  if (depth <= 12) return null
  const scale = CAMERA_DEPTH / depth
  return {
    x: width / 2 + scale * (worldX - cameraX) * width * 0.5,
    y: horizon + scale * CAMERA_HEIGHT * height * 0.5,
    w: scale * ROAD_WIDTH * width * 0.5,
    scale,
  }
}

function lerpPoint(from: Point, to: Point, t: number): Point {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    w: from.w + (to.w - from.w) * t,
    scale: from.scale + (to.scale - from.scale) * t,
  }
}

function fillTrap(
  ctx: CanvasRenderingContext2D,
  near: Point,
  far: Point,
  nearLeft: number,
  nearRight: number,
  farLeft: number,
  farRight: number,
): void {
  ctx.beginPath()
  ctx.moveTo(near.x + nearLeft, near.y)
  ctx.lineTo(near.x + nearRight, near.y)
  ctx.lineTo(far.x + farRight, far.y)
  ctx.lineTo(far.x + farLeft, far.y)
  ctx.closePath()
  ctx.fill()
}

function drawCone(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillStyle = 'rgba(42, 35, 64, 0.16)'
  ctx.beginPath()
  ctx.ellipse(x, y, size * 0.28, size * 0.08, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ff7a1a'
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x - size * 0.26, y)
  ctx.lineTo(x + size * 0.26, y)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#fff6e4'
  ctx.beginPath()
  ctx.moveTo(x, y - size * 0.62)
  ctx.lineTo(x - size * 0.14, y - size * 0.4)
  ctx.lineTo(x + size * 0.14, y - size * 0.4)
  ctx.closePath()
  ctx.fill()
}

function drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const width = size * 0.7
  const height = size * 0.58
  const depth = size * 0.24
  ctx.fillStyle = 'rgba(42, 35, 64, 0.16)'
  ctx.beginPath()
  ctx.ellipse(x, y, width * 0.55, size * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#c9842a'
  ctx.beginPath()
  ctx.moveTo(x - width / 2, y - height)
  ctx.lineTo(x + width / 2, y - height)
  ctx.lineTo(x + width / 2 + depth, y - height - depth)
  ctx.lineTo(x - width / 2 + depth, y - height - depth)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#e7b15a'
  ctx.fillRect(x - width / 2, y - height, width, height)
  ctx.strokeStyle = '#8a5a20'
  ctx.lineWidth = Math.max(2, size * 0.05)
  ctx.beginPath()
  ctx.moveTo(x - width / 2, y - height)
  ctx.lineTo(x + width / 2, y)
  ctx.moveTo(x + width / 2, y - height)
  ctx.lineTo(x - width / 2, y)
  ctx.stroke()
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillStyle = 'rgba(42, 35, 64, 0.14)'
  ctx.beginPath()
  ctx.ellipse(x, y, size * 0.36, size * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2f9e4f'
  ctx.beginPath()
  ctx.arc(x - size * 0.22, y - size * 0.24, size * 0.24, 0, Math.PI * 2)
  ctx.arc(x + size * 0.22, y - size * 0.22, size * 0.24, 0, Math.PI * 2)
  ctx.arc(x, y - size * 0.4, size * 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#57d27a'
  ctx.beginPath()
  ctx.arc(x - size * 0.08, y - size * 0.5, size * 0.14, 0, Math.PI * 2)
  ctx.fill()
}

function laneCenter(roadX: number, roadHalf: number, lane: number, width: number): number {
  const offset = (lane - 1) * LANE_OFFSET * roadHalf
  const limit = width * 0.3
  const clamped = Math.max(-limit, Math.min(limit, offset))
  return Math.max(width * 0.16, Math.min(width * 0.84, roadX + clamped))
}

function drawObstacle(ctx: CanvasRenderingContext2D, kind: ObstacleKind, x: number, y: number, size: number): void {
  if (kind === 'cone') drawCone(ctx, x, y, size)
  else if (kind === 'crate') drawCrate(ctx, x, y, size)
  else drawBush(ctx, x, y, size)
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillStyle = '#8a5a3a'
  ctx.fillRect(x - size * 0.06, y - size * 0.42, size * 0.12, size * 0.42)
  ctx.fillStyle = '#2f9e4f'
  ctx.beginPath()
  ctx.arc(x, y - size * 0.62, size * 0.32, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#49c86a'
  ctx.beginPath()
  ctx.arc(x - size * 0.12, y - size * 0.74, size * 0.18, 0, Math.PI * 2)
  ctx.fill()
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.beginPath()
  ctx.ellipse(x, y, size, size * 0.58, 0, 0, Math.PI * 2)
  ctx.ellipse(x - size * 0.62, y + size * 0.12, size * 0.68, size * 0.46, 0, 0, Math.PI * 2)
  ctx.ellipse(x + size * 0.64, y + size * 0.1, size * 0.62, size * 0.42, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  phase: number,
  tilt: number,
  squash: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)
  ctx.scale(1 + squash * 0.08, 1 - squash * 0.18)
  ctx.fillStyle = 'rgba(42, 35, 64, 0.18)'
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.34, size * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()
  const bob = Math.sin(phase) * size * 0.05
  const step = Math.sin(phase) * size * 0.16
  ctx.strokeStyle = '#2a2340'
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(3, size * 0.07)
  ctx.beginPath()
  ctx.moveTo(-size * 0.1, -size * 0.28 + bob)
  ctx.lineTo(-size * 0.2, -size * 0.02 + step)
  ctx.moveTo(size * 0.1, -size * 0.28 + bob)
  ctx.lineTo(size * 0.2, -size * 0.02 - step)
  ctx.stroke()
  ctx.strokeStyle = '#ffb703'
  ctx.lineWidth = Math.max(3, size * 0.07)
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = (ray / 8) * Math.PI * 2 + phase * 0.08
    const headY = -size * 0.58 + bob
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * size * 0.28, headY + Math.sin(angle) * size * 0.28)
    ctx.lineTo(Math.cos(angle) * size * 0.46, headY + Math.sin(angle) * size * 0.46)
    ctx.stroke()
  }
  ctx.fillStyle = '#ffd15c'
  ctx.beginPath()
  ctx.arc(0, -size * 0.58 + bob, size * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2a2340'
  ctx.beginPath()
  ctx.arc(-size * 0.09, -size * 0.62 + bob, size * 0.035, 0, Math.PI * 2)
  ctx.arc(size * 0.09, -size * 0.62 + bob, size * 0.035, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#2a2340'
  ctx.lineWidth = Math.max(2, size * 0.035)
  ctx.beginPath()
  ctx.arc(0, -size * 0.56 + bob, size * 0.1, 0.25, Math.PI - 0.25)
  ctx.stroke()
  ctx.fillStyle = '#ff9b88'
  ctx.beginPath()
  ctx.arc(-size * 0.17, -size * 0.52 + bob, size * 0.04, 0, Math.PI * 2)
  ctx.arc(size * 0.17, -size * 0.52 + bob, size * 0.04, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function buildSlices(
  track: readonly TrackSegment[],
  position: number,
  width: number,
  height: number,
  horizon: number,
): Slice[] {
  const base = Math.max(0, Math.min(TRACK_SEGMENTS - 1, Math.floor(position / SEGMENT_LENGTH)))
  const percent = (position % SEGMENT_LENGTH) / SEGMENT_LENGTH
  let curveX = 0
  let curveDx = -(track[base]?.curve ?? 0) * percent
  const slices: Slice[] = []

  for (let step = 0; step < DRAW_DISTANCE; step += 1) {
    const index = base + step
    if (index >= track.length) break
    const zNear = index * SEGMENT_LENGTH
    const cameraNear = curveX
    const cameraFar = curveX + curveDx
    const sprite = project(0, zNear, cameraNear, position, width, height, horizon)
    const far = project(0, zNear + SEGMENT_LENGTH, cameraFar, position, width, height, horizon)
    curveX += curveDx
    curveDx += track[index].curve
    if (!sprite || !far || sprite.y <= far.y) continue
    slices.push({
      index,
      depth: step,
      far,
      sprite,
      roadNear: sprite,
      segment: track[index],
    })
  }

  for (const slice of slices) {
    if (slice.far.y >= height) continue
    if (slice.roadNear.y > height) {
      const t = (height - slice.far.y) / (slice.roadNear.y - slice.far.y)
      slice.roadNear = lerpPoint(slice.far, slice.sprite, t)
    }
  }
  const nearest = slices.find((slice) => slice.far.y < height)
  if (nearest && nearest.roadNear.y < height) {
    const t = (height - nearest.far.y) / (nearest.sprite.y - nearest.far.y)
    nearest.roadNear = lerpPoint(nearest.far, nearest.sprite, t)
  }
  return slices
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  track: readonly TrackSegment[],
  world: World,
  width: number,
  height: number,
): void {
  const horizon = height * HORIZON
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#8ecfff')
  sky.addColorStop(1, '#fff0cc')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  const sunX = width * 0.78
  const sunY = horizon * 0.42
  ctx.fillStyle = '#ffe08a'
  ctx.beginPath()
  ctx.arc(sunX, sunY, Math.max(18, width * 0.045), 0, Math.PI * 2)
  ctx.fill()

  const drift = world.position * 0.02
  drawCloud(ctx, ((width * 0.2 - drift) % (width + 160)) + 80, horizon * 0.28, 28)
  drawCloud(ctx, ((width * 0.62 - drift * 0.7) % (width + 180)) + 40, horizon * 0.18, 22)

  ctx.fillStyle = '#b7d98a'
  ctx.beginPath()
  ctx.moveTo(0, horizon + 8)
  for (let x = 0; x <= width; x += 12) {
    const wave = Math.sin((x + world.position * 0.04) * 0.01) * 16
    ctx.lineTo(x, horizon - 28 + wave)
  }
  ctx.lineTo(width, horizon + 8)
  ctx.fill()

  ctx.fillStyle = '#67c96f'
  ctx.fillRect(0, horizon, width, height - horizon)

  const shake = Math.sin(world.time * 46) * 7 * world.flash
  ctx.save()
  ctx.translate(shake, 0)

  const slices = buildSlices(track, world.position, width, height, horizon)
  for (let index = slices.length - 1; index >= 0; index -= 1) {
    const slice = slices[index]
    if (slice.far.y >= height || slice.roadNear.y <= slice.far.y) continue
    const stripe = slice.index % 2
    ctx.fillStyle = fog(GRASS[stripe], slice.depth)
    ctx.fillRect(0, slice.far.y, width, slice.roadNear.y - slice.far.y)
    ctx.fillStyle = fog(RUMBLE[stripe], slice.depth)
    fillTrap(
      ctx,
      slice.roadNear,
      slice.far,
      -slice.roadNear.w * 1.16,
      slice.roadNear.w * 1.16,
      -slice.far.w * 1.16,
      slice.far.w * 1.16,
    )
    ctx.fillStyle = fog(ROAD[stripe], slice.depth)
    fillTrap(ctx, slice.roadNear, slice.far, -slice.roadNear.w, slice.roadNear.w, -slice.far.w, slice.far.w)
    if (stripe === 0) {
      ctx.fillStyle = 'rgba(255, 246, 228, 0.92)'
      for (const side of [-0.31, 0.31]) {
        const dashNear = lerpPoint(slice.far, slice.roadNear, 0.62)
        const dashFar = lerpPoint(slice.far, slice.roadNear, 0.28)
        fillTrap(
          ctx,
          dashNear,
          dashFar,
          dashNear.w * (side - 0.012),
          dashNear.w * (side + 0.012),
          dashFar.w * (side - 0.012),
          dashFar.w * (side + 0.012),
        )
      }
    }

    const sprite = slice.sprite
    if (sprite.y > horizon + 8 && sprite.y < height - 6 && slice.depth < 30) {
      const fade = slice.depth < 14 ? 1 : Math.max(0, 1 - (slice.depth - 14) / 8)
      ctx.globalAlpha = fade
      if (slice.index % 4 === 0) drawTree(ctx, sprite.x - sprite.w * 1.55, sprite.y, Math.max(8, sprite.scale * 1500 * width * 0.5))
      if (slice.index % 4 === 2) drawTree(ctx, sprite.x + sprite.w * 1.55, sprite.y, Math.max(8, sprite.scale * 1500 * width * 0.5))
      if (slice.segment.finish) {
        const bandFar = lerpPoint(sprite, slice.far, 0.22)
        for (let cell = 0; cell < 8; cell += 1) {
          ctx.fillStyle = cell % 2 === 0 ? '#2a2340' : '#fffaf2'
          const from = -1 + (2 * cell) / 8
          const to = -1 + (2 * (cell + 1)) / 8
          fillTrap(ctx, sprite, bandFar, sprite.w * from, sprite.w * to, bandFar.w * from, bandFar.w * to)
        }
        if (sprite.w > 36) {
          const pole = Math.max(8, sprite.w * 0.04)
          const banner = sprite.w * 0.22
          ctx.fillStyle = '#fff'
          ctx.fillRect(sprite.x - sprite.w, sprite.y - banner, pole, banner)
          ctx.fillRect(sprite.x + sprite.w - pole, sprite.y - banner, pole, banner)
          ctx.fillStyle = '#0f766e'
          ctx.fillRect(sprite.x - sprite.w, sprite.y - banner, sprite.w * 2, Math.max(10, banner * 0.28))
          ctx.fillStyle = '#fff'
          ctx.font = `800 ${Math.max(12, banner * 0.22)}px Nunito, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('ФИНИШ', sprite.x, sprite.y - banner * 0.86)
        }
      }
      if (slice.segment.blocks.length > 0 && slice.depth < 18) {
        const size = Math.min(width * 0.26, sprite.scale * 860 * width * 0.5)
        for (const lane of slice.segment.blocks) {
          drawObstacle(ctx, slice.segment.kind, laneCenter(sprite.x, sprite.w, lane, width), sprite.y, size)
        }
      }
      ctx.globalAlpha = 1
    }
  }

  const footY = height - 8
  let foot = slices.find((slice) => slice.far.y <= footY && slice.roadNear.y >= footY)
  if (!foot && slices[0]) foot = slices[0]
  if (foot) {
    const span = foot.roadNear.y - foot.far.y
    const t = span === 0 ? 1 : (footY - foot.far.y) / span
    const road = lerpPoint(foot.far, foot.roadNear, t)
    const lean = (world.targetLane - world.displayLane) * 0.18
    const size = Math.max(68, Math.min(height * 0.2, width * 0.2))
    drawPlayer(
      ctx,
      laneCenter(road.x, road.w, world.displayLane, width),
      footY,
      size,
      world.position / 70,
      lean,
      world.flash,
    )
  }

  ctx.restore()

  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 90, 70, ${0.28 * world.flash})`
    ctx.fillRect(0, 0, width, height)
  }
}

function steerBy(world: World, direction: -1 | 1): void {
  world.targetLane = Math.max(0, Math.min(2, world.targetLane + direction))
}

function detailFor(bumps: number): string {
  if (bumps <= 0) return 'До финиша без столкновений'
  if (bumps === 1) return 'Одно столкновение по дороге'
  return `Столкновений по дороге: ${bumps}`
}

export function RunGame({ age, onExit, onReplay, next }: GameProps) {
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const [bumps, setBumps] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const worldRef = useRef<World | null>(null)

  useSpeak('Перестраивайся и добеги до финиша')

  useEffect(() => {
    const track = buildTrack()
    const goal = finishIndex(track)
    const finishAt = goal * SEGMENT_LENGTH - HIT_DISTANCE
    const world: World = {
      position: 0,
      displayLane: 1,
      targetLane: 1,
      bumps: 0,
      stun: 0,
      flash: 0,
      resolved: new Uint8Array(track.length),
      finished: false,
      last: 0,
      time: 0,
    }
    worldRef.current = world
    const canvas = canvasRef.current
    let frame = 0
    let alive = true

    const loop = (now: number) => {
      if (!alive || world.finished) return
      if (world.last === 0) world.last = now
      const dt = Math.min(0.032, (now - world.last) / 1000)
      world.last = now
      world.time += dt
      world.stun = Math.max(0, world.stun - dt)
      world.flash = Math.max(0, world.flash - dt * 2.4)
      const laneStep = world.targetLane - world.displayLane
      world.displayLane += Math.sign(laneStep) * Math.min(Math.abs(laneStep), dt * 7)
      const pace = (world.stun > 0 ? 0.62 : 1) * Math.min(1, world.time / 0.55)
      world.position += SPEED * pace * dt

      for (let index = 0; index < track.length; index += 1) {
        const segment = track[index]
        if (segment.blocks.length === 0 || world.resolved[index]) continue
        if (world.position < index * SEGMENT_LENGTH - HIT_DISTANCE) continue
        world.resolved[index] = 1
        const lane = Math.round(world.displayLane) as Lane
        if (segment.blocks.includes(lane)) {
          world.bumps += 1
          world.stun = 0.42
          world.flash = 1
          setBumps(world.bumps)
          playBad()
        }
      }

      if (barRef.current) {
        const pct = Math.max(0, Math.min(100, (world.position / Math.max(1, finishAt)) * 100))
        barRef.current.style.width = `${pct}%`
      }

      const view = canvasRef.current
      if (view) {
        const bounds = view.getBoundingClientRect()
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const width = Math.max(1, bounds.width)
        const height = Math.max(1, bounds.height)
        const pixelWidth = Math.round(width * dpr)
        const pixelHeight = Math.round(height * dpr)
        if (view.width !== pixelWidth || view.height !== pixelHeight) {
          view.width = pixelWidth
          view.height = pixelHeight
        }
        const ctx = view.getContext('2d')
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          drawScene(ctx, track, world, width, height)
        }
      }

      if (world.position >= finishAt) {
        world.finished = true
        setBumps(world.bumps)
        setStars(starsForBumps(world.bumps))
        setDone(true)
        return
      }
      frame = window.requestAnimationFrame(loop)
    }

    frame = window.requestAnimationFrame(loop)
    return () => {
      alive = false
      window.cancelAnimationFrame(frame)
      if (worldRef.current === world) worldRef.current = null
      if (canvas) canvas.width = canvas.width
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat) return
      const world = worldRef.current
      if (!world || world.finished) return
      const left = event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A' || event.key === 'ф' || event.key === 'Ф'
      const right = event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D' || event.key === 'в' || event.key === 'В'
      if (!left && !right) return
      event.preventDefault()
      steerBy(world, left ? -1 : 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function steer(direction: -1 | 1): void {
    const world = worldRef.current
    if (!world || world.finished) return
    steerBy(world, direction)
  }

  return (
    <Shell
      title="Забег"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={<span className="meta">Столкновения: {bumps}</span>}
    >
      {done ? (
        <Finish
          age={age}
          gameId="run"
          stars={stars}
          detail={detailFor(bumps)}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <div className="run-progress" aria-hidden="true">
            <span ref={barRef} />
          </div>
          <div className="run-stage">
            <canvas
              ref={canvasRef}
              className="run-canvas"
              aria-hidden="true"
              onPointerDown={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect()
                steer(event.clientX - bounds.left < bounds.width / 2 ? -1 : 1)
              }}
            />
          </div>
          <div className="run-controls">
            <button type="button" className="btn" onPointerDown={() => steer(-1)}>
              Влево
            </button>
            <button type="button" className="btn" onPointerDown={() => steer(1)}>
              Вправо
            </button>
          </div>
          <p className="hint">Края дороги и кнопки перестраивают Лучика</p>
        </>
      )}
    </Shell>
  )
}

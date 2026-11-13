import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { shuffle } from '../random'
import { playGood } from '../sound'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'

type AnimalId = 'cat' | 'dog' | 'duck' | 'bunny' | 'frog'

const ANIMALS: Array<{ id: AnimalId; name: string }> = [
  { id: 'cat', name: 'Котик' },
  { id: 'dog', name: 'Собачка' },
  { id: 'duck', name: 'Уточка' },
  { id: 'bunny', name: 'Зайчик' },
  { id: 'frog', name: 'Лягушка' },
]

const ROUNDS = 4
const REVEAL_AT = 0.68

export function WipeGame({ age, onExit, onReplay, next }: GameProps) {
  const [plan] = useState(() => shuffle(ANIMALS).slice(0, ROUNDS))
  const [step, setStep] = useState(0)
  const [cleared, setCleared] = useState(false)
  const [done, setDone] = useState(false)
  const wait = useRef(0)
  const animal = plan[step] ?? plan[0]
  const spoken = done ? '' : cleared ? `Это ${animal.name.toLowerCase()}` : 'Потри и сотри чёрное'
  useSpeak(spoken)

  useEffect(() => () => window.clearTimeout(wait.current), [])

  return (
    <Shell
      title="Стиралка"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      step={done ? ROUNDS : step}
      total={ROUNDS}
    >
      {done ? (
        <Finish
          age={age}
          gameId="wipe"
          stars={3 as StarScore}
          detail={`Открыто зверюшек: ${ROUNDS} из ${ROUNDS}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <p className="prompt wipe-prompt" aria-live="polite">
            {cleared ? `Это ${animal.name.toLowerCase()}!` : 'Сотри чёрное'}
          </p>
          <ScratchCard
            key={animal.id}
            animal={animal.id}
            cleared={cleared}
            onClear={() => {
              if (cleared) return
              setCleared(true)
              playGood()
              wait.current = window.setTimeout(() => {
                if (step >= ROUNDS - 1) setDone(true)
                else {
                  setCleared(false)
                  setStep((value) => value + 1)
                }
              }, 1100)
            }}
          />
        </>
      )}
    </Shell>
  )
}

function ScratchCard({
  animal,
  cleared,
  onClear,
}: {
  animal: AnimalId
  cleared: boolean
  onClear: () => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskRef = useRef<Uint8Array | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const done = useRef(false)
  const ready = useRef(false)
  const scratched = useRef(false)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const svg = svgRef.current
    const canvas = canvasRef.current
    if (!stage || !svg || !canvas) return
    let token = 0
    const paint = () => {
      if (scratched.current) return
      const current = ++token
      const width = Math.max(1, Math.round(stage.clientWidth * Math.min(window.devicePixelRatio || 1, 2)))
      const height = Math.max(1, Math.round(stage.clientHeight * Math.min(window.devicePixelRatio || 1, 2)))
      canvas.width = width
      canvas.height = height
      const clone = svg.cloneNode(true) as SVGSVGElement
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('width', String(width))
      clone.setAttribute('height', String(height))
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }))
      const image = new Image()
      image.onload = () => {
        URL.revokeObjectURL(url)
        if (current !== token) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(image, 0, 0, width, height)
        ctx.globalCompositeOperation = 'source-in'
        ctx.fillStyle = '#1a1724'
        ctx.fillRect(0, 0, width, height)
        ctx.globalCompositeOperation = 'source-over'
        const pixels = ctx.getImageData(0, 0, width, height).data
        const mask = new Uint8Array(width * height)
        for (let index = 0; index < mask.length; index += 1) mask[index] = pixels[index * 4 + 3] > 24 ? 1 : 0
        maskRef.current = mask
        ready.current = true
      }
      image.src = url
    }
    paint()
    const observer = new ResizeObserver(paint)
    observer.observe(stage)
    return () => {
      token += 1
      observer.disconnect()
    }
  }, [animal])

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function rub(from: { x: number; y: number } | null, to: { x: number; y: number }) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const radius = canvas.width * 0.055
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = radius * 2
    ctx.beginPath()
    if (from) {
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
    } else {
      ctx.arc(to.x, to.y, radius, 0, Math.PI * 2)
    }
    if (from) ctx.stroke()
    else ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  function uncovered() {
    const canvas = canvasRef.current
    const mask = maskRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !mask || !ctx) return 0
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let total = 0
    let open = 0
    const step = 4
    for (let index = 0; index < mask.length; index += step) {
      if (!mask[index]) continue
      total += 1
      if (pixels[index * 4 + 3] < 20) open += 1
    }
    return total === 0 ? 0 : open / total
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!ready.current || done.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    const at = point(event)
    if (!at) return
    last.current = at
    scratched.current = true
    rub(null, at)
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || done.current) return
    const at = point(event)
    if (!at) return
    rub(last.current, at)
    last.current = at
    if (uncovered() >= REVEAL_AT) finish()
  }

  function onPointerUp() {
    drawing.current = false
    last.current = null
    if (!done.current && uncovered() >= REVEAL_AT) finish()
  }

  function finish() {
    if (done.current) return
    done.current = true
    onClear()
  }

  return (
    <div ref={stageRef} className="wipe-stage">
      <svg ref={svgRef} className="wipe-art" viewBox="0 0 240 240" aria-hidden="true">
        <Animal id={animal} />
      </svg>
      <canvas
        ref={canvasRef}
        className={cleared ? 'wipe-canvas gone' : 'wipe-canvas'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  )
}

function Animal({ id }: { id: AnimalId }) {
  if (id === 'cat') return <Cat />
  if (id === 'dog') return <Dog />
  if (id === 'duck') return <Duck />
  if (id === 'bunny') return <Bunny />
  return <Frog />
}

function Cat() {
  return (
    <g>
      <path d="M150 150c28 6 48 2 58-18" fill="none" stroke="#e8893a" strokeWidth="14" strokeLinecap="round" />
      <ellipse cx="118" cy="156" rx="62" ry="46" fill="#f4a261" />
      <path d="M78 78l16 28 22-20z" fill="#f4a261" />
      <path d="M150 74l-8 30 24-12z" fill="#f4a261" />
      <path d="M84 86l10 16 12-10z" fill="#f8c8c0" />
      <path d="M146 84l-4 16 14-8z" fill="#f8c8c0" />
      <circle cx="118" cy="104" r="42" fill="#f6b56a" />
      <ellipse cx="104" cy="108" rx="8" ry="9" fill="#fff" />
      <ellipse cx="136" cy="108" rx="8" ry="9" fill="#fff" />
      <circle cx="106" cy="110" r="4" fill="#2a2340" />
      <circle cx="138" cy="110" r="4" fill="#2a2340" />
      <ellipse cx="120" cy="122" rx="6" ry="4.5" fill="#e56b8a" />
      <path d="M96 116h-16M96 122h-18M142 116h16M142 122h18" stroke="#6b4428" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function Dog() {
  return (
    <g>
      <ellipse cx="122" cy="160" rx="64" ry="46" fill="#c4844a" />
      <ellipse cx="70" cy="118" rx="22" ry="34" fill="#a86b38" />
      <ellipse cx="168" cy="118" rx="22" ry="34" fill="#a86b38" />
      <circle cx="120" cy="108" r="44" fill="#d3965c" />
      <ellipse cx="120" cy="124" rx="24" ry="18" fill="#f3d2b0" />
      <ellipse cx="104" cy="102" rx="8" ry="9" fill="#fff" />
      <ellipse cx="140" cy="102" rx="8" ry="9" fill="#fff" />
      <circle cx="106" cy="104" r="4" fill="#2a2340" />
      <circle cx="142" cy="104" r="4" fill="#2a2340" />
      <ellipse cx="120" cy="120" rx="7" ry="5" fill="#2a2340" />
      <path d="M114 128c4 8 10 8 14 0" fill="#ff8d7a" />
    </g>
  )
}

function Duck() {
  return (
    <g>
      <ellipse cx="128" cy="156" rx="62" ry="42" fill="#ffd24a" />
      <ellipse cx="92" cy="112" rx="36" ry="32" fill="#ffe07a" />
      <path d="M118 114h42c8 0 12 8 6 14h-40c-8 0-12-6-8-14z" fill="#ff8a1e" />
      <ellipse cx="84" cy="106" rx="7" ry="8" fill="#fff" />
      <circle cx="86" cy="108" r="3.4" fill="#2a2340" />
      <ellipse cx="150" cy="150" rx="18" ry="12" fill="#f0b429" />
      <path d="M96 190h18l-6 10zm28 0h18l-6 10z" fill="#ff8a1e" />
    </g>
  )
}

function Bunny() {
  return (
    <g>
      <ellipse cx="92" cy="78" rx="16" ry="40" fill="#f7f1e8" />
      <ellipse cx="148" cy="78" rx="16" ry="40" fill="#f7f1e8" />
      <ellipse cx="92" cy="82" rx="8" ry="26" fill="#f6b6c8" />
      <ellipse cx="148" cy="82" rx="8" ry="26" fill="#f6b6c8" />
      <ellipse cx="120" cy="162" rx="58" ry="42" fill="#f7f1e8" />
      <circle cx="120" cy="112" r="40" fill="#fffaf3" />
      <ellipse cx="106" cy="112" rx="7" ry="8" fill="#fff" />
      <ellipse cx="136" cy="112" rx="7" ry="8" fill="#fff" />
      <circle cx="108" cy="114" r="3.5" fill="#2a2340" />
      <circle cx="138" cy="114" r="3.5" fill="#2a2340" />
      <ellipse cx="120" cy="124" rx="5" ry="3.5" fill="#e56b8a" />
      <circle cx="168" cy="168" r="12" fill="#fff" />
    </g>
  )
}

function Frog() {
  return (
    <g>
      <ellipse cx="120" cy="156" rx="70" ry="46" fill="#7dce6a" />
      <ellipse cx="86" cy="92" rx="26" ry="24" fill="#7dce6a" />
      <ellipse cx="154" cy="92" rx="26" ry="24" fill="#7dce6a" />
      <circle cx="86" cy="92" r="14" fill="#fff" />
      <circle cx="154" cy="92" r="14" fill="#fff" />
      <circle cx="88" cy="94" r="7" fill="#2a2340" />
      <circle cx="156" cy="94" r="7" fill="#2a2340" />
      <path d="M100 128c8 14 32 14 40 0" fill="none" stroke="#2f6a28" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="78" cy="168" rx="16" ry="10" fill="#67b85a" />
      <ellipse cx="162" cy="168" rx="16" ry="10" fill="#67b85a" />
    </g>
  )
}

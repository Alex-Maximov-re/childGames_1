import { useLayoutEffect, useRef, useState } from 'react'
import { makeHalfRounds, type HalfAnimal } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { QuizFrame, useSpeak } from '../ui'

type Look = {
  fur: string
  belly?: string
  spot?: string
  ear: 'floppy' | 'point' | 'round' | 'long' | 'horn'
  nose: string
  noseShape: 'dot' | 'snout' | 'beak' | 'trunk' | 'bill'
  mane?: string
  stripes?: boolean
  fluff?: boolean
  tail: 'thin' | 'bush' | 'curl' | 'tuft' | 'none'
}

const LOOK: Record<string, Look> = {
  cow: { fur: '#F7F3EA', belly: '#FFF', spot: '#2A2340', ear: 'floppy', nose: '#F4A6B5', noseShape: 'snout', tail: 'tuft' },
  dog: { fur: '#C4844A', belly: '#F0D2A8', ear: 'floppy', nose: '#2A2340', noseShape: 'dot', tail: 'thin' },
  cat: { fur: '#F2C14E', belly: '#FFF3C9', ear: 'point', nose: '#F08A9A', noseShape: 'dot', tail: 'curl' },
  horse: { fur: '#8B5A3C', belly: '#C9956A', ear: 'point', nose: '#5C3A28', noseShape: 'snout', mane: '#5C3A28', tail: 'thin' },
  pig: { fur: '#F7A8B8', belly: '#FFD0D8', ear: 'point', nose: '#E9899C', noseShape: 'snout', tail: 'curl' },
  sheep: { fur: '#F7F4EF', fluff: true, ear: 'floppy', nose: '#2A2340', noseShape: 'dot', tail: 'none' },
  goat: { fur: '#EFE6D6', belly: '#FFF', ear: 'horn', nose: '#2A2340', noseShape: 'dot', tail: 'thin' },
  hen: { fur: '#F28C28', belly: '#F6D7A8', ear: 'round', nose: '#E23B4A', noseShape: 'beak', tail: 'none' },
  duck: { fur: '#F6D34D', belly: '#FFF3C4', ear: 'round', nose: '#F28C28', noseShape: 'bill', tail: 'none' },
  rabbit: { fur: '#F4F0EA', belly: '#FFF', ear: 'long', nose: '#F4A6B5', noseShape: 'dot', tail: 'tuft' },
  lion: { fur: '#E2A04A', belly: '#F0C98A', ear: 'round', nose: '#2A2340', noseShape: 'dot', mane: '#C4841A', tail: 'tuft' },
  elephant: { fur: '#B7C4CE', belly: '#D5DEE6', ear: 'floppy', nose: '#8FA0AC', noseShape: 'trunk', tail: 'thin' },
  giraffe: { fur: '#F0C14A', spot: '#C47B2B', ear: 'horn', nose: '#C47B2B', noseShape: 'snout', tail: 'tuft' },
  zebra: { fur: '#F7F4EF', stripes: true, ear: 'point', nose: '#2A2340', noseShape: 'snout', tail: 'tuft' },
  bear: { fur: '#8D6A4A', belly: '#C9A27A', ear: 'round', nose: '#2A2340', noseShape: 'dot', tail: 'none' },
  fox: { fur: '#E07A3D', belly: '#F4D7B0', ear: 'point', nose: '#2A2340', noseShape: 'dot', tail: 'bush' },
  wolf: { fur: '#9AA3AD', belly: '#E4E8EC', ear: 'point', nose: '#2A2340', noseShape: 'dot', tail: 'bush' },
  monkey: { fur: '#C4844A', belly: '#F0C9A0', ear: 'round', nose: '#F0C9A0', noseShape: 'dot', tail: 'curl' },
  tiger: { fur: '#F0A04A', belly: '#F8D7A8', stripes: true, ear: 'round', nose: '#F08A9A', noseShape: 'dot', tail: 'thin' },
  penguin: { fur: '#2A2340', belly: '#F7F4EF', ear: 'round', nose: '#F28C28', noseShape: 'beak', tail: 'none' },
}

function AnimalSvg({ id }: { id: string }) {
  const look = LOOK[id] ?? LOOK.dog
  return (
    <svg className="half-svg" viewBox="0 0 200 140" aria-hidden="true">
      <rect width="200" height="140" fill="#FFF8EE" />
      <rect y="108" width="200" height="32" fill="#C8E6A0" />
      {look.mane && <circle cx="62" cy="70" r="38" fill={look.mane} />}
      <ellipse cx="148" cy="88" rx="40" ry="24" fill={look.fur} />
      {look.belly && <ellipse cx="148" cy="96" rx="20" ry="12" fill={look.belly} />}
      {look.fluff && (
        <>
          <circle cx="128" cy="78" r="16" fill="#FFF" />
          <circle cx="156" cy="74" r="16" fill="#FFF" />
          <circle cx="170" cy="90" r="14" fill="#FFF" />
        </>
      )}
      {look.stripes && (
        <>
          <path d="M124 74 L136 104" stroke="#2A2340" strokeWidth="3" />
          <path d="M140 70 L150 106" stroke="#2A2340" strokeWidth="3" />
          <path d="M156 72 L164 104" stroke="#2A2340" strokeWidth="3" />
          <path d="M172 78 L176 100" stroke="#2A2340" strokeWidth="3" />
        </>
      )}
      {look.spot && (
        <>
          <circle cx="132" cy="82" r="5" fill={look.spot} />
          <circle cx="150" cy="92" r="4" fill={look.spot} />
          <circle cx="166" cy="80" r="5" fill={look.spot} />
        </>
      )}
      {look.tail === 'thin' && <path d="M182 84 Q196 70 188 58" fill="none" stroke={look.fur} strokeWidth="4" strokeLinecap="round" />}
      {look.tail === 'bush' && <ellipse cx="186" cy="78" rx="12" ry="16" fill={look.fur} />}
      {look.tail === 'curl' && <path d="M180 90 Q196 96 184 108" fill="none" stroke={look.fur} strokeWidth="5" strokeLinecap="round" />}
      {look.tail === 'tuft' && (
        <>
          <path d="M184 86 Q198 96 190 108" fill="none" stroke={look.fur} strokeWidth="4" strokeLinecap="round" />
          <circle cx="190" cy="112" r="5" fill={look.spot ?? look.fur} />
        </>
      )}
      <circle cx="64" cy="72" r="28" fill={look.fur} />
      {look.ear === 'floppy' && (
        <>
          <ellipse cx="40" cy="78" rx="10" ry="16" fill={look.fur} />
          <ellipse cx="86" cy="74" rx="10" ry="14" fill={look.fur} />
        </>
      )}
      {look.ear === 'point' && (
        <>
          <polygon points="42,52 34,28 54,48" fill={look.fur} />
          <polygon points="86,52 96,26 74,48" fill={look.fur} />
        </>
      )}
      {look.ear === 'round' && (
        <>
          <circle cx="42" cy="50" r="10" fill={look.fur} />
          <circle cx="86" cy="50" r="10" fill={look.fur} />
        </>
      )}
      {look.ear === 'long' && (
        <>
          <ellipse cx="46" cy="36" rx="7" ry="20" fill={look.fur} />
          <ellipse cx="80" cy="36" rx="7" ry="20" fill={look.fur} />
          <ellipse cx="46" cy="40" rx="3" ry="12" fill="#F4A6B5" />
          <ellipse cx="80" cy="40" rx="3" ry="12" fill="#F4A6B5" />
        </>
      )}
      {look.ear === 'horn' && (
        <>
          <rect x="48" y="28" width="4" height="16" rx="2" fill="#C9956A" />
          <rect x="74" y="28" width="4" height="16" rx="2" fill="#C9956A" />
        </>
      )}
      <circle cx="54" cy="70" r="4" fill="#2A2340" />
      <circle cx="74" cy="70" r="4" fill="#2A2340" />
      <circle cx="55" cy="69" r="1.3" fill="white" />
      <circle cx="75" cy="69" r="1.3" fill="white" />
      {look.noseShape === 'dot' && <ellipse cx="64" cy="82" rx="5" ry="4" fill={look.nose} />}
      {look.noseShape === 'snout' && <ellipse cx="64" cy="84" rx="10" ry="7" fill={look.nose} />}
      {look.noseShape === 'beak' && <polygon points="54,82 74,82 64,94" fill={look.nose} />}
      {look.noseShape === 'bill' && <ellipse cx="64" cy="86" rx="12" ry="5" fill={look.nose} />}
      {look.noseShape === 'trunk' && <path d="M58 84 Q52 104 66 112" fill="none" stroke={look.fur} strokeWidth="8" strokeLinecap="round" />}
    </svg>
  )
}

function HalfPicture({ id, side }: { id: string; side: 'left' | 'right' }) {
  return (
    <span className={cx('half-clip', side)}>
      <AnimalSvg id={id} />
    </span>
  )
}

type Drag = {
  id: string
  dx: number
  dy: number
  w: number
  h: number
  x: number
  y: number
}

function hitsSlot(drag: Drag, slot: DOMRect): boolean {
  const pad = 36
  const centerX = drag.x + drag.w / 2
  const centerY = drag.y + drag.h / 2
  return centerX >= slot.left - pad && centerX <= slot.right + pad && centerY >= slot.top - pad && centerY <= slot.bottom + pad
}

export function HalvesGame({ age, onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(makeHalfRounds)
  const quiz = useQuiz(rounds.length)
  const missed = useRef(false)
  const [placed, setPlaced] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [over, setOver] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const round = rounds[quiz.step]
  const prompt = quiz.done || !round ? '' : `Собери: ${round.animal.name}`
  useSpeak(prompt)

  useLayoutEffect(() => {
    missed.current = false
    setPlaced(false)
    setWrong(false)
    setOver(false)
    setDragId(null)
    dragRef.current = null
  }, [quiz.step])

  function moveGhost(x: number, y: number) {
    const ghost = ghostRef.current
    if (ghost) ghost.style.transform = `translate(${x}px, ${y}px)`
  }

  function dropPiece(id: string) {
    const current = round
    if (!current || quiz.isLocked() || placed || !id) return
    if (id === current.animal.id) {
      setPlaced(true)
      playGood()
      quiz.advance(!missed.current, 800)
      return
    }
    missed.current = true
    setWrong(true)
    playBad()
    window.setTimeout(() => setWrong(false), 380)
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>, option: HalfAnimal) {
    if (event.pointerType === 'mouse' || quiz.isLocked() || placed) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = {
      id: option.id,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      w: rect.width,
      h: rect.height,
      x: rect.left,
      y: rect.top,
    }
    setDragId(option.id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag) return
    drag.x = event.clientX - drag.dx
    drag.y = event.clientY - drag.dy
    moveGhost(drag.x, drag.y)
    const slot = slotRef.current?.getBoundingClientRect()
    const nextOver = slot ? hitsSlot(drag, slot) : false
    setOver((value) => (value === nextOver ? value : nextOver))
  }

  function onPointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    setDragId(null)
    setOver(false)
    if (!drag) return
    const slot = slotRef.current?.getBoundingClientRect()
    if (!slot || !hitsSlot(drag, slot)) return
    dropPiece(drag.id)
  }

  const dragging = dragId ? round?.options.find((option) => option.id === dragId) : undefined

  return (
    <QuizFrame
      age={age}
      title="Половинки"
      gameId="halves"
      step={quiz.step}
      total={rounds.length}
      done={quiz.done}
      stars={quiz.stars}
      correct={quiz.correct}
      onExit={onExit}
      onReplay={onReplay}
      next={next}
    >
      {round && !quiz.done && (
        <>
          <p className="prompt" aria-live="polite">
            {prompt}
          </p>
          <div className="half-card">
            <div className="half-pane">
              <HalfPicture id={round.animal.id} side="left" />
            </div>
            <div
              ref={slotRef}
              role="group"
              aria-label="Место для половинки"
              className={cx('half-pane slot', over && 'over', wrong && 'shake', placed && 'filled')}
              onDragOver={(event) => {
                event.preventDefault()
                setOver(true)
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setOver(false)
                dropPiece(event.dataTransfer.getData('text/plain'))
              }}
            >
              {placed ? <HalfPicture id={round.animal.id} side="right" /> : <span className="slot-hint">Сюда</span>}
            </div>
          </div>
          <div className="half-choices">
            {round.options.map((option) => (
              <button
                key={option.id}
                type="button"
                draggable
                className={cx('half-choice', dragId === option.id && 'dragging')}
                aria-label={`Половинка: ${option.name}`}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', option.id)
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onPointerDown={(event) => onPointerDown(event, option)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <HalfPicture id={option.id} side="right" />
              </button>
            ))}
          </div>
          {dragging && dragRef.current && (
            <div
              ref={ghostRef}
              className="half-ghost"
              style={{
                width: dragRef.current.w,
                height: dragRef.current.h,
                transform: `translate(${dragRef.current.x}px, ${dragRef.current.y}px)`,
              }}
            >
              <HalfPicture id={dragging.id} side="right" />
            </div>
          )}
        </>
      )}
    </QuizFrame>
  )
}

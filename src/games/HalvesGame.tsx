import { useLayoutEffect, useRef, useState } from 'react'
import { makeHalfRounds, type HalfAnimal } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { QuizFrame, useSpeak } from '../ui'
import { AnimalSvg } from './halfArt'

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
  const wrongTimer = useRef<number | null>(null)
  const [placed, setPlaced] = useState(false)
  const [wrongId, setWrongId] = useState<string | null>(null)
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
    setWrongId(null)
    setOver(false)
    setDragId(null)
    dragRef.current = null
    return () => {
      if (wrongTimer.current !== null) {
        window.clearTimeout(wrongTimer.current)
        wrongTimer.current = null
      }
    }
  }, [quiz.step])

  function moveGhost(x: number, y: number) {
    const ghost = ghostRef.current
    if (ghost) ghost.style.transform = `translate(${x}px, ${y}px)`
  }

  function dropPiece(id: string) {
    const current = round
    if (!current || quiz.isLocked() || placed || !id) return
    if (id === current.animal.id) {
      setWrongId(null)
      setPlaced(true)
      playGood()
      quiz.advance(!missed.current, 1300)
      return
    }
    missed.current = true
    setWrongId(id)
    playBad()
    if (wrongTimer.current !== null) window.clearTimeout(wrongTimer.current)
    wrongTimer.current = window.setTimeout(() => {
      wrongTimer.current = null
      setWrongId((currentId) => (currentId === id ? null : currentId))
    }, 560)
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
          <div className={cx('half-card', placed && 'joined')}>
            <div className="half-pane">
              <HalfPicture id={round.animal.id} side="left" />
            </div>
            <div
              ref={slotRef}
              role="group"
              aria-label={placed ? 'Картинка собрана' : 'Место для половинки'}
              className={cx('half-pane slot', over && 'over', wrongId && 'bad', placed && 'filled')}
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
            <span className="half-seam" aria-hidden="true" />
            {placed && (
              <span className="half-spark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            )}
          </div>
          <div className={cx('half-choices', placed && 'done')}>
            {round.options.map((option) => (
              <button
                key={option.id}
                type="button"
                draggable
                className={cx('half-choice', dragId === option.id && 'dragging', wrongId === option.id && 'nope')}
                aria-label={`Половинка: ${option.name}`}
                onDragStart={(event) => {
                  setWrongId(null)
                  event.dataTransfer.setData('text/plain', option.id)
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onPointerDown={(event) => {
                  setWrongId(null)
                  onPointerDown(event, option)
                }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <HalfPicture id={option.id} side="right" />
                {wrongId === option.id && (
                  <span className="half-nope" aria-hidden="true">
                    <svg viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="#fff" opacity="0.94" />
                      <path d="M22 22 L42 42 M42 22 L22 42" stroke="#e23b4a" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
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

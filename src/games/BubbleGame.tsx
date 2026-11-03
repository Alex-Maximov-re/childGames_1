import { useEffect, useRef, useState } from 'react'
import { randInt } from '../random'
import { playGood } from '../sound'
import { plural } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'

const LEVELS = 5
const GOAL = 20
const BASE_RISE_MS = Math.round(9000 / 1.1)
const COLORS = ['#ff7a5c', '#ffd24a', '#7dce6a', '#7ec8f0', '#f7a8c4', '#b9a6f2']

type Balloon = {
  id: number
  x: number
  color: string
  star: boolean
  duration: number
}

type Burst = { id: number; x: number; y: number }

function riseMs(level: number): number {
  return Math.round(BASE_RISE_MS / (1 + 0.4 * (level - 1)))
}

function spawnMs(level: number): number {
  return Math.round(1300 / (1 + 0.25 * (level - 1)))
}

function maxAlive(level: number): number {
  return 3 + level
}

function starsFor(earned: number, appeared: number): StarScore {
  const ratio = earned / Math.max(1, appeared)
  if (ratio >= 0.7) return 3
  if (ratio >= 0.45) return 2
  return 1
}

function pickX(taken: number[]): number {
  let x = randInt(18, 82)
  let guard = 0
  while (taken.some((item) => Math.abs(item - x) < 14) && guard < 8) {
    x = randInt(18, 82)
    guard += 1
  }
  return x
}

export function BubbleGame({ age, onExit, onReplay, next }: GameProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [level, setLevel] = useState(1)
  const [levelPoints, setLevelPoints] = useState(0)
  const [earned, setEarned] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const [faster, setFaster] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)
  const balloonsRef = useRef<Balloon[]>([])
  const levelRef = useRef(1)
  const levelPointsRef = useRef(0)
  const earnedRef = useRef(0)
  const appearedRef = useRef(0)
  const goneRef = useRef(new Set<number>())
  const idRef = useRef(1)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  const timerRef = useRef<number | null>(null)
  useSpeak(done ? '' : 'Лопни шарик')

  function remember(nextBalloons: Balloon[]) {
    balloonsRef.current = nextBalloons
    setBalloons(nextBalloons)
  }

  function spawn() {
    if (!mountedRef.current || doneRef.current) return
    const current = balloonsRef.current
    if (current.length >= maxAlive(levelRef.current)) return
    const id = idRef.current
    idRef.current += 1
    const star = randInt(1, 10) <= 3
    const balloon: Balloon = {
      id,
      x: pickX(current.map((item) => item.x)),
      color: COLORS[randInt(0, COLORS.length - 1)],
      star,
      duration: riseMs(levelRef.current),
    }
    appearedRef.current += star ? 2 : 1
    remember([...current, balloon])
  }

  function finish() {
    doneRef.current = true
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setStars(starsFor(earnedRef.current, appearedRef.current))
    window.setTimeout(() => {
      if (!mountedRef.current) return
      remember([])
      setDone(true)
    }, 480)
  }

  function addPoints(balloon: Balloon) {
    const points = balloon.star ? 2 : 1
    earnedRef.current += points
    levelPointsRef.current += points
    setEarned(earnedRef.current)
    setLevelPoints(Math.min(levelPointsRef.current, GOAL))
    if (levelPointsRef.current < GOAL) return
    if (levelRef.current >= LEVELS) {
      finish()
      return
    }
    levelRef.current += 1
    levelPointsRef.current = 0
    setLevel(levelRef.current)
    setLevelPoints(0)
    setFaster(true)
    window.setTimeout(() => {
      if (mountedRef.current) setFaster(false)
    }, 900)
  }

  function pop(balloon: Balloon, element: HTMLButtonElement) {
    if (goneRef.current.has(balloon.id) || doneRef.current) return
    goneRef.current.add(balloon.id)
    const field = fieldRef.current?.getBoundingClientRect()
    const rect = element.getBoundingClientRect()
    if (field) {
      const burst = {
        id: balloon.id,
        x: rect.left + rect.width / 2 - field.left,
        y: rect.top + rect.height * 0.38 - field.top,
      }
      setBursts((list) => [...list, burst])
      window.setTimeout(() => {
        if (!mountedRef.current) return
        setBursts((list) => list.filter((item) => item.id !== burst.id))
      }, 520)
    }
    remember(balloonsRef.current.filter((item) => item.id !== balloon.id))
    playGood()
    addPoints(balloon)
  }

  function escape(id: number) {
    if (goneRef.current.has(id)) return
    goneRef.current.add(id)
    remember(balloonsRef.current.filter((item) => item.id !== id))
  }

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    const apply = () => field.style.setProperty('--rise', `${field.clientHeight + 130}px`)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(field)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const tick = () => {
      if (!mountedRef.current || doneRef.current) return
      spawn()
      timerRef.current = window.setTimeout(tick, spawnMs(levelRef.current))
    }
    timerRef.current = window.setTimeout(tick, 280)
    return () => {
      mountedRef.current = false
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <Shell
      title="Лопай шарики"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={
        <span className="meta">
          Уровень {level} · {levelPoints} из {GOAL}
        </span>
      }
    >
      {done ? (
        <Finish
          age={age}
          gameId="bubbles"
          stars={stars}
          detail={`Набрано ${earned} очков за ${LEVELS} ${plural(LEVELS, 'уровень', 'уровня', 'уровней')}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <p className="prompt">Лопни шарик</p>
          <p className="hint">{faster ? 'Быстрее!' : 'Обычный шарик — 1, со звёздочкой — 2'}</p>
          <div ref={fieldRef} className="bubble-field">
            {balloons.map((balloon) => (
              <button
                key={balloon.id}
                type="button"
                className="bubble"
                style={{ left: `${balloon.x}%`, animationDuration: `${balloon.duration}ms` }}
                aria-label={balloon.star ? 'Шарик со звёздочкой' : 'Шарик'}
                onPointerDown={(event) => {
                  event.preventDefault()
                  pop(balloon, event.currentTarget)
                }}
                onAnimationEnd={() => escape(balloon.id)}
              >
                <span className="bubble-body" style={{ background: balloon.color }}>
                  {balloon.star && <i className="bubble-mark" />}
                </span>
                <span className="bubble-knot" style={{ background: balloon.color }} />
                <span className="bubble-string" />
              </button>
            ))}
            {bursts.map((burst) => (
              <span key={burst.id} className="bubble-burst" style={{ left: burst.x, top: burst.y }} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            ))}
          </div>
        </>
      )}
    </Shell>
  )
}

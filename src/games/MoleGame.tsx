import { useEffect, useRef, useState } from 'react'
import { randInt } from '../random'
import { playGood } from '../sound'
import { cx } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'

const HOLES = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const CATCHES_PER_LEVEL = 10
const LEVELS = 5
const BASE_VISIBLE_MS = 2200
const BASE_GAP_MS = 700
const CAUGHT_BEAT_MS = 560
const ESCAPE_BEAT_MS = 520

function speedFactor(level: number): number {
  return 1 + 0.2 * (level - 1)
}

function visibleMs(level: number): number {
  return Math.round(BASE_VISIBLE_MS / speedFactor(level))
}

function gapMs(level: number): number {
  return Math.round(BASE_GAP_MS / speedFactor(level))
}

function starsFor(caught: number, appeared: number): StarScore {
  const ratio = caught / Math.max(1, appeared)
  if (ratio >= 0.85) return 3
  if (ratio >= 0.6) return 2
  return 1
}

function MoleFace({ tongue }: { tongue: boolean }) {
  return (
    <svg className="mole-face" viewBox="0 0 80 90" aria-hidden="true">
      <ellipse cx="40" cy="48" rx="28" ry="32" fill="#8B5A3C" />
      <ellipse cx="40" cy="58" rx="16" ry="14" fill="#E7C4A8" />
      <circle cx="28" cy="40" r="5" fill="#2A2340" />
      <circle cx="52" cy="40" r="5" fill="#2A2340" />
      <circle cx="29.5" cy="38.5" r="1.6" fill="white" />
      <circle cx="53.5" cy="38.5" r="1.6" fill="white" />
      <ellipse cx="40" cy="52" rx="7" ry="5" fill="#F08A9A" />
      {tongue ? (
        <path className="mole-tongue" d="M36 60 Q31 78 40 84 Q49 78 44 60 Q40 65 36 60" fill="#E4455A" />
      ) : (
        <path d="M34 60 Q40 66 46 60" fill="none" stroke="#2A2340" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
}

function CatchStars() {
  return (
    <span className="mole-stars" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

export function MoleGame({ age, onExit, onReplay, next }: GameProps) {
  const [hole, setHole] = useState<number | null>(null)
  const [bonk, setBonk] = useState<number | null>(null)
  const [tease, setTease] = useState<number | null>(null)
  const [level, setLevel] = useState(1)
  const [caughtLevel, setCaughtLevel] = useState(0)
  const [caught, setCaught] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const [faster, setFaster] = useState(false)
  const levelRef = useRef(1)
  const caughtLevelRef = useRef(0)
  const caughtRef = useRef(0)
  const appearedRef = useRef(0)
  const holeRef = useRef<number | null>(null)
  const lastHole = useRef(-1)
  const aliveRef = useRef(false)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  const hideTimer = useRef<number | null>(null)
  const gapTimer = useRef<number | null>(null)
  const bonkTimer = useRef<number | null>(null)
  useSpeak(done ? '' : 'Нажми на крота')

  function clearTimers() {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current)
    if (gapTimer.current !== null) window.clearTimeout(gapTimer.current)
    if (bonkTimer.current !== null) window.clearTimeout(bonkTimer.current)
    hideTimer.current = null
    gapTimer.current = null
    bonkTimer.current = null
  }

  const showNextRef = useRef<() => void>(() => {})

  showNextRef.current = () => {
    if (!mountedRef.current || doneRef.current) return
    let nextHole = randInt(0, 8)
    let guard = 0
    while (nextHole === lastHole.current && guard < 8) {
      nextHole = randInt(0, 8)
      guard += 1
    }
    lastHole.current = nextHole
    holeRef.current = nextHole
    aliveRef.current = true
    appearedRef.current += 1
    setBonk(null)
    setTease(null)
    setHole(nextHole)
    hideTimer.current = window.setTimeout(() => {
      if (!aliveRef.current || doneRef.current) return
      aliveRef.current = false
      holeRef.current = null
      setTease(nextHole)
      bonkTimer.current = window.setTimeout(() => {
        if (!mountedRef.current) return
        setHole(null)
        setTease(null)
        gapTimer.current = window.setTimeout(() => showNextRef.current(), gapMs(levelRef.current))
      }, ESCAPE_BEAT_MS)
    }, visibleMs(levelRef.current))
  }

  useEffect(() => {
    mountedRef.current = true
    showNextRef.current()
    return () => {
      mountedRef.current = false
      clearTimers()
    }
  }, [])

  function whack(index: number) {
    if (!aliveRef.current || holeRef.current !== index || doneRef.current) return
    aliveRef.current = false
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current)
    playGood()
    setBonk(index)
    holeRef.current = null
    caughtRef.current += 1
    caughtLevelRef.current += 1
    setCaught(caughtRef.current)

    const levelComplete = caughtLevelRef.current >= CATCHES_PER_LEVEL
    const finished = levelComplete && levelRef.current >= LEVELS
    if (finished) {
      doneRef.current = true
      setCaughtLevel(CATCHES_PER_LEVEL)
      setStars(starsFor(caughtRef.current, appearedRef.current))
    bonkTimer.current = window.setTimeout(() => {
      if (!mountedRef.current) return
      setHole(null)
      setBonk(null)
      setDone(true)
    }, CAUGHT_BEAT_MS)
      return
    }

    if (levelComplete) {
      levelRef.current += 1
      caughtLevelRef.current = 0
      setLevel(levelRef.current)
      setCaughtLevel(0)
      setFaster(true)
      window.setTimeout(() => {
        if (mountedRef.current) setFaster(false)
      }, 900)
    } else {
      setCaughtLevel(caughtLevelRef.current)
    }

    bonkTimer.current = window.setTimeout(() => {
      if (!mountedRef.current) return
      setHole(null)
      setBonk(null)
    }, CAUGHT_BEAT_MS)
    gapTimer.current = window.setTimeout(() => showNextRef.current(), gapMs(levelRef.current) + CAUGHT_BEAT_MS)
  }

  return (
    <Shell
      title="Крот"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={<span className="meta">Уровень {level} · {caughtLevel} из {CATCHES_PER_LEVEL}</span>}
    >
      {done ? (
        <Finish
          age={age}
          gameId="mole"
          stars={stars}
          detail={`Поймано ${caught} кротов за ${LEVELS} уровней`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <p className="prompt">Поймай крота</p>
          <p className="hint">{faster ? 'Быстрее!' : 'Нажми, когда он высунется'}</p>
          <div className="mole-board">
            {HOLES.map((index) => (
              <button
                key={index}
                type="button"
                className={cx('hole', hole === index && 'up', bonk === index && 'bonk', tease === index && 'tease')}
                onClick={() => whack(index)}
                aria-label={hole === index || tease === index ? 'Крот' : 'Норка'}
              >
                <span className="mole">
                  <MoleFace tongue={tease === index} />
                </span>
                {bonk === index && <CatchStars />}
              </button>
            ))}
          </div>
        </>
      )}
    </Shell>
  )
}

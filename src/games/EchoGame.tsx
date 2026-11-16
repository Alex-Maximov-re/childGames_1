import { useEffect, useRef, useState } from 'react'
import { playBad, playGood, playNote } from '../sound'
import { cx } from '../text'
import type { GameProps, StarScore } from '../types'
import { Dots, Finish, Shell } from '../ui'
import {
  judgeTap,
  levelFor,
  nextColor,
  pace,
  paletteFor,
  roundInLevel,
  starsForMistakes,
} from './echo'

type Phase = 'watch' | 'repeat'

export function EchoGame({ age, onExit, onReplay, next }: GameProps) {
  const palette = paletteFor(age)
  const [sequence, setSequence] = useState(() => [nextColor(palette)])
  const [phase, setPhase] = useState<Phase>('watch')
  const [lit, setLit] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [solved, setSolved] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const [roundKey, setRoundKey] = useState(0)

  const sequenceRef = useRef(sequence)
  const phaseRef = useRef<Phase>('watch')
  const cursorRef = useRef(0)
  const mistakesRef = useRef(0)
  const flashRef = useRef(0)
  const pointedRef = useRef(false)
  const timers = useRef<number[]>([])

  sequenceRef.current = sequence
  phaseRef.current = phase
  mistakesRef.current = mistakes

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((id) => window.clearTimeout(id))
      pending.length = 0
    }
  }, [])

  useEffect(() => {
    if (done) return
    let alive = true
    const waits: number[] = []
    const later = (ms: number) =>
      new Promise<void>((resolve) => {
        waits.push(window.setTimeout(() => resolve(), ms))
      })

    const chain = sequenceRef.current
    const colors = palette

    async function show() {
      phaseRef.current = 'watch'
      setPhase('watch')
      cursorRef.current = 0
      setWrong(null)
      setLit(null)
      await later(380)
      if (!alive) return
      const timing = pace(age, levelFor(Math.max(0, chain.length - 1)))
      for (const id of chain) {
        if (!alive) return
        setLit(id)
        const color = colors.find((item) => item.id === id)
        if (color) playNote(color.freq, (timing.on / 1000) * 0.75)
        await later(timing.on)
        if (!alive) return
        setLit(null)
        await later(timing.gap)
      }
      if (!alive) return
      phaseRef.current = 'repeat'
      setPhase('repeat')
    }

    void show()
    return () => {
      alive = false
      waits.forEach((id) => window.clearTimeout(id))
    }
  }, [age, done, palette, roundKey])

  function later(ms: number, run: () => void) {
    const id = window.setTimeout(run, ms)
    timers.current.push(id)
  }

  function press(id: string) {
    if (phaseRef.current !== 'repeat' || done) return
    const chain = sequenceRef.current
    const cursor = cursorRef.current
    const result = judgeTap(chain, cursor, id)
    if (result === 'wrong') {
      phaseRef.current = 'watch'
      setPhase('watch')
      setWrong(id)
      setLit(id)
      mistakesRef.current += 1
      setMistakes(mistakesRef.current)
      playBad()
      later(700, () => setRoundKey((key) => key + 1))
      return
    }
    const color = palette.find((item) => item.id === id)
    if (color) playNote(color.freq, 0.16)
    setLit(id)
    const flash = ++flashRef.current
    if (result === 'next') {
      cursorRef.current = cursor + 1
      later(140, () => {
        if (flashRef.current === flash && phaseRef.current === 'repeat') setLit(null)
      })
      return
    }
    phaseRef.current = 'watch'
    setPhase('watch')
    setSolved(chain.length)
    if (result === 'clear') {
      setStars(starsForMistakes(mistakesRef.current))
      setDone(true)
      return
    }
    if (chain.length % 3 === 0) playGood()
    later(640, () => {
      setSequence((prev) => [...prev, nextColor(palette)])
      setRoundKey((key) => key + 1)
    })
  }

  const level = levelFor(solved)
  const status = wrong
    ? 'Ошибка. Цепочка та же, смотри ещё раз'
    : phase === 'watch'
      ? solved > 0 && solved % 3 === 0
        ? `Уровень ${level}. Смотри`
        : 'Смотри и запоминай'
      : 'Повтори по порядку'

  return (
    <Shell
      title="Повторюшка"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={
        <>
          <span className="meta">Уровень {level} из 10</span>
          <Dots step={done ? 3 : roundInLevel(solved)} total={3} />
        </>
      }
    >
      {done ? (
        <Finish
          age={age}
          gameId="echo"
          stars={stars}
          detail={mistakes === 0 ? 'Все цепочки с первого раза' : `Ошибок: ${mistakes}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <p className="prompt echo-status" aria-live="polite">
            {status}
          </p>
          <div className={cx('echo-pads', phase === 'repeat' && 'ready', palette.length > 4 && 'five')}>
            {palette.map((color) => (
              <button
                key={color.id}
                type="button"
                className={cx('echo-pad', lit === color.id && 'lit', wrong === color.id && 'nope')}
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
                aria-disabled={phase !== 'repeat'}
                onPointerDown={(event) => {
                  event.preventDefault()
                  pointedRef.current = true
                  press(color.id)
                }}
                onClick={() => {
                  if (pointedRef.current) {
                    pointedRef.current = false
                    return
                  }
                  press(color.id)
                }}
              />
            ))}
          </div>
        </>
      )}
    </Shell>
  )
}

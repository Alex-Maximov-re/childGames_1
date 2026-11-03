import { useEffect, useState, type ReactNode } from 'react'
import { Luchik } from './art'
import { useSave } from './save'
import { playTap, playWin, speak } from './sound'
import { progressKey } from './catalog'
import { cx } from './text'
import type { AgeId, GameId, NextGame, StarScore } from './types'

const PRAISE: Record<StarScore, string> = {
  3: 'Блестяще!',
  2: 'Очень хорошо!',
  1: 'Хорошая попытка!',
}

const CONFETTI = ['#ff6b4a', '#ffd000', '#22c55e', '#38bdf8', '#8b5cf6', '#f472b6']

export function useSpeak(text: string): void {
  useEffect(() => {
    if (!text) return
    const id = window.setTimeout(() => speak(text), 50)
    return () => {
      window.clearTimeout(id)
      window.speechSynthesis?.cancel()
    }
  }, [text])
}

export function Dots({ step, total }: { step: number; total: number }) {
  const label = step >= total ? 'Игра пройдена' : `Задание ${step + 1} из ${total}`
  return (
    <div className="dots" aria-label={label}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index < step ? 'dot done' : index === step ? 'dot now' : 'dot'} />
      ))}
    </div>
  )
}

export function Stars({ value, xl = false }: { value: number; xl?: boolean }) {
  const safe = Math.max(0, Math.min(3, value))
  return (
    <span className={cx('stars', xl && 'xl')} aria-label={`Звёзды: ${safe} из 3`}>
      {[0, 1, 2].map((index) => (
        <span key={index} className={index < safe ? 'on' : ''} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

export function Shell({
  title,
  onExit,
  onRestart,
  step,
  total,
  meta,
  children,
}: {
  title: string
  onExit: () => void
  onRestart?: () => void
  step?: number
  total?: number
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="play">
      <header className="play-top">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="Назад">
          ←
        </button>
        <div className="grow">
          <h1>{title}</h1>
          {meta ?? (step !== undefined && total !== undefined ? <Dots step={step} total={total} /> : null)}
        </div>
        {onRestart && (
          <button type="button" className="icon-btn" onClick={onRestart} aria-label="Начать заново">
            ↻
          </button>
        )}
      </header>
      {children}
    </main>
  )
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => (
        <i
          key={index}
          style={{
            left: `${(index * 6.2) % 100}%`,
            background: CONFETTI[index % CONFETTI.length],
            animationDelay: `${(index % 8) * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

export function Finish({
  age,
  gameId,
  stars,
  detail,
  onReplay,
  onExit,
  next,
  prize,
}: {
  age: AgeId
  gameId: GameId
  stars: StarScore
  detail: string
  onReplay: () => void
  onExit: () => void
  next?: NextGame
  prize?: ReactNode
}) {
  const { record, save } = useSave()
  const key = progressKey(age, gameId)
  const stored = save.stars[key] ?? 0
  useEffect(() => {
    record(key, stars)
    const id = window.setTimeout(() => playWin(), 40)
    return () => window.clearTimeout(id)
  }, [key, stars, record])

  return (
    <section className="finish">
      {stars === 3 && <Confetti />}
      <Luchik />
      <h2>{PRAISE[stars]}</h2>
      <Stars value={stars} xl />
      <p className="muted">{detail}</p>
      {stored > stars && <p className="muted">На карточке игры останется прежний лучший результат.</p>}
      {prize}
      <div className="row-actions">
        <button type="button" className="btn primary" onClick={onReplay}>
          Ещё раз
        </button>
        <button type="button" className="ghost" onClick={onExit}>
          К списку игр
        </button>
        {next && (
          <button type="button" className="btn next-game" onClick={next.onGo}>
            <span className="next-kicker">Дальше</span>
            <span className="next-title">
              <span className="next-emoji" aria-hidden="true">
                {next.emoji}
              </span>
              {next.title}
            </span>
          </button>
        )}
      </div>
    </section>
  )
}

export function QuizFrame({
  age,
  title,
  gameId,
  step,
  total,
  done,
  stars,
  correct,
  onExit,
  onReplay,
  next,
  children,
}: {
  age: AgeId
  title: string
  gameId: GameId
  step: number
  total: number
  done: boolean
  stars: StarScore
  correct: number
  onExit: () => void
  onReplay: () => void
  next?: NextGame
  children: ReactNode
}) {
  return (
    <Shell
      title={title}
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      step={done ? total : step}
      total={total}
    >
      {done ? (
        <Finish
          age={age}
          gameId={gameId}
          stars={stars}
          detail={`С первой попытки: ${correct} из ${total}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        children
      )}
    </Shell>
  )
}

export function Speak({ text }: { text: string }) {
  const [note, setNote] = useState('')
  if (!text) return null
  return (
    <div className="speak-wrap">
      <button
        type="button"
        className="ghost"
        onClick={() => {
          if (speak(text)) setNote('')
          else setNote('Звук выключен. Включить его можно в разделе «Родителям».')
        }}
      >
        Проговорить
      </button>
      {note && <p className="hint">{note}</p>}
    </div>
  )
}

export function DigitPad({
  onDigit,
  onBack,
  onOk,
  locked,
}: {
  onDigit: (digit: string) => void
  onBack: () => void
  onOk: () => void
  locked?: boolean
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  return (
    <div className="pad">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          aria-disabled={locked}
          onClick={() => {
            if (locked) return
            playTap()
            onDigit(key)
          }}
        >
          {key}
        </button>
      ))}
      <button
        type="button"
        aria-label="Стереть"
        aria-disabled={locked}
        onClick={() => {
          if (locked) return
          playTap()
          onBack()
        }}
      >
        ⌫
      </button>
      <button
        type="button"
        aria-disabled={locked}
        onClick={() => {
          if (locked) return
          playTap()
          onDigit('0')
        }}
      >
        0
      </button>
      <button type="button" className="ok" aria-label="Проверить" aria-disabled={locked} onClick={onOk}>
        OK
      </button>
    </div>
  )
}

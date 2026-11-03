import { useLayoutEffect, useRef, useState } from 'react'
import { makeColorRounds } from '../data'
import { useQuiz } from '../quiz'
import type { GameProps } from '../types'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import { QuizFrame, Speak, useSpeak, Cheer } from '../ui'

export function ColorGame({ age, onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(() => makeColorRounds(age))
  const quiz = useQuiz(rounds.length)
  const missed = useRef(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const [goodId, setGoodId] = useState<string | null>(null)
  const round = rounds[quiz.step]
  const prompt = quiz.done || !round ? '' : `Найди ${round.target.name}`
  useSpeak(prompt)

  useLayoutEffect(() => {
    missed.current = false
    setWrong(null)
    setGoodId(null)
  }, [quiz.step])

  return (
    <QuizFrame
      age={age}
      title="Цвета"
      gameId="colors"
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
          <Speak text={prompt} />
          <div className="color-grid">
            {round.options.map((color) => (
              <button
                key={color.id}
                type="button"
                className={cx('swatch', wrong === color.id && 'shake', goodId === color.id && 'pop')}
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
                onClick={() => {
                  if (color.id === round.target.id) {
                    const started = quiz.advance(!missed.current)
                    if (!started) return
                    setWrong(null)
                    setGoodId(color.id)
                    playGood()
                    return
                  }
                  if (quiz.isLocked()) return
                  missed.current = true
                  setWrong(color.id)
                  playBad()
                }}
              >
                {goodId === color.id && <Cheer />}
              </button>
            ))}
          </div>
          <p className="hint" aria-live="polite">
            {wrong ? 'Попробуй другой кружок' : ''}
          </p>
        </>
      )}
    </QuizFrame>
  )
}

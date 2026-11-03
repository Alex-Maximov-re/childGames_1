import { useLayoutEffect, useRef, useState } from 'react'
import { ShapeArt } from '../art'
import { makeShapeRounds } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { QuizFrame, Speak, useSpeak, Cheer } from '../ui'

export function ShapeGame({ age, onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(() => makeShapeRounds(age))
  const quiz = useQuiz(rounds.length)
  const missed = useRef(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const [goodId, setGoodId] = useState<string | null>(null)
  const round = rounds[quiz.step]
  const prompt = quiz.done || !round ? '' : `Найди ${round.target.accusative}`
  useSpeak(prompt)

  useLayoutEffect(() => {
    missed.current = false
    setWrong(null)
    setGoodId(null)
  }, [quiz.step])

  return (
    <QuizFrame
      age={age}
      title="Фигуры"
      gameId="shapes"
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
          <div className="choice-grid">
            {round.options.map((shape) => (
              <button
                key={shape.id}
                type="button"
                className={cx('shape-btn', wrong === shape.id && 'shake', goodId === shape.id && 'pop')}
                aria-label={shape.label}
                onClick={() => {
                  if (shape.id === round.target.id) {
                    const started = quiz.advance(!missed.current)
                    if (!started) return
                    setWrong(null)
                    setGoodId(shape.id)
                    playGood()
                    return
                  }
                  if (quiz.isLocked()) return
                  missed.current = true
                  setWrong(shape.id)
                  playBad()
                }}
              >
                <ShapeArt type={shape.id} />
                {goodId === shape.id && <Cheer />}
              </button>
            ))}
          </div>
          <p className="hint" aria-live="polite">
            {wrong ? 'Попробуй другую фигуру' : ''}
          </p>
        </>
      )}
    </QuizFrame>
  )
}

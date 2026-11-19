import { useLayoutEffect, useRef, useState } from 'react'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { Cheer, QuizFrame, Speak, useSpeak } from '../ui'
import { makeGuessRounds } from './guess'

const ROUNDS = 20

export function GuessGame({ age, onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(() => makeGuessRounds())
  const quiz = useQuiz(rounds.length)
  const missed = useRef(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const [goodId, setGoodId] = useState<string | null>(null)
  const round = rounds[quiz.step]
  const prompt = quiz.done || !round ? '' : round.answer.name
  useSpeak(prompt)

  useLayoutEffect(() => {
    missed.current = false
    setWrong(null)
    setGoodId(null)
  }, [quiz.step])

  return (
    <QuizFrame
      age={age}
      title="Угадать животное"
      gameId="guess"
      step={quiz.done ? ROUNDS : quiz.step}
      total={ROUNDS}
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
          <div className="guess-grid">
            {round.options.map((animal) => (
              <button
                key={animal.id}
                type="button"
                className={cx('guess-card', wrong === animal.id && 'bad shake', goodId === animal.id && 'good pop')}
                aria-label={animal.name}
                onClick={() => {
                  if (animal.id === round.answer.id) {
                    const started = quiz.advance(!missed.current)
                    if (!started) return
                    setWrong(null)
                    setGoodId(animal.id)
                    playGood()
                    return
                  }
                  if (quiz.isLocked()) return
                  missed.current = true
                  setWrong(animal.id)
                  playBad()
                }}
              >
                <img
                  className="guess-photo"
                  src={`${import.meta.env.BASE_URL}animals/${animal.id}.jpg`}
                  alt=""
                />
                {goodId === animal.id && <Cheer />}
              </button>
            ))}
          </div>
          <p className="hint" aria-live="polite">
            {wrong ? 'Посмотри на картинки ещё раз' : ''}
          </p>
        </>
      )}
    </QuizFrame>
  )
}

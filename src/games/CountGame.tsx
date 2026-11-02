import { useLayoutEffect, useState } from 'react'
import { makeCountRounds } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { QuizFrame, Speak, useSpeak } from '../ui'

export function CountGame({ onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(makeCountRounds)
  const quiz = useQuiz(rounds.length)
  const [picked, setPicked] = useState<number | null>(null)
  const round = rounds[quiz.step]
  const prompt = quiz.done || !round ? '' : round.question
  useSpeak(prompt)

  useLayoutEffect(() => {
    setPicked(null)
  }, [quiz.step])

  return (
    <QuizFrame
      title="Сосчитай"
      gameId="count"
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
          <div className="items" aria-hidden="true">
            {Array.from({ length: round.n }, (_, index) => (
              <span key={`${quiz.step}-${index}`} className="item" style={{ animationDelay: `${index * 35}ms` }}>
                {round.emoji}
              </span>
            ))}
          </div>
          <div className="num-choices">
            {round.options.map((option) => (
              <button
                key={option}
                type="button"
                className={cx(
                  'choice',
                  picked !== null && option === round.n && 'good',
                  picked === option && option !== round.n && 'bad shake',
                )}
                onClick={() => {
                  if (quiz.isLocked()) return
                  setPicked(option)
                  if (option === round.n) playGood()
                  else playBad()
                  quiz.advance(option === round.n, option === round.n ? 600 : 1000)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </QuizFrame>
  )
}

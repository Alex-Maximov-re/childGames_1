import { useLayoutEffect, useState } from 'react'
import { makeOddRounds } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { QuizFrame, Speak, useSpeak } from '../ui'

export function OddGame({ onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(makeOddRounds)
  const quiz = useQuiz(rounds.length)
  const [picked, setPicked] = useState<number | null>(null)
  const round = rounds[quiz.step]
  const prompt = quiz.done || !round ? '' : 'Что здесь лишнее?'
  const say =
    quiz.done || !round ? '' : `Что здесь лишнее? ${round.items.map((item) => item.label).join(', ')}`
  useSpeak(say)

  useLayoutEffect(() => {
    setPicked(null)
  }, [quiz.step])

  return (
    <QuizFrame
      title="Что лишнее"
      gameId="odd"
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
          <Speak text={say} />
          <div className="quad">
            {round.items.map((item, index) => (
              <button
                key={item.label}
                type="button"
                className={cx(
                  'choice',
                  picked !== null && index === round.answer && 'good',
                  picked === index && index !== round.answer && 'bad shake',
                )}
                onClick={() => {
                  if (quiz.isLocked()) return
                  setPicked(index)
                  const ok = index === round.answer
                  if (ok) playGood()
                  else playBad()
                  quiz.advance(ok, 1300)
                }}
              >
                <span className="emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                {item.label}
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{round.why}</p>}
        </>
      )}
    </QuizFrame>
  )
}

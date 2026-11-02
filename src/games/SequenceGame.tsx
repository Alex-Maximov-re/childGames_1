import { useLayoutEffect, useState } from 'react'
import { makeSeqRounds } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { QuizFrame, Speak, useSpeak } from '../ui'

export function SequenceGame({ onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(makeSeqRounds)
  const quiz = useQuiz(rounds.length)
  const [picked, setPicked] = useState<number | null>(null)
  const round = rounds[quiz.step]
  const say = quiz.done || !round ? '' : `Какое число дальше: ${round.row.join(', ')}?`
  useSpeak(say)

  useLayoutEffect(() => {
    setPicked(null)
  }, [quiz.step])

  return (
    <QuizFrame
      title="Продолжи ряд"
      gameId="sequence"
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
          <p className="prompt">Какое число дальше?</p>
          <Speak text={say} />
          <div className="seq">
            {round.row.map((value, index) => (
              <span key={`${quiz.step}-${index}`}>{value}</span>
            ))}
            <span className="q">?</span>
          </div>
          <div className="num-choices">
            {round.options.map((option) => (
              <button
                key={option}
                type="button"
                className={cx(
                  'choice',
                  picked !== null && option === round.answer && 'good',
                  picked === option && option !== round.answer && 'bad shake',
                )}
                onClick={() => {
                  if (quiz.isLocked()) return
                  setPicked(option)
                  const ok = option === round.answer
                  if (ok) playGood()
                  else playBad()
                  quiz.advance(ok, 1200)
                }}
              >
                {option}
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{round.why}</p>}
        </>
      )}
    </QuizFrame>
  )
}

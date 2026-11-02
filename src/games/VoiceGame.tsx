import { useLayoutEffect, useRef, useState } from 'react'
import { makeVoiceRounds } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { QuizFrame, Speak, useSpeak } from '../ui'

export function VoiceGame({ onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(makeVoiceRounds)
  const quiz = useQuiz(rounds.length)
  const missed = useRef(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const [goodId, setGoodId] = useState<string | null>(null)
  const round = rounds[quiz.step]
  const prompt = quiz.done || !round ? '' : round.say
  useSpeak(prompt)

  useLayoutEffect(() => {
    missed.current = false
    setWrong(null)
    setGoodId(null)
  }, [quiz.step])

  return (
    <QuizFrame
      title="Кто говорит"
      gameId="voices"
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
          <div className="hero" aria-hidden="true">
            {round.emoji}
          </div>
          <div className="choices">
            {round.options.map((sound) => (
              <button
                key={sound}
                type="button"
                className={cx('choice', wrong === sound && 'bad shake', goodId === sound && 'good pop')}
                onClick={() => {
                  if (sound === round.answer) {
                    const started = quiz.advance(!missed.current)
                    if (!started) return
                    setWrong(null)
                    setGoodId(sound)
                    playGood()
                    return
                  }
                  if (quiz.isLocked()) return
                  missed.current = true
                  setWrong(sound)
                  playBad()
                }}
              >
                {sound}
              </button>
            ))}
          </div>
          <p className="hint" aria-live="polite">
            {wrong ? 'Попробуй другой звук' : ''}
          </p>
        </>
      )}
    </QuizFrame>
  )
}

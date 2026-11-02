import { useEffect, useRef, useState } from 'react'
import { makeMathRounds } from '../data'
import { useQuiz } from '../quiz'
import { playBad, playGood } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { DigitPad, QuizFrame, Speak, useSpeak } from '../ui'

export function MathGame({ age, onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(() => makeMathRounds(age))
  const quiz = useQuiz(rounds.length)
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<'good' | 'bad' | ''>('')
  const inputRef = useRef('')
  const round = rounds[quiz.step]
  const say = quiz.done || !round ? '' : round.say
  useSpeak(say)

  useEffect(() => {
    inputRef.current = ''
    setInput('')
    setFlash('')
  }, [quiz.step])

  function push(digit: string) {
    if (quiz.isLocked() || inputRef.current.length >= 3) return
    inputRef.current += digit
    setInput(inputRef.current)
    setFlash('')
  }

  function back() {
    if (quiz.isLocked()) return
    inputRef.current = inputRef.current.slice(0, -1)
    setInput(inputRef.current)
    setFlash('')
  }

  function submit() {
    if (quiz.isLocked() || !round || inputRef.current === '') return
    const ok = Number(inputRef.current) === round.answer
    setFlash(ok ? 'good' : 'bad')
    if (ok) playGood()
    else playBad()
    quiz.advance(ok, ok ? 550 : 1100)
  }

  useEffect(() => {
    if (!round || quiz.done) return
    function onKey(event: KeyboardEvent) {
      if (event.key >= '0' && event.key <= '9') push(event.key)
      else if (event.key === 'Backspace') {
        event.preventDefault()
        back()
      } else if (event.key === 'Enter') submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <QuizFrame
      age={age}
      title="Примеры"
      gameId="math"
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
          <p className="expr" aria-live="polite">
            {round.text}
          </p>
          <Speak text={say} />
          <p className={cx('answer-line', flash)}>{input || '…'}</p>
          {flash === 'bad' && <p className="why">Ответ: {round.answer}</p>}
          <DigitPad onDigit={push} onBack={back} onOk={submit} locked={quiz.isLocked()} />
        </>
      )}
    </QuizFrame>
  )
}

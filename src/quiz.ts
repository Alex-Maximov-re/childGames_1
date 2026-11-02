import { useEffect, useRef, useState } from 'react'
import { starsFrom } from './text'
import type { StarScore } from './types'

export function useQuiz(total: number) {
  const [step, setStep] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const lock = useRef(false)
  const timer = useRef<number | null>(null)
  const stepRef = useRef(0)
  const correctRef = useRef(0)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  function advance(countedCorrect: boolean, delay = 700): boolean {
    if (lock.current || done) return false
    lock.current = true
    const nextCorrect = correctRef.current + (countedCorrect ? 1 : 0)
    const nextStep = stepRef.current + 1
    correctRef.current = nextCorrect
    if (countedCorrect) setCorrect(nextCorrect)
    timer.current = window.setTimeout(() => {
      if (nextStep >= total) {
        setStars(starsFrom(nextCorrect, total))
        setDone(true)
      } else {
        stepRef.current = nextStep
        setStep(nextStep)
        lock.current = false
      }
    }, delay)
    return true
  }

  function isLocked(): boolean {
    return lock.current
  }

  return { step, correct, done, stars, advance, isLocked, total }
}

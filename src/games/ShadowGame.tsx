import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useQuiz } from '../quiz'
import { playBad, playGood, speak } from '../sound'
import { cx } from '../text'
import type { GameProps } from '../types'
import { Finish, Shell, Speak } from '../ui'
import { makeShadowRounds } from './shadow'
import type { ShadowAnimal } from './shadowAnimals'

const ROUNDS = 20

export function ShadowGame({ age, onExit, onReplay, next }: GameProps) {
  const [rounds] = useState(() => makeShadowRounds())
  const quiz = useQuiz(rounds.length)
  const misses = useRef(0)
  const [pick, setPick] = useState<{ kind: 'animal' | 'shadow'; id: string } | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [wrong, setWrong] = useState<string[]>([])
  const round = rounds[quiz.step]

  useEffect(() => {
    if (quiz.done) return
    const id = window.setTimeout(() => speak('Найди тень'), 80)
    return () => window.clearTimeout(id)
  }, [quiz.step, quiz.done])

  useLayoutEffect(() => {
    misses.current = 0
    setPick(null)
    setMatched([])
    setWrong([])
  }, [quiz.step])

  useEffect(() => {
    if (wrong.length === 0) return
    const id = window.setTimeout(() => setWrong([]), 480)
    return () => window.clearTimeout(id)
  }, [wrong])

  function tap(kind: 'animal' | 'shadow', id: string) {
    if (quiz.isLocked() || matched.includes(id)) return
    if (!pick || pick.kind === kind) {
      setPick({ kind, id })
      return
    }
    if (pick.id === id) {
      const nextMatched = [...matched, id]
      setMatched(nextMatched)
      setPick(null)
      playGood()
      if (nextMatched.length === 4) quiz.advance(misses.current === 0, 650)
      return
    }
    misses.current += 1
    setWrong([pick.id, id])
    setPick(null)
    playBad()
  }

  return (
    <Shell
      title="Угадай по тени"
      onExit={onExit}
      onRestart={quiz.done ? undefined : onReplay}
      meta={quiz.done ? 'Готово' : `Раунд ${quiz.step + 1} из ${ROUNDS}`}
    >
      {quiz.done ? (
        <Finish
          age={age}
          gameId="shadow"
          stars={quiz.stars}
          detail={`Без ошибок: ${quiz.correct} из ${ROUNDS}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        round && (
          <>
            <p className="prompt">Найди тень</p>
            <Speak text="Найди тень" />
            <ShadowRow
              kind="shadow"
              items={round.shadows}
              pick={pick}
              matched={matched}
              wrong={wrong}
              onTap={tap}
            />
            <ShadowRow
              kind="animal"
              items={round.animals}
              pick={pick}
              matched={matched}
              wrong={wrong}
              onTap={tap}
            />
          </>
        )
      )}
    </Shell>
  )
}

function ShadowRow({
  kind,
  items,
  pick,
  matched,
  wrong,
  onTap,
}: {
  kind: 'animal' | 'shadow'
  items: ShadowAnimal[]
  pick: { kind: 'animal' | 'shadow'; id: string } | null
  matched: string[]
  wrong: string[]
  onTap: (kind: 'animal' | 'shadow', id: string) => void
}) {
  return (
    <div className={cx('shadow-grid', kind === 'shadow' && 'is-shadow')}>
      {items.map((animal) => {
        const chosen = pick?.kind === kind && pick.id === animal.id
        const done = matched.includes(animal.id)
        const bad = wrong.includes(animal.id)
        return (
          <button
            key={animal.id}
            type="button"
            className={cx('shadow-card', kind, chosen && 'on', done && 'done', bad && 'bad shake')}
            aria-label={kind === 'shadow' ? `Тень: ${animal.name}` : animal.name}
            onClick={() => onTap(kind, animal.id)}
          >
            <img
              src={`${import.meta.env.BASE_URL}shadow/${animal.id}.png`}
              alt=""
              draggable={false}
            />
          </button>
        )
      })}
    </div>
  )
}

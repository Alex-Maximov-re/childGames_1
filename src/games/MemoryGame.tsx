import { useEffect, useRef, useState } from 'react'
import { makeDeck } from '../data'
import { playBad, playGood, playTap } from '../sound'
import { cx } from '../text'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'

function memoryStars(moves: number): StarScore {
  if (moves <= 10) return 3
  if (moves <= 16) return 2
  return 1
}

export function MemoryGame({ onExit, onReplay, next }: GameProps) {
  const [deck] = useState(makeDeck)
  const [open, setOpen] = useState<number[]>([])
  const [known, setKnown] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const openRef = useRef<number[]>([])
  const knownRef = useRef<number[]>([])
  const movesRef = useRef(0)
  const doneRef = useRef(false)
  const lockRef = useRef(false)
  const timer = useRef<number | null>(null)
  useSpeak(done ? '' : 'Открой две одинаковые карточки')

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  function turn(index: number) {
    if (doneRef.current || lockRef.current) return
    if (knownRef.current.includes(index) || openRef.current.includes(index)) return
    const nextOpen = [...openRef.current, index]
    openRef.current = nextOpen
    setOpen(nextOpen)
    playTap()
    if (nextOpen.length < 2) return

    const nextMoves = movesRef.current + 1
    movesRef.current = nextMoves
    setMoves(nextMoves)
    const [first, second] = nextOpen
    if (deck[first].id === deck[second].id) {
      const nextKnown = [...knownRef.current, first, second]
      knownRef.current = nextKnown
      openRef.current = []
      setKnown(nextKnown)
      setOpen([])
      playGood()
      if (nextKnown.length === deck.length) {
        doneRef.current = true
        setStars(memoryStars(nextMoves))
        setDone(true)
      }
      return
    }

    playBad()
    lockRef.current = true
    timer.current = window.setTimeout(() => {
      openRef.current = []
      setOpen([])
      lockRef.current = false
    }, 750)
  }

  return (
    <Shell
      title="Пары"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={<span className="meta">Ходы: {moves}</span>}
    >
      {done ? (
        <Finish
          gameId="memory"
          stars={stars}
          detail={`Ходы: ${moves}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
        />
      ) : (
        <>
          <p className="prompt">Найди пары</p>
          <div className="memory">
            {deck.map((card, index) => {
              const faceUp = open.includes(index) || known.includes(index)
              return (
                <button
                  key={card.uid}
                  type="button"
                  className={cx('card', faceUp && 'on', known.includes(index) && 'known')}
                  onClick={() => turn(index)}
                  aria-label={faceUp ? card.name : 'Закрытая карточка'}
                >
                  <span className="card-inner">
                    <span className="face back" aria-hidden="true">
                      ★
                    </span>
                    <span className="face front" aria-hidden="true">
                      {card.emoji}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </Shell>
  )
}

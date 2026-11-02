import { useCallback, useEffect, useRef, useState } from 'react'
import { puzzleArtUrl, sliceStyle } from '../art'
import { randInt } from '../random'
import { playTap } from '../sound'
import type { GameProps, StarScore } from '../types'
import { Finish, Shell, useSpeak } from '../ui'

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0]

function neighbors(index: number): number[] {
  const row = Math.floor(index / 3)
  const column = index % 3
  const list: number[] = []
  if (row > 0) list.push(index - 3)
  if (row < 2) list.push(index + 3)
  if (column > 0) list.push(index - 1)
  if (column < 2) list.push(index + 1)
  return list
}

function walk(): number[] {
  const tiles = [...SOLVED]
  let previous = -1
  for (let move = 0; move < 32; move += 1) {
    const empty = tiles.indexOf(0)
    const options = neighbors(empty).filter((index) => index !== previous)
    const pool = options.length > 0 ? options : neighbors(empty)
    const choice = pool[randInt(0, pool.length - 1)]
    const leaving = tiles[choice]
    tiles[choice] = tiles[empty]
    tiles[empty] = leaving
    previous = empty
  }
  return tiles
}

function solved(tiles: number[]): boolean {
  return tiles.every((tile, index) => tile === SOLVED[index])
}

function scramble(): number[] {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const tiles = walk()
    if (!solved(tiles)) return tiles
  }
  return walk()
}

function puzzleStars(moves: number): StarScore {
  if (moves <= 40) return 3
  if (moves <= 75) return 2
  return 1
}

export function PuzzleGame({ onExit, onReplay, next }: GameProps) {
  const [tiles, setTiles] = useState(scramble)
  const [moves, setMoves] = useState(0)
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState<StarScore>(1)
  const tilesRef = useRef(tiles)
  const movesRef = useRef(0)
  const doneRef = useRef(false)
  useSpeak(done ? '' : 'Нажми кусочек рядом с пустой клеткой')

  const slide = useCallback((index: number) => {
    if (doneRef.current) return
    const current = tilesRef.current
    const empty = current.indexOf(0)
    const rowGap = Math.abs(Math.floor(index / 3) - Math.floor(empty / 3))
    const columnGap = Math.abs((index % 3) - (empty % 3))
    if (rowGap + columnGap !== 1) return
    const nextTiles = current.slice()
    nextTiles[empty] = nextTiles[index]
    nextTiles[index] = 0
    tilesRef.current = nextTiles
    setTiles(nextTiles)
    const nextMoves = movesRef.current + 1
    movesRef.current = nextMoves
    setMoves(nextMoves)
    playTap()
    if (solved(nextTiles)) {
      doneRef.current = true
      setStars(puzzleStars(nextMoves))
      setDone(true)
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const empty = tilesRef.current.indexOf(0)
      const column = empty % 3
      const row = Math.floor(empty / 3)
      let from = -1
      if (event.key === 'ArrowLeft' && column > 0) from = empty - 1
      if (event.key === 'ArrowRight' && column < 2) from = empty + 1
      if (event.key === 'ArrowUp' && row > 0) from = empty - 3
      if (event.key === 'ArrowDown' && row < 2) from = empty + 3
      if (from >= 0) {
        event.preventDefault()
        slide(from)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slide])

  return (
    <Shell
      title="Картинка"
      onExit={onExit}
      onRestart={done ? undefined : onReplay}
      meta={<span className="meta">Ходы: {moves}</span>}
    >
      {done ? (
        <Finish
          gameId="puzzle"
          stars={stars}
          detail={`Ходы: ${moves}`}
          onReplay={onReplay}
          onExit={onExit}
          next={next}
          prize={<img className="prize" alt="Собранный рисунок: домик, солнце и дерево" src={puzzleArtUrl} />}
        />
      ) : (
        <>
          <p className="prompt">Собери рисунок</p>
          <p className="muted center">Нажми кусочек рядом с пустой клеткой</p>
          <div className="board">
            {tiles.map((value, index) => (
              <button
                key={index}
                type="button"
                className={value === 0 ? 'cell empty' : 'cell'}
                onClick={() => slide(index)}
                aria-label={value === 0 ? 'Пустая клетка' : `Кусочек ${value}`}
              >
                {value !== 0 && (
                  <>
                    <span className="slice" style={sliceStyle(value)} />
                    <span className="slice-num">{value}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </Shell>
  )
}

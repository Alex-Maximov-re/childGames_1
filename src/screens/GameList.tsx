import { ages, games } from '../catalog'
import { useSave } from '../save'
import { cx } from '../text'
import type { AgeId, GameId } from '../types'
import { Stars } from '../ui'

export function GameList({
  age,
  onAge,
  onBack,
  onPlay,
}: {
  age: AgeId
  onAge: (age: AgeId) => void
  onBack: () => void
  onPlay: (id: GameId) => void
}) {
  const { save } = useSave()
  const current = ages.find((item) => item.id === age)
  if (!current) return null
  const list = games.filter((game) => game.age === age)

  return (
    <main>
      <header className="play-top">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="На главную">
          ←
        </button>
        <div className="grow">
          <h1>{current.title}</h1>
          <p className="muted">{current.text}</p>
        </div>
      </header>
      <div className="chips">
        {ages.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx('chip', item.id === age && 'on')}
            aria-pressed={item.id === age}
            onClick={() => onAge(item.id)}
          >
            {item.range}
          </button>
        ))}
      </div>
      <div className="game-grid">
        {list.map((game) => (
          <button key={game.id} type="button" className="game-card" onClick={() => onPlay(game.id)}>
            <span className="blob sm" aria-hidden="true">
              {game.emoji}
            </span>
            <span className="body">
              <strong>{game.title}</strong>
              <span className="muted">{game.blurb}</span>
              <Stars value={save.stars[game.id] ?? 0} />
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}

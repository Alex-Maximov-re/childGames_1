import { useState } from 'react'
import { ages, games, progressKey } from '../catalog'
import { useSave } from '../save'
import { cx } from '../text'
import type { AgeId, GameId } from '../types'
import { Stars } from '../ui'

export function AllGames({
  onBack,
  onPlay,
}: {
  onBack: () => void
  onPlay: (id: GameId) => void
}) {
  const { save } = useSave()
  const [selectedAge, setSelectedAge] = useState<AgeId | 'all'>('all')

  const filteredGames =
    selectedAge === 'all'
      ? games
      : games.filter((game) => game.age === selectedAge)

  const groupedGames = ages.map((age) => ({
    ...age,
    games: games.filter((game) => game.age === age.id),
  })).filter((group) => group.games.length > 0)

  return (
    <main>
      <header className="play-top">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="На главную">
          ←
        </button>
        <div className="grow">
          <h1>Все игры</h1>
          <p className="muted">Вся коллекция игр Лучика</p>
        </div>
      </header>

      <div className="chips">
        <button
          type="button"
          className={cx('chip', selectedAge === 'all' && 'on')}
          aria-pressed={selectedAge === 'all'}
          onClick={() => setSelectedAge('all')}
        >
          Все
        </button>
        {ages.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx('chip', selectedAge === item.id && 'on')}
            aria-pressed={selectedAge === item.id}
            onClick={() => setSelectedAge(item.id)}
          >
            {item.range}
          </button>
        ))}
      </div>

      {selectedAge === 'all' ? (
        <div className="game-grid">
          {groupedGames.map((ageGroup) => (
            <div key={ageGroup.id} className="age-section">
              <h2 className="age-title">
                <span className="age-emoji">{ageGroup.emoji}</span>
                {ageGroup.title}
              </h2>
              <div className="game-grid">
                {ageGroup.games.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    className="game-card"
                    onClick={() => onPlay(game.id)}
                  >
                    <span className="blob sm" aria-hidden="true">
                      {game.emoji}
                    </span>
                    <span className="body">
                      <strong>{game.title}</strong>
                      <span className="muted">{game.blurb}</span>
                      <Stars value={save.stars[progressKey(ageGroup.id, game.id)] ?? 0} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="game-grid">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              type="button"
              className="game-card"
              onClick={() => onPlay(game.id)}
            >
              <span className="blob sm" aria-hidden="true">
                {game.emoji}
              </span>
              <span className="body">
                <strong>{game.title}</strong>
                <span className="muted">{game.blurb}</span>
                <Stars value={save.stars[progressKey(game.age, game.id)] ?? 0} />
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}

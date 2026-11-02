import { Luchik } from '../art'
import { ages, games } from '../catalog'
import { usePlatform } from '../platform'
import { platformFoot, platformSubtitle } from '../product'
import { useSave } from '../save'
import { cx, plural } from '../text'
import type { AgeId } from '../types'

export function Home({ onAge, onParents }: { onAge: (age: AgeId) => void; onParents: () => void }) {
  const platform = usePlatform()
  const { save } = useSave()
  const earned = games.reduce((sum, game) => sum + (save.stars[game.id] ?? 0), 0)
  const max = games.length * 3

  return (
    <main>
      <header className="top-row">
        <div className="brand">
          <Luchik />
          <div>
            <h1>Лучик</h1>
            <p className="muted">{platformSubtitle(platform)}</p>
          </div>
        </div>
        <button type="button" className="ghost" onClick={onParents}>
          Родителям
        </button>
      </header>
      <p className="score">
        {earned === 0
          ? 'Звёзды появятся после первой игры'
          : `${earned} ${plural(earned, 'звезда', 'звезды', 'звёзд')} из ${max}`}
      </p>
      <div className="age-grid">
        {ages.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx('age-card', item.id, save.age === item.id && 'current')}
            onClick={() => onAge(item.id)}
          >
            <span className="blob" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="age-copy">
              <span className="pill">{item.range}</span>
              <strong>{item.title}</strong>
              <span className="muted">{item.text}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="foot">{platformFoot(platform)}</p>
    </main>
  )
}

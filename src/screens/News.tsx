import { useState } from 'react'
import { formatNewsDate, groupNews, NEWS, NEWS_PREVIEW } from '../news'

export function News({ onExit }: { onExit: () => void }) {
  const [all, setAll] = useState(false)
  const shown = all ? NEWS : NEWS.slice(0, NEWS_PREVIEW)
  const groups = groupNews(shown)
  const hidden = NEWS.length - NEWS_PREVIEW

  return (
    <main className="news">
      <header className="play-top">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="На главную">
          ←
        </button>
        <div className="grow">
          <h1>Что нового</h1>
        </div>
      </header>
      <p className="muted news-lead">Коротко о том, что изменилось в Лучике.</p>
      {groups.map((group) => (
        <section key={group.date} className="news-day">
          <h2>{formatNewsDate(group.date)}</h2>
          <ul>
            {group.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ))}
      {hidden > 0 && (
        <button type="button" className="btn news-more" onClick={() => setAll((value) => !value)}>
          {all ? 'Только 10 последних' : 'Показать всю историю'}
        </button>
      )}
    </main>
  )
}

import { useEffect, useRef, useState } from 'react'
import { games } from '../catalog'
import { usePlatform } from '../platform'
import { APP_VERSION, platformTitle, platformWhere } from '../product'
import { randInt } from '../random'
import { useSave } from '../save'
import { playBad, playGood } from '../sound'
import { cx, plural } from '../text'
import { DigitPad } from '../ui'

export function ParentGate({ onExit, onSuccess }: { onExit: () => void; onSuccess: () => void }) {
  const [task] = useState(() => {
    const left = randInt(6, 14)
    const right = randInt(6, 14)
    return { left, right, answer: left + right }
  })
  const [value, setValue] = useState('')
  const [tries, setTries] = useState(0)
  const [error, setError] = useState(false)
  const valueRef = useRef('')
  const triesRef = useRef(0)
  const failed = tries >= 3

  function push(digit: string) {
    if (failed || valueRef.current.length >= 2) return
    valueRef.current += digit
    setValue(valueRef.current)
    setError(false)
  }

  function back() {
    if (failed) return
    valueRef.current = valueRef.current.slice(0, -1)
    setValue(valueRef.current)
    setError(false)
  }

  function submit() {
    if (failed || valueRef.current === '') return
    if (Number(valueRef.current) === task.answer) {
      playGood()
      onSuccess()
      return
    }
    triesRef.current += 1
    setTries(triesRef.current)
    setError(true)
    valueRef.current = ''
    setValue('')
    playBad()
  }

  useEffect(() => {
    if (failed) return
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
    <main>
      <header className="play-top">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="На главную">
          ←
        </button>
        <div className="grow">
          <h1>Для взрослых</h1>
        </div>
      </header>
      {failed ? (
        <section className="panel">
          <p>Пример не сошёлся. Попросите взрослого и откройте раздел ещё раз с главной.</p>
          <button type="button" className="btn primary" onClick={onExit}>
            На главную
          </button>
        </section>
      ) : (
        <section className="panel">
          <p>Дальше звук, звёзды и короткие правила. Решите пример, чтобы открыть раздел.</p>
          <p className="expr">
            {task.left} + {task.right}
          </p>
          <p className={cx('answer-line', error && 'bad')}>{value || '…'}</p>
          {error && <p className="hint">Попыток осталось: {3 - tries}</p>}
          <DigitPad onDigit={push} onBack={back} onOk={submit} />
        </section>
      )}
    </main>
  )
}

export function Parents({ onExit }: { onExit: () => void }) {
  const platform = usePlatform()
  const { save, toggleSound, resetProgress } = useSave()
  const where = platformWhere(platform)
  const [ask, setAsk] = useState(false)
  const [note, setNote] = useState('')
  const earned = games.reduce((sum, game) => sum + (save.stars[game.id] ?? 0), 0)

  return (
    <main>
      <header className="play-top">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="На главную">
          ←
        </button>
        <div className="grow">
          <h1>Родителям</h1>
        </div>
      </header>
      <section className="panel">
        <h2>Звук</h2>
        <button
          type="button"
          role="switch"
          aria-checked={save.sound}
          className={save.sound ? 'switch on' : 'switch'}
          onClick={toggleSound}
        >
          <span className="knob" aria-hidden="true" />
          {save.sound ? 'Звук включён' : 'Звук выключен'}
        </button>
        <p>Так включаются мелодии и голос, который читает задания.</p>
      </section>
      <section className="panel">
        <h2>Звёзды</h2>
        <p>
          Сейчас сохранено {earned} {plural(earned, 'звезда', 'звезды', 'звёзд')}. Они лежат только {where}.
        </p>
        {ask ? (
          <div className="row-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                resetProgress()
                setAsk(false)
                setNote(platform === 'web' ? 'Звёзды стёрты в этом браузере.' : 'Звёзды стёрты с этого устройства.')
              }}
            >
              Да, стереть
            </button>
            <button type="button" className="btn" onClick={() => setAsk(false)}>
              Оставить
            </button>
          </div>
        ) : (
          <button type="button" className="btn" onClick={() => setAsk(true)}>
            Стереть звёзды
          </button>
        )}
        {note && <p className="hint">{note}</p>}
      </section>
      <section className="panel privacy">
        <h2>Без рекламы и без анкет</h2>
        <p>Лучик не просит имя, почту и фото. В игре нет рекламы и покупок.</p>
        <p>Ответы и звёзды не отправляются на сервер. Голос и мелодии создаются на самом устройстве.</p>
        <p>Этот раздел закрыт примером, чтобы его не открывали посреди игры.</p>
        <p className="muted">
          {platformTitle(platform)}, версия {APP_VERSION}
        </p>
      </section>
    </main>
  )
}

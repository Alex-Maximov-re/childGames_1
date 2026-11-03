import { Component, useEffect, useState, type ReactNode } from 'react'
import { ages, games } from './catalog'
import { gameViews } from './games'
import { setBackListener, usePlatform } from './platform'
import { platformTitle } from './product'
import { unlockAudio } from './sound'
import { Nav, type NavPlace } from './Nav'
import { Home } from './screens/Home'
import { GameList } from './screens/GameList'
import { ParentGate, Parents } from './screens/Parents'
import { useSave } from './save'
import type { AgeId, GameId } from './types'

type Screen =
  | { name: 'home' }
  | { name: 'list'; age: AgeId }
  | { name: 'play'; age: AgeId; id: GameId }
  | { name: 'gate' }
  | { name: 'parents' }

export function App() {
  const platform = usePlatform()
  const { setAge } = useSave()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [nonce, setNonce] = useState(0)

  const loc =
    screen.name === 'play'
      ? `play-${screen.id}-${nonce}`
      : screen.name === 'list'
        ? `list-${screen.age}`
        : screen.name

  useEffect(() => {
    window.scrollTo(0, 0)
    if (screen.name === 'list') {
      const age = ages.find((item) => item.id === screen.age)
      document.title = age ? `${age.title} — ${platformTitle(platform)}` : platformTitle(platform)
      return
    }
    if (screen.name === 'play') {
      const game = games.find((item) => item.id === screen.id)
      document.title = game ? `${game.title} — ${platformTitle(platform)}` : platformTitle(platform)
      return
    }
    if (screen.name === 'gate' || screen.name === 'parents') {
      document.title = `Родителям — ${platformTitle(platform)}`
      return
    }
    document.title = `${platformTitle(platform)} — игры для детей`
  }, [loc, screen, platform])

  useEffect(() => {
    return setBackListener(() => {
      if (screen.name === 'home') return false
      if (screen.name === 'play') setScreen({ name: 'list', age: screen.age })
      else setScreen({ name: 'home' })
      return true
    })
  }, [screen])

  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      window.speechSynthesis?.getVoices()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  const ageTheme = screen.name === 'list' || screen.name === 'play' ? screen.age : 'home'
  const place: NavPlace =
    screen.name === 'home' ? 'home' : screen.name === 'gate' || screen.name === 'parents' ? 'parents' : screen.age

  return (
    <>
      <div className="bg-blobs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="frame" data-age={ageTheme} data-platform={platform}>
      <Nav
        place={place}
        onHome={() => setScreen({ name: 'home' })}
        onAge={(age) => {
          setAge(age)
          setScreen({ name: 'list', age })
        }}
        onParents={() => setScreen((current) => (current.name === 'parents' ? current : { name: 'gate' }))}
      />
      <div className="app">
        <Guard key={loc}>
          {screen.name === 'home' && (
            <Home
              onAge={(age) => {
                setAge(age)
                setScreen({ name: 'list', age })
              }}
            />
          )}
          {screen.name === 'list' && (
            <GameList
              age={screen.age}
              onBack={() => setScreen({ name: 'home' })}
              onAge={(age) => {
                setAge(age)
                setScreen({ name: 'list', age })
              }}
              onPlay={(id) => {
                setNonce((value) => value + 1)
                setScreen({ name: 'play', age: screen.age, id })
              }}
            />
          )}
          {screen.name === 'play' && (
            <PlayScreen
              age={screen.age}
              id={screen.id}
              nonce={nonce}
              onExit={() => setScreen({ name: 'list', age: screen.age })}
              onReplay={() => setNonce((value) => value + 1)}
              onNext={(id) => {
                setNonce((value) => value + 1)
                setScreen({ name: 'play', age: screen.age, id })
              }}
            />
          )}
          {screen.name === 'gate' && (
            <ParentGate onExit={() => setScreen({ name: 'home' })} onSuccess={() => setScreen({ name: 'parents' })} />
          )}
          {screen.name === 'parents' && <Parents onExit={() => setScreen({ name: 'home' })} />}
        </Guard>
      </div>
      </div>
    </>
  )
}

function PlayScreen({
  age,
  id,
  nonce,
  onExit,
  onReplay,
  onNext,
}: {
  age: AgeId
  id: GameId
  nonce: number
  onExit: () => void
  onReplay: () => void
  onNext: (id: GameId) => void
}) {
  const View = gameViews[id]
  const list = games.filter((game) => game.age === age)
  const index = list.findIndex((game) => game.id === id)
  const upcoming = index >= 0 && list.length > 1 ? list[(index + 1) % list.length] : undefined
  const next = upcoming
    ? { title: upcoming.title, emoji: upcoming.emoji, onGo: () => onNext(upcoming.id) }
    : undefined
  return <View key={nonce} age={age} onExit={onExit} onReplay={onReplay} next={next} />
}

class Guard extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel">
          <h1>Игра остановилась</h1>
          <p>Обновите страницу и откройте игру снова.</p>
          <button type="button" className="btn primary" onClick={() => window.location.reload()}>
            Обновить
          </button>
        </section>
      )
    }
    return this.props.children
  }
}

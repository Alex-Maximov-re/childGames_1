import { useEffect, useState } from 'react'
import { cx } from './text'
import { getBackgroundMusic } from './background-music'

export function SoundButton() {
  const [isMuted, setIsMuted] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    // Проверяем состояние mute при загрузке
    const music = getBackgroundMusic()
    if (music) {
      setIsMuted(music.isAudioMuted())
      setHasPermission(true)
    }
  }, [])

  const handleClick = () => {
    const music = getBackgroundMusic()
    if (!music) return

    music.toggleMute()
    setIsMuted(music.isAudioMuted())
  }

  // Не показываем кнопку, если музыка не инициализирована
  if (!hasPermission) return null

  return (
    <button
      type="button"
      className={cx('sound-button', isMuted && 'muted')}
      onClick={handleClick}
      aria-label={isMuted ? 'Включить музыку' : 'Выключить музыку'}
      title={isMuted ? 'Музыка выключена' : 'Музыка включена'}
    >
      <span className="sound-icon" aria-hidden="true">
        {isMuted ? '🔇' : '🔊'}
      </span>
    </button>
  )
}

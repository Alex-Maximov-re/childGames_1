import { unlockAudio } from './sound'
import { initBackgroundMusic } from './background-music'
import { useSave } from './save'
import { cx } from './text'

export function SoundButton() {
  const { save, toggleSound } = useSave()
  const muted = !save.sound

  return (
    <button
      type="button"
      className={cx('sound-button', muted && 'muted')}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => {
        unlockAudio()
        const music = initBackgroundMusic()
        music.noteGesture()
        toggleSound()
      }}
      aria-label={muted ? 'Включить звук' : 'Выключить звук'}
      title={muted ? 'Звук выключен' : 'Звук включён'}
    >
      <span className="sound-icon" aria-hidden="true">
        {muted ? '🔇' : '🔊'}
      </span>
    </button>
  )
}

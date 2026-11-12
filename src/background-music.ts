import { isSound } from './sound'

const backgroundMusicUrl = `${import.meta.env.BASE_URL}background_music.mp3`

class BackgroundMusic {
  private audio: HTMLAudioElement
  private hidden = false
  private gestured = false
  private token = 0

  constructor(src: string) {
    this.audio = new Audio(src)
    this.audio.loop = true
    this.audio.preload = 'auto'
    this.audio.volume = 0.3
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden
      void this.sync()
    })
  }

  noteGesture(): void {
    this.gestured = true
  }

  private shouldPlay(): boolean {
    return this.gestured && isSound() && !this.hidden && document.visibilityState !== 'hidden'
  }

  async sync(): Promise<boolean> {
    const token = ++this.token
    if (!this.shouldPlay()) {
      this.audio.pause()
      return false
    }
    try {
      await this.audio.play()
      if (token !== this.token || !this.shouldPlay()) {
        this.audio.pause()
        return false
      }
      return true
    } catch {
      return false
    }
  }
}

let music: BackgroundMusic | null = null

export function initBackgroundMusic(): BackgroundMusic {
  if (!music) music = new BackgroundMusic(backgroundMusicUrl)
  return music
}

export function getBackgroundMusic(): BackgroundMusic | null {
  return music
}

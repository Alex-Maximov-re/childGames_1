// Фоновая музыка для приложения Лучик

import { isSound } from './sound'

// URL для фоновой музыки — Vite автоматически обработает его при сборке
const backgroundMusicUrl = '/background_music.mp3'

class BackgroundMusic {
  private audio: HTMLAudioElement | null = null
  private isPlaying = false
  private isMuted = false

  constructor(private src: string) {
    this.load()
  }

  private load(): void {
    this.audio = new Audio(this.src)
    this.audio.loop = true
    this.audio.preload = 'auto'
    this.audio.volume = 0.3 // тихая фоновая музыка

    // Автозагрузка
    this.audio.load()
  }

  public async play(): Promise<void> {
    if (!this.audio || this.isPlaying || this.isMuted) return
    if (!isSound()) return

    try {
      await this.audio.play()
      this.isPlaying = true
    } catch (error) {
      console.log('Автозапуск музыки заблокирован браузером:', error)
    }
  }

  public pause(): void {
    if (!this.audio || !this.isPlaying) return
    this.audio.pause()
    this.isPlaying = false
  }

  public resume(): void {
    this.play()
  }

  public toggleMute(): void {
    if (!this.audio) return
    this.isMuted = !this.isMuted
    if (this.isMuted) {
      this.pause()
    } else {
      this.resume()
    }
  }

  public isAudioMuted(): boolean {
    return this.isMuted
  }

  public getVolume(): number {
    return this.audio?.volume ?? 0
  }

  public setVolume(volume: number): void {
    if (!this.audio) return
    this.audio.volume = Math.max(0, Math.min(1, volume))
  }
}

// Создаём глобальный инстанс
let music: BackgroundMusic | null = null

export function initBackgroundMusic(): BackgroundMusic {
  if (!music) {
    music = new BackgroundMusic(backgroundMusicUrl)
  }
  return music
}

export function getBackgroundMusic(): BackgroundMusic | null {
  return music
}

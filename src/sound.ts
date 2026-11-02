let audio: AudioContext | null = null
let sound = true

export function setSoundEnabled(enabled: boolean): void {
  sound = enabled
}

export function isSound(): boolean {
  return sound
}

function context(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audio) audio = new Ctx()
  if (audio.state === 'suspended') void audio.resume()
  return audio
}

export function unlockAudio(): void {
  context()
}

function tone(freq: number, duration: number, type: OscillatorType, when: number, gain = 0.06): void {
  const current = context()
  if (!current) return
  const oscillator = current.createOscillator()
  const amp = current.createGain()
  oscillator.type = type
  oscillator.frequency.value = freq
  amp.gain.setValueAtTime(gain, when)
  amp.gain.exponentialRampToValueAtTime(0.001, when + duration)
  oscillator.connect(amp)
  amp.connect(current.destination)
  oscillator.start(when)
  oscillator.stop(when + duration + 0.02)
}

export function playTap(): void {
  if (!sound) return
  const now = context()?.currentTime
  if (now === undefined) return
  tone(520, 0.07, 'triangle', now, 0.04)
}

export function playGood(): void {
  if (!sound) return
  const now = context()?.currentTime
  if (now === undefined) return
  tone(523, 0.12, 'sine', now, 0.05)
  tone(659, 0.12, 'sine', now + 0.09, 0.05)
  tone(784, 0.16, 'sine', now + 0.18, 0.05)
}

export function playBad(): void {
  if (!sound) return
  const now = context()?.currentTime
  if (now === undefined) return
  tone(196, 0.14, 'sine', now, 0.035)
}

export function playWin(): void {
  if (!sound) return
  const now = context()?.currentTime
  if (now === undefined) return
  ;[523, 659, 784, 1046].forEach((freq, index) => {
    tone(freq, 0.18, 'triangle', now + index * 0.11, 0.05)
  })
}

export function speak(text: string): boolean {
  if (!sound || !text.trim()) return false
  const synth = window.speechSynthesis
  if (!synth) return false
  try {
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ru-RU'
    utter.rate = 0.95
    const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith('ru'))
    if (voice) utter.voice = voice
    synth.speak(utter)
    return true
  } catch {
    return false
  }
}

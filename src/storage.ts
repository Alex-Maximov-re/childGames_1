import { GAME_IDS } from './catalog'
import { AGE_IDS, type AgeId, type Platform } from './types'

const KEY_BY_PLATFORM: Record<Platform, string> = {
  web: 'luchik-web-v2',
  android: 'luchik-android-v2',
  ios: 'luchik-save-v2',
}

let storageKey: string = KEY_BY_PLATFORM.ios

export function setStorageScope(platform: Platform): void {
  storageKey = KEY_BY_PLATFORM[platform]
}

export type SaveData = {
  sound: boolean
  age: AgeId | null
  stars: Record<string, number>
}

function emptySave(): SaveData {
  return { sound: true, age: null, stars: {} }
}

function isAge(value: unknown): value is AgeId {
  return typeof value === 'string' && (AGE_IDS as readonly string[]).includes(value)
}

function cleanStars(input: unknown): Record<string, number> {
  if (!input || typeof input !== 'object') return {}
  const source = input as Record<string, unknown>
  const stars: Record<string, number> = {}
  for (const age of AGE_IDS) {
    for (const id of GAME_IDS) {
      const key = `${age}:${id}`
      const value = source[key]
      if (value === 1 || value === 2 || value === 3) stars[key] = value
    }
  }
  return stars
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return emptySave()
    const parsed = JSON.parse(raw) as Partial<SaveData>
    return {
      sound: parsed.sound !== false,
      age: isAge(parsed.age) ? parsed.age : null,
      stars: cleanStars(parsed.stars),
    }
  } catch {
    return emptySave()
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(save))
  } catch {
    // Private mode or a full disk: the games still run, progress may not stick.
  }
}

import { GAME_IDS } from './catalog'
import type { AgeId, GameId, Platform } from './types'

const KEY_BY_PLATFORM: Record<Platform, string> = {
  web: 'luchik-web-v1',
  android: 'luchik-android-v1',
  ios: 'luchik-save-v1',
}

let storageKey: string = KEY_BY_PLATFORM.ios

export function setStorageScope(platform: Platform): void {
  storageKey = KEY_BY_PLATFORM[platform]
}

export type SaveData = {
  sound: boolean
  age: AgeId | null
  stars: Partial<Record<GameId, number>>
}

function emptySave(): SaveData {
  return { sound: true, age: null, stars: {} }
}

function isAge(value: unknown): value is AgeId {
  return value === 'little' || value === 'middle' || value === 'big'
}

function cleanStars(input: unknown): Partial<Record<GameId, number>> {
  if (!input || typeof input !== 'object') return {}
  const source = input as Record<string, unknown>
  const stars: Partial<Record<GameId, number>> = {}
  for (const id of GAME_IDS) {
    const value = source[id]
    if (value === 1 || value === 2 || value === 3) stars[id] = value
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

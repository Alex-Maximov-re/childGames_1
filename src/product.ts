import type { Platform } from './types'

export const APP_NAME = 'Лучик'
export const APP_VERSION = '1.0.19'

export function platformTitle(platform: Platform): string {
  if (platform === 'web') return 'Лучик в браузере'
  if (platform === 'android') return 'Лучик для Android'
  return 'Лучик'
}

export function platformSubtitle(platform: Platform): string {
  if (platform === 'web') return 'Веб-приложение в браузере'
  if (platform === 'android') return 'Приложение для Android'
  return 'Игры для детей от 1 года'
}

export function platformFoot(platform: Platform): string {
  if (platform === 'web') return 'Веб-версия. Без рекламы, звёзды остаются в этом браузере.'
  if (platform === 'android') return 'Версия для Android. Без рекламы, звёзды остаются в приложении.'
  return 'Без рекламы. Прогресс хранится только на этом устройстве.'
}

export function platformWhere(platform: Platform): string {
  if (platform === 'web') return 'в этом браузере'
  return 'на этом устройстве'
}

import { createContext, useContext, type ReactNode } from 'react'
import type { Platform } from './types'

const PlatformContext = createContext<Platform>('ios')

export function PlatformProvider({ platform, children }: { platform: Platform; children: ReactNode }) {
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>
}

export function usePlatform(): Platform {
  return useContext(PlatformContext)
}

type BackListener = () => boolean

let backListener: BackListener | null = null

export function setBackListener(listener: BackListener): () => void {
  backListener = listener
  return () => {
    if (backListener === listener) backListener = null
  }
}

/** Returns true when the app handled the back action. */
export function requestBack(): boolean {
  return backListener ? backListener() : false
}

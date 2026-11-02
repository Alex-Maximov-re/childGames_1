import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { setSoundEnabled } from './sound'
import { loadSave, writeSave, type SaveData } from './storage'
import type { AgeId } from './types'

type SaveApi = {
  save: SaveData
  toggleSound: () => void
  resetProgress: () => void
  setAge: (age: AgeId) => void
  record: (key: string, stars: number) => void
}

const SaveContext = createContext<SaveApi | null>(null)

export function SaveProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(() => {
    const loaded = loadSave()
    setSoundEnabled(loaded.sound)
    return loaded
  })

  const toggleSound = useCallback(() => {
    setSave((prev) => {
      const next = { ...prev, sound: !prev.sound }
      writeSave(next)
      setSoundEnabled(next.sound)
      if (!next.sound) window.speechSynthesis?.cancel()
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    setSave((prev) => {
      const next = { ...prev, stars: {} }
      writeSave(next)
      return next
    })
  }, [])

  const setAge = useCallback((age: AgeId) => {
    setSave((prev) => {
      if (prev.age === age) return prev
      const next = { ...prev, age }
      writeSave(next)
      return next
    })
  }, [])

  const record = useCallback((key: string, stars: number) => {
    const safe = Math.min(3, Math.max(1, Math.round(stars)))
    setSave((prev) => {
      const current = prev.stars[key] ?? 0
      if (safe <= current) return prev
      const next = { ...prev, stars: { ...prev.stars, [key]: safe } }
      writeSave(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ save, toggleSound, resetProgress, setAge, record }),
    [save, toggleSound, resetProgress, setAge, record],
  )

  return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>
}

export function useSave(): SaveApi {
  const value = useContext(SaveContext)
  if (!value) throw new Error('SaveProvider is missing')
  return value
}

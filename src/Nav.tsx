import { useEffect, useId, useRef, useState } from 'react'
import { Luchik } from './art'
import { ages } from './catalog'
import { cx } from './text'
import type { AgeId } from './types'

export type NavPlace = 'home' | AgeId | 'parents' | 'news'

export function Nav({
  place,
  onHome,
  onAge,
  onParents,
  onNews,
}: {
  place: NavPlace
  onHome: () => void
  onAge: (age: AgeId) => void
  onParents: () => void
  onNews: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const menuId = useId()
  const items: Array<{ id: NavPlace; label: string; onClick: () => void }> = [
    { id: 'home', label: 'Главная', onClick: onHome },
    ...ages.map((age) => ({
      id: age.id as NavPlace,
      label: age.menu,
      onClick: () => onAge(age.id),
    })),
    { id: 'news', label: 'Что нового', onClick: onNews },
    { id: 'parents', label: 'Родителям', onClick: onParents },
  ]

  useEffect(() => {
    setOpen(false)
  }, [place])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <header className={cx('site-nav', open && 'open')} ref={rootRef}>
      <div className="site-nav-inner">
        <button type="button" className="nav-brand" onClick={onHome}>
          <Luchik className="nav-mascot" />
          Лучик
        </button>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Закрыть' : 'Меню'}
        </button>
        <nav id={menuId} className="nav-links" aria-label="Разделы">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="nav-link"
              aria-current={place === item.id ? 'page' : undefined}
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

import type { CSSProperties } from 'react'
import type { ShapeId } from './types'

export function Luchik({ className = 'mascot' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g className="rays" fill="#FFB703">
        {Array.from({ length: 8 }, (_, index) => (
          <rect
            key={index}
            x="56"
            y="6"
            width="8"
            height="16"
            rx="4"
            transform={`rotate(${index * 45} 60 60)`}
          />
        ))}
      </g>
      <circle cx="60" cy="60" r="32" fill="#FFD15C" />
      <circle cx="48" cy="56" r="4" fill="#2A2340" />
      <circle cx="72" cy="56" r="4" fill="#2A2340" />
      <path d="M46 70 Q60 84 74 70" fill="none" stroke="#2A2340" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="66" r="5" fill="#FF9B88" />
      <circle cx="80" cy="66" r="5" fill="#FF9B88" />
    </svg>
  )
}

export function ShapeArt({ type }: { type: ShapeId }) {
  return (
    <svg className="shape-art" viewBox="0 0 100 100" aria-hidden="true">
      {type === 'circle' && <circle cx="50" cy="50" r="32" fill="currentColor" />}
      {type === 'square' && <rect x="18" y="18" width="64" height="64" rx="10" fill="currentColor" />}
      {type === 'triangle' && <polygon points="50,14 90,84 10,84" fill="currentColor" />}
      {type === 'diamond' && <polygon points="50,10 90,50 50,90 10,50" fill="currentColor" />}
      {type === 'star' && (
        <polygon points="50,8 61,35 90,35 66,54 75,84 50,66 25,84 34,54 10,35 39,35" fill="currentColor" />
      )}
      {type === 'heart' && (
        <path
          d="M50 84 C24 64 10 50 20 34 C28 22 42 24 50 36 C58 24 72 22 80 34 C90 50 76 64 50 84 Z"
          fill="currentColor"
        />
      )}
    </svg>
  )
}

export const puzzleSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'>
  <rect width='300' height='300' fill='#8ECAFF'/>
  <circle cx='230' cy='62' r='34' fill='#FFD15C'/>
  <ellipse cx='58' cy='58' rx='34' ry='18' fill='#ffffff'/>
  <circle cx='86' cy='54' r='16' fill='#ffffff'/>
  <rect x='0' y='190' width='300' height='110' fill='#67C96F'/>
  <rect x='34' y='156' width='14' height='48' fill='#6B3F2A'/>
  <circle cx='41' cy='138' r='28' fill='#2F9E4F'/>
  <polygon points='108,150 160,76 212,150' fill='#E23E57'/>
  <rect x='118' y='150' width='84' height='80' fill='#FF7A45'/>
  <rect x='148' y='178' width='24' height='52' fill='#6B3F2A'/>
  <rect x='128' y='166' width='18' height='18' fill='#FFF3B0'/>
  <rect x='176' y='166' width='18' height='18' fill='#FFF3B0'/>
  <rect x='246' y='214' width='8' height='22' fill='#2F9E4F'/>
  <circle cx='250' cy='208' r='12' fill='#FFD15C'/>
  <circle cx='250' cy='208' r='5' fill='#E23E57'/>
</svg>`

export const puzzleArtUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(puzzleSvg)}`

export function sliceStyle(slice: number): CSSProperties {
  const index = slice - 1
  const column = index % 3
  const row = Math.floor(index / 3)
  return {
    backgroundImage: `url("${puzzleArtUrl}")`,
    backgroundSize: '300% 300%',
    backgroundPosition: `${column * 50}% ${row * 50}%`,
    backgroundRepeat: 'no-repeat',
  }
}

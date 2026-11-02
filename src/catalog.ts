import type { AgeId, GameId } from './types'

export const GAME_IDS: GameId[] = [
  'colors',
  'shapes',
  'voices',
  'memory',
  'count',
  'odd',
  'math',
  'sequence',
  'puzzle',
]

export type AgeInfo = {
  id: AgeId
  title: string
  range: string
  text: string
  emoji: string
}

export type GameInfo = {
  id: GameId
  age: AgeId
  emoji: string
  title: string
  blurb: string
}

export const ages: AgeInfo[] = [
  {
    id: 'little',
    title: 'Малыши',
    range: '3–5 лет',
    text: 'Большие кнопки, цвета, фигуры и звуки животных',
    emoji: '🌈',
  },
  {
    id: 'middle',
    title: 'Почемучки',
    range: '6–8 лет',
    text: 'Память, счёт и внимательность',
    emoji: '🎲',
  },
  {
    id: 'big',
    title: 'Смекалистые',
    range: '9–12 лет',
    text: 'Числа, закономерности и картинка',
    emoji: '💡',
  },
]

export const games: GameInfo[] = [
  { id: 'colors', age: 'little', emoji: '🎨', title: 'Цвета', blurb: 'Найди цвет, который просит Лучик' },
  { id: 'shapes', age: 'little', emoji: '⭐', title: 'Фигуры', blurb: 'Круг, квадрат и другие формы' },
  { id: 'voices', age: 'little', emoji: '🐮', title: 'Кто говорит', blurb: 'Звуки знакомых животных' },
  { id: 'memory', age: 'middle', emoji: '🧠', title: 'Пары', blurb: 'Открой две одинаковые карточки' },
  { id: 'count', age: 'middle', emoji: '🔢', title: 'Сосчитай', blurb: 'Сколько предметов на экране' },
  { id: 'odd', age: 'middle', emoji: '👀', title: 'Что лишнее', blurb: 'Найди предмет не из этой компании' },
  { id: 'math', age: 'big', emoji: '➕', title: 'Примеры', blurb: 'Сложение, вычитание и умножение' },
  { id: 'sequence', age: 'big', emoji: '🔁', title: 'Продолжи ряд', blurb: 'Какое число стоит дальше' },
  { id: 'puzzle', age: 'big', emoji: '🧩', title: 'Картинка', blurb: 'Собери рисунок, двигая кусочки' },
]

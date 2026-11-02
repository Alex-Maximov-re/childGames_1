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
  'mole',
]

export type AgeInfo = {
  id: AgeId
  title: string
  menu: string
  range: string
  text: string
  emoji: string
}

export function progressKey(age: AgeId, id: GameId): string {
  return `${age}:${id}`
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
    id: 'y12',
    title: '1–2 года',
    menu: '1–2',
    range: '1–2 года',
    text: 'Цвета, звуки животных и крот в норках',
    emoji: '🍼',
  },
  {
    id: 'y3',
    title: '3 года',
    menu: '3 года',
    range: '3 года',
    text: 'Цвета, простые фигуры и знакомые животные',
    emoji: '🌈',
  },
  {
    id: 'y4',
    title: '4 года',
    menu: '4 года',
    range: '4 года',
    text: 'Больше фигур и счёт до четырёх',
    emoji: '⭐',
  },
  {
    id: 'y5',
    title: '5 лет',
    menu: '5 лет',
    range: '5 лет',
    text: 'Счёт, короткие пары и все фигуры',
    emoji: '🎈',
  },
  {
    id: 'y6',
    title: '6 лет',
    menu: '6 лет',
    range: '6 лет',
    text: 'Память, счёт подольше и «что лишнее»',
    emoji: '🎲',
  },
  {
    id: 'y79',
    title: '7–9 лет',
    menu: '7–9',
    range: '7–9 лет',
    text: 'Логика, примеры без умножения и картинка',
    emoji: '🔍',
  },
  {
    id: 'y10',
    title: '10+',
    menu: '10+',
    range: '10+',
    text: 'Умножение, ряды посложнее и головоломка',
    emoji: '💡',
  },
]

export const games: GameInfo[] = [
  { id: 'colors', age: 'y12', emoji: '🎨', title: 'Цвета', blurb: 'Два больших кружка' },
  { id: 'voices', age: 'y12', emoji: '🐮', title: 'Кто говорит', blurb: 'Два звука знакомых животных' },
  { id: 'mole', age: 'y12', emoji: '🐹', title: 'Крот', blurb: 'Поймай крота, когда он высунется' },
  { id: 'colors', age: 'y3', emoji: '🎨', title: 'Цвета', blurb: 'Найди цвет из трёх' },
  { id: 'shapes', age: 'y3', emoji: '⭐', title: 'Фигуры', blurb: 'Круг, квадрат и треугольник' },
  { id: 'voices', age: 'y3', emoji: '🐮', title: 'Кто говорит', blurb: 'Звуки знакомых животных' },
  { id: 'shapes', age: 'y4', emoji: '⭐', title: 'Фигуры', blurb: 'Круг, квадрат, треугольник и звезда' },
  { id: 'voices', age: 'y4', emoji: '🐮', title: 'Кто говорит', blurb: 'Больше животных и их звуки' },
  { id: 'count', age: 'y4', emoji: '🔢', title: 'Сосчитай', blurb: 'Счёт от 1 до 4' },
  { id: 'shapes', age: 'y5', emoji: '⭐', title: 'Фигуры', blurb: 'Все формы, включая сердечко и ромб' },
  { id: 'count', age: 'y5', emoji: '🔢', title: 'Сосчитай', blurb: 'Счёт от 1 до 6' },
  { id: 'memory', age: 'y5', emoji: '🧠', title: 'Пары', blurb: 'Три пары карточек' },
  { id: 'count', age: 'y6', emoji: '🔢', title: 'Сосчитай', blurb: 'Счёт от 1 до 8' },
  { id: 'memory', age: 'y6', emoji: '🧠', title: 'Пары', blurb: 'Шесть пар карточек' },
  { id: 'odd', age: 'y6', emoji: '👀', title: 'Что лишнее', blurb: 'Простые компании предметов' },
  { id: 'odd', age: 'y79', emoji: '👀', title: 'Что лишнее', blurb: 'Найди предмет не из этой компании' },
  { id: 'math', age: 'y79', emoji: '➕', title: 'Примеры', blurb: 'Сложение и вычитание' },
  { id: 'sequence', age: 'y79', emoji: '🔁', title: 'Продолжи ряд', blurb: 'Ряды с одинаковым шагом' },
  { id: 'puzzle', age: 'y79', emoji: '🧩', title: 'Картинка', blurb: 'Короткая сборка рисунка' },
  { id: 'math', age: 'y10', emoji: '➕', title: 'Примеры', blurb: 'Сложение, вычитание и умножение' },
  { id: 'sequence', age: 'y10', emoji: '🔁', title: 'Продолжи ряд', blurb: 'Шаг, удвоение и растущая прибавка' },
  { id: 'puzzle', age: 'y10', emoji: '🧩', title: 'Картинка', blurb: 'Собери рисунок, двигая кусочки' },
]

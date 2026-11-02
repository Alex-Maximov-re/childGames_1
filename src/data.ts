import { randInt, shuffle } from './random'
import type { AgeId, ShapeId } from './types'

export type ColorChip = { id: string; name: string; hex: string }

const PALETTE: Record<string, ColorChip> = {
  red: { id: 'red', name: 'красный', hex: '#FF4D4F' },
  orange: { id: 'orange', name: 'оранжевый', hex: '#FF8A1E' },
  yellow: { id: 'yellow', name: 'жёлтый', hex: '#FFD000' },
  green: { id: 'green', name: 'зелёный', hex: '#22C55E' },
  cyan: { id: 'cyan', name: 'голубой', hex: '#38BDF8' },
  blue: { id: 'blue', name: 'синий', hex: '#2563EB' },
  purple: { id: 'purple', name: 'фиолетовый', hex: '#8B5CF6' },
  pink: { id: 'pink', name: 'розовый', hex: '#F472B6' },
}

const COLOR_SETS = [
  ['red', 'yellow', 'blue', 'green'],
  ['orange', 'green', 'purple', 'cyan'],
  ['pink', 'yellow', 'blue', 'green'],
  ['red', 'cyan', 'yellow', 'purple'],
  ['orange', 'blue', 'pink', 'green'],
  ['yellow', 'purple', 'cyan', 'red'],
]

const COLOR_PAIRS = [
  ['red', 'yellow'],
  ['blue', 'green'],
  ['red', 'blue'],
  ['yellow', 'green'],
]

const COLOR_TRIOS = [
  ['red', 'yellow', 'blue'],
  ['green', 'orange', 'yellow'],
  ['pink', 'blue', 'yellow'],
  ['red', 'green', 'orange'],
  ['purple', 'yellow', 'green'],
  ['blue', 'orange', 'pink'],
]

export type ColorRound = { target: ColorChip; options: ColorChip[] }

export function makeColorRounds(age: AgeId): ColorRound[] {
  const sets = age === 'y12' ? COLOR_PAIRS : age === 'y3' ? COLOR_TRIOS : COLOR_SETS
  let previous = ''
  return sets.map((ids) => {
    const options = ids.map((id) => PALETTE[id])
    let target = options[randInt(0, options.length - 1)]
    let guard = 0
    while (target.id === previous && guard < 4) {
      target = options[randInt(0, options.length - 1)]
      guard += 1
    }
    previous = target.id
    return { target, options: shuffle(options) }
  })
}

export type ShapeChip = { id: ShapeId; label: string; accusative: string }
export type ShapeRound = { target: ShapeChip; options: ShapeChip[] }

const SHAPES: ShapeChip[] = [
  { id: 'circle', label: 'круг', accusative: 'круг' },
  { id: 'square', label: 'квадрат', accusative: 'квадрат' },
  { id: 'triangle', label: 'треугольник', accusative: 'треугольник' },
  { id: 'star', label: 'звезда', accusative: 'звёздочку' },
  { id: 'heart', label: 'сердечко', accusative: 'сердечко' },
  { id: 'diamond', label: 'ромб', accusative: 'ромб' },
]

function oneShape(poolSize: number, optionCount: number): ShapeRound {
  const pool = SHAPES.slice(0, poolSize)
  const target = pool[randInt(0, pool.length - 1)]
  const others = shuffle(pool.filter((shape) => shape.id !== target.id)).slice(0, optionCount - 1)
  return { target, options: shuffle([target, ...others]) }
}

export function makeShapeRounds(age: AgeId): ShapeRound[] {
  const poolSize = age === 'y3' ? 3 : age === 'y4' ? 4 : 6
  const optionCount = age === 'y3' ? 3 : 4
  const total = age === 'y3' ? 4 : 6
  const rounds: ShapeRound[] = []
  let previous = ''
  for (let index = 0; index < total; index += 1) {
    let round = oneShape(poolSize, optionCount)
    let guard = 0
    while (round.target.id === previous && guard < 6) {
      round = oneShape(poolSize, optionCount)
      guard += 1
    }
    previous = round.target.id
    rounds.push(round)
  }
  return rounds
}

type Animal = { id: string; name: string; emoji: string; sound: string }

const ANIMALS: Animal[] = [
  { id: 'cow', name: 'корова', emoji: '🐮', sound: 'му-у' },
  { id: 'dog', name: 'собака', emoji: '🐶', sound: 'гав' },
  { id: 'cat', name: 'кошка', emoji: '🐱', sound: 'мяу' },
  { id: 'pig', name: 'свинья', emoji: '🐷', sound: 'хрю' },
  { id: 'duck', name: 'утка', emoji: '🦆', sound: 'кря' },
  { id: 'frog', name: 'лягушка', emoji: '🐸', sound: 'ква' },
  { id: 'sheep', name: 'овечка', emoji: '🐑', sound: 'бе-е' },
  { id: 'horse', name: 'лошадь', emoji: '🐴', sound: 'и-го-го' },
  { id: 'bee', name: 'пчела', emoji: '🐝', sound: 'ж-ж-ж' },
  { id: 'owl', name: 'сова', emoji: '🦉', sound: 'ух' },
]

export type VoiceRound = { name: string; emoji: string; answer: string; options: string[]; say: string }

function soundsClash(left: string, right: string): boolean {
  const pair = [left, right].sort().join('|')
  return pair === 'ква|кря' || pair === 'бе-е|му-у'
}

export function makeVoiceRounds(age: AgeId): VoiceRound[] {
  const source = age === 'y12' ? ANIMALS.slice(0, 4) : ANIMALS
  const total = age === 'y12' ? 4 : 6
  const choices = age === 'y12' ? 2 : 3
  return shuffle(source)
    .slice(0, total)
    .map((animal) => {
      const others = shuffle(source.filter((item) => item.id !== animal.id && !soundsClash(item.sound, animal.sound)))
      const backup = others.length >= choices - 1 ? others : shuffle(source.filter((item) => item.id !== animal.id))
      const picked = backup.slice(0, choices - 1)
      return {
        name: animal.name,
        emoji: animal.emoji,
        answer: animal.sound,
        say: `Что говорит ${animal.name}?`,
        options: shuffle([animal.sound, ...picked.map((item) => item.sound)]),
      }
    })
}

export type MemoryFace = { id: string; emoji: string; name: string; uid: string }

const MEMORY_FACES = [
  { id: 'cow', emoji: '🐮', name: 'корова' },
  { id: 'dog', emoji: '🐶', name: 'собака' },
  { id: 'cat', emoji: '🐱', name: 'кошка' },
  { id: 'pig', emoji: '🐷', name: 'свинья' },
  { id: 'frog', emoji: '🐸', name: 'лягушка' },
  { id: 'fox', emoji: '🦊', name: 'лиса' },
]

export function makeDeck(pairs: number): MemoryFace[] {
  const cards = MEMORY_FACES.slice(0, pairs).flatMap((face) => [
    { ...face, uid: `${face.id}-1` },
    { ...face, uid: `${face.id}-2` },
  ])
  return shuffle(cards)
}

export type CountRound = { emoji: string; question: string; n: number; options: number[] }

const COUNT_KINDS = [
  { emoji: '🍎', question: 'Сколько яблок?' },
  { emoji: '⭐', question: 'Сколько звёзд?' },
  { emoji: '⚽', question: 'Сколько мячей?' },
  { emoji: '🦆', question: 'Сколько уток?' },
  { emoji: '🌸', question: 'Сколько цветков?' },
  { emoji: '🍪', question: 'Сколько печений?' },
  { emoji: '🎈', question: 'Сколько шаров?' },
  { emoji: '🐟', question: 'Сколько рыбок?' },
]

function distractors(n: number, ceiling: number): number[] {
  const candidates = [n - 2, n - 1, n + 1, n + 2, n + 3].filter((value) => value >= 1 && value <= ceiling)
  const picked = shuffle(candidates).slice(0, 2)
  let guard = 0
  while (picked.length < 2 && guard < 20) {
    const extra = randInt(1, ceiling)
    if (extra !== n && !picked.includes(extra)) picked.push(extra)
    guard += 1
  }
  return shuffle([n, ...picked])
}

export function makeCountRounds(age: AgeId): CountRound[] {
  const max = age === 'y4' ? 4 : age === 'y5' ? 6 : 8
  const kinds = shuffle(COUNT_KINDS)
  const numbers = shuffle(Array.from({ length: max }, (_, index) => index + 1))
  return numbers.map((n, index) => ({
    emoji: kinds[index].emoji,
    question: kinds[index].question,
    n,
    options: distractors(n, max + 2),
  }))
}

export type OddItem = { emoji: string; label: string }
export type OddRound = { items: OddItem[]; answer: number; why: string }

const ODD_BANK: OddRound[] = [
  {
    items: [
      { emoji: '🍎', label: 'яблоко' },
      { emoji: '🍌', label: 'банан' },
      { emoji: '🍇', label: 'виноград' },
      { emoji: '🚗', label: 'машина' },
    ],
    answer: 3,
    why: 'Машина ездит, а остальное — фрукты.',
  },
  {
    items: [
      { emoji: '🐶', label: 'собака' },
      { emoji: '🐱', label: 'кошка' },
      { emoji: '🐰', label: 'кролик' },
      { emoji: '🌳', label: 'дерево' },
    ],
    answer: 3,
    why: 'Дерево растёт, остальные — животные.',
  },
  {
    items: [
      { emoji: '🚌', label: 'автобус' },
      { emoji: '🚗', label: 'машина' },
      { emoji: '🚲', label: 'велосипед' },
      { emoji: '🍦', label: 'мороженое' },
    ],
    answer: 3,
    why: 'Мороженое едят, на остальном ездят.',
  },
  {
    items: [
      { emoji: '☀️', label: 'солнце' },
      { emoji: '🌙', label: 'луна' },
      { emoji: '⭐', label: 'звезда' },
      { emoji: '🧦', label: 'носок' },
    ],
    answer: 3,
    why: 'Носок — одежда, остальное видно на небе.',
  },
  {
    items: [
      { emoji: '📕', label: 'книга' },
      { emoji: '✏️', label: 'карандаш' },
      { emoji: '🎒', label: 'рюкзак' },
      { emoji: '🍰', label: 'торт' },
    ],
    answer: 3,
    why: 'Торт едят, остальное берут с собой в школу.',
  },
  {
    items: [
      { emoji: '❄️', label: 'снежинка' },
      { emoji: '⛄', label: 'снеговик' },
      { emoji: '🧤', label: 'варежка' },
      { emoji: '🏖️', label: 'пляж' },
    ],
    answer: 3,
    why: 'Пляж — про лето, остальное — про зиму.',
  },
  {
    items: [
      { emoji: '🥁', label: 'барабан' },
      { emoji: '🎸', label: 'гитара' },
      { emoji: '🎺', label: 'труба' },
      { emoji: '🪑', label: 'стул' },
    ],
    answer: 3,
    why: 'Стул — мебель, остальное — музыкальные инструменты.',
  },
  {
    items: [
      { emoji: '🌷', label: 'тюльпан' },
      { emoji: '🌼', label: 'ромашка' },
      { emoji: '🌻', label: 'подсолнух' },
      { emoji: '🚕', label: 'такси' },
    ],
    answer: 3,
    why: 'Такси — машина, остальное — цветы.',
  },
  {
    items: [
      { emoji: '🧢', label: 'кепка' },
      { emoji: '👗', label: 'платье' },
      { emoji: '👟', label: 'кроссовки' },
      { emoji: '🍞', label: 'хлеб' },
    ],
    answer: 3,
    why: 'Хлеб едят, остальное надевают.',
  },
  {
    items: [
      { emoji: '🐟', label: 'рыба' },
      { emoji: '🐠', label: 'рыбка' },
      { emoji: '🐬', label: 'дельфин' },
      { emoji: '🎈', label: 'шарик' },
    ],
    answer: 3,
    why: 'Шарик — игрушка, остальные живут в воде.',
  },
]

function mixOdd(round: OddRound): OddRound {
  const answerLabel = round.items[round.answer].label
  const items = shuffle(round.items)
  return { ...round, items, answer: items.findIndex((item) => item.label === answerLabel) }
}

export function makeOddRounds(age: AgeId): OddRound[] {
  const bank = age === 'y6' ? ODD_BANK.slice(0, 6) : ODD_BANK
  const total = age === 'y6' ? 6 : 8
  return shuffle(bank)
    .slice(0, total)
    .map((round) => mixOdd(round))
}

export type SeqRound = { row: number[]; answer: number; options: number[]; why: string }

const SEQ_BANK: SeqRound[] = [
  { row: [2, 4, 6, 8], answer: 10, options: [9, 10, 12], why: 'Каждое число больше предыдущего на 2.' },
  { row: [1, 3, 5, 7], answer: 9, options: [8, 9, 11], why: 'Это нечётные числа, шаг 2.' },
  { row: [5, 10, 15, 20], answer: 25, options: [23, 25, 30], why: 'Каждое число больше на 5.' },
  { row: [3, 6, 9, 12], answer: 15, options: [14, 15, 18], why: 'Считаем по три.' },
  { row: [10, 9, 8, 7], answer: 6, options: [4, 6, 8], why: 'Числа уменьшаются на 1.' },
  { row: [4, 8, 12, 16], answer: 20, options: [18, 20, 24], why: 'Каждое число больше на 4.' },
  { row: [20, 18, 16, 14], answer: 12, options: [10, 12, 15], why: 'Числа уменьшаются на 2.' },
  { row: [1, 2, 4, 8], answer: 16, options: [10, 12, 16], why: 'Каждое число в два раза больше предыдущего.' },
  {
    row: [1, 2, 4, 7, 11],
    answer: 16,
    options: [13, 15, 16],
    why: 'Прибавляем 1, потом 2, потом 3, потом 4 и затем 5.',
  },
  {
    row: [2, 3, 5, 8, 12],
    answer: 17,
    options: [15, 17, 19],
    why: 'Прибавляем 1, потом 2, потом 3, потом 4 и затем 5.',
  },
]

export function makeSeqRounds(age: AgeId): SeqRound[] {
  const bank = age === 'y79' ? SEQ_BANK.slice(0, 7) : SEQ_BANK
  const total = age === 'y79' ? 6 : 8
  return shuffle(bank)
    .slice(0, total)
    .map((round) => ({ ...round, options: shuffle(round.options) }))
}

export type MathRound = { text: string; say: string; answer: number }

function plus(a: number, b: number): MathRound {
  return { text: `${a} + ${b}`, say: `${a} плюс ${b}`, answer: a + b }
}

function minus(a: number, b: number): MathRound {
  return { text: `${a} − ${b}`, say: `${a} минус ${b}`, answer: a - b }
}

function times(a: number, b: number): MathRound {
  return { text: `${a} × ${b}`, say: `${a} умножить на ${b}`, answer: a * b }
}

function makeMath(index: number, age: AgeId): MathRound {
  if (age === 'y79') {
    if (index < 4) return plus(randInt(1, 10), randInt(1, 9))
    const b = randInt(1, 8)
    return minus(b + randInt(1, 10), b)
  }
  if (index < 2) return plus(randInt(2, 9), randInt(1, 9))
  if (index < 4) return plus(randInt(10, 40), randInt(3, 19))
  if (index < 6) {
    const b = randInt(2, 15)
    return minus(b + randInt(1, 20), b)
  }
  return times(randInt(2, 9), randInt(2, 9))
}

export function makeMathRounds(age: AgeId): MathRound[] {
  const total = age === 'y79' ? 6 : 8
  return Array.from({ length: total }, (_, index) => makeMath(index, age))
}

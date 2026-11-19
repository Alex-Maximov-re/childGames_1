export type GuessAnimal = {
  id: string
  name: string
}

export const GUESS_ANIMALS: GuessAnimal[] = [
  { id: 'cow', name: 'Корова' },
  { id: 'dog', name: 'Собака' },
  { id: 'cat', name: 'Кошка' },
  { id: 'horse', name: 'Лошадь' },
  { id: 'pig', name: 'Свинья' },
  { id: 'sheep', name: 'Овечка' },
  { id: 'goat', name: 'Коза' },
  { id: 'hen', name: 'Курица' },
  { id: 'duck', name: 'Утка' },
  { id: 'rabbit', name: 'Кролик' },
  { id: 'lion', name: 'Лев' },
  { id: 'elephant', name: 'Слон' },
  { id: 'giraffe', name: 'Жираф' },
  { id: 'zebra', name: 'Зебра' },
  { id: 'bear', name: 'Медведь' },
  { id: 'fox', name: 'Лиса' },
  { id: 'wolf', name: 'Волк' },
  { id: 'monkey', name: 'Обезьяна' },
  { id: 'tiger', name: 'Тигр' },
  { id: 'penguin', name: 'Пингвин' },
]

export type GuessRound = {
  answer: GuessAnimal
  options: GuessAnimal[]
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swap]
    copy[swap] = current
  }
  return copy
}

function takeLeast(pool: GuessAnimal[], count: number, seen: Map<string, number>, rng: () => number): GuessAnimal[] {
  const ranked = [...pool].sort((a, b) => (seen.get(a.id) ?? 0) - (seen.get(b.id) ?? 0))
  const picked: GuessAnimal[] = []
  while (picked.length < count && ranked.length > 0) {
    const best = seen.get(ranked[0].id) ?? 0
    let end = 1
    while (end < ranked.length && (seen.get(ranked[end].id) ?? 0) === best) end += 1
    const band = ranked.splice(0, end)
    const choice = band.splice(Math.floor(rng() * band.length), 1)[0]
    picked.push(choice)
    ranked.unshift(...band)
  }
  return picked
}

export function makeGuessRounds(rng: () => number = Math.random): GuessRound[] {
  const order = shuffle(GUESS_ANIMALS, rng)
  const seen = new Map<string, number>()
  let recent = new Set<string>()
  return order.map((answer) => {
    const others = GUESS_ANIMALS.filter((item) => item.id !== answer.id)
    const fresh = others.filter((item) => !recent.has(item.id))
    const pool = fresh.length >= 3 ? fresh : others
    const picked = takeLeast(pool, 3, seen, rng)
    const options = shuffle([answer, ...picked], rng)
    for (const item of options) seen.set(item.id, (seen.get(item.id) ?? 0) + 1)
    recent = new Set(options.map((item) => item.id))
    return { answer, options }
  })
}

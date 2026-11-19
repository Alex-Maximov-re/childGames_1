import { SHADOW_ANIMALS, type ShadowAnimal } from './shadowAnimals'

export type ShadowRound = {
  animals: ShadowAnimal[]
  shadows: ShadowAnimal[]
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

export function makeShadowRounds(rng: () => number = Math.random): ShadowRound[] {
  const buckets = new Map<string, ShadowAnimal[]>()
  for (const animal of shuffle(SHADOW_ANIMALS, rng)) {
    const list = buckets.get(animal.shape) ?? []
    list.push(animal)
    buckets.set(animal.shape, list)
  }
  const rounds: ShadowRound[] = []
  for (let round = 0; round < 20; round += 1) {
    const available = [...buckets.keys()].filter((shape) => (buckets.get(shape)?.length ?? 0) > 0)
    available.sort((a, b) => (buckets.get(b)?.length ?? 0) - (buckets.get(a)?.length ?? 0) || rng() - 0.5)
    const group: ShadowAnimal[] = []
    for (const shape of available) {
      if (group.length === 4) break
      const list = buckets.get(shape)
      const animal = list?.pop()
      if (animal) group.push(animal)
    }
    rounds.push({ animals: shuffle(group, rng), shadows: shuffle(group, rng) })
  }
  return rounds
}

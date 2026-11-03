export type Side = 'w' | 'b'
export type Kind = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type Cell = { side: Side; kind: Kind } | null
export type Level = 'easy' | 'mid' | 'hard'

export type Move = {
  from: number
  to: number
  kind: Kind
  capture: boolean
  promo?: Kind
  castle?: 'K' | 'Q'
  ep?: boolean
}

export type Game = {
  board: Cell[]
  side: Side
  castle: number
  ep: number
}

export type Ending = {
  kind: 'mate' | 'stalemate' | 'material'
  winner: Side | 'draw'
}

const VALUE: Record<Kind, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const MATE = 100000
const KNIGHT: Array<[number, number]> = [
  [1, 2],
  [2, 1],
  [-1, 2],
  [-2, 1],
  [1, -2],
  [2, -1],
  [-1, -2],
  [-2, -1],
]

const PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 4, 6, 6, 4, 2, 2, 0, 0, 2, 8, 8, 2, 0, 0, 0, 0, 2, 8, 8, 2, 0,
  0, 2, 0, 0, 4, 4, 0, 0, 2, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0,
]
const KNIGHT_PST = [
  -40, -30, -20, -20, -20, -20, -30, -40, -30, -10, 0, 4, 4, 0, -10, -30, -20, 0, 8, 12, 12, 8, 0, -20, -20, 4, 12, 16,
  16, 12, 4, -20, -20, 0, 12, 16, 16, 12, 0, -20, -20, 2, 8, 10, 10, 8, 2, -20, -30, -10, 0, 2, 2, 0, -10, -30, -40,
  -30, -20, -20, -20, -20, -30, -40,
]
const BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 4, 0, 0, 0, 0, 4, -10, -10, 0, 6, 8, 8, 6, 0, -10, -10, 2, 6, 10, 10, 6,
  2, -10, -10, 0, 8, 10, 10, 8, 0, -10, -10, 4, 6, 8, 8, 6, 4, -10, -10, 8, 0, 0, 0, 0, 8, -10, -20, -10, -10, -10,
  -10, -10, -10, -20,
]
const ROOK = [
  0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 8, 8, 8, 8, 8, 8, 6, 0, 0, 0, 0, 0, 0, 0, 0,
]
const QUEEN = [
  -20, -10, -10, -6, -6, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 4, 4, 4, 4, 0, -10, -6, 0, 4, 6, 6, 4, 0,
  -6, -6, 0, 4, 6, 6, 4, 0, -6, -10, 0, 4, 4, 4, 4, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -6, -6, -10,
  -10, -20,
]
const KING = [
  16, 22, 12, 0, 0, 12, 22, 16, 12, 14, 4, -4, -4, 4, 14, 12, -8, -8, -12, -16, -16, -12, -8, -8, -16, -16, -20, -24,
  -24, -20, -16, -16, -20, -20, -24, -28, -28, -24, -20, -20, -16, -16, -20, -24, -24, -20, -16, -16, -8, -8, -12, -16,
  -16, -12, -8, -8, -12, -16, -20, -24, -24, -20, -16, -12,
]

function opposite(side: Side): Side {
  return side === 'w' ? 'b' : 'w'
}

function fileOf(index: number): number {
  return index % 8
}

function rankOf(index: number): number {
  return Math.floor(index / 8)
}

function place(file: number, rank: number): number {
  return rank * 8 + file
}

function inside(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8
}

function mirror(index: number): number {
  return (7 - rankOf(index)) * 8 + fileOf(index)
}

export function startGame(): Game {
  const board: Cell[] = Array.from({ length: 64 }, () => null)
  const back: Kind[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  back.forEach((kind, file) => {
    board[file] = { side: 'w', kind }
    board[56 + file] = { side: 'b', kind }
    board[8 + file] = { side: 'w', kind: 'p' }
    board[48 + file] = { side: 'b', kind: 'p' }
  })
  return { board, side: 'w', castle: 15, ep: -1 }
}

function ray(board: Cell[], target: number, df: number, dr: number, by: Side, kinds: Kind[]): boolean {
  let file = fileOf(target) + df
  let rank = rankOf(target) + dr
  while (inside(file, rank)) {
    const piece = board[place(file, rank)]
    if (piece) return piece.side === by && kinds.includes(piece.kind)
    file += df
    rank += dr
  }
  return false
}

export function attacked(board: Cell[], target: number, by: Side): boolean {
  const file = fileOf(target)
  const rank = rankOf(target)
  const pawnRank = by === 'w' ? rank - 1 : rank + 1
  if (pawnRank >= 0 && pawnRank < 8) {
    for (const df of [-1, 1]) {
      const next = file + df
      if (!inside(next, pawnRank)) continue
      const piece = board[place(next, pawnRank)]
      if (piece?.side === by && piece.kind === 'p') return true
    }
  }
  for (const [df, dr] of KNIGHT) {
    const nextFile = file + df
    const nextRank = rank + dr
    if (!inside(nextFile, nextRank)) continue
    const piece = board[place(nextFile, nextRank)]
    if (piece?.side === by && piece.kind === 'n') return true
  }
  for (let df = -1; df <= 1; df += 1) {
    for (let dr = -1; dr <= 1; dr += 1) {
      if (!df && !dr) continue
      const nextFile = file + df
      const nextRank = rank + dr
      if (!inside(nextFile, nextRank)) continue
      const piece = board[place(nextFile, nextRank)]
      if (piece?.side === by && piece.kind === 'k') return true
    }
  }
  return (
    ray(board, target, 1, 1, by, ['b', 'q']) ||
    ray(board, target, 1, -1, by, ['b', 'q']) ||
    ray(board, target, -1, 1, by, ['b', 'q']) ||
    ray(board, target, -1, -1, by, ['b', 'q']) ||
    ray(board, target, 1, 0, by, ['r', 'q']) ||
    ray(board, target, -1, 0, by, ['r', 'q']) ||
    ray(board, target, 0, 1, by, ['r', 'q']) ||
    ray(board, target, 0, -1, by, ['r', 'q'])
  )
}

function kingAt(board: Cell[], side: Side): number {
  return board.findIndex((piece) => piece?.side === side && piece.kind === 'k')
}

export function inCheck(game: Game): boolean {
  const king = kingAt(game.board, game.side)
  return king >= 0 && attacked(game.board, king, opposite(game.side))
}

function addPawn(moves: Move[], game: Game, from: number): void {
  const side = game.side
  const step = side === 'w' ? 1 : -1
  const start = side === 'w' ? 1 : 6
  const last = side === 'w' ? 7 : 0
  const file = fileOf(from)
  const rank = rankOf(from)
  const forward = rank + step
  if (inside(file, forward) && !game.board[place(file, forward)]) {
    pushPawn(moves, from, place(file, forward), false, forward === last)
    const jump = rank + step * 2
    if (rank === start && !game.board[place(file, jump)]) {
      moves.push({ from, to: place(file, jump), kind: 'p', capture: false })
    }
  }
  for (const df of [-1, 1]) {
    const nextFile = file + df
    if (!inside(nextFile, forward)) continue
    const to = place(nextFile, forward)
    const victim = game.board[to]
    if (victim && victim.side !== side) pushPawn(moves, from, to, true, forward === last)
    if (to === game.ep) moves.push({ from, to, kind: 'p', capture: true, ep: true })
  }
}

function pushPawn(moves: Move[], from: number, to: number, capture: boolean, promote: boolean): void {
  if (!promote) {
    moves.push({ from, to, kind: 'p', capture })
    return
  }
  for (const promo of ['q', 'r', 'b', 'n'] as const) {
    moves.push({ from, to, kind: 'p', capture, promo })
  }
}

function addLeap(moves: Move[], game: Game, from: number, steps: Array<[number, number]>): void {
  const side = game.side
  const file = fileOf(from)
  const rank = rankOf(from)
  for (const [df, dr] of steps) {
    const nextFile = file + df
    const nextRank = rank + dr
    if (!inside(nextFile, nextRank)) continue
    const to = place(nextFile, nextRank)
    const victim = game.board[to]
    if (victim?.side === side) continue
    moves.push({ from, to, kind: game.board[from]!.kind, capture: Boolean(victim) })
  }
}

function addSlide(moves: Move[], game: Game, from: number, dirs: Array<[number, number]>): void {
  const side = game.side
  const kind = game.board[from]!.kind
  for (const [df, dr] of dirs) {
    let file = fileOf(from) + df
    let rank = rankOf(from) + dr
    while (inside(file, rank)) {
      const to = place(file, rank)
      const victim = game.board[to]
      if (victim?.side === side) break
      moves.push({ from, to, kind, capture: Boolean(victim) })
      if (victim) break
      file += df
      rank += dr
    }
  }
}

const BISHOP_DIRS: Array<[number, number]> = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]
const ROOK_DIRS: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]
const KING_DIRS: Array<[number, number]> = [...BISHOP_DIRS, ...ROOK_DIRS]

function canCastle(game: Game, wing: 'K' | 'Q'): boolean {
  const side = game.side
  const flag = side === 'w' ? (wing === 'K' ? 1 : 2) : wing === 'K' ? 4 : 8
  if ((game.castle & flag) === 0) return false
  const king = side === 'w' ? 4 : 60
  const rook = side === 'w' ? (wing === 'K' ? 7 : 0) : wing === 'K' ? 63 : 56
  if (game.board[king]?.kind !== 'k' || game.board[rook]?.kind !== 'r') return false
  const enemy = opposite(side)
  if (attacked(game.board, king, enemy)) return false
  const gaps = wing === 'K' ? [king + 1, king + 2] : [king - 1, king - 2, king - 3]
  if (gaps.some((index) => game.board[index])) return false
  const passed = wing === 'K' ? [king + 1, king + 2] : [king - 1, king - 2]
  return passed.every((index) => !attacked(game.board, index, enemy))
}

function pseudoMoves(game: Game): Move[] {
  const moves: Move[] = []
  for (let from = 0; from < 64; from += 1) {
    const piece = game.board[from]
    if (!piece || piece.side !== game.side) continue
    if (piece.kind === 'p') addPawn(moves, game, from)
    else if (piece.kind === 'n') addLeap(moves, game, from, KNIGHT)
    else if (piece.kind === 'b') addSlide(moves, game, from, BISHOP_DIRS)
    else if (piece.kind === 'r') addSlide(moves, game, from, ROOK_DIRS)
    else if (piece.kind === 'q') addSlide(moves, game, from, KING_DIRS)
    else addLeap(moves, game, from, KING_DIRS)
  }
  if (canCastle(game, 'K')) moves.push({ from: game.side === 'w' ? 4 : 60, to: game.side === 'w' ? 6 : 62, kind: 'k', capture: false, castle: 'K' })
  if (canCastle(game, 'Q')) moves.push({ from: game.side === 'w' ? 4 : 60, to: game.side === 'w' ? 2 : 58, kind: 'k', capture: false, castle: 'Q' })
  return moves
}

export function play(game: Game, move: Move): Game {
  const board = game.board.slice()
  const us = game.side
  const piece = board[move.from]
  board[move.from] = null
  board[move.to] = move.promo ? { side: us, kind: move.promo } : piece
  if (move.ep) board[move.to + (us === 'w' ? -8 : 8)] = null
  if (move.castle === 'K') {
    const rook = us === 'w' ? 7 : 63
    board[rook - 2] = board[rook]
    board[rook] = null
  }
  if (move.castle === 'Q') {
    const rook = us === 'w' ? 0 : 56
    board[rook + 3] = board[rook]
    board[rook] = null
  }
  let castle = game.castle
  if (piece?.kind === 'k') castle &= us === 'w' ? ~3 : ~12
  if (move.from === 0 || move.to === 0) castle &= ~2
  if (move.from === 7 || move.to === 7) castle &= ~1
  if (move.from === 56 || move.to === 56) castle &= ~8
  if (move.from === 63 || move.to === 63) castle &= ~4
  const ep = piece?.kind === 'p' && Math.abs(move.to - move.from) === 16 ? (move.from + move.to) / 2 : -1
  return { board, side: opposite(us), castle, ep }
}

export function legalMoves(game: Game): Move[] {
  return pseudoMoves(game).filter((move) => {
    const next = play(game, move)
    const king = kingAt(next.board, game.side)
    return king >= 0 && !attacked(next.board, king, next.side)
  })
}

function materialDraw(board: Cell[]): boolean {
  const rest: Kind[] = []
  for (const piece of board) {
    if (piece && piece.kind !== 'k') rest.push(piece.kind)
  }
  if (rest.length === 0) return true
  if (rest.length === 1 && (rest[0] === 'n' || rest[0] === 'b')) return true
  return false
}

export function ending(game: Game): Ending | null {
  const moves = legalMoves(game)
  if (!moves.length) {
    return inCheck(game)
      ? { kind: 'mate', winner: opposite(game.side) }
      : { kind: 'stalemate', winner: 'draw' }
  }
  if (materialDraw(game.board)) return { kind: 'material', winner: 'draw' }
  return null
}

function table(kind: Kind, index: number, side: Side): number {
  const square = side === 'w' ? index : mirror(index)
  if (kind === 'p') return PAWN[square]
  if (kind === 'n') return KNIGHT_PST[square]
  if (kind === 'b') return BISHOP[square]
  if (kind === 'r') return ROOK[square]
  if (kind === 'q') return QUEEN[square]
  return KING[square]
}

function evaluate(game: Game): number {
  let white = 0
  let queens = 0
  for (let index = 0; index < 64; index += 1) {
    const piece = game.board[index]
    if (!piece) continue
    if (piece.kind === 'q') queens += 1
    const sign = piece.side === 'w' ? 1 : -1
    white += sign * (VALUE[piece.kind] + table(piece.kind, index, piece.side))
  }
  if (queens) {
    const whiteKing = kingAt(game.board, 'w')
    const blackKing = kingAt(game.board, 'b')
    white += shelter(whiteKing)
    white -= shelter(blackKing)
  }
  return game.side === 'w' ? white : -white
}

function shelter(king: number): number {
  if (king < 0) return 0
  const file = fileOf(king)
  const rank = rankOf(king)
  if ((file === 6 || file === 2) && (rank === 0 || rank === 7)) return 18
  if (file === 3 || file === 4) return -12
  return 0
}

function moveScore(game: Game, move: Move): number {
  const victim = game.board[move.to]
  let score = move.promo === 'q' ? 800 : 0
  if (victim) score += VALUE[victim.kind] * 10 - VALUE[move.kind]
  if (move.castle) score += 30
  return score
}

function ordered(game: Game, moves: Move[]): Move[] {
  return [...moves].sort((left, right) => moveScore(game, right) - moveScore(game, left))
}

function quiesce(game: Game, alpha: number, beta: number, left: number): number {
  const stand = evaluate(game)
  if (stand >= beta) return beta
  if (stand > alpha) alpha = stand
  if (left === 0) return alpha
  const moves = ordered(
    game,
    legalMoves(game).filter((move) => move.capture || move.promo),
  )
  for (const move of moves) {
    const score = -quiesce(play(game, move), -beta, -alpha, left - 1)
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

function search(game: Game, depth: number, alpha: number, beta: number, ply: number): number {
  if (depth === 0) return quiesce(game, alpha, beta, 2)
  const moves = ordered(game, legalMoves(game))
  if (!moves.length) return inCheck(game) ? -MATE + ply : 0
  for (const move of moves) {
    const score = -search(play(game, move), depth - 1, -beta, -alpha, ply + 1)
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

function chooseEasy(game: Game, moves: Move[], random: () => number): Move {
  const enemy = opposite(game.side)
  const scored = moves.map((move) => {
    const next = play(game, move)
    const victim = game.board[move.to]
    let score = 0
    const fromHit = attacked(game.board, move.from, enemy)
    const toHit = attacked(next.board, move.to, enemy)
    const toSafe = attacked(next.board, move.to, game.side)
    if (fromHit && !toHit) score += 8
    if (victim) score += 4
    if (toHit && !toSafe) score -= 9
    else if (toHit && victim && VALUE[victim.kind] + 80 < VALUE[move.kind]) score -= 5
    return { move, score }
  })
  const best = Math.max(...scored.map((item) => item.score))
  const pool = scored.filter((item) => item.score === best)
  return pool[Math.floor(random() * pool.length)].move
}

function valued(game: Game, moves: Move[], depth: number): Array<{ move: Move; score: number }> {
  return moves
    .map((move) => ({ move, score: -search(play(game, move), depth, -1e9, 1e9, 1) }))
    .sort((left, right) => right.score - left.score)
}

function chooseMid(game: Game, moves: Move[], random: () => number): Move {
  const scored = valued(game, moves, 1)
  const best = scored[0].score
  const window = random() < 0.42 ? 280 : 30
  const pool = scored.filter((item) => item.score >= best - window)
  return pool[Math.floor(random() * pool.length)].move
}

function chooseHard(game: Game, moves: Move[]): Move {
  let best = -1e9
  let pick = moves[0]
  for (const move of ordered(game, moves)) {
    const score = -search(play(game, move), 2, -1e9, -best, 1)
    if (score > best) {
      best = score
      pick = move
    }
  }
  return pick
}

export function chooseMove(game: Game, level: Level, random: () => number = Math.random): Move {
  const moves = legalMoves(game)
  if (moves.length === 1) return moves[0]
  if (level === 'easy') return chooseEasy(game, moves, random)
  if (level === 'mid') return chooseMid(game, moves, random)
  return chooseHard(game, moves)
}

export function perft(game: Game, depth: number): number {
  const moves = legalMoves(game)
  if (depth === 1) return moves.length
  let total = 0
  for (const move of moves) total += perft(play(game, move), depth - 1)
  return total
}

export function findMove(game: Game, from: string, to: string, promo?: Kind): Move | undefined {
  const start = square(from)
  const end = square(to)
  return legalMoves(game).find((move) => move.from === start && move.to === end && move.promo === promo)
}

export function square(name: string): number {
  return (name.charCodeAt(0) - 97) + (Number(name[1]) - 1) * 8
}

export function squareName(index: number): string {
  return 'abcdefgh'[fileOf(index)] + (rankOf(index) + 1)
}

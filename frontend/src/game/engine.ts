export type GameMode = "walls" | "pass-through";

export interface Point {
  x: number;
  y: number;
}

export type GameStatus = "active" | "over";

export interface GameState {
  gridSize: number;
  mode: GameMode;
  snake: Point[];
  dir: Point;
  food: Point;
  score: number;
  status: GameStatus;
}

export const DEFAULT_GRID_SIZE = 20;

export type Rand = () => number;

export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function placeFood(gridSize: number, snake: Point[], rand: Rand = Math.random): Point {
  const free: Point[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { ...snake[0]! };
  const index = Math.min(free.length - 1, Math.floor(rand() * free.length));
  return free[index]!;
}

export function createGame(
  mode: GameMode,
  gridSize = DEFAULT_GRID_SIZE,
  rand: Rand = Math.random,
): GameState {
  const mid = Math.floor(gridSize / 2);
  const snake: Point[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    gridSize,
    mode,
    snake,
    dir: { x: 1, y: 0 },
    food: placeFood(gridSize, snake, rand),
    score: 0,
    status: "active",
  };
}

/** Ignores reversals into the snake's own neck and no-op turns. */
export function turn(state: GameState, dir: Point): GameState {
  if (state.status === "over") return state;
  if (dir.x === 0 && dir.y === 0) return state;
  if (dir.x === -state.dir.x && dir.y === -state.dir.y) return state;
  if (samePoint(dir, state.dir)) return state;
  return { ...state, dir };
}

const wrap = (value: number, size: number) => ((value % size) + size) % size;

export function step(state: GameState, rand: Rand = Math.random): GameState {
  if (state.status === "over") return state;

  const head = state.snake[0]!;
  let next: Point = { x: head.x + state.dir.x, y: head.y + state.dir.y };

  const outOfBounds =
    next.x < 0 || next.y < 0 || next.x >= state.gridSize || next.y >= state.gridSize;

  if (outOfBounds) {
    if (state.mode === "walls") return { ...state, status: "over" };
    next = { x: wrap(next.x, state.gridSize), y: wrap(next.y, state.gridSize) };
  }

  const ate = samePoint(next, state.food);
  // The tail cell frees up on the same tick unless the snake grows.
  const body = ate ? state.snake : state.snake.slice(0, -1);
  if (body.some((s) => samePoint(s, next))) return { ...state, status: "over" };

  const snake = [next, ...body];
  return {
    ...state,
    snake,
    score: ate ? state.score + 10 : state.score,
    food: ate ? placeFood(state.gridSize, snake, rand) : state.food,
  };
}

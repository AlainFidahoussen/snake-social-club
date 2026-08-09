import type { GameMode, Point } from "@/game/engine";

interface SnakeBoardProps {
  gridSize: number;
  snake: Point[];
  food: Point;
  mode: GameMode;
  dimmed?: boolean;
}

export function SnakeBoard({ gridSize, snake, food, mode, dimmed }: SnakeBoardProps) {
  const key = (p: Point) => p.y * gridSize + p.x;
  const snakeIndex = new Map(snake.map((p, i) => [key(p), i]));
  const foodKey = key(food);

  return (
    <div
      className={`board ${mode === "walls" ? "board-walls" : "board-wrap"} ${dimmed ? "opacity-60" : ""}`}
      style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`Snake board, ${mode} mode, length ${snake.length}`}
    >
      {Array.from({ length: gridSize * gridSize }, (_, i) => {
        const segment = snakeIndex.get(i);
        const isHead = segment === 0;
        const isFood = i === foodKey;
        return (
          <div
            key={i}
            className={`cell ${segment !== undefined ? (isHead ? "cell-head" : "cell-body") : ""} ${
              isFood ? "cell-food" : ""
            }`}
          />
        );
      })}
    </div>
  );
}

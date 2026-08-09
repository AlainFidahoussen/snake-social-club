import { describe, expect, it } from "vitest";
import { createGame, placeFood, step, turn, type GameState } from "@/game/engine";

const build = (partial: Partial<GameState>): GameState => ({
  ...createGame("walls", 5, () => 0),
  ...partial,
});

describe("createGame", () => {
  it("starts with a 3-segment snake and food off the snake", () => {
    const game = createGame("walls", 10, () => 0.99);
    expect(game.snake).toHaveLength(3);
    expect(game.status).toBe("active");
    expect(game.snake.some((s) => s.x === game.food.x && s.y === game.food.y)).toBe(false);
  });
});

describe("turn", () => {
  it("ignores a direct reversal", () => {
    const game = build({ dir: { x: 1, y: 0 } });
    expect(turn(game, { x: -1, y: 0 }).dir).toEqual({ x: 1, y: 0 });
  });

  it("accepts a perpendicular turn", () => {
    const game = build({ dir: { x: 1, y: 0 } });
    expect(turn(game, { x: 0, y: 1 }).dir).toEqual({ x: 0, y: 1 });
  });

  it("does nothing once the game is over", () => {
    const game = build({ status: "over" });
    expect(turn(game, { x: 0, y: 1 }).dir).toEqual(game.dir);
  });
});

describe("walls mode", () => {
  it("ends the game when the head leaves the grid", () => {
    const game = build({
      snake: [{ x: 4, y: 0 }],
      dir: { x: 1, y: 0 },
      food: { x: 2, y: 2 },
    });
    expect(step(game).status).toBe("over");
  });
});

describe("pass-through mode", () => {
  it("wraps the head to the opposite edge", () => {
    const game = build({
      mode: "pass-through",
      snake: [{ x: 4, y: 3 }],
      dir: { x: 1, y: 0 },
      food: { x: 2, y: 2 },
    });
    const next = step(game);
    expect(next.status).toBe("active");
    expect(next.snake[0]).toEqual({ x: 0, y: 3 });
  });

  it("wraps backwards past zero too", () => {
    const game = build({
      mode: "pass-through",
      snake: [{ x: 0, y: 0 }],
      dir: { x: 0, y: -1 },
      food: { x: 2, y: 2 },
    });
    expect(step(game).snake[0]).toEqual({ x: 0, y: 4 });
  });
});

describe("eating and collisions", () => {
  it("grows and scores when eating food", () => {
    const game = build({
      snake: [
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      dir: { x: 1, y: 0 },
      food: { x: 2, y: 1 },
    });
    const next = step(game);
    expect(next.score).toBe(10);
    expect(next.snake).toHaveLength(3);
    expect(next.food).not.toEqual({ x: 2, y: 1 });
  });

  it("ends the game on self collision", () => {
    const game = build({
      snake: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
      ],
      dir: { x: 0, y: 1 },
      food: { x: 4, y: 4 },
    });
    expect(step(game).status).toBe("over");
  });

  it("allows moving into the freed tail cell", () => {
    const game = build({
      snake: [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
      ],
      dir: { x: 1, y: 0 },
      food: { x: 4, y: 4 },
    });
    expect(step(game).status).toBe("active");
  });
});

describe("placeFood", () => {
  it("never lands on the snake", () => {
    const snake = Array.from({ length: 24 }, (_, i) => ({ x: i % 5, y: Math.floor(i / 5) }));
    const food = placeFood(5, snake, () => 0);
    expect(snake.some((s) => s.x === food.x && s.y === food.y)).toBe(false);
  });
});

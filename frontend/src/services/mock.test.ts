import { beforeEach, describe, expect, it } from "vitest";
import { createMockServices } from "@/services/mock";
import type { Services } from "@/services/types";

const creds = { username: "viper", password: "hunter2" };

let services: Services;

beforeEach(() => {
  localStorage.clear();
  services = createMockServices();
});

describe("auth service", () => {
  it("signs up, exposes a session, and notifies listeners", async () => {
    const seen: (string | null)[] = [];
    services.auth.onSessionChange((s) => seen.push(s?.user.username ?? null));

    const session = await services.auth.signUp(creds);
    expect(session.user.username).toBe("viper");
    expect(await services.auth.getSession()).not.toBeNull();

    await services.auth.signOut();
    expect(await services.auth.getSession()).toBeNull();
    expect(seen).toEqual(["viper", null]);
  });

  it("rejects duplicate usernames and short passwords", async () => {
    await services.auth.signUp(creds);
    await expect(services.auth.signUp({ ...creds, username: "VIPER" })).rejects.toThrow(/taken/i);
    await expect(services.auth.signUp({ username: "newbie", password: "123" })).rejects.toThrow(/6/);
  });

  it("rejects a wrong password on sign in", async () => {
    await services.auth.signUp(creds);
    await services.auth.signOut();
    await expect(services.auth.signIn({ ...creds, password: "nope" })).rejects.toThrow(/invalid/i);
    await expect(services.auth.signIn(creds)).resolves.toMatchObject({ user: { username: "viper" } });
  });
});

describe("games service", () => {
  it("requires a session to create a game", async () => {
    await expect(services.games.createGame({ mode: "walls", gridSize: 20 })).rejects.toThrow(/signed in/i);
  });

  it("publishes updates that spectators can read", async () => {
    await services.auth.signUp(creds);
    const game = await services.games.createGame({ mode: "pass-through", gridSize: 20 });

    await services.games.updateGame({
      gameId: game.id,
      snake: [{ x: 1, y: 1 }],
      food: { x: 4, y: 4 },
      score: 50,
      status: "active",
    });

    const watched = await services.games.getGame(game.id);
    expect(watched?.score).toBe(50);
    expect((await services.games.listActiveGames()).some((g) => g.id === game.id)).toBe(true);
  });

  it("hides finished games from the active list", async () => {
    await services.auth.signUp(creds);
    const game = await services.games.createGame({ mode: "walls", gridSize: 20 });
    await services.games.updateGame({
      gameId: game.id,
      snake: [{ x: 1, y: 1 }],
      food: { x: 4, y: 4 },
      score: 10,
      status: "over",
    });
    expect((await services.games.listActiveGames()).some((g) => g.id === game.id)).toBe(false);
  });

  it("seeds other players so the watch page is never empty", async () => {
    const active = await services.games.listActiveGames();
    expect(active.length).toBeGreaterThan(0);
  });
});

describe("leaderboard service", () => {
  it("returns scores for the requested mode only, highest first", async () => {
    await services.auth.signUp(creds);
    await services.leaderboard.submitScore({ mode: "walls", score: 5000 });
    await services.leaderboard.submitScore({ mode: "pass-through", score: 6000 });

    const walls = await services.leaderboard.topScores({ mode: "walls" });
    expect(walls.every((entry) => entry.mode === "walls")).toBe(true);
    expect(walls[0]?.score).toBe(5000);

    const wrap = await services.leaderboard.topScores({ mode: "pass-through" });
    expect(wrap[0]?.score).toBe(6000);
  });

  it("respects the limit", async () => {
    const rows = await services.leaderboard.topScores({ mode: "walls", limit: 2 });
    expect(rows).toHaveLength(2);
  });

  it("requires a session to submit", async () => {
    await expect(services.leaderboard.submitScore({ mode: "walls", score: 10 })).rejects.toThrow(
      /signed in/i,
    );
  });
});

import {
  createGame as createEngineGame,
  step,
  turn,
  type GameMode,
  type GameState,
  type Point,
} from "@/game/engine";
import { ServiceError, type GameSnapshot, type ScoreEntry, type Services, type Session, type User } from "./types";

interface StoredUser extends User {
  password: string;
}

interface Bot {
  gameId: string;
  state: GameState;
  tickMs: number;
  lastTick: number;
}

interface Store {
  users: StoredUser[];
  scores: ScoreEntry[];
  games: Record<string, GameSnapshot>;
  session: Session | null;
}

const STORAGE_KEY = "snake.mock.v1";
const LATENCY_MS = 60;

const uid = () => Math.random().toString(36).slice(2, 10);
const delay = (ms = LATENCY_MS) => new Promise<void>((r) => setTimeout(r, ms));
const normalize = (username: string) => username.trim().toLowerCase();

const BOT_NAMES = ["pixelviper", "coilqueen", "byteboa", "mambo_mamba"];

function botTurn(state: GameState): GameState {
  const head = state.snake[0]!;
  const options: Point[] = [
    { x: Math.sign(state.food.x - head.x), y: 0 },
    { x: 0, y: Math.sign(state.food.y - head.y) },
    state.dir,
    { x: state.dir.y, y: state.dir.x },
    { x: -state.dir.y, y: -state.dir.x },
  ];
  for (const dir of options) {
    if (dir.x === 0 && dir.y === 0) continue;
    const candidate = turn(state, dir);
    if (step(candidate).status === "active") return candidate;
  }
  return state;
}

export function createMockServices(): Services {
  const store: Store = { users: [], scores: [], games: {}, session: null };
  const bots: Bot[] = [];
  const listeners = new Set<(session: Session | null) => void>();

  const persist = () => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ users: store.users, scores: store.scores, session: store.session }),
    );
  };

  const restore = () => {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<Store>;
      store.users = parsed.users ?? [];
      store.scores = parsed.scores ?? [];
      store.session = parsed.session ?? null;
    } catch {
      /* corrupt payload: start fresh */
    }
  };

  const seed = () => {
    const modes: GameMode[] = ["walls", "pass-through"];
    BOT_NAMES.forEach((username, i) => {
      const user: StoredUser = { id: `bot-${i}`, username, password: uid() };
      if (!store.users.some((u) => u.id === user.id)) store.users.push(user);

      const mode = modes[i % 2]!;
      for (let n = 0; n < 3; n++) {
        store.scores.push({
          id: uid(),
          userId: user.id,
          username,
          mode: modes[(i + n) % 2]!,
          score: 40 + ((i * 7 + n * 13) % 26) * 10,
          createdAt: Date.now() - (i + n) * 3_600_000,
        });
      }

      const state = createEngineGame(mode);
      const gameId = `bot-game-${i}`;
      store.games[gameId] = {
        id: gameId,
        userId: user.id,
        username,
        mode,
        gridSize: state.gridSize,
        snake: state.snake,
        food: state.food,
        score: 0,
        status: "active",
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
      bots.push({ gameId, state, tickMs: 140 + i * 40, lastTick: Date.now() });
    });
    persist();
  };

  restore();
  seed();

  /** Bots advance lazily: elapsed time is converted into engine ticks on read. */
  const advanceBots = () => {
    const now = Date.now();
    for (const bot of bots) {
      const ticks = Math.min(40, Math.floor((now - bot.lastTick) / bot.tickMs));
      if (ticks <= 0) continue;
      bot.lastTick = now;
      for (let i = 0; i < ticks; i++) {
        bot.state = step(botTurn(bot.state));
        if (bot.state.status === "over") {
          const snapshot = store.games[bot.gameId]!;
          store.scores.push({
            id: uid(),
            userId: snapshot.userId,
            username: snapshot.username,
            mode: snapshot.mode,
            score: bot.state.score,
            createdAt: now,
          });
          bot.state = createEngineGame(bot.state.mode);
          break;
        }
      }
      const snapshot = store.games[bot.gameId]!;
      store.games[bot.gameId] = {
        ...snapshot,
        snake: bot.state.snake,
        food: bot.state.food,
        score: bot.state.score,
        status: "active",
        updatedAt: now,
      };
    }
  };

  const emit = () => listeners.forEach((l) => l(store.session));

  const requireSession = (): Session => {
    if (!store.session) throw new ServiceError("You must be signed in.");
    return store.session;
  };

  const startSession = (user: StoredUser): Session => {
    const session: Session = { token: `mock-${uid()}`, user: { id: user.id, username: user.username } };
    store.session = session;
    persist();
    emit();
    return session;
  };

  return {
    auth: {
      async signUp({ username, password }) {
        await delay();
        if (username.trim().length < 3) throw new ServiceError("Username needs at least 3 characters.");
        if (password.length < 6) throw new ServiceError("Password needs at least 6 characters.");
        if (store.users.some((u) => normalize(u.username) === normalize(username)))
          throw new ServiceError("That username is taken.");
        const user: StoredUser = { id: uid(), username: username.trim(), password };
        store.users.push(user);
        return startSession(user);
      },
      async signIn({ username, password }) {
        await delay();
        const user = store.users.find((u) => normalize(u.username) === normalize(username));
        if (!user || user.password !== password) throw new ServiceError("Invalid username or password.");
        return startSession(user);
      },
      async signOut() {
        await delay(10);
        store.session = null;
        persist();
        emit();
      },
      async getSession() {
        return store.session;
      },
      onSessionChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },

    games: {
      async createGame({ mode, gridSize }) {
        await delay();
        const { user } = requireSession();
        const state = createEngineGame(mode, gridSize);
        const snapshot: GameSnapshot = {
          id: uid(),
          userId: user.id,
          username: user.username,
          mode,
          gridSize,
          snake: state.snake,
          food: state.food,
          score: 0,
          status: "active",
          startedAt: Date.now(),
          updatedAt: Date.now(),
        };
        store.games[snapshot.id] = snapshot;
        return snapshot;
      },
      async updateGame({ gameId, snake, food, score, status }) {
        const { user } = requireSession();
        const existing = store.games[gameId];
        if (!existing) throw new ServiceError("Game not found.");
        if (existing.userId !== user.id) throw new ServiceError("You can only update your own game.");
        const updated: GameSnapshot = { ...existing, snake, food, score, status, updatedAt: Date.now() };
        store.games[gameId] = updated;
        return updated;
      },
      async getGame(gameId) {
        advanceBots();
        return store.games[gameId] ?? null;
      },
      async listActiveGames() {
        await delay(20);
        advanceBots();
        return Object.values(store.games)
          .filter((g) => g.status === "active")
          .sort((a, b) => b.score - a.score);
      },
    },

    leaderboard: {
      async submitScore({ mode, score }) {
        await delay();
        const { user } = requireSession();
        const entry: ScoreEntry = {
          id: uid(),
          userId: user.id,
          username: user.username,
          mode,
          score,
          createdAt: Date.now(),
        };
        store.scores.push(entry);
        persist();
        return entry;
      },
      async topScores({ mode, limit = 10 }) {
        await delay(20);
        advanceBots();
        return store.scores
          .filter((s) => s.mode === mode)
          .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
          .slice(0, limit);
      },
    },
  };
}

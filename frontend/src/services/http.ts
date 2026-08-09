import {
  ServiceError,
  type GameSnapshot,
  type ScoreEntry,
  type Services,
  type Session,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const TOKEN_STORAGE_KEY = "snake.session.token";

class HttpServiceError extends ServiceError {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

interface ErrorBody {
  message: string;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const init: RequestInit = { method: options.method ?? "GET", headers };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    throw new HttpServiceError(
      body?.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

export function createHttpServices(): Services {
  let token: string | null =
    typeof localStorage === "undefined" ? null : localStorage.getItem(TOKEN_STORAGE_KEY);
  let session: Session | null = null;
  const listeners = new Set<(session: Session | null) => void>();

  const setSession = (next: Session | null) => {
    session = next;
    token = next?.token ?? null;
    if (typeof localStorage !== "undefined") {
      if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    listeners.forEach((listener) => listener(session));
  };

  return {
    auth: {
      async signUp(input) {
        const result = await apiFetch<Session>("/auth/signup", { method: "POST", body: input });
        setSession(result);
        return result;
      },
      async signIn(input) {
        const result = await apiFetch<Session>("/auth/signin", { method: "POST", body: input });
        setSession(result);
        return result;
      },
      async signOut() {
        if (token) await apiFetch<void>("/auth/signout", { method: "POST", token });
        setSession(null);
      },
      async getSession() {
        if (!token) return null;
        try {
          session = await apiFetch<Session>("/auth/session", { token });
          return session;
        } catch (error) {
          if (error instanceof HttpServiceError && error.status === 401) {
            setSession(null);
            return null;
          }
          throw error;
        }
      },
      onSessionChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },

    games: {
      async createGame(input) {
        return apiFetch<GameSnapshot>("/games", { method: "POST", body: input, token });
      },
      async updateGame({ gameId, ...body }) {
        return apiFetch<GameSnapshot>(`/games/${gameId}`, { method: "PATCH", body, token });
      },
      async getGame(gameId) {
        try {
          return await apiFetch<GameSnapshot>(`/games/${gameId}`);
        } catch (error) {
          if (error instanceof HttpServiceError && error.status === 404) return null;
          throw error;
        }
      },
      async listActiveGames() {
        return apiFetch<GameSnapshot[]>("/games/active");
      },
    },

    leaderboard: {
      async submitScore(input) {
        return apiFetch<ScoreEntry>("/leaderboard/scores", { method: "POST", body: input, token });
      },
      async topScores({ mode, limit }) {
        const params = new URLSearchParams({ mode });
        if (limit !== undefined) params.set("limit", String(limit));
        return apiFetch<ScoreEntry[]>(`/leaderboard/scores?${params.toString()}`);
      },
    },
  };
}

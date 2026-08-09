import type { GameMode, GameStatus, Point } from "@/game/engine";

export interface User {
  id: string;
  username: string;
}

export interface Session {
  token: string;
  user: User;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface ScoreEntry {
  id: string;
  userId: string;
  username: string;
  mode: GameMode;
  score: number;
  createdAt: number;
}

/** What watchers see: the authoritative snapshot of one player's run. */
export interface GameSnapshot {
  id: string;
  userId: string;
  username: string;
  mode: GameMode;
  gridSize: number;
  snake: Point[];
  food: Point;
  score: number;
  status: GameStatus;
  startedAt: number;
  updatedAt: number;
}

export interface AuthService {
  signUp(input: Credentials): Promise<Session>;
  signIn(input: Credentials): Promise<Session>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onSessionChange(listener: (session: Session | null) => void): () => void;
}

export interface GamesService {
  createGame(input: { mode: GameMode; gridSize: number }): Promise<GameSnapshot>;
  updateGame(input: {
    gameId: string;
    snake: Point[];
    food: Point;
    score: number;
    status: GameStatus;
  }): Promise<GameSnapshot>;
  getGame(gameId: string): Promise<GameSnapshot | null>;
  listActiveGames(): Promise<GameSnapshot[]>;
}

export interface LeaderboardService {
  submitScore(input: { mode: GameMode; score: number }): Promise<ScoreEntry>;
  topScores(input: { mode: GameMode; limit?: number }): Promise<ScoreEntry[]>;
}

/** Every backend call in the app goes through this one object. */
export interface Services {
  auth: AuthService;
  games: GamesService;
  leaderboard: LeaderboardService;
}

export class ServiceError extends Error {}

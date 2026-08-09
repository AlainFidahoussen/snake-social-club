import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SnakeBoard } from "@/components/snake-board";
import { useSession } from "@/hooks/use-session";
import {
  createGame,
  step,
  turn,
  DEFAULT_GRID_SIZE,
  type GameMode,
  type GameState,
} from "@/game/engine";
import { getServices } from "@/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Serpent.io — Multiplayer Snake with Walls & Wrap Modes" },
      {
        name: "description",
        content:
          "Play Snake in walls or pass-through mode, climb the per-mode leaderboard, and watch other players' live runs.",
      },
      { property: "og:title", content: "Serpent.io — Multiplayer Snake" },
      {
        property: "og:description",
        content: "Two modes, live spectating, and global per-mode leaderboards.",
      },
    ],
  }),
  component: PlayPage,
});

const TICK_MS = 120;

const KEY_DIRS: Record<string, { x: number; y: number }> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function PlayPage() {
  const { session, loading } = useSession();
  const [mode, setMode] = useState<GameMode>("walls");
  const [state, setState] = useState<GameState>(() => createGame("walls", DEFAULT_GRID_SIZE, () => 0.5));
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  const reset = useCallback(
    (nextMode: GameMode) => {
      setMode(nextMode);
      setState(createGame(nextMode));
      setRunning(false);
      gameIdRef.current = null;
      submittedRef.current = false;
    },
    [],
  );

  const start = useCallback(async () => {
    const fresh = createGame(mode);
    setState(fresh);
    submittedRef.current = false;
    setRunning(true);
    if (!session) return;
    const game = await getServices().games.createGame({ mode, gridSize: fresh.gridSize });
    gameIdRef.current = game.id;
  }, [mode, session]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const dir = KEY_DIRS[event.key];
      if (!dir) return;
      event.preventDefault();
      setState((prev) => turn(prev, dir));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setState((prev) => step(prev)), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // Publish the run so spectators can follow it, and record the final score.
  useEffect(() => {
    if (!session || !gameIdRef.current) return;
    const services = getServices();
    void services.games
      .updateGame({
        gameId: gameIdRef.current,
        snake: state.snake,
        food: state.food,
        score: state.score,
        status: state.status,
      })
      .catch(() => undefined);

    if (state.status === "over" && !submittedRef.current) {
      submittedRef.current = true;
      void services.leaderboard
        .submitScore({ mode: state.mode, score: state.score })
        .catch(() => undefined);
    }
  }, [state, session]);

  useEffect(() => {
    if (state.status !== "over") return;
    setRunning(false);
  }, [state.status]);

  useEffect(() => {
    let active = true;
    void getServices()
      .leaderboard.topScores({ mode, limit: 1 })
      .then((rows) => active && setBest(rows[0]?.score ?? 0));
    return () => {
      active = false;
    };
  }, [mode, state.status]);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[minmax(0,42rem)_1fr]">
      <div className="space-y-4">
        <SnakeBoard
          gridSize={state.gridSize}
          snake={state.snake}
          food={state.food}
          mode={state.mode}
          dimmed={state.status === "over"}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void start()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {state.status === "over" ? "Play again" : running ? "Restart" : "Start game"}
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            disabled={state.status === "over"}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      <aside className="space-y-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Snake, two ways</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Arrow keys or WASD. Eat, grow, and don't bite yourself.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { value: "walls", title: "Walls", copy: "Touch an edge and it's over." },
              { value: "pass-through", title: "Pass-through", copy: "Edges wrap you to the far side." },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => reset(option.value)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                mode === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className="font-medium">{option.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{option.copy}</div>
            </button>
          ))}
        </div>

        <dl className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Score" value={state.score} />
          <Stat label="Length" value={state.snake.length} />
          <Stat label="Mode best" value={best ?? "—"} />
        </dl>

        {state.status === "over" && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            Game over — {state.score} points{session ? " submitted to the leaderboard." : "."}
          </p>
        )}

        {!loading && !session && (
          <p className="rounded-md border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Log in
            </Link>{" "}
            or{" "}
            <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
              sign up
            </Link>{" "}
            to save scores and let others watch your run live.
          </p>
        )}
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 py-3">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl text-accent">{value}</dd>
    </div>
  );
}

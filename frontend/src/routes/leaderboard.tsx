import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { GameMode } from "@/game/engine";
import { getServices } from "@/services";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Snake Leaderboard — Top Scores by Mode | Serpent.io" },
      {
        name: "description",
        content: "See the highest Snake scores for walls mode and pass-through mode across all players.",
      },
      { property: "og:title", content: "Snake Leaderboard by Mode" },
      { property: "og:description", content: "Top walls and pass-through Snake scores." },
    ],
  }),
  component: LeaderboardPage,
});

const MODES: { value: GameMode; label: string }[] = [
  { value: "walls", label: "Walls" },
  { value: "pass-through", label: "Pass-through" },
];

function LeaderboardPage() {
  const [mode, setMode] = useState<GameMode>("walls");
  const { data, isPending } = useQuery({
    queryKey: ["leaderboard", mode],
    queryFn: () => getServices().leaderboard.topScores({ mode, limit: 10 }),
    refetchInterval: 5000,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight">Leaderboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Top 10 scores per mode.</p>

      <div className="mt-6 inline-flex rounded-lg border border-border p-1">
        {MODES.map((option) => (
          <button
            key={option.value}
            onClick={() => setMode(option.value)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              mode === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ol className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/60">
        {isPending && <li className="px-4 py-3 text-sm text-muted-foreground">Loading scores…</li>}
        {data?.length === 0 && (
          <li className="px-4 py-3 text-sm text-muted-foreground">No scores in this mode yet.</li>
        )}
        {data?.map((entry, i) => (
          <li key={entry.id} className="flex items-center gap-4 px-4 py-3">
            <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
            <span className="flex-1 truncate">{entry.username}</span>
            <span className="font-display text-lg text-accent">{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

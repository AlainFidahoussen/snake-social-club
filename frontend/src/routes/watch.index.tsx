import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SnakeBoard } from "@/components/snake-board";
import { getServices } from "@/services";

export const Route = createFileRoute("/watch/")({
  head: () => ({
    meta: [
      { title: "Watch Live Snake Games — Spectate Players | Serpent.io" },
      {
        name: "description",
        content: "Browse every active Snake run and spectate any player's board live, tick by tick.",
      },
      { property: "og:title", content: "Watch Live Snake Games" },
      { property: "og:description", content: "Spectate active players in walls and pass-through modes." },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { data, isPending } = useQuery({
    queryKey: ["active-games"],
    queryFn: () => getServices().games.listActiveGames(),
    refetchInterval: 1000,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight">Live games</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isPending ? "Finding players…" : `${data?.length ?? 0} active run(s) right now.`}
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((game) => (
          <Link
            key={game.id}
            to="/watch/$gameId"
            params={{ gameId: game.id }}
            className="group rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-baseline justify-between">
              <span className="truncate font-medium">{game.username}</span>
              <span className="font-display text-lg text-accent">{game.score}</span>
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {game.mode}
            </div>
            <div className="mt-4">
              <SnakeBoard
                gridSize={game.gridSize}
                snake={game.snake}
                food={game.food}
                mode={game.mode}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

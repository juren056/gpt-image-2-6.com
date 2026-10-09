import { useQuery } from '@tanstack/react-query';
import { Activity, ImageIcon, Trophy, Users } from 'lucide-react';

import { apiGet } from '@/lib/api-client';
import type { CommunityStatsResponse } from '@/lib/public-stats';
import { m } from '@/paraglide/messages.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Community() {
  const statsQuery = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => apiGet<CommunityStatsResponse>('/api/public-stats'),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
  const stats = statsQuery.data;
  const canViewMetrics = stats?.canViewMetrics === true;
  const metrics = [
    {
      icon: Activity,
      label: m['landing.community.online'](),
      value: stats?.onlineCreators,
    },
    {
      icon: ImageIcon,
      label: m['landing.community.today'](),
      value: stats?.generationsToday,
    },
    {
      icon: Users,
      label: m['landing.community.creators'](),
      value: stats?.totalCreators,
    },
  ];

  return (
    <section id="community" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-start">
          <div>
            <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              {m['landing.community.eyebrow']()}
            </p>
            <h2 className="max-w-xl font-serif text-4xl tracking-tight sm:text-5xl">
              {m['landing.community.title']()}
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl leading-relaxed">
              {m['landing.community.description']()}
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {metrics.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="border-border bg-card rounded-2xl border p-5"
                >
                  <Icon className="text-primary mb-5 size-5" />
                  {statsQuery.isPending ? (
                    <div className="bg-muted h-9 w-16 animate-pulse rounded-lg" />
                  ) : canViewMetrics &&
                    value !== null &&
                    value !== undefined ? (
                    <p className="text-3xl font-semibold tracking-tight tabular-nums">
                      {value.toLocaleString()}
                    </p>
                  ) : (
                    <p
                      className="from-primary/55 via-primary/25 to-muted-foreground/20 h-9 bg-gradient-to-r bg-clip-text text-2xl font-semibold tracking-[0.28em] text-transparent select-none"
                      aria-hidden="true"
                    >
                      •••
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1 text-xs">{label}</p>
                </div>
              ))}
            </div>
            {canViewMetrics && (
              <p className="text-muted-foreground mt-3 text-xs">
                {m['landing.community.live_note']()}
              </p>
            )}
          </div>

          <div className="border-border bg-card overflow-hidden rounded-[2rem] border">
            <div className="border-border flex items-center justify-between border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                  <Trophy className="size-4" />
                </span>
                <div>
                  <h3 className="font-medium">
                    {m['landing.community.leaderboard']()}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {m['landing.community.leaderboard_period']()}
                  </p>
                </div>
              </div>
              <span className="border-border bg-muted rounded-full border px-2.5 py-1 text-[11px] font-medium">
                {m['landing.community.live']()}
              </span>
            </div>

            <div className="p-3">
              {stats?.leaderboard.length ? (
                stats.leaderboard.map((creator, index) => (
                  <div
                    key={`${creator.name}-${index}`}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3.5"
                  >
                    <span className="text-muted-foreground w-5 text-center text-xs font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <Avatar className="size-9">
                      <AvatarImage src={creator.image || undefined} />
                      <AvatarFallback>
                        {creator.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {creator.name}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {m['landing.community.generations']({
                        count: creator.generations,
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center">
                  <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
                    <Trophy className="size-5" />
                  </div>
                  <p className="mt-4 text-sm font-medium">
                    {m['landing.community.empty_title']()}
                  </p>
                  <p className="text-muted-foreground mt-2 max-w-xs text-xs leading-relaxed">
                    {m['landing.community.empty_description']()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type PublicStats = {
  onlineCreators: number;
  generationsToday: number;
  totalCreators: number;
  leaderboard: Array<{
    name: string;
    image: string | null;
    generations: number;
  }>;
  measuredAt: string;
};

export type CommunityStatsResponse = Omit<
  PublicStats,
  'onlineCreators' | 'generationsToday' | 'totalCreators'
> & {
  canViewMetrics: boolean;
  onlineCreators: number | null;
  generationsToday: number | null;
  totalCreators: number | null;
};

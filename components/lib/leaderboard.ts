import { supabase, isConfigured } from './supabase';

export interface LeaderboardEntry {
  player_name: string;
  wave: number;
  score: number;
}

export async function fetchLeaderboard(limit = 5): Promise<LeaderboardEntry[]> {
  if (!isConfigured()) return [];

  const { data, error } = await supabase!
    .from('leaderboard')
    .select('player_name, wave, score')
    .order('wave', { ascending: false })
    .order('score', { ascending: false })
    .limit(limit * 4); // берём с запасом для дедупликации по игроку

  if (error) {
    console.error('[leaderboard] fetch error:', error.message);
    return [];
  }

  // Лучший результат каждого уникального игрока
  const best = new Map<string, LeaderboardEntry>();
  for (const row of data ?? []) {
    const key = (row.player_name as string).toLowerCase();
    const prev = best.get(key);
    if (
      !prev ||
      row.wave > prev.wave ||
      (row.wave === prev.wave && row.score > prev.score)
    ) {
      best.set(key, {
        player_name: row.player_name,
        wave: row.wave,
        score: row.score,
      });
    }
  }

  return [...best.values()]
    .sort((a, b) => b.wave - a.wave || b.score - a.score)
    .slice(0, limit);
}

export async function submitScore(
  playerName: string,
  wave: number,
  score: number,
  kills: number,
): Promise<void> {
  if (!isConfigured()) return;
  const name = playerName.trim().slice(0, 18).toUpperCase();
  if (!name) return;

  const { error } = await supabase!.from('leaderboard').insert({
    player_name: name,
    wave: Math.max(1, Math.floor(wave)),
    score: Math.max(0, Math.floor(score)),
    kills: Math.max(0, Math.floor(kills)),
  });

  if (error) console.error('[leaderboard] submit error:', error.message);
}

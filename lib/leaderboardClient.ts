export interface WaveLeaderboardEntry {
  id: string;
  player_name: string;
  wave: number;
  score: number;
  created_at: string;
}

interface SubmitPayload {
  playerName: string;
  wave: number;
  score: number;
}

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
const LEADERBOARD_TABLE = ((import.meta as any).env?.VITE_LEADERBOARD_TABLE as string | undefined) || 'leaderboard_waves';

const hasConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function getHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchWaveLeaderboard(limit = 8): Promise<WaveLeaderboardEntry[]> {
  if (!hasConfig) return [];

  const url = `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}?select=id,player_name,wave,score,created_at&order=wave.desc,score.desc,created_at.asc&limit=${limit}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    throw new Error(`Leaderboard fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function submitWaveResult({ playerName, wave, score }: SubmitPayload): Promise<void> {
  if (!hasConfig) return;

  const url = `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}`;
  const payload = {
    player_name: (playerName || 'YOU').trim().slice(0, 18),
    wave: Math.max(1, Math.floor(wave || 1)),
    score: Math.max(0, Math.floor(score || 0)),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Leaderboard submit failed: ${res.status}`);
  }
}

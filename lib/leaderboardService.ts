export interface WaveLeaderboardEntry {
  id: string;
  player_name: string;
  wave: number;
  score: number;
  created_at: string;
}

export interface SubmitPayload {
  playerName: string;
  wave: number;
  score: number;
}

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
const LEADERBOARD_TABLE = ((import.meta as any).env?.VITE_LEADERBOARD_TABLE as string | undefined) || 'leaderboard';

export function isLeaderboardConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getHeaders() {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY!,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
  if (SUPABASE_ANON_KEY?.includes('.')) headers.Authorization = `Bearer ${SUPABASE_ANON_KEY!}`;
  return headers;
}

function toEntry(row: any, i: number): WaveLeaderboardEntry {
  return {
    id: String(row?.id ?? `row_${i}`),
    player_name: String(row?.player_name ?? 'YOU'),
    wave: Math.max(1, Number(row?.wave) || 1),
    score: Math.max(0, Number(row?.score) || 0),
    created_at: String(row?.created_at || new Date().toISOString()),
  };
}

export async function fetchLeaderboardRows(limit = 200): Promise<WaveLeaderboardEntry[]> {
  if (!isLeaderboardConfigured()) return [];

  const url =
    `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}` +
    `?select=id,player_name,wave,score,created_at` +
    `&order=wave.desc,score.desc,created_at.asc` +
    `&limit=${limit}` +
    `&_ts=${Date.now()}`;

  const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) {
    const details = await res.text().catch(() => '');
    throw new Error(`Leaderboard fetch failed: ${res.status}${details ? ` ${details}` : ''}`);
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  return rows.map(toEntry);
}

export async function submitLeaderboardRow({ playerName, wave, score }: SubmitPayload): Promise<void> {
  if (!isLeaderboardConfigured()) return;

  const payload = {
    player_name: (playerName || 'YOU').trim().slice(0, 18),
    wave: Math.max(1, Math.floor(wave || 1)),
    score: Math.max(0, Math.floor(score || 0)),
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      ...getHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => '');
    throw new Error(`Leaderboard submit failed: ${res.status}${details ? ` ${details}` : ''}`);
  }
}

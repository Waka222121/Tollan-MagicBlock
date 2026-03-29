export interface WaveLeaderboardEntry {
  id: string;
  player_name: string;
  wave: number;
  score: number;
  created_at: string;
}

export type LeaderboardMode = 'global' | 'local';

interface SubmitPayload {
  playerName: string;
  wave: number;
  score: number;
}

const SUPABASE_URL       = (import.meta as any).env?.VITE_SUPABASE_URL       as string | undefined;
const SUPABASE_ANON_KEY  = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY  as string | undefined;
const LEADERBOARD_TABLE  = ((import.meta as any).env?.VITE_LEADERBOARD_TABLE as string | undefined) || 'leaderboard_waves';

const hasConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const LOCAL_LEADERBOARD_KEY = 'mb_local_leaderboard';

// ─── Local fallback ───────────────────────────────────────────

function loadLocalLeaderboard(): WaveLeaderboardEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && typeof row.player_name === 'string')
      .map((row) => ({
        id:         String(row.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`),
        player_name: String(row.player_name || 'YOU'),
        wave:        Math.max(1, Number(row.wave)  || 1),
        score:       Math.max(0, Number(row.score) || 0),
        created_at:  String(row.created_at || new Date().toISOString()),
      }));
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(rows: WaveLeaderboardEntry[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(rows));
}

// ─── Sorting / dedup helpers ──────────────────────────────────

function normalizePlayerName(name: string) {
  return String(name || '').trim().toLowerCase();
}

function isBetterEntry(next: WaveLeaderboardEntry, prev: WaveLeaderboardEntry) {
  if (next.wave  !== prev.wave)  return next.wave  > prev.wave;
  if (next.score !== prev.score) return next.score > prev.score;
  return next.created_at < prev.created_at;
}

function uniqueBestByPlayer(rows: WaveLeaderboardEntry[]) {
  const bestByName = new Map<string, WaveLeaderboardEntry>();
  for (const row of rows) {
    const key = normalizePlayerName(row.player_name);
    if (!key) continue;
    const prev = bestByName.get(key);
    if (!prev || isBetterEntry(row, prev)) bestByName.set(key, row);
  }
  return [...bestByName.values()];
}

function sortLeaderboard(rows: WaveLeaderboardEntry[]) {
  return [...rows].sort(
    (a, b) => (b.wave - a.wave) || (b.score - a.score) || a.created_at.localeCompare(b.created_at)
  );
}

// ─── Headers ──────────────────────────────────────────────────
// FIX: always send Authorization: Bearer — Supabase REST API requires it
// regardless of key format (jwt OR sb_publishable_).

function getHeaders(): Record<string, string> {
  return {
    'apikey':        SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY!}`,
    'Content-Type':  'application/json',
    'Cache-Control': 'no-cache',
  };
}

// ─── Fetch leaderboard ────────────────────────────────────────

export async function fetchWaveLeaderboard(limit = 8): Promise<WaveLeaderboardEntry[]> {
  if (!hasConfig) {
    return sortLeaderboard(uniqueBestByPlayer(loadLocalLeaderboard())).slice(0, limit);
  }

  const pageSize = Math.max(limit * 6, 50);
  const maxPages = 4;
  let offset = 0;
  let rows: WaveLeaderboardEntry[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const url =
      `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}` +
      `?select=id,player_name,wave,score,created_at` +
      `&order=wave.desc,score.desc,created_at.asc` +
      `&limit=${pageSize}&offset=${offset}` +
      `&_ts=${Date.now()}`;

    let res: Response;
    try {
      res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
    } catch (networkErr) {
      // true network failure → fall back to local
      console.warn('[leaderboard] network error, using local fallback', networkErr);
      return sortLeaderboard(uniqueBestByPlayer(loadLocalLeaderboard())).slice(0, limit);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Leaderboard fetch failed: ${res.status} ${body}`);
    }

    const chunk = await res.json();
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    rows = rows.concat(chunk);

    const uniqueCount = uniqueBestByPlayer(rows).length;
    if (uniqueCount >= limit || chunk.length < pageSize) break;

    offset += pageSize;
  }

  return sortLeaderboard(uniqueBestByPlayer(rows)).slice(0, limit);
}

export function getLeaderboardMode(): LeaderboardMode {
  return hasConfig ? 'global' : 'local';
}

// ─── Submit score ─────────────────────────────────────────────

export async function submitWaveResult({ playerName, wave, score }: SubmitPayload): Promise<void> {
  const payload = {
    player_name: (playerName || 'YOU').trim().slice(0, 18),
    wave:        Math.max(1, Math.floor(wave  || 1)),
    score:       Math.max(0, Math.floor(score || 0)),
  };

  if (!hasConfig) {
    // Local fallback: keep only best result per player
    const rows = loadLocalLeaderboard();
    const now  = new Date().toISOString();
    const incoming: WaveLeaderboardEntry = {
      id:         `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      player_name: payload.player_name,
      wave:        payload.wave,
      score:       payload.score,
      created_at:  now,
    };
    const key = normalizePlayerName(payload.player_name);
    const idx = rows.findIndex((row) => normalizePlayerName(row.player_name) === key);
    if (idx >= 0) {
      if (isBetterEntry(incoming, rows[idx])) rows[idx] = { ...rows[idx], ...incoming };
    } else {
      rows.push(incoming);
    }
    saveLocalLeaderboard(sortLeaderboard(uniqueBestByPlayer(rows)).slice(0, 64));
    return;
  }

  const url = `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      cache:  'no-store',
      headers: { ...getHeaders(), Prefer: 'return=minimal' },
      body:   JSON.stringify(payload),
    });
  } catch (networkErr) {
    console.warn('[leaderboard] submit network error', networkErr);
    return;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Leaderboard submit failed: ${res.status} ${body}`);
  }
}

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

const SUPABASE_URL      = (import.meta as any).env?.VITE_SUPABASE_URL      as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
const LEADERBOARD_TABLE = ((import.meta as any).env?.VITE_LEADERBOARD_TABLE as string | undefined) || 'leaderboard_waves';

const hasConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const LOCAL_LEADERBOARD_KEY = 'mb_local_leaderboard';
const FETCH_TIMEOUT_MS = 8000;

// ─── fetch with timeout ───────────────────────────────────────
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    fetch(url, options)
      .then((res) => { clearTimeout(timer); resolve(res); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

// ─── headers ─────────────────────────────────────────────────
// Supabase accepts both old JWT keys (eyJ...) and new publishable keys (sb_publishable_...)
// as the apikey header. Authorization: Bearer is only needed for JWT keys.
function getReadHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'apikey':        SUPABASE_ANON_KEY!,
    'Content-Type':  'application/json',
    'Cache-Control': 'no-cache, no-store',
  };
  // JWT keys need Bearer token; publishable keys use apikey header only
  if (SUPABASE_ANON_KEY?.startsWith('eyJ')) {
    h['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return h;
}

function getWriteHeaders(): Record<string, string> {
  return {
    ...getReadHeaders(),
    'Prefer': 'return=minimal',
  };
}

// ─── local storage fallback ───────────────────────────────────
function loadLocalLeaderboard(): WaveLeaderboardEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r.player_name === 'string')
      .map((r) => ({
        id:          String(r.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`),
        player_name: String(r.player_name || 'YOU'),
        wave:        Math.max(1, Number(r.wave)  || 1),
        score:       Math.max(0, Number(r.score) || 0),
        created_at:  String(r.created_at || new Date().toISOString()),
      }));
  } catch { return []; }
}

function saveLocalLeaderboard(rows: WaveLeaderboardEntry[]) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(rows)); } catch { /* quota */ }
}

// ─── sort / dedup ─────────────────────────────────────────────
function normalizePlayerName(name: string) {
  return String(name || '').trim().toLowerCase();
}

function isBetterEntry(next: WaveLeaderboardEntry, prev: WaveLeaderboardEntry) {
  if (next.wave  !== prev.wave)  return next.wave  > prev.wave;
  if (next.score !== prev.score) return next.score > prev.score;
  return next.created_at < prev.created_at;
}

function uniqueBestByPlayer(rows: WaveLeaderboardEntry[]) {
  const best = new Map<string, WaveLeaderboardEntry>();
  for (const row of rows) {
    const key = normalizePlayerName(row.player_name);
    if (!key) continue;
    const prev = best.get(key);
    if (!prev || isBetterEntry(row, prev)) best.set(key, row);
  }
  return [...best.values()];
}

function sortLeaderboard(rows: WaveLeaderboardEntry[]) {
  return [...rows].sort(
    (a, b) => (b.wave - a.wave) || (b.score - a.score) || a.created_at.localeCompare(b.created_at)
  );
}

// ─── public API ───────────────────────────────────────────────

export async function fetchWaveLeaderboard(limit = 8): Promise<WaveLeaderboardEntry[]> {
  if (!hasConfig) {
    console.warn('[leaderboard] No Supabase config — using local storage');
    return sortLeaderboard(uniqueBestByPlayer(loadLocalLeaderboard())).slice(0, limit);
  }

  const url =
    `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}` +
    `?select=id,player_name,wave,score,created_at` +
    `&order=wave.desc,score.desc,created_at.asc` +
    `&limit=200` +
    `&_ts=${Date.now()}`;

  console.log('[leaderboard] fetching from', SUPABASE_URL);

  let res: Response;
  try {
    res = await fetchWithTimeout(url, { headers: getReadHeaders(), cache: 'no-store' });
  } catch (err) {
    console.warn('[leaderboard] fetch error (network/timeout):', err);
    return sortLeaderboard(uniqueBestByPlayer(loadLocalLeaderboard())).slice(0, limit);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[leaderboard] fetch failed: HTTP ${res.status}`, body);
    throw new Error(`Leaderboard fetch failed: ${res.status} — ${body}`);
  }

  const data = await res.json();
  console.log('[leaderboard] fetched rows:', data?.length ?? 0);

  if (!Array.isArray(data) || data.length === 0) return [];

  return sortLeaderboard(uniqueBestByPlayer(data as WaveLeaderboardEntry[])).slice(0, limit);
}

export function getLeaderboardMode(): LeaderboardMode {
  return hasConfig ? 'global' : 'local';
}

export async function submitWaveResult({ playerName, wave, score }: SubmitPayload): Promise<void> {
  const payload = {
    player_name: (playerName || 'YOU').trim().slice(0, 18),
    wave:        Math.max(1, Math.floor(wave  || 1)),
    score:       Math.max(0, Math.floor(score || 0)),
  };

  if (!hasConfig) {
    const rows = loadLocalLeaderboard();
    const now  = new Date().toISOString();
    const incoming: WaveLeaderboardEntry = {
      id:          `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      player_name: payload.player_name,
      wave:        payload.wave,
      score:       payload.score,
      created_at:  now,
    };
    const key = normalizePlayerName(payload.player_name);
    const idx = rows.findIndex((r) => normalizePlayerName(r.player_name) === key);
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
    res = await fetchWithTimeout(url, {
      method:  'POST',
      cache:   'no-store',
      headers: getWriteHeaders(),
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[leaderboard] submit network error:', err);
    return;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[leaderboard] submit failed: HTTP ${res.status}`, body);
    throw new Error(`Leaderboard submit failed: ${res.status} — ${body}`);
  }

  console.log('[leaderboard] submitted:', payload);
}

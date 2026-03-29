export interface WaveLeaderboardEntry {
  id?: string;
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
function fetchWithTimeout(url: string, options: RequestInit, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Request timed out')), ms);
    fetch(url, options)
      .then(r => { clearTimeout(t); resolve(r); })
      .catch(e => { clearTimeout(t); reject(e); });
  });
}
 
// ─── headers ─────────────────────────────────────────────────
// Send key BOTH as apikey header AND Authorization Bearer
// so it works with old JWT keys (eyJ...) and new sb_publishable_ keys
function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'apikey':        SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY!}`,
    'Content-Type':  'application/json',
    'Cache-Control': 'no-cache, no-store',
    ...extra,
  };
}
 
// ─── build URL with apikey as query param (fallback for new key format) ──
function buildUrl(path: string, params: Record<string, string> = {}): string {
  const p = new URLSearchParams({
    apikey: SUPABASE_ANON_KEY!,
    ...params,
    _ts: String(Date.now()),
  });
  return `${SUPABASE_URL}/rest/v1/${path}?${p.toString()}`;
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
      .filter((r: any) => r && typeof r.player_name === 'string')
      .map((r: any) => ({
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
  try { localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(rows)); } catch { /**/ }
}
 
// ─── sort / dedup ─────────────────────────────────────────────
function norm(name: string) {
  return String(name || '').trim().toLowerCase();
}
 
function isBetter(next: WaveLeaderboardEntry, prev: WaveLeaderboardEntry) {
  if (next.wave  !== prev.wave)  return next.wave  > prev.wave;
  if (next.score !== prev.score) return next.score > prev.score;
  return next.created_at < prev.created_at;
}
 
function dedup(rows: WaveLeaderboardEntry[]) {
  const best = new Map<string, WaveLeaderboardEntry>();
  for (const row of rows) {
    const key = norm(row.player_name);
    if (!key) continue;
    const prev = best.get(key);
    if (!prev || isBetter(row, prev)) best.set(key, row);
  }
  return [...best.values()];
}
 
function sort(rows: WaveLeaderboardEntry[]) {
  return [...rows].sort(
    (a, b) => (b.wave - a.wave) || (b.score - a.score) || a.created_at.localeCompare(b.created_at)
  );
}
 
function normalize(data: any[]): WaveLeaderboardEntry[] {
  return data.map((r, i) => ({
    id:          String(r.id ?? `${i}_${r.player_name}`),
    player_name: String(r.player_name || 'YOU'),
    wave:        Math.max(1, Number(r.wave)  || 1),
    score:       Math.max(0, Number(r.score) || 0),
    created_at:  String(r.created_at || new Date().toISOString()),
  }));
}
 
// ─── public API ───────────────────────────────────────────────
 
export async function fetchWaveLeaderboard(limit = 8): Promise<WaveLeaderboardEntry[]> {
  if (!hasConfig) {
    console.warn('[leaderboard] No Supabase config — using localStorage');
    return sort(dedup(loadLocalLeaderboard())).slice(0, limit);
  }
 
  // Pass key both as header AND query param — works with all Supabase key formats
  const url = buildUrl(LEADERBOARD_TABLE, {
    select: 'player_name,wave,score,created_at',
    order:  'wave.desc,score.desc,created_at.asc',
    limit:  '200',
  });
 
  console.log('[leaderboard] GET', url.split('?')[0]);
 
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    });
  } catch (err) {
    console.warn('[leaderboard] network/timeout error:', err);
    return sort(dedup(loadLocalLeaderboard())).slice(0, limit);
  }
 
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[leaderboard] GET failed ${res.status}:`, body);
    throw new Error(`Leaderboard fetch failed: ${res.status} — ${body}`);
  }
 
  const data = await res.json();
  console.log('[leaderboard] rows received:', Array.isArray(data) ? data.length : data);
 
  if (!Array.isArray(data) || data.length === 0) return [];
  return sort(dedup(normalize(data))).slice(0, limit);
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
    const incoming: WaveLeaderboardEntry = {
      id:          `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      player_name: payload.player_name,
      wave:        payload.wave,
      score:       payload.score,
      created_at:  new Date().toISOString(),
    };
    const key = norm(payload.player_name);
    const idx = rows.findIndex(r => norm(r.player_name) === key);
    if (idx >= 0) {
      if (isBetter(incoming, rows[idx])) rows[idx] = { ...rows[idx], ...incoming };
    } else {
      rows.push(incoming);
    }
    saveLocalLeaderboard(sort(dedup(rows)).slice(0, 64));
    return;
  }
 
  // Pass key as query param for POST too
  const url = buildUrl(LEADERBOARD_TABLE);
 
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method:  'POST',
      cache:   'no-store',
      headers: getHeaders({ 'Prefer': 'return=minimal' }),
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[leaderboard] submit network error:', err);
    return;
  }
 
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[leaderboard] POST failed ${res.status}:`, body);
    throw new Error(`Leaderboard submit failed: ${res.status} — ${body}`);
  }
 
  console.log('[leaderboard] submitted:', payload);
}
 

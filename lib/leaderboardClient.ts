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

function fetchWithTimeout(url: string, options: RequestInit, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(url, options)
      .then(r => { clearTimeout(t); resolve(r); })
      .catch(e => { clearTimeout(t); reject(e); });
  });
}

// Always send key both as header AND query param — works with all key formats
function makeUrl(table: string, params: Record<string, string> = {}): string {
  const p = new URLSearchParams({ apikey: SUPABASE_ANON_KEY!, ...params, _ts: String(Date.now()) });
  return `${SUPABASE_URL}/rest/v1/${table}?${p}`;
}

function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'apikey':        SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY!}`,
    'Content-Type':  'application/json',
    ...extra,
  };
}

// ─── local storage ────────────────────────────────────────────
function loadLocal(): WaveLeaderboardEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r: any) => r && typeof r.player_name === 'string')
      .map((r: any, i: number) => ({
        id:          String(r.id || `local_${i}`),
        player_name: String(r.player_name || 'YOU'),
        wave:        Math.max(1, Number(r.wave)  || 1),
        score:       Math.max(0, Number(r.score) || 0),
        created_at:  String(r.created_at || new Date().toISOString()),
      }));
  } catch { return []; }
}

function saveLocal(rows: WaveLeaderboardEntry[]) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(rows)); } catch { /**/ }
}

// ─── sort / dedup ─────────────────────────────────────────────
function norm(n: string) { return String(n || '').trim().toLowerCase(); }

function isBetter(a: WaveLeaderboardEntry, b: WaveLeaderboardEntry) {
  if (a.wave  !== b.wave)  return a.wave  > b.wave;
  if (a.score !== b.score) return a.score > b.score;
  return a.created_at < b.created_at;
}

function dedup(rows: WaveLeaderboardEntry[]) {
  const m = new Map<string, WaveLeaderboardEntry>();
  for (const r of rows) {
    const k = norm(r.player_name);
    if (!k) continue;
    const p = m.get(k);
    if (!p || isBetter(r, p)) m.set(k, r);
  }
  return [...m.values()];
}

function sorted(rows: WaveLeaderboardEntry[]) {
  return [...rows].sort((a, b) =>
    (b.wave - a.wave) || (b.score - a.score) || a.created_at.localeCompare(b.created_at)
  );
}

function toEntry(r: any, i: number): WaveLeaderboardEntry {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
}

// ─── public API ───────────────────────────────────────────────

export async function fetchWaveLeaderboard(limit = 8): Promise<WaveLeaderboardEntry[]> {
  if (!hasConfig) {
    console.warn('[lb] no config → localStorage');
    return sorted(dedup(loadLocal())).slice(0, limit);
  }

  const url = makeUrl(LEADERBOARD_TABLE, {
    select: 'player_name,wave,score,created_at',
    order:  'wave.desc,score.desc,created_at.asc',
    limit:  '200',
  });

  console.log('[lb] GET', SUPABASE_URL + '/rest/v1/' + LEADERBOARD_TABLE);

  let res: Response;
  try {
    res = await fetchWithTimeout(url, { headers: getHeaders(), cache: 'no-store' });
  } catch (err) {
    console.warn('[lb] network error:', err);
    return sorted(dedup(loadLocal())).slice(0, limit);
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

    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Leaderboard fetch failed: ${res.status}`);
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

export async function submitWaveResult({ playerName, wave, score }: SubmitPayload): Promise<void> {
  const payload = {
    player_name: (playerName || 'YOU').trim().slice(0, 18),
    wave:        Math.max(1, Math.floor(wave  || 1)),
    score:       Math.max(0, Math.floor(score || 0)),
  };

  if (!hasConfig) {
    const rows  = loadLocal();
    const entry: WaveLeaderboardEntry = {
      id: `${Date.now()}`, player_name: payload.player_name,
      wave: payload.wave, score: payload.score, created_at: new Date().toISOString(),
    };
    const key = norm(payload.player_name);
    const idx = rows.findIndex(r => norm(r.player_name) === key);
    if (idx >= 0) { if (isBetter(entry, rows[idx])) rows[idx] = { ...rows[idx], ...entry }; }
    else rows.push(entry);
    saveLocal(sorted(dedup(rows)).slice(0, 64));
    return;
  }

  const url = makeUrl(LEADERBOARD_TABLE);
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST', cache: 'no-store',
      headers: getHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[lb] submit error:', err);
    return;
  }

  const url = `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}`;
  const res = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      ...getHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[lb] POST ${res.status}:`, body);
    throw new Error(`submit ${res.status}: ${body}`);
  }
  console.log('[lb] submitted:', payload);
}

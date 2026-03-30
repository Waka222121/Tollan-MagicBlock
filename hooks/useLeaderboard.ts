import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLeaderboardRows, isLeaderboardConfigured, submitLeaderboardRow, type WaveLeaderboardEntry } from '../lib/leaderboardService';

type LeaderboardStatus = 'idle' | 'loading' | 'error' | 'local';

const LOCAL_KEY = 'mb_local_leaderboard_v2';

function normalizeName(name: string) {
  return String(name || '').trim().toLowerCase();
}

function isBetter(next: WaveLeaderboardEntry, prev: WaveLeaderboardEntry) {
  if (next.wave !== prev.wave) return next.wave > prev.wave;
  if (next.score !== prev.score) return next.score > prev.score;
  return next.created_at < prev.created_at;
}

function bestByPlayer(rows: WaveLeaderboardEntry[]) {
  const map = new Map<string, WaveLeaderboardEntry>();
  for (const row of rows) {
    const key = normalizeName(row.player_name);
    if (!key) continue;
    const prev = map.get(key);
    if (!prev || isBetter(row, prev)) map.set(key, row);
  }
  return [...map.values()];
}

function sortRows(rows: WaveLeaderboardEntry[]) {
  return [...rows].sort((a, b) => (b.wave - a.wave) || (b.score - a.score) || a.created_at.localeCompare(b.created_at));
}

function readLocalRows(): WaveLeaderboardEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeLocalRows(rows: WaveLeaderboardEntry[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
}

export function useLeaderboard(active: boolean, limit = 5) {
  const [rows, setRows] = useState<WaveLeaderboardEntry[]>([]);
  const [status, setStatus] = useState<LeaderboardStatus>('idle');
  const [errorText, setErrorText] = useState('');

  const configured = useMemo(() => isLeaderboardConfigured(), []);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setErrorText('');

    if (!configured) {
      const localRows = sortRows(bestByPlayer(readLocalRows())).slice(0, limit);
      setRows(localRows);
      setStatus('local');
      return;
    }

    try {
      const remoteRows = await fetchLeaderboardRows(200);
      const topRows = sortRows(bestByPlayer(remoteRows)).slice(0, limit);
      setRows(topRows);
      setStatus('idle');
    } catch (e: any) {
      setStatus('error');
      setErrorText(String(e?.message || e || 'Unknown leaderboard error'));
    }
  }, [configured, limit]);

  const submitResult = useCallback(async (playerName: string, wave: number, score: number) => {
    if (!configured) {
      const localRows = readLocalRows();
      const incoming: WaveLeaderboardEntry = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        player_name: (playerName || 'YOU').trim().slice(0, 18),
        wave: Math.max(1, Math.floor(wave || 1)),
        score: Math.max(0, Math.floor(score || 0)),
        created_at: new Date().toISOString(),
      };
      const key = normalizeName(incoming.player_name);
      const idx = localRows.findIndex((r) => normalizeName(r.player_name) === key);
      if (idx >= 0) {
        if (isBetter(incoming, localRows[idx])) localRows[idx] = incoming;
      } else {
        localRows.push(incoming);
      }
      writeLocalRows(sortRows(bestByPlayer(localRows)).slice(0, 64));
      return;
    }

    await submitLeaderboardRow({ playerName, wave, score });
  }, [configured]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!active) return;
    const poll = window.setInterval(refresh, 5000);
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, refresh]);

  return { rows, status, errorText, refresh, submitResult };
}

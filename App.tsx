import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameState } from './types';
import Hub from './components/Hub';
import GameEngine from './GameEngine';
import { fetchWaveLeaderboard, getLeaderboardMode, submitWaveResult, type WaveLeaderboardEntry } from './lib/leaderboardClient';
 
// ─── Helpers ──────────────────────────────────────────────────
const MEDAL: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
const FONT = "'JetBrains Mono', monospace";
 
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
 
// ─── ScoreRow ─────────────────────────────────────────────────
function ScoreRow({ rank, entry, isPlayer }: {
  rank: number;
  entry: WaveLeaderboardEntry;
  isPlayer: boolean;
}) {
  const medal = MEDAL[rank];
  const name  = (entry as any).name  ?? '—';
  const wave  = (entry as any).wave  ?? '?';
  const score = (entry as any).score ?? 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 5, marginBottom: 3,
      background: isPlayer
        ? 'rgba(100,50,200,0.22)'
        : rank === 1 ? 'rgba(155,89,182,0.18)' : 'rgba(28,14,55,0.55)',
      border: isPlayer
        ? '1px solid #7a40cc'
        : rank === 1 ? '1px solid #5a2a9a' : '1px solid transparent',
    }}>
      <span style={{ width: 28, fontSize: 11, fontWeight: 700, flexShrink: 0, color: medal || '#5a3a8a' }}>
        #{rank}
      </span>
      <span style={{
        flex: 1, fontSize: 12, color: '#e0d0ff', textTransform: 'uppercase',
        letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      <span style={{ fontSize: 10, color: '#6a4a9a', letterSpacing: 1, flexShrink: 0 }}>
        W{wave}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 700, minWidth: 64, textAlign: 'right',
        flexShrink: 0, color: medal || '#b090ee',
      }}>
        {(score as number).toLocaleString()}
      </span>
    </div>
  );
}
 
// ─── EmptyRow ─────────────────────────────────────────────────
function EmptyRow({ rank }: { rank: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 5, marginBottom: 3,
      background: 'rgba(18,9,40,0.4)', border: '1px solid transparent',
    }}>
      <span style={{ width: 28, fontSize: 11, color: '#2a1a4a', flexShrink: 0 }}>#{rank}</span>
      <span style={{ flex: 1, fontSize: 11, color: '#2a1a4a' }}>—</span>
      <span style={{ fontSize: 11, color: '#2a1a4a', minWidth: 64, textAlign: 'right' }}>—</span>
    </div>
  );
}
 
// ─── StatRow ──────────────────────────────────────────────────
function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '5px 0', borderBottom: '1px solid #1a0f35',
    }}>
      <span style={{ fontSize: 10, letterSpacing: 2, color: '#5a3a8a', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, color: accent ? '#c090ff' : '#e0d0ff', fontWeight: accent ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}
 
// ─── ActionBtn ────────────────────────────────────────────────
function ActionBtn({
  onClick, primary, children,
}: {
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, fontFamily: FONT, fontSize: 11, letterSpacing: 2,
        padding: '12px 0', cursor: 'pointer', textTransform: 'uppercase',
        borderStyle: 'solid', borderWidth: 1, borderRadius: 8,
        borderColor: hover ? '#9060dd' : primary ? '#7a40cc' : '#3a1a6a',
        background:  hover
          ? 'rgba(120,60,200,0.4)'
          : primary ? 'rgba(100,50,180,0.28)' : 'transparent',
        color: primary ? '#e0d0ff' : '#9070bb',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {children}
    </button>
  );
}
 
// ─── GameOverOverlay ──────────────────────────────────────────
interface GameOverOverlayProps {
  playerName:   string;
  lastRunStats: any;
  leaderboard:  WaveLeaderboardEntry[];
  lbStatus:     'idle' | 'loading' | 'error';
  onPlayAgain:  () => void;
  onMainMenu:   () => void;
  onRefresh:    () => void;
}
 
function GameOverOverlay({
  playerName, lastRunStats, leaderboard,
  lbStatus, onPlayAgain, onMainMenu, onRefresh,
}: GameOverOverlayProps) {
  const score    = lastRunStats?.score    ?? 0;
  const wave     = lastRunStats?.wave     ?? 1;
  const kills    = lastRunStats?.kills    ?? 0;
  const maxCombo = lastRunStats?.maxCombo ?? 0;
  const timeSec  = lastRunStats?.time     ?? 0;
  const level    = lastRunStats?.level    ?? 1;
 
  const playerRank = leaderboard.findIndex(e => (e as any).score === score) + 1;
  const visibleEntries = leaderboard.slice(0, 10);
  const fillerCount    = Math.max(0, 5 - visibleEntries.length);
 
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.88)', zIndex: 9999,
      fontFamily: FONT, padding: 16,
    }}>
      <div style={{
        background: 'linear-gradient(160deg,#0d0d18 0%,#110c20 100%)',
        border: '1px solid #4a2a8a', borderRadius: 16,
        padding: '28px 30px 24px', width: '100%', maxWidth: 540,
        maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box',
      }}>
 
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 34, height: 34, flexShrink: 0, background: '#9b59b6',
            clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            boxShadow: '0 0 12px rgba(155,89,182,0.5)',
          }} />
          <div>
            <div style={{
              fontSize: 10, letterSpacing: 4, color: '#7a50cc',
              textTransform: 'uppercase', marginBottom: 2,
            }}>
              Game Over
            </div>
            <div style={{
              fontSize: 18, letterSpacing: 2, color: '#e0d0ff',
              fontWeight: 700, textTransform: 'uppercase',
            }}>
              Leaderboard
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#50dd88' }} />
            <span style={{ fontSize: 9, letterSpacing: 2, color: '#50dd88', textTransform: 'uppercase' }}>
              Live
            </span>
          </div>
        </div>
 
        {/* Rank badge */}
        {playerRank > 0 && playerRank <= 10 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(100,50,200,0.2)', border: '1px solid #7a40cc',
            borderRadius: 8, padding: '10px 16px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 10, letterSpacing: 2, color: '#c0a0ff', textTransform: 'uppercase' }}>
              Your Rank
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: MEDAL[playerRank] || '#b090ee' }}>
              #{playerRank}
            </span>
          </div>
        )}
 
        {/* Name + Refresh */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 10, letterSpacing: 3, color: '#7a50cc', whiteSpace: 'nowrap' }}>
            NAME:
          </span>
          <span style={{
            flex: 1, background: '#140c2e', border: '1px solid #4a2a8a', borderRadius: 6,
            color: '#e0d0ff', fontFamily: FONT, fontSize: 12, letterSpacing: 2,
            padding: '7px 12px', textTransform: 'uppercase',
          }}>
            {playerName || 'WIZARD'}
          </span>
          <button
            onClick={onRefresh}
            style={{
              background: 'transparent', border: '1px solid #4a2a7a', borderRadius: 6,
              color: '#9070bb', fontFamily: FONT, fontSize: 9, letterSpacing: 2,
              padding: '7px 14px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            Refresh
          </button>
        </div>
 
        {/* Rows */}
        <div style={{ marginBottom: 6 }}>
          {lbStatus === 'loading' && (
            <div style={{
              padding: '18px 12px', textAlign: 'center',
              fontSize: 10, letterSpacing: 3, color: '#5a3a9a',
            }}>
              Loading...
            </div>
          )}
          {lbStatus === 'error' && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 11, color: '#cc5050', letterSpacing: 1 }}>
              Could not load leaderboard
            </div>
          )}
          {lbStatus !== 'loading' && visibleEntries.map((entry, i) => (
            <ScoreRow
              key={i}
              rank={i + 1}
              entry={entry}
              isPlayer={
                (entry as any).score === score &&
                ((entry as any).name ?? '').toUpperCase() === playerName.toUpperCase()
              }
            />
          ))}
          {lbStatus !== 'loading' && Array.from({ length: fillerCount }).map((_, i) => (
            <EmptyRow key={`filler-${i}`} rank={visibleEntries.length + i + 1} />
          ))}
        </div>
 
        {/* This run stats */}
        <div style={{ borderTop: '1px solid #2a1560', margin: '16px 0 14px' }} />
        <div style={{
          fontSize: 10, letterSpacing: 3, color: '#7a50cc',
          marginBottom: 10, textTransform: 'uppercase',
        }}>
          This Run
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', marginBottom: 4 }}>
          <StatRow label="Wave"      value={`Wave ${wave}`} />
          <StatRow label="Score"     value={(score as number).toLocaleString()} accent />
          <StatRow label="Kills"     value={String(kills)} />
          <StatRow label="Max Combo" value={`×${maxCombo}`} />
          <StatRow label="Level"     value={String(level)} />
          <StatRow label="Time"      value={formatTime(timeSec)} />
        </div>
 
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <ActionBtn onClick={onPlayAgain} primary>▶ Play Again</ActionBtn>
          <ActionBtn onClick={onMainMenu}>⌂ Main Menu</ActionBtn>
        </div>
 
      </div>
    </div>
  );
}
 
// ─── App ──────────────────────────────────────────────────────
const App = () => {
  const initialStoredName = localStorage.getItem('mb_player_name');
 
  const [gameState,        setGameState]        = useState(GameState.MENU);
  const [highScore,        setHighScore]        = useState(0);
  const [totalKills,       setTotalKills]       = useState(0);
  const [bestWave,         setBestWave]         = useState(1);
  const [lastRunStats,     setLastRunStats]     = useState<any>(null);
  const [playerName,       setPlayerName]       = useState(() => initialStoredName || '');
  const [leaderboard,      setLeaderboard]      = useState<WaveLeaderboardEntry[]>([]);
  const [lbStatus,         setLbStatus]         = useState<'idle' | 'loading' | 'error' | 'local'>('idle');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(() => !initialStoredName);
 
  const runKey = useRef(0);
 
  const startGame = useCallback(() => {
    runKey.current += 1;
    setLastRunStats(null);
    setGameState(GameState.PLAYING);
  }, []);
 
  const refreshLeaderboard = useCallback(async () => {
    setLbStatus('loading');
    try {
      const rows = await fetchWaveLeaderboard(10);
      setLeaderboard(rows);
      setLbStatus(getLeaderboardMode() === 'local' ? 'local' : 'idle');
    } catch (e) {
      if ((import.meta as any).env?.DEV) console.warn('[leaderboard] failed to fetch rows', e);
      setLbStatus('error');
    }
  }, []);
 
  const handleGameOver = useCallback((stats: any) => {
    setHighScore(prev => Math.max(prev, stats.score));
    setTotalKills(prev => prev + stats.kills);
    setBestWave(prev => Math.max(prev, stats.wave || 1));
    setLastRunStats(stats);
    setGameState(GameState.MENU);
 
    submitWaveResult({ playerName, wave: stats.wave || 1, score: stats.score || 0 })
      .then(refreshLeaderboard)
      .catch((e) => {
        if ((import.meta as any).env?.DEV) console.warn('[leaderboard] failed to submit row', e);
      });
  }, [playerName, refreshLeaderboard]);
 
  const handlePlayerNameChange = useCallback((name: string) => {
    const next = name.trim().slice(0, 18) || 'YOU';
    setPlayerName(next);
    localStorage.setItem('mb_player_name', next);
    setIsNamePromptOpen(false);
  }, []);
 
  const backToMenu = useCallback(() => setGameState(GameState.MENU), []);
 
  const isInGame =
    gameState === GameState.PLAYING  ||
    gameState === GameState.LEVEL_UP ||
    gameState === GameState.GAMEOVER ||
    gameState === GameState.PAUSED;
 
  useEffect(() => { refreshLeaderboard(); }, [refreshLeaderboard]);

  useEffect(() => {
    if (gameState !== GameState.MENU) return;
    const pollId = window.setInterval(() => {
      refreshLeaderboard();
    }, 10000);

    return () => window.clearInterval(pollId);
  }, [gameState, refreshLeaderboard]);
 
  return (
    <div className="w-full h-screen relative overflow-hidden select-none">
 
      {gameState === GameState.MENU && (
        <Hub
          onStart={startGame}
          highScore={highScore}
          totalKills={totalKills}
          bestWave={bestWave}
          playerName={playerName}
          isNamePromptOpen={isNamePromptOpen}
          onPlayerNameChange={handlePlayerNameChange}
          leaderboard={leaderboard}
          leaderboardStatus={lbStatus}
          onRefreshLeaderboard={refreshLeaderboard}
        />
      )}
 
      {isInGame && (
        <GameEngine
          runId={runKey.current}
          state={gameState}
          onStateChange={setGameState}
          onGameOver={handleGameOver}
          onExit={backToMenu}
          onRetry={startGame}
          lastRunStats={lastRunStats}
        />
      )}
 
    </div>
  );
};
 
export default App;

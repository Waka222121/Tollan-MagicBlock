import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameState } from './types';
import Hub from './components/Hub';
import GameEngine from './GameEngine';
import AITerminal from './components/AITerminal';
import { fetchWaveLeaderboard, submitWaveResult, type WaveLeaderboardEntry } from './lib/leaderboardClient';

const App = () => {
  const [gameState,    setGameState]    = useState(GameState.MENU);
  const [highScore,    setHighScore]    = useState(0);
  const [totalKills,   setTotalKills]   = useState(0);
  const [bestWave,     setBestWave]     = useState(1);
  const [lastRunStats, setLastRunStats] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('mb_player_name') || 'YOU');
  const [leaderboard, setLeaderboard] = useState<WaveLeaderboardEntry[]>([]);
  const [lbStatus, setLbStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  // Увеличивается при каждом старте — гарантирует пересоздание GameEngine
  const runKey = useRef(0);

  const startGame = useCallback(() => {
    runKey.current += 1;
    setLastRunStats(null);
    setGameState(GameState.PLAYING);
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    setLbStatus('loading');
    try {
      const rows = await fetchWaveLeaderboard(8);
      setLeaderboard(rows);
      setLbStatus('idle');
    } catch (e) {
      console.warn('[leaderboard] failed to fetch rows', e);
      setLbStatus('error');
    }
  }, []);

  const handleGameOver = useCallback((stats) => {
    setHighScore(prev => Math.max(prev, stats.score));
    setTotalKills(prev => prev + stats.kills);
    setBestWave(prev => Math.max(prev, stats.wave || 1));
    setLastRunStats(stats);
    setGameState(GameState.GAMEOVER);
    submitWaveResult({ playerName, wave: stats.wave || 1, score: stats.score || 0 }).then(refreshLeaderboard).catch((e) => {
      console.warn('[leaderboard] failed to submit row', e);
    });
  }, [playerName, refreshLeaderboard]);

  const handlePlayerNameChange = useCallback((name: string) => {
    const next = name.trim().slice(0, 18) || 'YOU';
    setPlayerName(next);
    localStorage.setItem('mb_player_name', next);
  }, []);

  const backToMenu = useCallback(() => {
    setGameState(GameState.MENU);
  }, []);

  const isInGame = gameState === GameState.PLAYING
    || gameState === GameState.LEVEL_UP
    || gameState === GameState.GAMEOVER
    || gameState === GameState.PAUSED;

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  return (
    <div className="w-full h-screen relative overflow-hidden select-none">
      {gameState === GameState.MENU && (
        <Hub 
          onStart={startGame} 
          highScore={highScore} 
          totalKills={totalKills}
          bestWave={bestWave}
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
          leaderboard={leaderboard}
          leaderboardStatus={lbStatus}
          onRefreshLeaderboard={refreshLeaderboard}
          onOpenTerminal={() => setIsTerminalOpen(true)}
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

      {isTerminalOpen && (
        <AITerminal onClose={() => setIsTerminalOpen(false)} />
      )}
    </div>
  );
};

export default App;

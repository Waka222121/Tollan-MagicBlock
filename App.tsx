import React, { useState, useCallback, useRef, useEffect } from 'react';
import Phaser from 'phaser';
import { GameState } from './types';
import Hub from './components/Hub';
import GameEngine from './GameEngine';
import MenuBackground from './game/MenuBackground';
import type { LeaderboardEntry } from './components/LeaderboardPanel';

// ── Фоновая Phaser-сцена для меню ────────────────────────────────────────────
const MenuBg = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO, parent: ref.current,
      width: window.innerWidth, height: window.innerHeight,
      physics: { default:'arcade', arcade:{ gravity:{x:0,y:0}, debug:false } },
      backgroundColor:'#050508', pixelArt:true, roundPixels:true,
      scale:{ mode:Phaser.Scale.NONE, autoCenter:Phaser.Scale.NO_CENTER, width:window.innerWidth, height:window.innerHeight },
      scene:[MenuBackground],
    });
    return () => { game.destroy(true); };
  }, []);
  return (
    <>
      <div ref={ref} style={{position:'absolute',inset:0,zIndex:0}}/>
      <div style={{position:'absolute',inset:0,zIndex:1,pointerEvents:'none',
        background:'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)'}}/>
    </>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => {
  const [gameState,    setGameState]    = useState(GameState.MENU);
  const [highScore,    setHighScore]    = useState(0);
  const [totalKills,   setTotalKills]   = useState(0);
  const [bestWave,     setBestWave]     = useState(1);
  const [lastRunStats, setLastRunStats] = useState(null);

  // Leaderboard state — пока пустой, подключим Supabase позже
  const [leaderboard,       setLeaderboard]       = useState<LeaderboardEntry[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState<'idle'|'loading'|'error'|'local'>('idle');
  const [playerName,        setPlayerName]        = useState('YOU');

  const runKey = useRef(0);

  // TODO: заменить на реальный fetchLeaderboard из Supabase
  const refreshLeaderboard = useCallback(async () => {
    setLeaderboardStatus('loading');
    // placeholder — вернём пустой список
    await new Promise(r => setTimeout(r, 300));
    setLeaderboard([]);
    setLeaderboardStatus('idle');
  }, []);

  const startGame = useCallback(() => {
    runKey.current += 1;
    setLastRunStats(null);
    setGameState(GameState.PLAYING);
  }, []);

  const handleGameOver = useCallback((stats) => {
    setHighScore(prev => Math.max(prev, stats.score || 0));
    setTotalKills(prev => prev + (stats.kills || 0));
    setBestWave(prev => Math.max(prev, stats.wave || 1));
    setLastRunStats(stats);
    setGameState(GameState.GAMEOVER);

    // TODO: отправить результат в Supabase
    // submitScore(playerName, stats.wave, stats.score, stats.kills)
    //   .then(refreshLeaderboard);
  }, []);

  const backToMenu = useCallback(() => {
    setGameState(GameState.MENU);
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  const isInGame = gameState === GameState.PLAYING
    || gameState === GameState.LEVEL_UP
    || gameState === GameState.GAMEOVER
    || gameState === GameState.PAUSED;

  return (
    <div className="w-full h-screen relative overflow-hidden select-none">
      {gameState === GameState.MENU && <MenuBg />}

      {gameState === GameState.MENU && (
        <div style={{position:'absolute',inset:0,zIndex:2}}>
          <Hub
            onStart={startGame}
            highScore={highScore}
            totalKills={totalKills}
            bestWave={bestWave}
            playerName={playerName}
            leaderboard={leaderboard}
            leaderboardStatus={leaderboardStatus}
            onRefreshLeaderboard={refreshLeaderboard}
            onOpenTerminal={() => {}}
          />
        </div>
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

import React, { useState, useCallback, useRef } from 'react';
import { GameState } from './types';
import Hub from './components/Hub';
import GameEngine from './GameEngine';
import AITerminal from './components/AITerminal';

const App = () => {
  const [gameState,    setGameState]    = useState(GameState.MENU);
  const [highScore,    setHighScore]    = useState(0);
  const [totalKills,   setTotalKills]   = useState(0);
  const [lastRunStats, setLastRunStats] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  // Увеличивается при каждом старте — гарантирует пересоздание GameEngine
  const runKey = useRef(0);

  const startGame = useCallback(() => {
    runKey.current += 1;
    setLastRunStats(null);
    setGameState(GameState.PLAYING);
  }, []);

  const handleGameOver = useCallback((stats) => {
    setHighScore(prev => Math.max(prev, stats.score));
    setTotalKills(prev => prev + stats.kills);
    setLastRunStats(stats);
    setGameState(GameState.GAMEOVER);
  }, []);

  const backToMenu = useCallback(() => {
    setGameState(GameState.MENU);
  }, []);

  const isInGame = gameState === GameState.PLAYING
    || gameState === GameState.LEVEL_UP
    || gameState === GameState.GAMEOVER
    || gameState === GameState.PAUSED;

  return (
    <div className="w-full h-screen relative overflow-hidden select-none">
      {gameState === GameState.MENU && (
        <Hub 
          onStart={startGame} 
          highScore={highScore} 
          totalKills={totalKills}
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

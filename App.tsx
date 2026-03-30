import { useCallback, useRef, useState } from 'react';
import { GameState } from './types';
import Hub from './components/Hub';
import GameEngine from './GameEngine';
import { useLeaderboard } from './hooks/useLeaderboard';

const App = () => {
  const initialStoredName = localStorage.getItem('mb_player_name');

  const [gameState, setGameState] = useState(GameState.MENU);
  const [highScore, setHighScore] = useState(0);
  const [totalKills, setTotalKills] = useState(0);
  const [bestWave, setBestWave] = useState(1);
  const [lastRunStats, setLastRunStats] = useState<any>(null);
  const [playerName, setPlayerName] = useState(() => initialStoredName || '');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(() => !initialStoredName);

  const { rows: leaderboard, status: lbStatus, refresh: refreshLeaderboard, submitResult } = useLeaderboard(gameState === GameState.MENU, 5);

  const runKey = useRef(0);

  const startGame = useCallback(() => {
    runKey.current += 1;
    setLastRunStats(null);
    setGameState(GameState.PLAYING);
  }, []);

  const handleGameOver = useCallback((stats: any) => {
    setHighScore((prev) => Math.max(prev, stats.score));
    setTotalKills((prev) => prev + stats.kills);
    setBestWave((prev) => Math.max(prev, stats.wave || 1));
    setLastRunStats(stats);
    setGameState(GameState.MENU);

    submitResult(playerName, stats.wave || 1, stats.score || 0)
      .then(refreshLeaderboard)
      .catch((e) => {
        console.warn('[leaderboard] failed to submit row', e);
        refreshLeaderboard();
      });
  }, [playerName, refreshLeaderboard, submitResult]);

  const handlePlayerNameChange = useCallback((name: string) => {
    const next = name.trim().slice(0, 18) || 'YOU';
    setPlayerName(next);
    localStorage.setItem('mb_player_name', next);
    setIsNamePromptOpen(false);
  }, []);

  const backToMenu = useCallback(() => setGameState(GameState.MENU), []);

  const isInGame =
    gameState === GameState.PLAYING ||
    gameState === GameState.LEVEL_UP ||
    gameState === GameState.GAMEOVER ||
    gameState === GameState.PAUSED;

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

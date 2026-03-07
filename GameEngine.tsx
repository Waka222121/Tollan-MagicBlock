import React, { useRef, useEffect, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { GameState, GameSyncPayload, PlayerStatsSnapshot, RunStats, UpgradeChoice, GameStateValue } from './types';
import GameUI from './components/GameUI';
import Game from './game/Game';
import { UpgradeSystem } from './game/UpgradeSystem';
import { GameBridge } from './game/GameBridge';

interface GameEngineProps {
  state: GameStateValue;
  onStateChange: (state: GameStateValue) => void;
  onGameOver: (stats: RunStats) => void;
  onExit: () => void;
  onRetry: () => void;
  lastRunStats: RunStats | null;
}

const GameEngine = ({ state, onStateChange, onGameOver, onExit, onRetry, lastRunStats }: GameEngineProps) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isAlive = useRef(true);
  const [playerData, setPlayerData] = useState<PlayerStatsSnapshot | null>(null);
  const [upgradeChoices, setUpgradeChoices] = useState<UpgradeChoice[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameStats, setGameStats] = useState({
    timer: 0, kills: 0, wave: 1, waveProgress: 0, waveTarget: 0,
    dashCooldownRatio: 1.0, isDashing: false,
    combo: 0, comboLevel: 0, comboMult: 1.0,
  });

  GameBridge.onStateChange = (s) => { if (isAlive.current) onStateChange(s); };
  GameBridge.onGameOver = (s) => { if (isAlive.current) onGameOver(s); };

  GameBridge.generateUpgrades = useCallback((ps: PlayerStatsSnapshot) => {
    if (!isAlive.current) return;
    const choices = UpgradeSystem.generateUpgradeChoices(ps);
    setUpgradeChoices(choices);
    requestAnimationFrame(() => {
      if (isAlive.current) GameBridge.onStateChange(GameState.LEVEL_UP);
    });
  }, []);

  GameBridge.onSyncData = (data: GameSyncPayload) => {
    if (!isAlive.current) return;
    setPlayerData(data.playerStats);
    setGameStats({
      timer: data.timer,
      kills: data.kills,
      wave: data.wave,
      waveProgress: data.waveProgress,
      waveTarget: data.waveTarget,
      dashCooldownRatio: data.dashCooldownRatio ?? 1.0,
      isDashing: data.isDashing ?? false,
      combo: data.combo ?? 0,
      comboLevel: data.comboLevel ?? 0,
      comboMult: data.comboMult ?? 1.0,
    });
  };

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    isAlive.current = true;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      backgroundColor: '#050508',
      pixelArt: true,
      roundPixels: false,
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scene: [Game],
    });

    const styleId = 'phaser-pixelated';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = 'canvas { image-rendering: pixelated; image-rendering: crisp-edges; }';
      document.head.appendChild(style);
    }

    gameRef.current = game;
    setIsLoaded(true);

    return () => {
      isAlive.current = false;
      GameBridge.onStateChange = () => {};
      GameBridge.onGameOver = () => {};
      GameBridge.generateUpgrades = () => {};
      GameBridge.onSyncData = () => {};
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const handleQuit = useCallback(() => {
    isAlive.current = false;
    GameBridge.onStateChange = () => {};
    GameBridge.onGameOver = () => {};
    GameBridge.generateUpgrades = () => {};
    GameBridge.onSyncData = () => {};
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    onExit();
  }, [onExit]);

  const handleRetry = useCallback(() => {
    isAlive.current = false;
    GameBridge.onStateChange = () => {};
    GameBridge.onGameOver = () => {};
    GameBridge.generateUpgrades = () => {};
    GameBridge.onSyncData = () => {};
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    onRetry();
  }, [onRetry]);

  const handleUpgrade = useCallback((choice: UpgradeChoice) => {
    setUpgradeChoices([]);
    (gameRef.current?.scene?.getScene('Game') as any)?.applyUpgrade?.(choice);
  }, []);

  const handlePause = useCallback(() => {
    (gameRef.current?.scene?.getScene('Game') as any)?.pauseGame?.();
  }, []);

  const handleResume = useCallback(() => {
    (gameRef.current?.scene?.getScene('Game') as any)?.resumeGame?.();
  }, []);

  return (
    <div className="w-full h-full relative bg-[#020402]">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] bg-black text-[#9b59b6] font-mono uppercase tracking-[0.5em] animate-pulse">
          Initializing_Tactical_Grid...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      {playerData && (
        <GameUI
          gameState={state}
          player={playerData}
          timer={gameStats.timer}
          kills={gameStats.kills}
          upgradeChoices={upgradeChoices}
          onSelectUpgrade={handleUpgrade}
          onQuit={handleQuit}
          onRetry={handleRetry}
          onPause={handlePause}
          onResume={handleResume}
          runStats={lastRunStats}
          wave={gameStats.wave}
          waveProgress={gameStats.waveProgress}
          waveTarget={gameStats.waveTarget}
          dashCooldownRatio={gameStats.dashCooldownRatio}
          isDashing={gameStats.isDashing}
          combo={gameStats.combo}
          comboLevel={gameStats.comboLevel}
          comboMult={gameStats.comboMult}
        />
      )}
    </div>
  );
};

export default GameEngine;

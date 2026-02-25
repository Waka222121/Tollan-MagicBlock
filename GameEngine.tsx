import React, { useRef, useEffect, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { GameState } from './types';
import GameUI from './components/GameUI';
import Game from './game/Game';
import { UpgradeSystem } from './game/UpgradeSystem';
import { GameBridge } from './game/GameBridge';

const GameEngine = ({ state, onStateChange, onGameOver, onExit, onRetry, lastRunStats }) => {
  const gameRef      = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isAlive      = useRef(true); // флаг — компонент ещё смонтирован
  const [playerData,     setPlayerData]     = useState<any>(null);
  const [upgradeChoices, setUpgradeChoices] = useState<any[]>([]);
  const [isLoaded,       setIsLoaded]       = useState(false);
  const [gameStats, setGameStats] = useState({
    timer: 0, kills: 0, wave: 1, waveProgress: 0, waveTarget: 0,
    dashCooldownRatio: 1.0, isDashing: false,
    combo: 0, comboLevel: 0, comboMult: 1.0,
  });

  // Все Bridge-коллбэки проверяют isAlive прежде чем трогать React state
  GameBridge.onStateChange = (s) => { if (isAlive.current) onStateChange(s); };
  GameBridge.onGameOver    = (s) => { if (isAlive.current) onGameOver(s); };

  GameBridge.generateUpgrades = useCallback((ps: any) => {
    if (!isAlive.current) return;
    const choices = UpgradeSystem.generateUpgradeChoices(ps);
    setUpgradeChoices(choices);
    requestAnimationFrame(() => {
      if (isAlive.current) GameBridge.onStateChange(GameState.LEVELING);
    });
  }, []);

  GameBridge.onSyncData = (data: any) => {
    if (!isAlive.current) return;
    setPlayerData(data.playerStats);
    setGameStats({
      timer:             data.timer,
      kills:             data.kills,
      wave:              data.wave,
      waveProgress:      data.waveProgress,
      waveTarget:        data.waveTarget,
      dashCooldownRatio: data.dashCooldownRatio ?? 1.0,
      isDashing:         data.isDashing         ?? false,
      combo:             data.combo             ?? 0,
      comboLevel:        data.comboLevel        ?? 0,
      comboMult:         data.comboMult         ?? 1.0,
    });
  };

  // Создаём Phaser один раз
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    isAlive.current = true;

    const game = new Phaser.Game({
      type:   Phaser.AUTO,
      parent: containerRef.current,
      width:  window.innerWidth,
      height: window.innerHeight,
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
      backgroundColor: '#050508',
      pixelArt: true,
      roundPixels: true,
      scene: [Game],
    });

    // Убираем линии между тайлами через CSS
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) canvas.style.imageRendering = 'pixelated';

    gameRef.current = game;
    setIsLoaded(true);

    // Cleanup при unmount — полное уничтожение Phaser
    return () => {
      isAlive.current = false;
      // Глушим все коллбэки чтобы не было вызовов на unmounted компонент
      GameBridge.onStateChange    = () => {};
      GameBridge.onGameOver       = () => {};
      GameBridge.generateUpgrades = () => {};
      GameBridge.onSyncData       = () => {};
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Явный выход — уничтожаем Phaser ДО перехода в меню
  const handleQuit = useCallback(() => {
    isAlive.current = false;
    GameBridge.onStateChange    = () => {};
    GameBridge.onGameOver       = () => {};
    GameBridge.generateUpgrades = () => {};
    GameBridge.onSyncData       = () => {};
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    onExit(); // теперь безопасно переходить в меню
  }, [onExit]);

  // Рестарт — уничтожаем старый Phaser, App создаёт новый GameEngine
  const handleRetry = useCallback(() => {
    isAlive.current = false;
    GameBridge.onStateChange    = () => {};
    GameBridge.onGameOver       = () => {};
    GameBridge.generateUpgrades = () => {};
    GameBridge.onSyncData       = () => {};
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    onRetry();
  }, [onRetry]);

  const handleUpgrade = useCallback((choice: any) => {
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

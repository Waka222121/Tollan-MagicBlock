import type { GameSyncPayload, PlayerStatsSnapshot, RunStats, GameStateValue } from '../types';

/**
 * GameBridge is the single communication channel between React and Phaser.
 */
export const GameBridge: {
  onStateChange: (state: GameStateValue) => void;
  onGameOver: (stats: RunStats) => void;
  generateUpgrades: (stats: PlayerStatsSnapshot) => void;
  onSyncData: (data: GameSyncPayload) => void;
} = {
  onStateChange: () => {},
  onGameOver: () => {},
  generateUpgrades: () => {},
  onSyncData: () => {},
};

export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  LEVEL_UP: 'LEVEL_UP',
  GAMEOVER: 'GAMEOVER',
  PAUSED: 'PAUSED'
} as const;

export type GameStateValue = typeof GameState[keyof typeof GameState];

export interface UpgradeChoice {
  id: string;
  type: 'NEW_ABILITY' | 'UPGRADE_ABILITY' | 'STAT_BOOST';
  name: string;
  description: string;
  rarity?: string;
  abilityId?: string;
  slot?: number;
  stat?: string;
  value?: number;
  multiplier?: boolean;
  [key: string]: any;
}

export interface PlayerStatsSnapshot {
  hp: number;
  maxHp: number;
  xp: number;
  nextLevelXp: number;
  level: number;
  gold: number;
  gems: number;
  abilities: any[];
  dashCooldownRatio?: number;
  [key: string]: any;
}

export interface GameSyncPayload {
  playerStats: PlayerStatsSnapshot;
  timer: number;
  kills: number;
  wave: number;
  waveProgress: number;
  waveTarget: number;
  dashCooldownRatio: number;
  isDashing: boolean;
  combo: number;
  comboLevel: number;
  comboMult: number;
}

export interface RunStats {
  score: number;
  kills: number;
  time: number;
  level: number;
  abilities: any[];
  wave: number;
  gold: number;
  gems: number;
  maxCombo: number;
}

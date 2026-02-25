/**
 * GameBridge — единственный источник истины для связи React ↔ Phaser.
 * React пишет сюда при каждом рендере.
 * Phaser читает отсюда при каждом вызове.
 * Никакого timing-hell, никаких замыканий, никаких init().
 */
export const GameBridge = {
  onStateChange:    (_state: string) => {},
  onGameOver:       (_stats: any)    => {},
  generateUpgrades: (_stats: any)    => {},
  onSyncData:       (_data: any)     => {},
};

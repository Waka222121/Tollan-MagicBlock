import Phaser from 'phaser';

export default class MenuBackground extends Phaser.Scene {
  constructor() {
    super('MenuBackground');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Dark background
    this.add.rectangle(W / 2, H / 2, W, H, 0x050508);

    // Floating purple particles
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
      const dot = this.add.ellipse(x, y, size * 2, size * 2, 0x9b59b6, alpha);

      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(40, 120),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        delay: Phaser.Math.Between(0, 4000),
        repeat: -1,
        repeatDelay: Phaser.Math.Between(500, 2000),
        onRepeat: () => {
          dot.x = Phaser.Math.Between(0, W);
          dot.y = H + 10;
          dot.alpha = alpha;
        }
      });
    }

    // Grid lines
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x9b59b6, 0.06);
    const step = 60;
    for (let x = 0; x < W; x += step) graphics.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += step) graphics.lineBetween(0, y, W, y);
  }
}

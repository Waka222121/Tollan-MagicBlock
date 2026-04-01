import Phaser from 'phaser';

/**
 * MenuBackground — лёгкая Phaser-сцена для фона главного меню.
 * Рисует плавающие частицы и мерцающие звёзды в стиле игры.
 */
export default class MenuBackground extends Phaser.Scene {
  private particles: Array<{
    x: number; y: number;
    vx: number; vy: number;
    radius: number;
    alpha: number;
    alphaDir: number;
    color: number;
    gfx: Phaser.GameObjects.Ellipse;
  }> = [];

  private stars: Array<{
    x: number; y: number;
    alpha: number;
    alphaDir: number;
    speed: number;
    gfx: Phaser.GameObjects.Ellipse;
  }> = [];

  private runeTexts: Array<{
    obj: Phaser.GameObjects.Text;
    vy: number;
    alpha: number;
    alphaDir: number;
  }> = [];

  constructor() {
    super('MenuBackground');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Фоновый градиент (прямоугольники) ───────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x050508).setDepth(0);
    this.add.rectangle(W / 2, H * 0.7, W, H * 0.6, 0x09090f).setDepth(0).setAlpha(0.6);

    // ── Звёзды (маленькие мерцающие точки) ──────────────────────────────
    const starColors = [0xffffff, 0xccaaff, 0xaabbff, 0xffd700];
    for (let i = 0; i < 120; i++) {
      const gfx = this.add.ellipse(
        Math.random() * W,
        Math.random() * H,
        Math.random() < 0.8 ? 2 : 3,
        Math.random() < 0.8 ? 2 : 3,
        starColors[Math.floor(Math.random() * starColors.length)],
        Math.random() * 0.6 + 0.2,
      ).setDepth(1);

      this.stars.push({
        x: gfx.x, y: gfx.y,
        alpha: gfx.alpha,
        alphaDir: Math.random() < 0.5 ? 1 : -1,
        speed: Math.random() * 0.008 + 0.003,
        gfx,
      });
    }

    // ── Плавающие магические орбы ────────────────────────────────────────
    const orbColors = [0x9b59b6, 0x6c3483, 0x1a5276, 0x0e6655, 0x7d3c98];
    for (let i = 0; i < 18; i++) {
      const r = Math.random() * 28 + 10;
      const color = orbColors[Math.floor(Math.random() * orbColors.length)];
      const gfx = this.add.ellipse(
        Math.random() * W,
        Math.random() * H,
        r * 2, r * 2,
        color,
        Math.random() * 0.15 + 0.05,
      ).setDepth(2);

      this.particles.push({
        x: gfx.x, y: gfx.y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        radius: r,
        alpha: gfx.alpha,
        alphaDir: Math.random() < 0.5 ? 1 : -1,
        color,
        gfx,
      });
    }

    // ── Мелкие светящиеся частицы ────────────────────────────────────────
    for (let i = 0; i < 30; i++) {
      const gfx = this.add.ellipse(
        Math.random() * W,
        Math.random() * H,
        4, 4,
        0x9b59b6,
        Math.random() * 0.5 + 0.1,
      ).setDepth(3);

      this.particles.push({
        x: gfx.x, y: gfx.y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 0.5 + 0.2),
        radius: 2,
        alpha: gfx.alpha,
        alphaDir: 1,
        color: 0x9b59b6,
        gfx,
      });
    }

    // ── Парящие руны / символы ───────────────────────────────────────────
    const runes = ['✦', '⬡', '◈', '⊕', '⊛', '✧', '⟁', '⌬', '⍟', '⎔'];
    for (let i = 0; i < 12; i++) {
      const obj = this.add.text(
        Math.random() * W,
        Math.random() * H,
        runes[Math.floor(Math.random() * runes.length)],
        {
          fontSize: `${Math.floor(Math.random() * 18 + 10)}px`,
          color: Math.random() < 0.5 ? '#9b59b6' : '#4a235a',
          alpha: 0,
        },
      ).setDepth(3).setAlpha(Math.random() * 0.25 + 0.05);

      this.runeTexts.push({
        obj,
        vy: -(Math.random() * 0.25 + 0.08),
        alpha: obj.alpha,
        alphaDir: Math.random() < 0.5 ? 1 : -1,
      });
    }

    // ── Горизонтальные линии сканлайна ───────────────────────────────────
    const lineGfx = this.add.graphics().setDepth(4).setAlpha(0.04);
    lineGfx.lineStyle(1, 0xffffff, 1);
    for (let y = 0; y < H; y += 4) {
      lineGfx.lineBetween(0, y, W, y);
    }
  }

  update(_time: number, delta: number) {
    const W = this.scale.width;
    const H = this.scale.height;
    const dt = delta / 16.67; // нормируем к 60fps

    // Обновляем орбы и частицы
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Зацикливаем по экрану
      if (p.x < -p.radius * 2) p.x = W + p.radius;
      if (p.x > W + p.radius * 2) p.x = -p.radius;
      if (p.y < -p.radius * 2) p.y = H + p.radius;
      if (p.y > H + p.radius * 2) p.y = -p.radius;

      // Мерцание
      p.alpha += p.alphaDir * 0.003 * dt;
      if (p.alpha > 0.35) { p.alpha = 0.35; p.alphaDir = -1; }
      if (p.alpha < 0.02) { p.alpha = 0.02; p.alphaDir = 1; }

      p.gfx.x = Math.round(p.x);
      p.gfx.y = Math.round(p.y);
      p.gfx.setAlpha(p.alpha);
    }

    // Мерцание звёзд
    for (const s of this.stars) {
      s.alpha += s.alphaDir * s.speed * dt;
      if (s.alpha > 0.85) { s.alpha = 0.85; s.alphaDir = -1; }
      if (s.alpha < 0.05) { s.alpha = 0.05; s.alphaDir = 1; }
      s.gfx.setAlpha(s.alpha);
    }

    // Движение рун
    for (const r of this.runeTexts) {
      r.obj.y += r.vy * dt;
      if (r.obj.y < -30) r.obj.y = H + 10;

      r.alpha += r.alphaDir * 0.004 * dt;
      if (r.alpha > 0.3) { r.alpha = 0.3; r.alphaDir = -1; }
      if (r.alpha < 0.02) { r.alpha = 0.02; r.alphaDir = 1; }
      r.obj.setAlpha(r.alpha);
    }
  }
}

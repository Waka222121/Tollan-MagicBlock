import React, { useState, useRef, useEffect } from 'react';

interface DevPanelProps {
  gameRef: React.MutableRefObject<Phaser.Game | null>;
}

const BOSS_WAVES = [5, 10, 15, 20, 25, 30];
const BOSS_NAMES: Record<number, string> = {
  5: 'SERINAX', 10: 'VORGATH', 15: 'NEXARION',
  20: 'SERINAX II', 25: 'VORGATH II', 30: 'NEXARION II',
};

const DevPanel = ({ gameRef }: DevPanelProps) => {
  const [open, setOpen] = useState(false);
  const [waveInput, setWaveInput] = useState('1');
  const [log, setLog] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 12, y: 80 });
  const dragOffset = useRef({ x: 0, y: 0 });

  const getScene = () =>
    gameRef.current?.scene?.getScene('Game') as any;

  const addLog = (msg: string) =>
    setLog(prev => [`[${new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${msg}`, ...prev.slice(0, 19)]);

  const jumpToWave = (wave: number) => {
    const scene = getScene();
    if (!scene) return addLog('❌ Сцена не найдена');
    try {
      // Clear enemies
      scene.enemyManager?.group?.getChildren?.()?.forEach?.((e: any) => { if (e.active) e.setActive(false).setVisible(false); });
      scene.enemyManager?.bossGroup?.getChildren?.()?.forEach?.((e: any) => { if (e.active) e.setActive(false).setVisible(false); });
      // Start wave
      scene.startNextWave?.(wave);
      addLog(`✅ Прыжок на волну ${wave}${BOSS_NAMES[wave] ? ` — BOSS: ${BOSS_NAMES[wave]}` : ''}`);
    } catch (e: any) {
      addLog(`❌ Ошибка: ${e.message}`);
    }
  };

  const setPlayerHP = (hp: number) => {
    const scene = getScene();
    if (!scene?.playerManager?.stats) return addLog('❌ PlayerManager не найден');
    scene.playerManager.stats.hp = hp;
    scene.playerManager.stats.maxHp = Math.max(scene.playerManager.stats.maxHp, hp);
    addLog(`💉 HP установлен: ${hp}`);
  };

  const setGodMode = () => {
    const scene = getScene();
    if (!scene?.playerManager?.stats) return addLog('❌ PlayerManager не найден');
    scene.playerManager.stats.armor = 9999;
    scene.playerManager.stats.hp = 99999;
    scene.playerManager.stats.maxHp = 99999;
    addLog('👑 GOD MODE: armor=9999, hp=99999');
  };

  const killAllEnemies = () => {
    const scene = getScene();
    if (!scene) return addLog('❌ Сцена не найдена');
    let count = 0;
    scene.enemyManager?.group?.getChildren?.()?.forEach?.((e: any) => {
      if (e.active) { e.setActive(false).setVisible(false); count++; }
    });
    addLog(`💀 Убито врагов: ${count}`);
  };

  const spawnBoss = (bossKey: string) => {
    const scene = getScene();
    if (!scene) return addLog('❌ Сцена не найдена');
    try {
      // Деактивируем текущего босса если есть
      scene.enemyManager?.bossGroup?.getChildren?.()?.forEach?.((e: any) => {
        if (e.active) {
          e.setActive(false).setVisible(false);
          if (e.body) e.body.enable = false;
          const bg = e.getData?.('hpBarBg');
          const bf = e.getData?.('hpBarFill');
          const bl = e.getData?.('hpBarLabel');
          if (bg) bg.destroy();
          if (bf) bf.destroy();
          if (bl) bl.destroy();
        }
      });
      scene.enemyManager?.spawnEnemy?.('BOSS', { hp: 1, damage: 1, speed: 1, xp: 1 }, true, bossKey);
      addLog(`👹 Заспавнен босс: ${bossKey}`);
    } catch (e: any) {
      addLog(`❌ Ошибка: ${e.message}`);
    }
  };

  // Drag logic
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging]);

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, fontFamily: "'Courier New', monospace", userSelect: 'none' }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? '#1a0a00' : '#0a0a0a',
          border: '1px solid #ff4400',
          color: '#ff6600',
          padding: '4px 10px',
          fontSize: '11px',
          cursor: 'pointer',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ fontSize: 8, color: '#ff4400' }}>{'▲'.repeat(3)}</span>
        DEV
        <span style={{ fontSize: 8, color: '#ff4400' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={{
          background: 'rgba(5, 3, 0, 0.97)',
          border: '1px solid #ff4400',
          borderTop: 'none',
          width: 260,
          padding: 0,
          boxShadow: '0 4px 32px rgba(255,68,0,0.3)',
        }}>
          {/* Header / drag handle */}
          <div
            onMouseDown={onMouseDown}
            style={{
              background: 'linear-gradient(90deg, #1a0800, #0a0500)',
              borderBottom: '1px solid #ff4400',
              padding: '5px 10px',
              cursor: 'grab',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ color: '#ff6600', fontSize: 10, letterSpacing: '0.15em' }}>⚙ DEV CONSOLE</span>
            <span style={{ color: '#ff2200', fontSize: 9 }}>DRAG ↕</span>
          </div>

          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* Jump to wave */}
            <Section label="ВОЛНЫ">
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="number" min={1} max={99} value={waveInput}
                  onChange={e => setWaveInput(e.target.value)}
                  style={{ width: 48, background: '#0a0500', border: '1px solid #ff4400', color: '#ff8800', padding: '2px 4px', fontSize: 12, fontFamily: 'inherit' }}
                />
                <Btn onClick={() => jumpToWave(parseInt(waveInput) || 1)}>→ ПЕРЕЙТИ</Btn>
              </div>
              {/* Quick wave buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
                {[1, 3, 5, 10, 15, 20, 25].map(w => (
                  <button key={w} onClick={() => { setWaveInput(String(w)); jumpToWave(w); }}
                    style={{
                      background: BOSS_WAVES.includes(w) ? '#2a0800' : '#0f0800',
                      border: `1px solid ${BOSS_WAVES.includes(w) ? '#ff2200' : '#552200'}`,
                      color: BOSS_WAVES.includes(w) ? '#ff4400' : '#aa4400',
                      padding: '2px 6px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {w}{BOSS_WAVES.includes(w) ? '★' : ''}
                  </button>
                ))}
              </div>
            </Section>

            {/* Boss spawn */}
            <Section label="БОССЫ">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {['SERINAX', 'VORGATH', 'NEXARION'].map(b => (
                  <React.Fragment key={b}>
                    <Btn onClick={() => spawnBoss(b)} accent="#cc0044">
                      {b}
                    </Btn>
                  </React.Fragment>
                ))}
              </div>
            </Section>

            {/* Player */}
            <Section label="ИГРОК">
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Btn onClick={setGodMode} accent="#ffcc00">GOD MODE</Btn>
                <Btn onClick={() => setPlayerHP(999)}>HP MAX</Btn>
                <Btn onClick={() => setPlayerHP(1)} accent="#ff2200">HP = 1</Btn>
              </div>
            </Section>

            {/* Enemies */}
            <Section label="ВРАГИ">
              <Btn onClick={killAllEnemies} accent="#ff2200">УБИТЬ ВСЕХ</Btn>
            </Section>

            {/* Log */}
            <Section label="ЛОГ">
              <div style={{
                background: '#050300', border: '1px solid #331100',
                padding: '4px 6px', height: 80, overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                {log.length === 0
                  ? <span style={{ color: '#442200', fontSize: 9 }}>— пусто —</span>
                  : log.map((l, i) => (
                    <span key={i} style={{ color: l.includes('❌') ? '#ff2200' : '#aa6600', fontSize: 9, lineHeight: 1.4 }}>{l}</span>
                  ))
                }
              </div>
            </Section>

          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div style={{ color: '#552200', fontSize: 9, letterSpacing: '0.15em', marginBottom: 4, borderBottom: '1px solid #220800', paddingBottom: 2 }}>
      {label}
    </div>
    {children}
  </div>
);

const Btn = ({ onClick, children, accent = '#ff4400' }: { onClick: () => void; children: React.ReactNode; accent?: string }) => (
  <button onClick={onClick} style={{
    background: '#0a0500', border: `1px solid ${accent}`,
    color: accent, padding: '2px 8px', fontSize: 10,
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em',
    transition: 'background 0.1s',
  }}
    onMouseEnter={e => (e.currentTarget.style.background = '#1a0800')}
    onMouseLeave={e => (e.currentTarget.style.background = '#0a0500')}
  >
    {children}
  </button>
);

export default DevPanel;

import React from 'react';
import { GameState } from '../types';

const GameUI = ({ 
  gameState, player, timer, kills, upgradeChoices, onSelectUpgrade, onQuit, onRetry, onPause, onResume, runStats,
  wave = 1, waveProgress = 0, waveTarget = 0,
  dashCooldownRatio = 1.0, isDashing = false,
  combo = 0, comboLevel = 0, comboMult = 1.0,
  comboTimeoutMs = 3000,
}) => {
  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!player) return null;

  const xpPercent = player?.nextLevelXp > 0 ? (player.xp / player.nextLevelXp) * 100 : 0;
  const hpPercent = player?.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;

  const comboColors = ['', '#ffcc00', '#ff8800', '#ff4400', '#ff00ff'];
  const comboLabels = ['', 'DOUBLE', 'TRIPLE', 'RAMPAGE', '★ GODLIKE'];
  const comboCol = comboColors[comboLevel] || '#ffcc00';

  return (
    <div className="absolute inset-0 pointer-events-none text-white font-mono select-none">
      <style>{`
        @keyframes comboDecay {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* ── HUD TOP ─────────────────────────────────────────────────── */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED || gameState === GameState.LEVEL_UP) && (
        <div className="absolute top-0 left-0 w-full p-10 flex flex-col gap-4 z-[140]">

          {/* Top row */}
          <div className="flex justify-between items-start">

            {/* Wave label */}
            <div className="flex flex-col">
              <span className="font-pirata text-5xl tracking-wide text-white uppercase drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Wave_{wave}</span>
              <span className="text-[9px] text-purple-400 tracking-[0.4em] font-bold uppercase mt-1">Status: Neural_Link_Synchronized</span>
            </div>

            {/* Right stats */}
            <div className="flex gap-10 text-right items-center">

              {/* Combo */}
              {combo >= 2 && (
                <div className="flex flex-col items-end">
                  <span className="text-[9px] tracking-[0.4em] uppercase font-bold mb-1" style={{ color: comboCol }}>
                    {comboLabels[comboLevel] || 'COMBO'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-pirata italic font-black leading-none"
                      style={{
                        fontSize: `${Math.min(72, 32 + comboLevel * 12)}px`,
                        color: comboCol,
                        filter: comboLevel >= 2 ? `drop-shadow(0 0 10px ${comboCol})` : 'none'
                      }}>
                      ×{comboMult.toFixed(1)}
                    </span>
                    <span className="text-slate-400 text-lg font-mono">{combo} kills</span>
                  </div>
                  <div className="w-24 h-0.5 bg-white/10 mt-1 overflow-hidden rounded-full">
                    <div className="h-full rounded-full" key={combo}
                      style={{ background: comboCol, animation: `comboDecay ${comboTimeoutMs / 1000}s linear forwards` }}
                    />
                  </div>
                </div>
              )}

              {/* Objective */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 tracking-widest uppercase mb-1">Objective</span>
                <span className="text-2xl font-black italic text-[#9b59b6]">Defeat Enemies</span>
                <span className="text-xl font-mono text-slate-300">{waveProgress} / {waveTarget}</span>
              </div>

              {/* Kills */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 tracking-widest uppercase mb-1">Total_Purges</span>
                <span className="text-4xl font-black italic text-purple-500">{kills}</span>
              </div>

              {/* Time + pause button */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 tracking-widest uppercase mb-1">Time</span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black italic">{formatTime(timer)}</span>
                  {gameState === GameState.PLAYING && (
                    <button
                      onClick={onPause}
                      className="w-9 h-9 flex items-center justify-center border border-white/10 hover:border-purple-500/60 hover:bg-purple-500/10 transition-all text-slate-400 hover:text-white pointer-events-auto"
                      title="Pause (Esc)"
                    >⏸</button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Bars */}
          <div className="w-full max-w-2xl space-y-3">
            {/* HP Bar */}
            <div className="h-4 bg-black/80 border border-white/5 overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.6)]">
              <div
                className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 transition-all duration-300 relative"
                style={{ width: `${Math.max(0, hpPercent)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              </div>
              <div className="absolute inset-0 flex items-center px-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/60">
                INTEGRITY: {Math.ceil(Math.max(0, player.hp))} / {player.maxHp}
              </div>
            </div>

            {/* XP Bar */}
            <div className="h-1.5 bg-black/60 border border-white/5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                style={{ width: `${xpPercent}%` }}
              />
            </div>

            {/* Dash cooldown bar */}
            <div className="flex items-center gap-3">
              <span className={`text-[8px] font-black tracking-[0.35em] uppercase transition-colors duration-200 ${dashCooldownRatio >= 1.0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {isDashing ? 'BLINKING' : dashCooldownRatio >= 1.0 ? 'BLINK_READY' : 'BLINK_RECHARGING'}
              </span>
              <div className="flex-1 h-1 bg-black/60 border border-white/5 overflow-hidden">
                <div className="h-full transition-all duration-100"
                  style={{
                    width: `${dashCooldownRatio * 100}%`,
                    background: dashCooldownRatio >= 1.0 ? 'linear-gradient(to right, #06b6d4, #00ddff)' : '#475569',
                    boxShadow: dashCooldownRatio >= 1.0 ? '0 0 10px rgba(0,221,255,0.7)' : 'none'
                  }}
                />
              </div>
              <span className="text-[8px] text-slate-600 tracking-widest">SHIFT</span>
            </div>
          </div>

        </div>
      )}

      {/* ── PAUSE SCREEN ────────────────────────────────────────────── */}
      {gameState === GameState.PAUSED && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto flex flex-col items-center justify-center z-[300]">
          <span className="text-[11px] text-purple-400 tracking-[1em] uppercase font-bold mb-6">System_Suspended</span>
          <h2 className="text-[9rem] font-pirata italic text-white tracking-widest uppercase mb-6 drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]">PAUSED</h2>
          <div className="text-slate-500 text-[11px] tracking-[0.5em] uppercase mb-12">Press ESC to resume</div>
          <div className="flex gap-6">
            <button onClick={onResume} className="btn-stone px-20 py-8 text-white font-black text-2xl uppercase italic tracking-tighter group relative overflow-hidden pointer-events-auto">
              <div className="metal-shine"></div>
              <span className="relative z-10">▶ Resume</span>
            </button>
            <button onClick={onQuit} className="px-12 py-8 border border-white/10 text-slate-500 font-bold hover:text-white transition-all uppercase tracking-[0.4em] text-[11px] hover:bg-white/5 pointer-events-auto">
              Return_To_Void
            </button>
          </div>
        </div>
      )}

      {/* ── LEVEL UP MENU ───────────────────────────────────────────── */}
      {gameState === GameState.LEVEL_UP && (
        <div className="fixed inset-0 pointer-events-auto flex flex-col items-center justify-center z-[200] p-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_65%,rgba(33,14,56,0.90)_0%,rgba(10,2,23,0.96)_52%,#04000d_100%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(52%_44%_at_50%_61%,rgba(186,113,255,0.20)_0%,rgba(126,74,188,0.10)_36%,transparent_72%)] blur-xl"></div>
            <div className="absolute inset-0 backdrop-blur-[1px]"></div>
          </div>
          <div className="text-center mb-16 relative z-10">
            <span className="text-purple-500 text-[12px] font-black tracking-[1em] uppercase mb-4 block">Ascension_Protocol</span>
            <h2 className="text-8xl font-pirata italic text-white tracking-widest uppercase animate-golden-pulse">Ancient Adaptation</h2>
          </div>
          <div className="flex gap-8 max-w-7xl w-full relative z-10">
            {upgradeChoices.length > 0 ? upgradeChoices.map((choice) => {
              const isUpgrade = choice.type === 'UPGRADE_ABILITY';
              const isNew     = choice.type === 'NEW_ABILITY';
              const eb        = choice.elementBadge;
              return (
                <button key={choice.id} onClick={() => onSelectUpgrade(choice)}
                  className="btn-stone flex-1 min-h-[460px] p-10 flex flex-col items-center text-center transition-all group overflow-hidden relative border-2 border-purple-500/70">
                  <div className="metal-shine"></div>

                  {/* Element badge top-left */}
                  {eb && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-1 rounded-sm border text-[9px] font-black tracking-widest uppercase"
                      style={{ borderColor: eb.color + '66', color: eb.color, background: eb.color + '18' }}>
                      {eb.icon} {eb.label}
                    </div>
                  )}

                  {/* Rarity / type badge top-right */}
                  <div className="absolute top-4 right-4 text-[9px] font-black tracking-widest uppercase"
                    style={{ color: isNew ? '#cc88ff' : isUpgrade ? '#ffcc44' : '#88aaff' }}>
                    {isNew ? '✦ NEW' : isUpgrade ? `LVL ${choice.currentLevel} → ${choice.nextLevel}` : '◈ PASSIVE'}
                  </div>

                  <span className="text-8xl mb-8 mt-6 group-hover:scale-110 transition-transform duration-500">{choice.icon}</span>
                  <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">{choice.name}</h3>
                  <p className="text-[12px] text-slate-400 normal-case font-sans leading-relaxed mb-10 px-4 h-12 overflow-hidden">{choice.description}</p>
                  <div className="mt-auto px-8 py-3 border border-purple-500/40 bg-purple-500/10 text-purple-400 text-[10px] font-bold tracking-[0.5em] group-hover:bg-purple-500 group-hover:text-black transition-colors">
                    SYNCHRONIZE
                  </div>
                </button>
              );
            }) : (
              <div className="text-white font-mono animate-pulse">GENERATING_UPGRADES...</div>
            )}
          </div>
        </div>
      )}

      {/* ── DEATH SCREEN ────────────────────────────────────────────── */}
      {gameState === GameState.GAMEOVER && runStats && (
        <div className="fixed inset-0 bg-black pointer-events-auto flex flex-col items-center justify-center p-16 z-[400]">
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ff000022_0%,transparent_70%)]"></div>
          </div>
          <span className="text-[14px] text-red-600 font-bold tracking-[1.5em] mb-8 uppercase animate-pulse">Sequence_Critical_Failure</span>
          <h2 className="text-[12rem] font-pirata italic text-white mb-12 uppercase leading-none drop-shadow-[0_0_80px_rgba(255,0,0,0.4)]">Purged</h2>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-px bg-white/5 border border-white/5 mb-24 w-full max-w-6xl shadow-2xl">
            <div className="bg-black/60 p-10">
              <span className="text-[10px] text-slate-500 block mb-3 tracking-widest uppercase font-bold">Score</span>
              <span className="text-5xl font-black italic text-white tracking-tighter">{runStats.score}</span>
            </div>
            <div className="bg-black/60 p-10 border-l border-white/5">
              <span className="text-[10px] text-slate-500 block mb-3 tracking-widest uppercase font-bold">Purges</span>
              <span className="text-5xl font-black italic text-purple-500 tracking-tighter">{runStats.kills}</span>
            </div>
            <div className="bg-black/60 p-10 border-l border-white/5">
              <span className="text-[10px] text-slate-500 block mb-3 tracking-widest uppercase font-bold">Assets</span>
              <div className="flex flex-col">
                <span className="text-2xl font-black italic text-yellow-500">{runStats.gold || 0} Gold</span>
                <span className="text-2xl font-black italic text-cyan-500">{runStats.gems || 0} Gems</span>
              </div>
            </div>
            <div className="bg-black/60 p-10 border-l border-white/5">
              <span className="text-[10px] text-slate-500 block mb-3 tracking-widest uppercase font-bold">Phase</span>
              <span className="text-5xl font-black italic text-white tracking-tighter">{runStats.level}</span>
            </div>
            <div className="bg-black/60 p-10 border-l border-white/5">
              <span className="text-[10px] text-slate-500 block mb-3 tracking-widest uppercase font-bold">Wave</span>
              <span className="text-5xl font-black italic text-[#9b59b6] tracking-tighter">{runStats.wave || 1}</span>
            </div>
            <div className="bg-black/60 p-10 border-l border-white/5">
              <span className="text-[10px] text-slate-500 block mb-3 tracking-widest uppercase font-bold">Best Combo</span>
              <span className="text-5xl font-black italic text-yellow-400 tracking-tighter">{runStats.maxCombo || 0}</span>
            </div>
          </div>
          <div className="flex gap-10">
            <button onClick={onRetry} className="btn-stone px-24 py-10 text-white font-black text-4xl uppercase italic tracking-tighter active:scale-95 group relative overflow-hidden">
              <div className="metal-shine"></div>
              <span className="relative z-10">Reboot_Core</span>
            </button>
            <button onClick={onQuit} className="px-16 py-10 border border-white/10 text-slate-500 font-bold hover:text-white transition-all uppercase tracking-[0.4em] text-[11px] hover:bg-white/5">
              Return_To_Void
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameUI;

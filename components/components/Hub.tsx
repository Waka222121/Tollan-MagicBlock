
import React from 'react';

const Hub = ({ onStart, highScore, totalKills, onOpenTerminal }) => {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-white overflow-hidden select-none pointer-events-auto bg-[#020402]">
      {/* Background Layers for Depth */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#9b59b611_0%,transparent_50%)] animate-pulse"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#9b59b608] blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-[#4ecdc405] blur-[100px] rounded-full"></div>
      </div>
      
      {/* Animated Scanlines / Grid */}
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl flex flex-col px-12">
        <header className="flex justify-between items-center mb-28">
          <div className="flex items-center gap-6">
            <div className="mb-logo neon-glow"></div>
            <div className="flex flex-col">
              <span className="font-pirata text-4xl tracking-wide leading-none uppercase text-white">TOLLAN</span>
              <span className="font-mono text-[10px] tracking-[0.4em] text-[#9b59b6] uppercase mt-1">MagicBlock Protocol</span>
            </div>
          </div>
          <div className="hidden lg:flex gap-12 font-mono text-[10px] tracking-widest text-slate-500 uppercase">
            <span onClick={onOpenTerminal} className="hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-[#9b59b6] pb-1">Neural Interface</span>
            <span className="hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-[#9b59b6] pb-1">Execution Layer</span>
            <span className="hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-[#9b59b6] pb-1">Documentation</span>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-[#9b59b6]/30 bg-[#9b59b6]/10 text-[#9b59b6] font-mono text-[10px] uppercase tracking-[0.3em] mb-12 shadow-[0_0_15px_#9b59b622]">
              <span className="w-2 h-2 bg-[#9b59b6] animate-pulse"></span>
              Core_Link: Stable // Shard_0x{Math.random().toString(16).slice(2,8).toUpperCase()}
            </div>
            
            <h1 className="text-[8rem] md:text-[12rem] font-pirata tracking-[-0.03em] leading-[0.75] mb-20 uppercase text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              TOLLAN<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9b59b6] to-white drop-shadow-none">MagicBlock</span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
              <button 
                onClick={onStart}
                className="btn-stone group px-20 py-12 text-white font-black text-5xl uppercase italic tracking-tighter overflow-hidden flex items-center gap-8 transition-all active:scale-95"
              >
                <div className="metal-shine"></div>
                <span className="relative z-10">Initiate Link</span>
                <svg className="w-12 h-12 transform group-hover:translate-x-3 transition-transform relative z-10 text-[#9b59b6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>

              <button 
                onClick={onOpenTerminal}
                className="px-10 py-6 font-mono text-[10px] tracking-[0.4em] uppercase text-slate-500 hover:text-[#9b59b6] transition-colors border border-white/5 hover:border-[#9b59b6]/30 bg-white/2"
              >
                Access Neural Interface
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-px bg-white/5 border border-white/5 shadow-2xl backdrop-blur-sm">
            <div className="bg-black/40 p-14 group hover:bg-[#9b59b6]/5 transition-colors">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Max_Integrity</span>
              <span className="text-7xl font-pirata italic tracking-tighter text-white group-hover:text-purple-400 transition-colors">
                {highScore.toLocaleString()}
              </span>
            </div>
            <div className="bg-black/40 p-14 border-l border-white/5 group hover:bg-[#9b59b6]/5 transition-colors">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Core_Purges</span>
              <span className="text-7xl font-pirata italic tracking-tighter text-white group-hover:text-[#9b59b6] transition-colors">
                {totalKills.toLocaleString()}
              </span>
            </div>
            <div className="bg-black/60 p-14 border-t border-white/5 col-span-2">
              <div className="flex justify-between items-center mb-8">
                <span className="font-mono text-[11px] text-slate-400 uppercase tracking-[0.4em] font-bold">Protocol_Matrix</span>
                <span className="text-emerald-400 font-mono text-[10px] animate-pulse flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  STABLE
                </span>
              </div>
              <div className="space-y-4 font-mono text-[11px] text-slate-500 uppercase tracking-widest">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span>Logic Engine</span>
                  <span className="text-white">PHASER_RUNTIME_01</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span>State Registry</span>
                  <span className="text-white">IMMU_CORE_0x1F</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Status</span>
                  <span className="text-[#9b59b6]">SYNCHRONIZED</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-32 pt-12 border-t border-white/10 flex justify-between items-end">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] text-slate-600 tracking-[0.4em] uppercase font-bold">
              Powered by <span className="text-[#9b59b6]">MagicBlock</span> // Engine_Phaser_v3.60
            </span>
            <div className="flex gap-3">
               <div className="w-3 h-3 bg-white/5"></div>
               <div className="w-3 h-3 bg-white/10"></div>
               <div className="w-3 h-3 bg-[#9b59b6] shadow-[0_0_8px_#9b59b6]"></div>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] text-slate-700 uppercase tracking-widest block mb-1">TOLLAN_STABLE_ASSET_LAYER</span>
            <span className="font-mono text-[9px] text-slate-800">BUILD_0.2.1 // ARCADE_EDITION</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Hub;

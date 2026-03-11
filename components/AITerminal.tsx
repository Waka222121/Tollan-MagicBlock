
import React, { useState } from 'react';
import ChatModule from './ai/ChatModule';
import ForgeModule from './ai/ForgeModule';
import VoiceModule from './ai/VoiceModule';
import MediaModule from './ai/MediaModule';

const TABS = [
  { id: 'chat', label: 'NEURAL_CHAT', icon: '💬' },
  { id: 'forge', label: 'ASSET_FORGE', icon: '🎨' },
  { id: 'voice', label: 'VOICE_LINK', icon: '🎙️' },
  { id: 'media', label: 'DATA_ANALYSIS', icon: '📂' },
];

const AITerminal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col overflow-hidden font-mono uppercase pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black">
        <div className="flex items-center gap-4">
          <div className="mb-logo neon-glow scale-75"></div>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter text-white">TOLLAN MagicBlock Neural Interface</h2>
            <span className="text-[8px] text-[#9b59b6] tracking-[0.4em] font-bold">MagicBlock Protocol Layer 0xFF21</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-2 border border-white/10 hover:bg-white hover:text-black transition-all text-[10px] font-bold tracking-widest text-white"
        >
          DISCONNECT_NODE [ESC]
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r border-white/10 bg-black/50 p-4 flex flex-col gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full p-4 text-left flex items-center gap-4 transition-all border ${
                activeTab === tab.id 
                  ? 'border-[#9b59b6] bg-[#9b59b6]/10 text-[#9b59b6]' 
                  : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-bold tracking-widest">{tab.label}</span>
            </button>
          ))}
          
          <div className="mt-auto p-4 border-t border-white/5 opacity-30 text-[8px] text-slate-600 leading-relaxed">
            SYSTEM_STATUS: STABLE<br/>
            ENCRYPTION: AES-256-ON-CHAIN<br/>
            SHARD: SHARD_01_ALPHA
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
          {activeTab === 'chat' && <ChatModule />}
          {activeTab === 'forge' && <ForgeModule />}
          {activeTab === 'voice' && <VoiceModule />}
          {activeTab === 'media' && <MediaModule />}
        </div>
      </div>
    </div>
  );
};

export default AITerminal;

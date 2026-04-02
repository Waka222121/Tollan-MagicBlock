import React, { useEffect, useState } from 'react';
import LeaderboardPanel, { type LeaderboardEntry } from './LeaderboardPanel';

const MENU_BG = '/assets/menu-background.png';

interface HubProps {
  onStart: () => void;
  highScore?: number;
  totalKills?: number;
  bestWave?: number;
  playerName?: string;
  onPlayerNameChange?: (name: string) => void;
  leaderboard?: LeaderboardEntry[];
  leaderboardStatus?: 'idle' | 'loading' | 'error' | 'local';
  onRefreshLeaderboard?: () => void;
  onOpenTerminal?: () => void;
}

const Hub = ({
  onStart,
  highScore = 0,
  totalKills = 0,
  bestWave = 1,
  playerName = '',
  onPlayerNameChange,
  leaderboard = [],
  leaderboardStatus = 'idle',
  onRefreshLeaderboard,
  onOpenTerminal = () => {},
}: HubProps) => {
  const rows = leaderboard.slice(0, 5);

  // Показываем модалку если имя не задано
  const [showModal, setShowModal] = useState(!playerName);
  const [inputName, setInputName] = useState('');

  const handleSaveName = () => {
    const clean = inputName.trim().slice(0, 18).toUpperCase() || 'WIZARD';
    onPlayerNameChange?.(clean);
    setShowModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
  };

  return (
    <div style={{
      position:'relative', display:'flex', flexDirection:'column',
      height:'100vh', overflow:'hidden', color:'#fff',
      userSelect:'none', pointerEvents:'auto', background:'#000000'
    }}>
      {/* Nickname modal */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, zIndex:100,
          background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <div style={{
            background:'linear-gradient(180deg, rgba(28,8,52,0.98), rgba(11,5,24,1))',
            border:'1px solid rgba(192,132,252,0.5)',
            boxShadow:'0 0 40px rgba(139,92,246,0.4)',
            borderRadius:'14px', padding:'36px 40px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'20px',
            minWidth:'320px'
          }}>
            <span className="font-mono" style={{fontSize:'13px',color:'#e9d5ff',textTransform:'uppercase',letterSpacing:'0.4em',fontWeight:700}}>
              Enter your nickname
            </span>
            <input
              autoFocus
              maxLength={18}
              value={inputName}
              onChange={e => setInputName(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="YOUR_NICKNAME"
              className="font-mono"
              style={{
                background:'rgba(109,40,217,0.15)',
                border:'1px solid rgba(196,181,253,0.5)',
                color:'#fff', fontSize:'16px', letterSpacing:'0.2em',
                padding:'10px 16px', borderRadius:'6px', outline:'none',
                width:'100%', textAlign:'center', textTransform:'uppercase'
              }}
            />
            <button
              onClick={handleSaveName}
              className="font-mono"
              style={{
                padding:'10px 32px', background:'rgba(109,40,217,0.4)',
                border:'1px solid rgba(196,181,253,0.75)',
                color:'#f5d0fe', fontSize:'13px', textTransform:'uppercase',
                letterSpacing:'0.15em', cursor:'pointer', fontWeight:700,
                borderRadius:'6px', width:'100%'
              }}
            >
              SAVE AND CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Background */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${MENU_BG})`,
          backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat',
          backgroundColor:'#0b0b16'
        }}/>
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(180deg, rgba(6,6,14,0.30) 0%, rgba(10,8,20,0.42) 100%)'
        }}/>
      </div>
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      <div style={{
        position:'relative', zIndex:10, display:'flex', flexDirection:'column',
        height:'100%', width:'100%', maxWidth:'1280px', margin:'0 auto',
        padding:'24px 44px 18px'
      }}>

        {/* HEADER */}
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
            <img src="/assets/MagicBlock-Logomark-White.png" alt="MagicBlock"
              style={{width:'76px',height:'76px',objectFit:'contain',flexShrink:0,
                filter:'drop-shadow(0 0 8px rgba(155,89,182,0.8))'}}/>
            <div style={{display:'flex',flexDirection:'column'}}>
              <span className="font-pirata" style={{fontSize:'30px',letterSpacing:'0.1em',lineHeight:1,textTransform:'uppercase',color:'#fff'}}>TOLLAN</span>
              <span className="font-mono" style={{fontSize:'12px',letterSpacing:'0.4em',color:'#9b59b6',textTransform:'uppercase',marginTop:'4px'}}>MagicBlock Protocol</span>
            </div>
          </div>
          <div style={{display:'flex',gap:'36px'}}>
            {['Execution Layer','Documentation'].map(label => (
              <span key={label} className="font-mono"
                style={{fontSize:'10px',letterSpacing:'0.2em',color:'#64748b',textTransform:'uppercase',cursor:'pointer',transition:'color 0.2s'}}
                onMouseEnter={e=>(e.currentTarget.style.color='#fff')}
                onMouseLeave={e=>(e.currentTarget.style.color='#64748b')}>{label}</span>
            ))}
          </div>
        </header>

        {/* MAIN */}
        <main style={{flex:1,display:'grid',gridTemplateColumns:'6fr 6fr',gap:'32px',alignItems:'center',minHeight:0}}>

          {/* LEFT */}
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <h1 className="font-pirata" style={{
              fontSize:'clamp(6rem, 11vw, 10rem)', lineHeight:0.82,
              letterSpacing:'0.01em', textTransform:'uppercase', color:'#fff',
              marginBottom:'20px', textShadow:'0 6px 20px rgba(0,0,0,0.5)'
            }}>
              TOLLAN<br/>
              <span style={{background:'linear-gradient(to right, #9b59b6, #fff)',
                WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                MagicBlock
              </span>
            </h1>
            <button onClick={onStart} className="btn-stone" style={{
              alignSelf:'flex-start', padding:'16px 46px', fontSize:'24px',
              fontWeight:900, textTransform:'uppercase', fontStyle:'italic',
              letterSpacing:'-0.03em', color:'#fff',
              display:'flex', alignItems:'center', gap:'12px',
              cursor:'pointer', transition:'all 0.15s', overflow:'hidden', position:'relative'
            }}>
              <div className="metal-shine"></div>
              <span style={{position:'relative',zIndex:1}}>Game</span>
              <svg style={{width:'24px',height:'24px',color:'#9b59b6',position:'relative',zIndex:1}}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </div>

          {/* RIGHT — leaderboard panel */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr',
            background:'linear-gradient(180deg, rgba(28,8,52,0.92), rgba(11,5,24,0.98))',
            border:'1px solid rgba(192,132,252,0.35)',
            boxShadow:'0 0 40px rgba(139,92,246,0.22), 0 20px 60px rgba(0,0,0,0.55)',
            borderRadius:'14px', overflow:'hidden',
            width:'100%', minWidth:'520px', maxWidth:'540px',
            justifySelf:'end', transform:'translateX(28px)'
          }}>
            <div style={{padding:'18px',borderBottom:'1px solid rgba(192,132,252,0.2)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                <span className="font-mono" style={{fontSize:'11px',color:'#e9d5ff',textTransform:'uppercase',letterSpacing:'0.45em',fontWeight:700}}>
                  LEADERBOARD
                </span>
              </div>
              <LeaderboardPanel
                playerName={playerName}
                rows={rows}
                status={leaderboardStatus}
                onRefresh={() => onRefreshLeaderboard?.()}
              />
            </div>
            <div style={{padding:'18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <span className="font-mono" style={{fontSize:'11px',color:'#e9d5ff',textTransform:'uppercase',letterSpacing:'0.45em',fontWeight:700}}>
                  PROTOCOL_MATRIX
                </span>
                <span className="font-mono" style={{fontSize:'10px',color:'#c4b5fd',display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{width:'6px',height:'6px',background:'#c084fc',borderRadius:'50%',display:'inline-block',boxShadow:'0 0 8px #c084fc'}}/>
                  STABLE
                </span>
              </div>
              <div className="font-mono" style={{display:'flex',flexDirection:'column',gap:'7px',fontSize:'12px',color:'#c4b5fd',textTransform:'uppercase',letterSpacing:'0.14em'}}>
                {[['Best Wave',`WAVE ${bestWave}`],['Best Score',highScore.toLocaleString()],['Total Purges',totalKills.toLocaleString()]].map(([label,val],i,arr) => (
                  <div key={label} style={{display:'flex',justifyContent:'space-between',
                    ...(i < arr.length-1 ? {borderBottom:'1px solid rgba(192,132,252,0.2)',paddingBottom:'6px'} : {})}}>
                    <span>{label}</span><span style={{color:'#fff'}}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{flexShrink:0,marginTop:'12px',paddingTop:'10px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            <span className="font-mono" style={{fontSize:'9px',color:'#475569',letterSpacing:'0.3em',textTransform:'uppercase',fontWeight:700}}>
              Powered by <span style={{color:'#9b59b6'}}>MagicBlock</span> // Engine_Phaser_v3.90
            </span>
            <div style={{display:'flex',gap:'6px'}}>
              {[0.05,0.1,1].map((op,i) => (
                <div key={i} style={{width:'8px',height:'8px',
                  background: i===2 ? '#9b59b6' : `rgba(255,255,255,${op})`,
                  boxShadow: i===2 ? '0 0 8px #9b59b6' : 'none'}}/>
              ))}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <span className="font-mono" style={{fontSize:'9px',color:'#334155',textTransform:'uppercase',letterSpacing:'0.2em',display:'block',marginBottom:'2px'}}>TOLLAN_STABLE_ASSET_LAYER</span>
            <span className="font-mono" style={{fontSize:'8px',color:'#1e293b'}}>BUILD_0.2.1 // ARCADE_EDITION</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Hub;

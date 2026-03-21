import React, { useState } from 'react';

const Hub = ({ onStart, highScore, totalKills, bestWave = 1, playerName = 'YOU', isNamePromptOpen = false, onPlayerNameChange, leaderboard = [], leaderboardStatus = 'idle', onRefreshLeaderboard, onOpenTerminal }) => {
  const [draftName, setDraftName] = useState(playerName || '');
  const fallbackBoard = [
    { player_name: 'NEON_WRAITH', wave: Math.max(1, bestWave + 4), score: 0 },
    { player_name: 'ARC_SYN', wave: Math.max(1, bestWave + 2), score: 0 },
    { player_name: playerName, wave: Math.max(1, bestWave), score: highScore },
  ];
  const rows = (leaderboard.length ? leaderboard : fallbackBoard).slice(0, 8);
  return (
    <div style={{
      position:'relative', display:'flex', flexDirection:'column',
      height:'100vh', overflow:'hidden', color:'#fff',
      userSelect:'none', pointerEvents:'auto', background:'#020402'
    }}>
      {/* Background */}
      <div style={{position:'absolute',inset:0,opacity:0.2,pointerEvents:'none'}}>
        <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'radial-gradient(circle at 50% 50%,#9b59b611 0%,transparent 50%)'}}></div>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:'60%',height:'60%',background:'#9b59b608',filter:'blur(120px)',borderRadius:'50%'}}></div>
        <div style={{position:'absolute',bottom:'-10%',right:'-5%',width:'50%',height:'50%',background:'#4ecdc405',filter:'blur(100px)',borderRadius:'50%'}}></div>
      </div>
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>

      <div style={{
        position:'relative', zIndex:10, display:'flex', flexDirection:'column',
        height:'100%', width:'100%', maxWidth:'1280px', margin:'0 auto',
        padding:'20px 40px 16px'
      }}>

        {/* HEADER */}
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <img src="/assets/MagicBlock-Logomark-White.png" alt="MagicBlock" style={{width:"68px",height:"68px",objectFit:"contain",flexShrink:0,filter:"drop-shadow(0 0 8px rgba(155,89,182,0.8))"}}/>
            <div style={{display:'flex',flexDirection:'column'}}>
              <span className="font-pirata" style={{fontSize:'26px',letterSpacing:'0.1em',lineHeight:1,textTransform:'uppercase',color:'#fff'}}>TOLLAN</span>
              <span className="font-mono" style={{fontSize:'11px',letterSpacing:'0.4em',color:'#9b59b6',textTransform:'uppercase',marginTop:'3px'}}>MagicBlock Protocol</span>
            </div>
          </div>
          <div style={{display:'flex',gap:'32px'}}>
            <span className="font-mono" style={{fontSize:'9px',letterSpacing:'0.2em',color:'#64748b',textTransform:'uppercase',cursor:'pointer',transition:'color 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='#64748b')}>
              Execution Layer
            </span>
            <span className="font-mono" style={{fontSize:'9px',letterSpacing:'0.2em',color:'#64748b',textTransform:'uppercase',cursor:'pointer',transition:'color 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='#64748b')}>
              Documentation
            </span>
          </div>
        </header>

        {/* MAIN */}
        <main style={{flex:1,display:'grid',gridTemplateColumns:'7fr 5fr',gap:'32px',alignItems:'center',minHeight:0}}>

          {/* LEFT */}
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>

            {/* Title */}
            <h1 className="font-pirata" style={{
              fontSize:'clamp(6rem, 11vw, 10rem)',
              lineHeight:0.82,
              letterSpacing:'-0.02em',
              textTransform:'uppercase',
              color:'#fff',
              marginBottom:'20px',
              textShadow:'0 6px 20px rgba(0,0,0,0.5)'
            }}>
              TOLLAN<br/>
              <span style={{
                background:'linear-gradient(to right, #9b59b6, #fff)',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent',
                backgroundClip:'text'
              }}>MagicBlock</span>
            </h1>

            {/* CTA */}
            <div style={{display:'flex',flexDirection:'row',gap:'12px',alignItems:'center'}}>
              <button
                onClick={onStart}
                className="btn-stone"
                style={{
                  padding:'10px 28px',fontSize:'16px',fontWeight:900,
                  textTransform:'uppercase',fontStyle:'italic',
                  letterSpacing:'-0.03em',color:'#fff',
                  display:'flex',alignItems:'center',gap:'10px',
                  cursor:'pointer',transition:'all 0.15s',overflow:'hidden',
                  position:'relative'
                }}
              >
                <div className="metal-shine"></div>
                <span style={{position:'relative',zIndex:1}}>Initiate Link</span>
                <svg style={{width:'16px',height:'16px',color:'#9b59b6',position:'relative',zIndex:1,transition:'transform 0.2s'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* RIGHT — leaderboard */}
          <div style={{
            display:'grid',gridTemplateColumns:'1fr',gap:'1px',
            background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.05)',
            boxShadow:'0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{background:'rgba(0,0,0,0.42)',padding:'18px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <span className="font-mono" style={{fontSize:'10px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.35em',fontWeight:700}}>Wave_Leaderboard</span>
                <span className="font-mono" style={{fontSize:'9px',color: leaderboard.length ? '#c084fc' : '#a78bfa'}}>
                  {leaderboard.length ? 'ONLINE' : 'LOCAL_FALLBACK'}
                </span>
              </div>
              <div style={{display:'flex',gap:'6px',marginBottom:'8px',alignItems:'center'}}>
                <span className="font-mono" style={{flex:1,fontSize:'10px',letterSpacing:'0.12em',color:'#d8b4fe',textTransform:'uppercase'}}>
                  Pilot: {playerName || 'UNREGISTERED'}
                </span>
                <button
                  onClick={() => onRefreshLeaderboard?.()}
                  style={{
                    padding:'6px 8px', background:'rgba(168,85,247,0.16)', border:'1px solid rgba(168,85,247,0.45)',
                    color:'#d8b4fe', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', cursor:'pointer'
                  }}
                >
                  REFRESH
                </button>
              </div>
              <div className="font-mono" style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.14em'}}>
                {rows.map((entry, i) => (
                  <div key={`${entry.player_name}_${i}`}
                    style={{
                      display:'grid',
                      gridTemplateColumns:'28px 1fr auto',
                      gap:'8px',
                      alignItems:'center',
                      color: entry.player_name === playerName ? '#fff' : '#c4b5fd',
                      background: entry.player_name === playerName ? 'rgba(168,85,247,0.12)' : 'transparent',
                      border: entry.player_name === playerName ? '1px solid rgba(192,132,252,0.55)' : '1px solid transparent',
                      padding:'6px 8px'
                    }}>
                    <span style={{color: i < 3 ? '#c084fc' : '#6d28d9', fontWeight:700}}>#{i + 1}</span>
                    <span>{entry.player_name}</span>
                    <span style={{color:'#fff', fontWeight:700}}>WAVE {entry.wave}</span>
                  </div>
                ))}
              </div>
              {leaderboardStatus !== 'idle' && (
                <div className="font-mono" style={{marginTop:'8px', fontSize:'9px', color: leaderboardStatus === 'loading' ? '#c084fc' : '#a78bfa', letterSpacing:'0.12em'}}>
                  {leaderboardStatus === 'loading' ? 'SYNCING_LEADERBOARD...' : 'NETWORK_UNAVAILABLE_USING_LOCAL_FALLBACK'}
                </div>
              )}
            </div>
            <div style={{background:'rgba(0,0,0,0.6)',padding:'18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <span className="font-mono" style={{fontSize:'10px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.35em',fontWeight:700}}>Protocol_Matrix</span>
                <span className="font-mono" style={{fontSize:'9px',color:'#34d399',display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{width:'5px',height:'5px',background:'#34d399',borderRadius:'50%',display:'inline-block',boxShadow:'0 0 6px #34d399'}}></span>
                  STABLE
                </span>
              </div>
              <div className="font-mono" style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'10px',color:'#64748b',textTransform:'uppercase',letterSpacing:'0.15em'}}>
                <div style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,0.04)',paddingBottom:'5px'}}>
                  <span>Best Wave</span><span style={{color:'#22d3ee'}}>WAVE_{bestWave}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,0.04)',paddingBottom:'5px'}}>
                  <span>Best Score</span><span style={{color:'#fff'}}>{highScore.toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span>Total Purges</span><span style={{color:'#9b59b6'}}>{totalKills.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{
          flexShrink:0,marginTop:'12px',paddingTop:'10px',
          borderTop:'1px solid rgba(255,255,255,0.08)',
          display:'flex',justifyContent:'space-between',alignItems:'flex-end'
        }}>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            <span className="font-mono" style={{fontSize:'9px',color:'#475569',letterSpacing:'0.3em',textTransform:'uppercase',fontWeight:700}}>
              Powered by <span style={{color:'#9b59b6'}}>MagicBlock</span> // Engine_Phaser_v3.60
            </span>
            <div style={{display:'flex',gap:'6px'}}>
              <div style={{width:'8px',height:'8px',background:'rgba(255,255,255,0.05)'}}></div>
              <div style={{width:'8px',height:'8px',background:'rgba(255,255,255,0.1)'}}></div>
              <div style={{width:'8px',height:'8px',background:'#9b59b6',boxShadow:'0 0 8px #9b59b6'}}></div>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <span className="font-mono" style={{fontSize:'9px',color:'#334155',textTransform:'uppercase',letterSpacing:'0.2em',display:'block',marginBottom:'2px'}}>TOLLAN_STABLE_ASSET_LAYER</span>
            <span className="font-mono" style={{fontSize:'8px',color:'#1e293b'}}>BUILD_0.2.1 // ARCADE_EDITION</span>
          </div>
        </footer>

      </div>
      {isNamePromptOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(8,3,18,0.82)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400}}>
          <div style={{width:'min(520px,90vw)',border:'1px solid rgba(192,132,252,0.45)',background:'linear-gradient(160deg, rgba(32,16,60,0.95), rgba(12,8,24,0.95))',padding:'24px',boxShadow:'0 0 50px rgba(168,85,247,0.25)'}}>
            <div className="font-mono" style={{fontSize:'10px',letterSpacing:'0.35em',color:'#a78bfa',textTransform:'uppercase',marginBottom:'8px'}}>Pilot Registration</div>
            <div className="font-pirata" style={{fontSize:'48px',lineHeight:1,color:'#fff',marginBottom:'16px'}}>Enter your nickname</div>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.currentTarget.value)}
              maxLength={18}
              placeholder="YOUR_NICKNAME"
              style={{width:'100%',padding:'12px 14px',background:'#0f0a1f',border:'1px solid rgba(192,132,252,0.45)',color:'#e9d5ff',fontSize:'14px',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'14px'}}
            />
            <button
              onClick={() => onPlayerNameChange?.(draftName)}
              className="btn-stone"
              style={{width:'100%',padding:'12px 16px',fontSize:'14px',fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'#fff'}}
            >
              Save and continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hub;

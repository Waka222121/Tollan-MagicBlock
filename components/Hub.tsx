import React, { useEffect, useState } from 'react';


const MENU_BG_CANDIDATES = [
  '/assets/menu-background.png',
  '/assets/menu-background.jpg',
  '/assets/menu_background.png',
  '/menu-background.png',
  '/menu-background.jpg',
];





const Hub = ({ onStart, highScore, totalKills, bestWave = 1, playerName = 'YOU', isNamePromptOpen = false, onPlayerNameChange, leaderboard = [], leaderboardStatus = 'idle', onRefreshLeaderboard }) => {
  const [draftName, setDraftName] = useState(playerName || '');
  const [menuBackgroundUrl, setMenuBackgroundUrl] = useState(MENU_BG_CANDIDATES[0]);

  useEffect(() => {
    let cancelled = false;

    const tryLoad = async () => {
      for (const src of MENU_BG_CANDIDATES) {
        const ok = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = `${src}?v=20260322`;
        });

        if (ok) {
          if (!cancelled) setMenuBackgroundUrl(src);
          return;
        }
      }
    };

    tryLoad();
    return () => {
      cancelled = true;
    };
  }, []);
  const rows = leaderboard.slice(0, 5);
  const filledRows = [...rows];
  while (filledRows.length < 5) filledRows.push(null);
  return (
    <div style={{
      position:'relative', display:'flex', flexDirection:'column',
      height:'100vh', overflow:'hidden', color:'#fff',
      userSelect:'none', pointerEvents:'auto', background:'#000000'
    }}>
      {/* Background */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <div
          style={{
            position:'absolute',
            inset:0,
            backgroundImage:"url('/assets/menu-background.png?v=20260322b')",
            backgroundSize:'cover',
            backgroundPosition:'center',
            backgroundRepeat:'no-repeat',
            backgroundColor:'#0b0b16'
          }}
        ></div>
        <div
          style={{
            position:'absolute',
            inset:0,
            background:'linear-gradient(180deg, rgba(6, 6, 14, 0.30) 0%, rgba(10, 8, 20, 0.42) 100%)'
          }}
        ></div>
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
            <img src="/assets/MagicBlock-Logomark-White.png" alt="MagicBlock" style={{width:"76px",height:"76px",objectFit:"contain",flexShrink:0,filter:"drop-shadow(0 0 8px rgba(155,89,182,0.8))"}}/>
            <div style={{display:'flex',flexDirection:'column'}}>
              <span className="font-pirata" style={{fontSize:'30px',letterSpacing:'0.1em',lineHeight:1,textTransform:'uppercase',color:'#fff'}}>TOLLAN</span>
              <span className="font-mono" style={{fontSize:'12px',letterSpacing:'0.4em',color:'#9b59b6',textTransform:'uppercase',marginTop:'4px'}}>MagicBlock Protocol</span>
            </div>
          </div>
          <div style={{display:'flex',gap:'36px'}}>
            <span className="font-mono" style={{fontSize:'10px',letterSpacing:'0.2em',color:'#64748b',textTransform:'uppercase',cursor:'pointer',transition:'color 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='#64748b')}>
              Execution Layer
            </span>
            <span className="font-mono" style={{fontSize:'10px',letterSpacing:'0.2em',color:'#64748b',textTransform:'uppercase',cursor:'pointer',transition:'color 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='#64748b')}>
              Documentation
            </span>
          </div>
        </header>

        {/* MAIN */}
        <main style={{flex:1,display:'grid',gridTemplateColumns:'6fr 6fr',gap:'32px',alignItems:'center',minHeight:0}}>

          {/* LEFT */}
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>

            {/* Title */}
            <h1 className="font-pirata" style={{
              fontSize:'clamp(6rem, 11vw, 10rem)',
              lineHeight:0.82,
              letterSpacing:'0.01em',
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
                  padding:'16px 46px',fontSize:'24px',fontWeight:900,
                  textTransform:'uppercase',fontStyle:'italic',
                  letterSpacing:'-0.03em',color:'#fff',
                  display:'flex',alignItems:'center',gap:'12px',
                  cursor:'pointer',transition:'all 0.15s',overflow:'hidden',
                  position:'relative'
                }}
              >
                <div className="metal-shine"></div>
                <span style={{position:'relative',zIndex:1}}>Game</span>
                <svg style={{width:'24px',height:'24px',color:'#9b59b6',position:'relative',zIndex:1,transition:'transform 0.2s'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* RIGHT — leaderboard */}
          <div style={{
            display:'grid',gridTemplateColumns:'1fr',
            background:'linear-gradient(180deg, rgba(28,8,52,0.92), rgba(11,5,24,0.98))',
            border:'1px solid rgba(192,132,252,0.35)',
            boxShadow:'0 0 40px rgba(139,92,246,0.22), 0 20px 60px rgba(0,0,0,0.55)',
            borderRadius:'14px',
            overflow:'hidden',
            width:'100%',
            minWidth:'520px',
            maxWidth:'540px',
            justifySelf:'end',
            transform:'translateX(28px)'
          }}>
            <div style={{padding:'18px',borderBottom:'1px solid rgba(192,132,252,0.2)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                <span className="font-mono" style={{fontSize:'11px',color:'#e9d5ff',textTransform:'uppercase',letterSpacing:'0.45em',fontWeight:700}}>LEADERBOARD</span>
              </div>
              <div style={{display:'flex',gap:'6px',marginBottom:'8px',alignItems:'center'}}>
                <span className="font-mono" style={{flex:1,fontSize:'12px',letterSpacing:'0.16em',color:'#f5d0fe',textTransform:'uppercase'}}>
                  NAME: {(playerName || 'UNREGISTERED').toUpperCase().replace(/\s+/g, '_')}
                </span>
                <button
                  onClick={() => onRefreshLeaderboard?.()}
                  style={{
                    padding:'9px 12px', background:'rgba(109,40,217,0.28)', border:'1px solid rgba(196,181,253,0.75)',
                    color:'#f5d0fe', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer', fontWeight:700
                  }}
                >
                  REFRESH
                </button>
              </div>
              <div className="font-mono" style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.14em',marginTop:'10px'}}>
                {filledRows.map((entry, i) => (
                  <div key={entry ? `${entry.player_name}_${i}` : `empty_${i}`}
                    style={{
                      display:'grid',
                      gridTemplateColumns:'28px 1fr auto',
                      gap:'10px',
                      alignItems:'center',
                      color: entry?.player_name === playerName ? '#ffffff' : '#ddd6fe',
                      background: entry?.player_name === playerName ? 'linear-gradient(90deg, rgba(168,85,247,0.35), rgba(168,85,247,0.1))' : 'rgba(13,7,31,0.28)',
                      border: entry?.player_name === playerName ? '1px solid rgba(216,180,254,0.95)' : '1px solid rgba(167,139,250,0.32)',
                      padding:'6px 10px'
                    }}>
                    <span style={{color: '#c084fc', fontWeight:700}}>#{i + 1}</span>
                    <span>{entry ? String(entry.player_name || '').toUpperCase().replace(/\s+/g, '_') : '—'}</span>
                    <span style={{color:'#fff', fontWeight:700, letterSpacing:'0.12em'}}>{entry ? `WAVE ${entry.wave}` : '—'}</span>
                  </div>
                ))}
              </div>
              {leaderboardStatus !== 'idle' && (
                <div className="font-mono" style={{marginTop:'10px', fontSize:'9px', color: leaderboardStatus === 'loading' ? '#c084fc' : '#a78bfa', letterSpacing:'0.12em'}}>
                  {leaderboardStatus === 'loading' ? 'SYNCING_LEADERBOARD...' : 'NETWORK_UNAVAILABLE_USING_LOCAL_FALLBACK'}
                </div>
              )}
            </div>
            <div style={{padding:'18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <span className="font-mono" style={{fontSize:'11px',color:'#e9d5ff',textTransform:'uppercase',letterSpacing:'0.45em',fontWeight:700}}>PROTOCOL_MATRIX</span>
                <span className="font-mono" style={{fontSize:'10px',color:'#c4b5fd',display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{width:'6px',height:'6px',background:'#c084fc',borderRadius:'50%',display:'inline-block',boxShadow:'0 0 8px #c084fc'}}></span>
                  STABLE
                </span>
              </div>
              <div className="font-mono" style={{display:'flex',flexDirection:'column',gap:'7px',fontSize:'12px',color:'#c4b5fd',textTransform:'uppercase',letterSpacing:'0.14em'}}>
                <div style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid rgba(192,132,252,0.2)',paddingBottom:'6px'}}>
                  <span>Best Wave</span><span style={{color:'#fff'}}>WAVE {bestWave}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid rgba(192,132,252,0.2)',paddingBottom:'6px'}}>
                  <span>Best Score</span><span style={{color:'#fff'}}>{highScore.toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span>Total Purges</span><span style={{color:'#fff'}}>{totalKills.toLocaleString()}</span>
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

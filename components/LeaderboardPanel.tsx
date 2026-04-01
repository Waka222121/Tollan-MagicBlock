import React from 'react';
import type { WaveLeaderboardEntry } from '../lib/leaderboardService';

interface LeaderboardPanelProps {
  playerName: string;
  rows: WaveLeaderboardEntry[];
  status: 'idle' | 'loading' | 'error' | 'local';
  errorText?: string;
  onRefresh: () => void;
}

const LeaderboardPanel = ({ playerName, rows, status, errorText, onRefresh }: LeaderboardPanelProps) => {
  const top5 = rows.slice(0, 5);
  const filled = [...top5];
  while (filled.length < 5) filled.push(null as any);

  return (
    <>
      <div style={{display:'flex',gap:'6px',marginBottom:'8px',alignItems:'center'}}>
        <span className="font-mono" style={{flex:1,fontSize:'12px',letterSpacing:'0.16em',color:'#f5d0fe',textTransform:'uppercase'}}>
          NAME: {(playerName || 'UNREGISTERED').toUpperCase().replace(/\s+/g, '_')}
        </span>
        <button
          onClick={onRefresh}
          style={{
            padding:'9px 12px', background:'rgba(109,40,217,0.28)', border:'1px solid rgba(196,181,253,0.75)',
            color:'#f5d0fe', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer', fontWeight:700
          }}
        >
          REFRESH
        </button>
      </div>

      <div className="font-mono" style={{display:'grid',gridTemplateColumns:'28px 1fr 80px 86px',gap:'10px',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.14em',marginTop:'10px',color:'#c4b5fd'}}>
        <span>#</span>
        <span>Player</span>
        <span style={{textAlign:'right'}}>Wave</span>
        <span style={{textAlign:'right'}}>Score</span>
      </div>

      <div className="font-mono" style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.14em',marginTop:'8px'}}>
        {filled.map((entry, i) => (
          <div key={entry ? `${entry.player_name}_${i}` : `empty_${i}`}
            style={{
              display:'grid',
              gridTemplateColumns:'28px 1fr 80px 86px',
              gap:'10px',
              alignItems:'center',
              color: entry?.player_name === playerName ? '#ffffff' : '#ddd6fe',
              background: entry?.player_name === playerName ? 'linear-gradient(90deg, rgba(168,85,247,0.35), rgba(168,85,247,0.1))' : 'rgba(13,7,31,0.28)',
              border: entry?.player_name === playerName ? '1px solid rgba(216,180,254,0.95)' : '1px solid rgba(167,139,250,0.32)',
              padding:'6px 10px'
            }}>
            <span style={{color: '#c084fc', fontWeight:700}}>#{i + 1}</span>
            <span>{entry ? String(entry.player_name || '').toUpperCase().replace(/\s+/g, '_') : '—'}</span>
            <span style={{color:'#fff', fontWeight:700, letterSpacing:'0.12em', textAlign:'right'}}>{entry ? `${entry.wave}` : '—'}</span>
            <span style={{color:'#fff', fontWeight:700, letterSpacing:'0.12em', textAlign:'right'}}>{entry ? Number(entry.score || 0).toLocaleString() : '—'}</span>
          </div>
        ))}
      </div>

      {status !== 'idle' && (
        <div className="font-mono" style={{marginTop:'10px', fontSize:'9px', color: status === 'loading' ? '#c084fc' : '#a78bfa', letterSpacing:'0.12em'}}>
          {status === 'loading'
            ? 'SYNCING_LEADERBOARD...'
            : status === 'local'
              ? 'LOCAL_LEADERBOARD_ONLY_CONFIGURE_SUPABASE_FOR_GLOBAL_RANKING'
              : `NETWORK_UNAVAILABLE_USING_LOCAL_FALLBACK${errorText ? ` // ${errorText.slice(0, 80)}` : ''}`}
        </div>
      )}
    </>
  );
};

export default LeaderboardPanel;

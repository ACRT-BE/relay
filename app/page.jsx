
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase, hasSupabase, FORCE_DEMO } from '../lib/supabaseClient';

const UI = {
  app: { background: 'linear-gradient(180deg,#0b0f1a,#121826)', minHeight: '100vh', color: '#fff' },
  panel: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', color:'#fff' },
  chipActive: { backgroundColor: '#1066db', border: '1px solid #1066db', color: '#fff', borderRadius: 16, padding: '8px 12px' },
  chipInactive: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 16, padding: '8px 12px' },
  muted: { background: 'rgba(255,255,255,0.1)', borderRadius: 16 },
  row: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 },
  rowActive: { background: 'rgba(239,68,68,0.10)', border: '1px solid #ef4444', borderRadius: 12, padding: 8 },
  ghostIcon: { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color:'#fff', borderRadius: 12, padding: '6px 10px' }
};

function pad(n){ return String(n).padStart(2,'0'); }
function parseHM(dateStr, hm){ const [h='0',m='0']=String(hm||'').split(':'); const d=new Date(dateStr+'T00:00:00'); d.setHours(+h||0, +m||0, 0,0); return d; }
function addMin(d, min){ const x=new Date(d); x.setMinutes(x.getMinutes()+min); return x; }
function fmtHM(d){ return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function minutesBetween(a,b){ return Math.max(0, Math.round((b.getTime()-a.getTime())/60000)); }
const PALETTE = ['#ef4444','#f59e0b','#eab308','#10b981','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316'];

function isDigit(ch){ return ch >= '0' && ch <= '9'; }
function isValidHHmm(s){ if (s.length !== 5) return false; if (s[2] !== ':') return false; const hh = Number(s.slice(0,2)); const mm = Number(s.slice(3,5)); if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false; return hh>=0&&hh<=23&&mm>=0&&mm<=59; }
function allowPartialHHmm(s){ if (s === '') return true; if (s.length > 5) return false; for (let i=0;i<s.length;i++){ const ch=s[i]; if (!isDigit(ch) && ch !== ':') return false; } if (s.length >= 3 && s[2] !== ':') return false; const h1=s[0], h2=s[1]; if (h1 && !(h1>='0'&&h1<='2')) return false; if (h2 && !(h2>='0'&&h2<=(h1==='2'?'3':'9'))) return false; const m1=s.length>=4?s[3]:''; const m2=s.length===5?s[4]:''; if (m1 && !(m1>='0'&&m1<='5')) return false; if (m2 && !(m2>='0'&&m2<='9')) return false; if (s.length===5) return isValidHHmm(s); return true; }

function makeTeamA(){ return { id:'teamA', name:'Équipe A', currentRaceId:'A3',
  races:[ {id:'A1',name:'Qualification',type:'qualifying',date:'2025-09-19',start:'11:00',end:'11:20'}, {id:'A2',name:'Sprint',type:'sprint',date:'2025-09-19',start:'12:00',end:'12:15'}, {id:'A3',name:'Course 1',type:'race',date:'2025-09-19',start:'13:05',end:'14:00'} ],
  drivers:[ {id:'a1',name:'Alice',color:'#49abff'}, {id:'a2',name:'Bob',color:'#f59e0b'}, {id:'a3',name:'Claire',color:'#22c55e'} ],
  stints:[ {id:'sa1',race_id:'A3',driverId:'a1',dur:10,pos:0}, {id:'sa2',race_id:'A3',driverId:'a2',dur:12,pos:1}, {id:'sa3',race_id:'A3',driverId:'a3',dur:15,pos:2}, {id:'sa4',race_id:'A3',driverId:'a1',dur:8,pos:3} ]
};}
function makeTeamB(){ return { id:'teamB', name:'Équipe B', currentRaceId:'B2',
  races:[ {id:'B1',name:'Libre',type:'practice',date:'2025-09-19',start:'10:00',end:'10:30'}, {id:'B2',name:'Course',type:'race',date:'2025-09-19',start:'15:00',end:'16:00'} ],
  drivers:[ {id:'b1',name:'Diego',color:'#3b82f6'}, {id:'b2',name:'Emma',color:'#ec4899'} ],
  stints:[ {id:'sb1',race_id:'B2',driverId:'b1',dur:20,pos:0}, {id:'sb2',race_id:'B2',driverId:'b2',dur:20,pos:1}, {id:'sb3',race_id:'B2',driverId:'b1',dur:20,pos:2} ]
};}

async function seedDemoToSupabase(){
  try{
    const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true });
    if ((count ?? 0) > 0) return;
    const { data: tA } = await supabase.from('teams').insert({ name:'Équipe A', slug:'equipe-a' }).select().single();
    const { data: tB } = await supabase.from('teams').insert({ name:'Équipe B', slug:'equipe-b' }).select().single();
    const driversA = [ { name:'Alice', color:'#49abff' }, { name:'Bob', color:'#f59e0b' }, { name:'Claire', color:'#22c55e' } ];
    const driversB = [ { name:'Diego', color:'#3b82f6' }, { name:'Emma', color:'#ec4899' } ];
    const { data: dA } = await supabase.from('drivers').insert(driversA.map(x=>({ team_id: tA.id, ...x }))).select();
    const { data: dB } = await supabase.from('drivers').insert(driversB.map(x=>({ team_id: tB.id, ...x }))).select();
    const racesA = [
      { name:'Qualification', type:'qualifying', date:'2025-09-19', start:'11:00', finish:'11:20' },
      { name:'Sprint',        type:'sprint',     date:'2025-09-19', start:'12:00', finish:'12:15' },
      { name:'Course 1',      type:'race',       date:'2025-09-19', start:'13:05', finish:'14:00' },
    ].map(x=>({ team_id: tA.id, ...x }));
    const racesB = [
      { name:'Libre',  type:'practice', date:'2025-09-19', start:'10:00', finish:'10:30' },
      { name:'Course', type:'race',     date:'2025-09-19', start:'15:00', finish:'16:00' },
    ].map(x=>({ team_id: tB.id, ...x }));
    const { data: rA } = await supabase.from('races').insert(racesA).select();
    const { data: rB } = await supabase.from('races').insert(racesB).select();
    const by = (arr, k) => Object.fromEntries((arr||[]).map(x=>[x[k], x]));
    const dAMap = by(dA,'name'), dBMap = by(dB,'name'), rAMap = by(rA,'name'), rBMap = by(rB,'name');
    await supabase.from('stints').insert([
      { race_id: rAMap['Course 1'].id, driver_id: dAMap['Alice'].id,  duration_minutes: 10, pos: 0 },
      { race_id: rAMap['Course 1'].id, driver_id: dAMap['Bob'].id,    duration_minutes: 12, pos: 1 },
      { race_id: rAMap['Course 1'].id, driver_id: dAMap['Claire'].id, duration_minutes: 15, pos: 2 },
      { race_id: rAMap['Course 1'].id, driver_id: dAMap['Alice'].id,  duration_minutes:  8, pos: 3 },
      { race_id: rBMap['Course'].id,   driver_id: dBMap['Diego'].id,  duration_minutes: 20, pos: 0 },
      { race_id: rBMap['Course'].id,   driver_id: dBMap['Emma'].id,   duration_minutes: 20, pos: 1 },
      { race_id: rBMap['Course'].id,   driver_id: dBMap['Diego'].id,  duration_minutes: 20, pos: 2 },
    ]);
  } catch (e) {
    console.error('Seed error -> will fallback to demo', e);
    throw e;
  }
}

export default function Page(){
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState('');
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [tmpTeamName, setTmpTeamName] = useState('');

  useEffect(()=>{
    (async () => {
      if (FORCE_DEMO || !hasSupabase) {
        const A = makeTeamA(); const B = makeTeamB();
        setProfiles([A,B]); setProfileId('teamA'); return;
      }
      try { await seedDemoToSupabase(); await loadFromSupabase(); }
      catch (e) { const A = makeTeamA(); const B = makeTeamB(); setProfiles([A,B]); setProfileId('teamA'); }
    })();
  }, []);

  async function loadFromSupabase(){
    const { data: teams } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
    const results = [];
    for (const t of teams){
      const [{ data: drivers }, { data: races }] = await Promise.all([
        supabase.from('drivers').select('*').eq('team_id', t.id),
        supabase.from('races').select('*').eq('team_id', t.id).order('date').order('start')
      ]);
      const currentRaceId = races?.[races.length-1]?.id || '';
      let stints = [];
      if (currentRaceId){
        const { data: st } = await supabase.from('stints').select('*').eq('race_id', currentRaceId).order('pos');
        stints = (st||[]).map(s => ({ id: s.id, race_id: s.race_id, driverId: s.driver_id, dur: s.duration_minutes, pos: s.pos }));
      }
      const rmap = (races||[]).map(r => ({ id: r.id, name: r.name, type: r.type, date: r.date, start: r.start?.slice?.(0,5) || r.start, end: r.finish?.slice?.(0,5) || r.finish }));
      const dmap = (drivers||[]).map(d => ({ id: d.id, name: d.name, color: d.color }));
      results.push({ id: t.id, name: t.name, races: rmap, currentRaceId, drivers: dmap, stints });
    }
    setProfiles(results);
    setProfileId(results[0]?.id || '');
  }

  const profile = useMemo(() => profiles.find(p=>p.id===profileId) || profiles[0], [profiles, profileId]);
  function startEditTeam(id, name){ setEditingTeamId(id); setTmpTeamName(name); }
  async function commitEditTeam(){ const v = (tmpTeamName||'').trim(); if (v) { setProfiles(prev=>prev.map(p=>p.id===editingTeamId?{...p,name:v}:p)); if (hasSupabase) await supabase.from('teams').update({ name: v }).eq('id', editingTeamId); } setEditingTeamId(null); setTmpTeamName(''); }
  async function addTeam(){ const name = 'Nouvelle équipe'; if (hasSupabase){ const { data } = await supabase.from('teams').insert({ name }).select().single(); if (data){ const newTeam = { id: data.id, name, races: [], currentRaceId: '', drivers: [], stints: [] }; setProfiles(prev=>[...prev, newTeam]); setProfileId(newTeam.id); setEditingTeamId(newTeam.id); setTmpTeamName(name);} } else { const id = 'team' + Math.random().toString(36).slice(2,8); const newTeam = { id, name, races: [], currentRaceId: '', drivers: [], stints: [] }; setProfiles(prev=>[...prev, newTeam]); setProfileId(id); setEditingTeamId(id); setTmpTeamName(name);} }
  async function deleteTeam(id){ if (profiles.length <= 1) { alert('Impossible de supprimer la dernière équipe.'); return; } if (!confirm('Supprimer définitivement cette équipe ?')) return; if (hasSupabase){ await supabase.from('teams').delete().eq('id', id); } const next = profiles.filter(p=>p.id!==id); setProfiles(next); if (editingTeamId===id){ setEditingTeamId(null); setTmpTeamName(''); } if (profileId===id){ setProfileId(next[0]?.id || ''); } }

  const sortedRaces = useMemo(() => { const arr = (profile?.races || []).slice(); arr.sort((a,b)=>parseHM(a.date,a.start)-parseHM(b.date,b.start)); return arr; }, [profile]);
  const [currentRaceId, setCurrentRaceId] = useState('');
  useEffect(()=>{ setCurrentRaceId(profile?.currentRaceId || (sortedRaces[0]?.id || '')); }, [profileId, profile, sortedRaces]);
  const currentRace = useMemo(()=> sortedRaces.find(r=>r.id===currentRaceId) || sortedRaces[0] || null, [sortedRaces, currentRaceId]);

  const [raceName, setRaceName] = useState(currentRace ? currentRace.name : '');
  const [raceType, setRaceType] = useState(currentRace ? currentRace.type : 'race');
  const [raceDate, setRaceDate] = useState(currentRace ? currentRace.date : new Date().toISOString().slice(0,10));
  const [raceTime, setRaceTime] = useState(currentRace ? currentRace.start : '13:05');
  const [tmpRaceTime, setTmpRaceTime] = useState(raceTime);
  const [raceEndTime, setRaceEndTime] = useState(currentRace ? currentRace.end : '14:00');
  const [tmpRaceEndTime, setTmpRaceEndTime] = useState(raceEndTime);

  const [newRaceName, setNewRaceName] = useState('Course 2');
  const [newRaceType, setNewRaceType] = useState('race');
  const [newRaceDate, setNewRaceDate] = useState(new Date().toISOString().slice(0,10));
  const [newRaceStart, setNewRaceStart] = useState('14:00');
  const [tmpNewStart, setTmpNewStart] = useState('14:00');
  const [newRaceEnd, setNewRaceEnd] = useState('16:00');
  const [tmpNewEnd, setTmpNewEnd] = useState('16:00');

  const [editingDriverId, setEditingDriverId] = useState(null);
  const [addingDriver, setAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverColor, setNewDriverColor] = useState(PALETTE[0]);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const toggleMenu = (idx)=> setOpenMenuIdx(openMenuIdx===idx?null:idx);

  const [drivers, setDrivers] = useState(profile?.drivers || []);
  const [stints, setStints] = useState(profile?.stints || []);
  useEffect(()=>{ setDrivers(profile?.drivers || []); setStints(profile?.stints || []); setNewDriverColor(PALETTE[(profile?.drivers?.length||0)%PALETTE.length]||PALETTE[0]); }, [profileId, profile]);

  function upsertProfile(next){ setProfiles(prev => prev.map(p => p.id===profileId ? { ...p, ...next } : p)); }
  useEffect(()=>{ if(profile) upsertProfile({ drivers }); }, [drivers]);
  useEffect(()=>{ if(profile) upsertProfile({ stints }); }, [stints]);
  useEffect(()=>{ if(profile) upsertProfile({ currentRaceId }); }, [currentRaceId]);

  useEffect(()=>{ if(profile && currentRace){
    const races = (profile.races||[]).map(r => r.id===currentRace.id ? { ...r, name: raceName, type: raceType, date: raceDate, start: raceTime, end: raceEndTime } : r);
    upsertProfile({ races });
    if (hasSupabase){
      supabase.from('races').update({ name: raceName, type: raceType, date: raceDate, start: raceTime, finish: raceEndTime }).eq('id', currentRace.id).then(()=>{});
    }
  }}, [raceName, raceType, raceDate, raceTime, raceEndTime]);

  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()), 30000); return ()=>clearInterval(t); },[]);

  const computedState = useMemo(()=>{
    try {
      if (!currentRace) return { items: [], totalMinutes: 0 };
      const start = parseHM(raceDate, raceTime);
      const end   = parseHM(raceDate, raceEndTime);
      const items = []; let cursor = start;
      for (let i=0;i<stints.length;i++){
        const s = stints[i]; if (cursor >= end) break;
        const d = drivers.find(x=>x.id===s.driverId) || {id:'-', name:'Non assigné', color:'#888'};
        const sStart = new Date(cursor); const sEndTarget = addMin(sStart, s.dur);
        const sEnd = sEndTarget > end ? end : sEndTarget;
        const shown = Math.max(0, minutesBetween(sStart, sEnd));
        items.push({ idx: items.length+1, startD: sStart, endD: sEnd, start: fmtHM(sStart), end: fmtHM(sEnd), dur: shown, driver: d, id: s.id ?? ('i'+i) });
        cursor = sEndTarget;
      }
      return { items, totalMinutes: minutesBetween(start, end) };
    } catch (e) {
      console.error('computedState error', e);
      return { items: [], totalMinutes: 0 };
    }
  }, [raceDate, raceTime, raceEndTime, stints, drivers, currentRace]);

  const driverTotals = useMemo(()=>{ const map = {}; computedState.items.forEach(it => { map[it.driver.id] = (map[it.driver.id]||0) + it.dur; }); return map; }, [computedState]);

  function move(i, dir){ const j=i+dir; if(j<0||j>=stints.length) return; const copy=[...stints]; [copy[i],copy[j]]=[copy[j],copy[i]]; copy.forEach((s,idx)=>s.pos=idx); setStints(copy); if (hasSupabase){ copy.forEach(s => { if(s.id) supabase.from('stints').update({ pos: s.pos }).eq('id', s.id); }); } }
  function changeDur(i, v){ if(!Number.isFinite(v)||v<1) return; const copy=[...stints]; copy[i]={...copy[i], dur:v}; setStints(copy); if (hasSupabase){ const s = copy[i]; if(s?.id) supabase.from('stints').update({ duration_minutes: s.dur }).eq('id', s.id); } }
  function assignDriver(i, id){ const copy=[...stints]; copy[i]={...copy[i], driverId:id}; setStints(copy); if (hasSupabase){ const s = copy[i]; if(s?.id) supabase.from('stints').update({ driver_id: id }).eq('id', s.id); } }
  function setDriverColor(id, color){ setDrivers(ds=>ds.map(d=>d.id===id?{...d,color}:d)); if (hasSupabase){ supabase.from('drivers').update({ color }).eq('id', id); } setEditingDriverId(null); }

  async function addNewDriver(){ const name = (newDriverName||'').trim(); if(!name) return; const color = newDriverColor || PALETTE[0]; if (hasSupabase){ const { data } = await supabase.from('drivers').insert({ team_id: profileId, name, color }).select().single(); if (data){ setDrivers(prev=>[...prev, { id: data.id, name, color }]); } } else { const id = 'd' + Math.random().toString(36).slice(2,8); setDrivers(prev=>[...prev, { id, name, color }]); } setAddingDriver(false); setNewDriverName(''); setNewDriverColor(PALETTE[((drivers?.length||0)+1)%PALETTE.length]||PALETTE[0]); }

  function balancePerDriver(){ if (stints.length === 0) return; const driverIds = Array.from(new Set(stints.map(s=>s.driverId))); const perDriverTarget = Math.max(1, Math.round(computedState.totalMinutes / Math.max(1, driverIds.length))); const idxsByDriver = {}; stints.forEach((s,idx)=>{ (idxsByDriver[s.driverId]||(idxsByDriver[s.driverId]=[])).push(idx); }); const next=[...stints]; driverIds.forEach(id=>{ const idxs = idxsByDriver[id]||[]; if (idxs.length===0) return; const base = Math.max(1, Math.floor(perDriverTarget/idxs.length)); const delta = perDriverTarget - base*idxs.length; idxs.forEach((i,k)=>{ let dur=base; if(k===idxs.length-1) dur=Math.max(1, base+delta); next[i]={...next[i], dur}; }); }); setStints(next); if (hasSupabase){ next.forEach(s => { if(s?.id) supabase.from('stints').update({ duration_minutes: s.dur }).eq('id', s.id); }); } }

  function onTimeChange(value, setTmp, setFinal){ if (!allowPartialHHmm(value)) return; setTmp(value); if (value.length===5 && isValidHHmm(value)) setFinal(value); }

  async function deleteCurrentRace(){ if (!currentRace) return; if (!confirm('Supprimer cette course ?')) return; if (hasSupabase) await supabase.from('races').delete().eq('id', currentRace.id); const races = (profile.races||[]).filter(r=>r.id!==currentRace.id); const nextCR = races.slice().sort((a,b)=>parseHM(a.date,a.start)-parseHM(b.date,b.start))[0]; upsertProfile({ races, currentRaceId: nextCR?nextCR.id:'' }); setCurrentRaceId(nextCR?nextCR.id:''); }

  function addNewRace(){ const name = (newRaceName||'').trim(); if (!name) return; if (!isValidHHmm(newRaceStart) || !isValidHHmm(newRaceEnd)) return; if (hasSupabase){ supabase.from('races').insert({ team_id: profileId, name, type: newRaceType, date: newRaceDate, start: newRaceStart, finish: newRaceEnd }).select().single().then(({ data })=>{ if (data){ const newRace = { id: data.id, name, type:newRaceType, date:newRaceDate, start:newRaceStart, end:newRaceEnd }; const races = [ ...(profile.races||[]), newRace ]; upsertProfile({ races, currentRaceId: data.id }); setCurrentRaceId(data.id); } }); } else { const id = 'N' + Math.random().toString(36).slice(2,8); const newRace = { id, name, type:newRaceType, date:newRaceDate, start:newRaceStart, end:newRaceEnd }; const races = [ ...(profile.races||[]), newRace ]; upsertProfile({ races, currentRaceId: id }); setCurrentRaceId(id); } }

  function switchTeam(id){ setProfileId(id); }

  const sortedRacesUI = useMemo(()=>{ const arr = (profile?.races||[]).slice(); arr.sort((a,b)=>parseHM(a.date,a.start)-parseHM(b.date,b.start)); return arr; }, [profile]);

  return (
    <div style={UI.app} className="mx-auto max-w-sm p-3">
      <header className="mb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏁 Kart Relay</h1>
          <span className="text-xs opacity-70">{hasSupabase ? 'Supabase' : 'Demo locale'}</span>
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-2 items-center">
          {profiles.map(p => (
            editingTeamId===p.id ? (
              <div key={p.id} style={{...UI.chipInactive, display:'flex', gap:6, alignItems:'center'}}>
                <input autoFocus value={tmpTeamName} onChange={e=>setTmpTeamName(e.target.value)}
                  onKeyDown={(e)=>{ if(e.key==='Enter') commitEditTeam(); if(e.key==='Escape'){ setEditingTeamId(null); setTmpTeamName(''); } }}
                  onBlur={commitEditTeam} style={{...UI.input, padding:'6px 8px', height:32}} />
                <button onClick={commitEditTeam} style={{...UI.ghostIcon, padding:'4px 8px'}}>OK</button>
              </div>
            ) : (
              <div key={p.id} style={{display:'flex', gap:6, alignItems:'center'}}>
                <button onClick={()=>switchTeam(p.id)} style={p.id===profileId?UI.chipActive:UI.chipInactive} className="whitespace-nowrap">
                  {p.name}
                </button>
                {p.id===profileId && (
                  <>
                    <button aria-label="Renommer l'équipe" onClick={()=>startEditTeam(p.id, p.name)} style={UI.ghostIcon}>✎</button>
                    <button aria-label="Supprimer l'équipe" onClick={()=>deleteTeam(p.id)} style={{...UI.ghostIcon, borderColor:'#ef4444', color:'#ef4444'}}>🗑</button>
                  </>
                )}
              </div>
            )
          ))}
          <button aria-label="Nouvelle équipe" onClick={addTeam} style={{...UI.chipInactive, fontWeight:800}}>+</button>
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {sortedRacesUI.map(r => (
            <button key={r.id}
              onClick={()=>{ setCurrentRaceId(r.id); upsertProfile({ currentRaceId: r.id }); }}
              style={r.id===(currentRace&&currentRace.id)?UI.chipActive:UI.chipInactive}
              className="whitespace-nowrap"
              title={`${r.name} • ${r.date} ${r.start}-${r.end}`}
            >
              <span style={{fontWeight:600}}>{r.start}</span> <span style={{opacity:0.8}}>{r.name}</span>
            </button>
          ))}
        </div>
      </header>

      <section style={UI.panel} className="space-y-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-300">Course</div>
            {currentRace ? (
              <>
                <div className="font-semibold">{raceName}</div>
                <div className="text-sm text-slate-400">
                  {raceType} • départ <span className="font-semibold text-white">{raceTime}</span>
                  <span className="mx-1">—</span>
                  fin <span className="font-semibold text-white">{raceEndTime}</span>
                  <span className="ml-2 text-xs text-slate-400">({Math.floor(computedState.totalMinutes/60)}h{pad(computedState.totalMinutes%60)})</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-400">Aucune course pour cette équipe pour l'instant.</div>
            )}
          </div>
          <button className="px-4 py-2 rounded-2xl" style={{background:'#1f85ff'}} disabled={!currentRace}>+ Relais</button>
        </div>

        {(currentRace?computedState.items:[]).map((s, i) => {
          const sameDay = (a,b)=> a.toDateString()===b.toDateString();
          const startD = parseHM(raceDate, raceTime);
          const active = sameDay(new Date(), startD) && new Date() >= s.startD && new Date() < s.endD;
          return (
            <div key={s.idx} className="flex items-center gap-2 border" style={{...(active?UI.rowActive:UI.row), flexWrap:'wrap', alignItems:'stretch'}}>
              <div className="w-10 text-center text-xs opacity-70" style={{alignSelf:'center'}}>#{s.idx}</div>
              <div style={{width:6, borderRadius:4, backgroundColor:s.driver.color}} />

              <div className="flex-1" style={{minWidth:180}}>
                <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                  <div style={{fontSize:20, fontWeight:900, lineHeight:1.1}}>{s.start} – {s.end}</div>
                  {active && (
                    <span style={{fontSize:10, fontWeight:800, letterSpacing:1, padding:'4px 6px', borderRadius:999, background:'rgba(239,68,68,0.15)', border:'1px solid #ef4444', color:'#ef4444'}}>EN COURS</span>
                  )}
                </div>
                <div style={{marginTop:6, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{width:10, height:10, borderRadius:'50%', backgroundColor:s.driver.color}} />
                    <span style={{fontSize:18, fontWeight:800, color:s.driver.color}}>{s.driver.name}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:999, padding:'4px 8px'}}>
                    <button aria-label="-1 minute" onClick={()=>changeDur(i, (stints[i].dur||1)-1)} style={{...UI.ghostIcon, padding:'2px 8px'}}>−</button>
                    <span style={{fontWeight:800}}>{s.dur} min</span>
                    <button aria-label="+1 minute" onClick={()=>changeDur(i, (stints[i].dur||1)+1)} style={{...UI.ghostIcon, padding:'2px 8px'}}>+</button>
                  </div>
                </div>
              </div>

              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button aria-label="Options" onClick={()=>toggleMenu(s.idx)} style={{...UI.ghostIcon}}>⋯</button>
              </div>

              {openMenuIdx===s.idx && (
                <div style={{width:'100%', marginTop:8, padding:8, border:'1px dashed rgba(255,255,255,0.15)', borderRadius:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                  <label style={{fontSize:12, opacity:0.8}}>Pilote</label>
                  <select style={{...UI.input, padding:'6px 10px'}} className="text-sm" value={stints[i].driverId} onChange={e=>assignDriver(i, e.target.value)}>
                    {drivers.map(dr => <option key={dr.id} value={dr.id}>{dr.name}</option>)}
                  </select>
                  <div style={{flexGrow:1}} />
                  <div style={{display:'flex', gap:8}}>
                    <button title="Monter" style={UI.ghostIcon} onClick={()=>move(i,-1)}>↑</button>
                    <button title="Descendre" style={UI.ghostIcon} onClick={()=>move(i, 1)}>↓</button>
                    <button title="Supprimer" style={{...UI.ghostIcon, borderColor:'#ef4444', color:'#ef4444'}} onClick={()=>{/* TODO: delete stint */}}>✕</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-3 grid grid-cols-3 gap-2">
          {drivers.map(d => {
            const m = driverTotals[d.id]||0; const h = Math.floor(m/60), mm = m%60;
            return (
              <div key={d.id} className="text-center border" style={UI.row}>
                <div className="text-xs opacity-80">{d.name}</div>
                <div className="text-sm font-semibold">{h}h{pad(mm)}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={UI.panel} className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-300">Sélectionner / éditer la course</div>
          {currentRace && (
            <button className="px-3 py-1.5 rounded-xl border" style={{background:'#ef4444', borderColor:'#ef4444'}} onClick={deleteCurrentRace}>Supprimer la course</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input style={UI.input} value={raceName} onChange={e=>setRaceName(e.target.value)} />
          <select style={UI.input} value={raceType} onChange={e=>setRaceType(e.target.value)}>
            <option value="practice">Entrainement</option>
            <option value="qualifying">Qualification</option>
            <option value="sprint">Sprint</option>
            <option value="race">Course</option>
            <option value="endurance">Endurance</option>
          </select>
          <input style={UI.input} type="date" value={raceDate} onChange={e=>setRaceDate(e.target.value)} />
          <input style={UI.input} type="text" inputMode="numeric" placeholder="HH:mm" value={tmpRaceTime} onChange={e=>onTimeChange(e.target.value, setTmpRaceTime, setRaceTime)} onBlur={()=>{ if (!isValidHHmm(tmpRaceTime)) setTmpRaceTime(raceTime); }} />
          <input style={UI.input} type="text" inputMode="numeric" placeholder="HH:mm" value={tmpRaceEndTime} onChange={e=>onTimeChange(e.target.value, setTmpRaceEndTime, setRaceEndTime)} onBlur={()=>{ if (!isValidHHmm(tmpRaceEndTime)) setTmpRaceEndTime(raceEndTime); }} />
        </div>
      </section>

      <section style={UI.panel} className="mb-3">
        <div className="text-xs uppercase tracking-wide text-slate-300 mb-2">Actions rapides</div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2" style={UI.muted} onClick={balancePerDriver}>Équilibrer par pilote (temps total égal sur la journée)</button>
          <button className="px-4 py-2" style={UI.muted} onClick={()=>setStints(s=>[...s].reverse())}>Inverser l'ordre</button>
        </div>
      </section>

      <section style={UI.panel}>
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-300 mb-2">Pilotes</div>
          <button onClick={()=>{ setAddingDriver(v=>!v); setNewDriverColor(PALETTE[(drivers.length)%PALETTE.length]||PALETTE[0]); }} style={UI.ghostIcon}>+ Pilote</button>
        </div>

        {addingDriver && (
          <div className="mb-3" style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <input style={{...UI.input, height:40, flex:'1 1 140px'}} placeholder="Nom du pilote" value={newDriverName} onChange={e=>setNewDriverName(e.target.value)} />
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              {PALETTE.map(c => (
                <button key={c} title={c} onClick={()=>setNewDriverColor(c)} style={{height:22, width:22, borderRadius:6, backgroundColor:c, boxShadow: `0 0 0 ${newDriverColor===c?3:1}px rgba(255,255,255,${newDriverColor===c?0.9:0.2})`}} />
              ))}
            </div>
            <button onClick={addNewDriver} disabled={!newDriverName.trim()} style={{...UI.chipActive, opacity: newDriverName.trim()?1:0.6}}>Ajouter</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          {(drivers||[]).map((d)=> (
            <div key={d.id} style={UI.row}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={()=>setEditingDriverId(editingDriverId===d.id?null:d.id)} className="h-4 w-4 rounded" style={{backgroundColor:d.color, boxShadow:'0 0 0 1px rgba(255,255,255,0.2)'}} title="Changer couleur" />
                  <RenameDriver d={d} setDrivers={setDrivers} onCommit={(v)=>{ if (hasSupabase) supabase.from('drivers').update({ name: v }).eq('id', d.id); }} />
                </div>
                <button className="px-3 py-2" style={{background:'#ef4444', borderRadius:16}} onClick={async ()=>{ if(!confirm('Supprimer ce pilote ?')) return; if(hasSupabase) await supabase.from('drivers').delete().eq('id', d.id); setDrivers(prev=>prev.filter(x=>x.id!==d.id)); }}>Suppr</button>
              </div>
              {editingDriverId===d.id && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {PALETTE.map(c => (
                    <button key={c} className="h-6 w-6 rounded" style={{backgroundColor:c, boxShadow:'0 0 0 2px rgba(255,255,255,0.1)'}} onClick={()=>setDriverColor(d.id, c)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{...UI.panel, marginTop:12}}>
        <div className="text-xs uppercase tracking-wide text-slate-300">Créer une course</div>
        <input style={{...UI.input, width:'100%', marginTop:8}} placeholder="Nom" value={newRaceName} onChange={e=>setNewRaceName(e.target.value)} />
        <div className="flex gap-2 flex-wrap" style={{marginTop:8}}>
          <select style={{...UI.input, flex:1}} value={newRaceType} onChange={e=>setNewRaceType(e.target.value)}>
            <option value="qualifying">Qualification</option>
            <option value="sprint">Sprint</option>
            <option value="race">Course</option>
            <option value="endurance">Endurance</option>
            <option value="practice">Entrainement</option>
          </select>
          <input type="date" value={newRaceDate} onChange={e=>setNewRaceDate(e.target.value)} style={{...UI.input}} />
          <input type="text" inputMode="numeric" placeholder="HH:mm (début)" value={tmpNewStart}
                 onChange={e=>onTimeChange(e.target.value, setTmpNewStart, setNewRaceStart)}
                 onBlur={()=>{ if (!isValidHHmm(tmpNewStart)) setTmpNewStart(newRaceStart); }}
                 style={{...UI.input, width:'100%', flexBasis:'100%'}} />
          <input type="text" inputMode="numeric" placeholder="HH:mm (fin)" value={tmpNewEnd}
                 onChange={e=>onTimeChange(e.target.value, setTmpNewEnd, setNewRaceEnd)}
                 onBlur={()=>{ if (!isValidHHmm(tmpNewEnd)) setTmpNewEnd(newRaceEnd); }}
                 style={{...UI.input, width:'100%', flexBasis:'100%'}} />
        </div>
        <button className="px-4 py-2" onClick={addNewRace}
                disabled={!newRaceName.trim() || !isValidHHmm(newRaceStart) || !isValidHHmm(newRaceEnd) || !profileId}
                style={{background:'#1f85ff', borderRadius:16, marginTop:8, opacity:(!newRaceName.trim() || !isValidHHmm(newRaceStart) || !isValidHHmm(newRaceEnd) || !profileId)?0.6:1}}>
          + Nouvelle course
        </button>
      </section>
    </div>
  );
}

function RenameDriver({ d, setDrivers, onCommit }){
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(d.name);
  return editing ? (
    <div className="flex items-center gap-2">
      <input style={{...UI.input, height:40, width:140}} value={tmp} onChange={e=>setTmp(e.target.value)}
        onKeyDown={e=>{ if(e.key==='Enter'){ const v=tmp.trim(); if(v){ setDrivers(ds=>ds.map(x=>x.id===d.id?{...x,name:v}:x)); onCommit?.(v); } setEditing(false);} if(e.key==='Escape'){ setEditing(false);} }} />
      <button className="px-3 py-2" style={UI.muted} onClick={()=>{ const v=tmp.trim(); if(v){ setDrivers(ds=>ds.map(x=>x.id===d.id?{...x,name:v}:x)); onCommit?.(v); } setEditing(false); }}>OK</button>
    </div>
  ) : (
    <button className="text-sm font-medium text-left" onClick={()=>setEditing(true)} aria-label="Renommer le pilote">{d.name}</button>
  );
}

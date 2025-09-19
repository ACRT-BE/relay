'use client';
import './globals.css';
import React, { useEffect, useMemo, useState } from "react";

// ---------- UI helpers (inline styles only; no regex; no TS types) ----------
const UI = {
  app: { background: "linear-gradient(180deg,#0b0f1a,#121826)", minHeight: "100vh", color: "#fff" },
  panel: { backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" },
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px", color:'#fff' },
  chipActive: { backgroundColor: "#1066db", border: "1px solid #1066db", color: "#fff", borderRadius: 16, padding: "8px 12px" },
  chipInactive: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 16, padding: "8px 12px" },
  muted: { background: "rgba(255,255,255,0.1)", borderRadius: 16 },
  row: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 8 },
  rowActive: { background: "rgba(239,68,68,0.10)", border: "1px solid #ef4444", borderRadius: 12, padding: 8 },
  ghostIcon: { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color:'#fff', borderRadius: 12, padding: '6px 10px' }
};

function pad(n){ return String(n).padStart(2,'0'); }
function parseHM(dateStr, hm){
  const parts = String(hm||'').split(":");
  const h = Number(parts[0]||0); const m = Number(parts[1]||0);
  const d = new Date(dateStr+"T00:00:00");
  d.setHours(h||0, m||0, 0, 0);
  return d;
}
function addMin(d, min){ const x = new Date(d); x.setMinutes(x.getMinutes()+min); return x; }
function fmtHM(d){ return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function minutesBetween(a,b){ return Math.max(0, Math.round((b.getTime()-a.getTime())/60000)); }
const PALETTE = ['#ef4444','#f59e0b','#eab308','#10b981','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316'];

// ===== Time validation (no RegExp) =====
function isDigit(ch){ return ch >= '0' && ch <= '9'; }
function isValidHHmm(s){
  if (s.length !== 5) return false;
  if (s[2] !== ':') return false;
  const hh = Number(s.slice(0,2));
  const mm = Number(s.slice(3,5));
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false;
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}
function allowPartialHHmm(s){
  if (s === '') return true;
  if (s.length > 5) return false;
  for (let i=0;i<s.length;i++){ const ch=s[i]; if (!isDigit(ch) && ch !== ':') return false; }
  if (s.length >= 3 && s[2] !== ':') return false;
  const h1 = s[0]; const h2 = s[1];
  if (h1 && !(h1 >= '0' && h1 <= '2')) return false;
  if (h2 && !(h2 >= '0' && h2 <= (h1==='2' ? '3' : '9'))) return false;
  const m1 = s.length >= 4 ? s[3] : '';
  const m2 = s.length === 5 ? s[4] : '';
  if (m1 && !(m1 >= '0' && m1 <= '5')) return false;
  if (m2 && !(m2 >= '0' && m2 <= '9')) return false;
  if (s.length === 5) return isValidHHmm(s);
  return true;
}

// ---- Runtime tests (keep tiny; no external libs) ----
if (typeof window !== 'undefined') {
  try {
    const tests = [
      // Valid full HH:mm
      ['00:00', true], ['09:59', true], ['23:59', true],
      // Invalid full HH:mm
      ['24:00', false], ['16:60', false], ['7:5', false], ['1630', false], ['', false],
      // Partial typing acceptance
      ['1', true], ['12', true], ['12:', true], ['12:3', true], ['12:34', true],
      // Bad characters
      ['2a:30', false], ['12:a0', false],
      // Edge new tests
      ['-1:00', false], ['23:5x', false], ['03:07', true], ['2:', false]
    ];
    console.groupCollapsed('HH:mm validation tests');
    tests.forEach(([s, exp]) => {
      const str = String(s);
      const val = (str.length===5 ? isValidHHmm(str) : allowPartialHHmm(str));
      const ok = val === exp;
      console[ok ? 'log' : 'error'](`${s} -> ${val} expected ${exp}`);
    });
    console.groupEnd();
  } catch {}
}

// ===== Demo data for multi-team profiles =====
function makeTeamA(){
  return {
    id: 'teamA', name: 'Équipe A',
    races: [
      { id:'A1', name:'Qualification', type:'qualifying', date:'2025-09-19', start:'11:00', end:'11:20' },
      { id:'A2', name:'Sprint',        type:'sprint',     date:'2025-09-19', start:'12:00', end:'12:15' },
      { id:'A3', name:'Course 1',      type:'race',       date:'2025-09-19', start:'13:05', end:'14:00' },
    ],
    currentRaceId: 'A3',
    drivers: [ {id:'a1', name:'Alice', color:'#49abff'}, {id:'a2', name:'Bob', color:'#f59e0b'}, {id:'a3', name:'Claire', color:'#22c55e'} ],
    stints: [ {id:'sa1', driverId:'a1', dur:10}, {id:'sa2', driverId:'a2', dur:12}, {id:'sa3', driverId:'a3', dur:15}, {id:'sa4', driverId:'a1', dur:8} ],
  };
}
function makeTeamB(){
  return {
    id: 'teamB', name: 'Équipe B',
    races: [
      { id:'B1', name:'Libre',   type:'practice',  date:'2025-09-19', start:'10:00', end:'10:30' },
      { id:'B2', name:'Course',  type:'race',      date:'2025-09-19', start:'15:00', end:'16:00' },
    ],
    currentRaceId: 'B2',
    drivers: [ {id:'b1', name:'Diego', color:'#3b82f6'}, {id:'b2', name:'Emma', color:'#ec4899'} ],
    stints: [ {id:'sb1', driverId:'b1', dur:20}, {id:'sb2', driverId:'b2', dur:20}, {id:'sb3', driverId:'b1', dur:20} ],
  };
}

export default function Preview(){
  // ---- Profiles (teams) ----
  const [profiles, setProfiles] = useState([ makeTeamA(), makeTeamB() ]);
  const [profileId, setProfileId] = useState('teamA');
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [tmpTeamName, setTmpTeamName] = useState('');

  const profile = useMemo(() => profiles.find(p=>p.id===profileId) || profiles[0], [profiles, profileId]);

  function startEditTeam(id, name){ setEditingTeamId(id); setTmpTeamName(name); }
  function commitEditTeam(){
    const v = (tmpTeamName||'').trim();
    if (v) setProfiles(prev=>prev.map(p=>p.id===editingTeamId?{...p,name:v}:p));
    setEditingTeamId(null); setTmpTeamName('');
  }
  function addTeam(){
    const id = 'team' + Math.random().toString(36).slice(2,8);
    const name = 'Nouvelle équipe';
    const newTeam = { id, name, races: [], currentRaceId: '', drivers: [], stints: [] };
    setProfiles(prev=>[...prev, newTeam]);
    setProfileId(id);
    setEditingTeamId(id);
    setTmpTeamName(name);
  }
  function deleteTeam(id){
    if (profiles.length <= 1) { alert('Impossible de supprimer la dernière équipe.'); return; }
    if (!confirm('Supprimer définitivement cette équipe ?')) return;
    const next = profiles.filter(p=>p.id!==id);
    setProfiles(next);
    if (editingTeamId===id){ setEditingTeamId(null); setTmpTeamName(''); }
    if (profileId===id){ setProfileId(next[0]?.id || ''); }
  }

  // ---- Derive core states from current profile ----
  const sortedRaces = useMemo(() => {
    const arr = (profile?.races || []).slice();
    arr.sort((a,b)=>parseHM(a.date,a.start).getTime()-parseHM(b.date,b.start).getTime());
    return arr;
  }, [profile]);
  const [currentRaceId, setCurrentRaceId] = useState(profile?.currentRaceId || (sortedRaces[0]?.id || ''));

  useEffect(()=>{ setCurrentRaceId(profile?.currentRaceId || (sortedRaces[0]?.id || '')); }, [profileId, profile, sortedRaces]);

  const currentRace = useMemo(()=> sortedRaces.find(r=>r.id===currentRaceId) || sortedRaces[0] || null, [sortedRaces, currentRaceId]);

  const [raceName, setRaceName] = useState(currentRace ? currentRace.name : '');
  const [raceType, setRaceType] = useState(currentRace ? currentRace.type : 'race');
  const [raceDate, setRaceDate] = useState(currentRace ? currentRace.date : '2025-09-19');
  const [raceTime, setRaceTime] = useState(currentRace ? currentRace.start : '13:05');
  const [tmpRaceTime, setTmpRaceTime] = useState(raceTime);
  const [raceEndTime, setRaceEndTime] = useState(currentRace ? currentRace.end : '14:00');
  const [tmpRaceEndTime, setTmpRaceEndTime] = useState(raceEndTime);

  // ---- New race (Créer une course) controlled inputs ----
  const [newRaceName, setNewRaceName] = useState('Course 2');
  const [newRaceType, setNewRaceType] = useState('race'); // practice | qualifying | sprint | race | endurance
  const [newRaceDate, setNewRaceDate] = useState('2025-09-20');
  const [newRaceStart, setNewRaceStart] = useState('14:00');
  const [tmpNewStart, setTmpNewStart] = useState('14:00');
  const [newRaceEnd, setNewRaceEnd] = useState('16:00');
  const [tmpNewEnd, setTmpNewEnd] = useState('16:00');

  // drivers color palette toggle state
  const [editingDriverId, setEditingDriverId] = useState(null);

  // add driver UI state
  const [addingDriver, setAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverColor, setNewDriverColor] = useState(PALETTE[0]);

  // contextual menu per stint (hide arrows/delete/etc.)
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const toggleMenu = (idx)=> setOpenMenuIdx(openMenuIdx===idx?null:idx);

  const nudgeDur = (i, delta)=>{
    const next = Math.max(1, (stints[i]?.dur||0) + delta);
    changeDur(i, next);
  };

  // whenever we switch race selection, refresh editing fields
  useEffect(()=>{
    if (!currentRace) {
      setRaceName(''); setRaceType('race'); setRaceDate(new Date().toISOString().slice(0,10));
      setRaceTime(''); setTmpRaceTime(''); setRaceEndTime(''); setTmpRaceEndTime('');
      return;
    }
    setRaceName(currentRace.name); setRaceType(currentRace.type); setRaceDate(currentRace.date);
    setRaceTime(currentRace.start); setTmpRaceTime(currentRace.start);
    setRaceEndTime(currentRace.end); setTmpRaceEndTime(currentRace.end);
  }, [currentRaceId, profileId, currentRace]);

  // drivers & stints for profile
  const [drivers, setDrivers] = useState(profile?.drivers || []);
  const [stints, setStints] = useState(profile?.stints || []);

  useEffect(()=>{ 
    setDrivers(profile?.drivers || []); 
    setStints(profile?.stints || []);
    // reset add-driver default color when switching team
    setNewDriverColor(PALETTE[(profile?.drivers?.length||0)%PALETTE.length]||PALETTE[0]);
  }, [profileId, profile]);

  // persist edits back to profiles
  function upsertProfile(next){ setProfiles(prev => prev.map(p => p.id===profileId ? { ...p, ...next } : p)); }
  useEffect(()=>{ if(profile) upsertProfile({ drivers }); }, [drivers]);
  useEffect(()=>{ if(profile) upsertProfile({ stints }); }, [stints]);
  useEffect(()=>{ if(profile) upsertProfile({ currentRaceId }); }, [currentRaceId]);
  useEffect(()=>{ if(profile && currentRace){
    const races = (profile.races||[]).map(r => r.id===currentRace.id ? { ...r, name: raceName, type: raceType, date: raceDate, start: raceTime, end: raceEndTime } : r);
    upsertProfile({ races });
  }}, [raceName, raceType, raceDate, raceTime, raceEndTime]);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()), 30000); return ()=>clearInterval(t); },[]);

  // Computed timeline for current race
  const computedState = useMemo(()=>{
    if (!currentRace) return { items: [], totalMinutes: 0 };
    const start = parseHM(raceDate, raceTime);
    const end   = parseHM(raceDate, raceEndTime);
    const items = [];
    let cursor = start;
    for (let i=0;i<stints.length;i++){
      const s = stints[i];
      if (cursor >= end) break;
      const d = drivers.find(x=>x.id===s.driverId) || {id:'-', name:'Non assigné', color:'#888'};
      const sStart = new Date(cursor);
      const sEndTarget = addMin(sStart, s.dur);
      const sEnd = sEndTarget > end ? end : sEndTarget;
      const shown = Math.max(0, minutesBetween(sStart, sEnd));
      items.push({ idx: items.length+1, startD: sStart, endD: sEnd, start: fmtHM(sStart), end: fmtHM(sEnd), dur: shown, driver: d });
      cursor = sEndTarget;
    }
    return { items, totalMinutes: minutesBetween(start, end) };
  }, [raceDate, raceTime, raceEndTime, stints, drivers, currentRace]);

  const driverTotals = useMemo(()=>{
    const map = {};
    computedState.items.forEach(it => { map[it.driver.id] = (map[it.driver.id]||0) + it.dur; });
    return map; // id -> minutes
  }, [computedState]);

  function move(i, dir){ const j=i+dir; if(j<0||j>=stints.length) return; const copy=[...stints]; [copy[i],copy[j]]=[copy[j],copy[i]]; setStints(copy); }
  function changeDur(i, v){ if(!Number.isFinite(v)||v<1) return; const copy=[...stints]; copy[i]={...copy[i], dur:v}; setStints(copy); }
  function assignDriver(i, id){ const copy=[...stints]; copy[i]={...copy[i], driverId:id}; setStints(copy); }
  function setDriverColor(id, color){ setDrivers(ds=>ds.map(d=>d.id===id?{...d,color}:d)); setEditingDriverId(null); }

  // delete a stint i (bug fix: ensure function closes properly)
  function deleteStint(i){
    setStints(prev => prev.filter((_, idx) => idx !== i));
    setOpenMenuIdx(null);
  }

  function addNewDriver(){
    const name = (newDriverName||'').trim(); if(!name) return;
    const id = 'd' + Math.random().toString(36).slice(2,8);
    const color = newDriverColor || PALETTE[0];
    setDrivers(prev=>[...prev, { id, name, color }]);
    setAddingDriver(false);
    setNewDriverName('');
    setNewDriverColor(PALETTE[((drivers?.length||0)+1)%PALETTE.length]||PALETTE[0]);
  }

  // balance per driver across the whole day
  function balancePerDriver(){
    if (stints.length === 0) return;
    const driverIds = Array.from(new Set(stints.map(s=>s.driverId)));
    const perDriverTarget = Math.max(1, Math.round(computedState.totalMinutes / Math.max(1, driverIds.length)));
    const idxsByDriver = {};
    stints.forEach((s,idx)=>{ (idxsByDriver[s.driverId]||(idxsByDriver[s.driverId]=[])).push(idx); });
    const next=[...stints];
    driverIds.forEach(id=>{
      const idxs = idxsByDriver[id]||[]; if (idxs.length===0) return;
      const base = Math.max(1, Math.floor(perDriverTarget/idxs.length));
      const delta = perDriverTarget - base*idxs.length;
      idxs.forEach((i,k)=>{ let dur=base; if(k===idxs.length-1) dur=Math.max(1, base+delta); next[i]={...next[i], dur}; });
    });
    setStints(next);
  }

  function onTimeChange(value, setTmp, setFinal){
    if (!allowPartialHHmm(value)) return; // reject invalid keystrokes
    setTmp(value);
    if (value.length===5 && isValidHHmm(value)) setFinal(value);
  }

  function deleteCurrentRace(){
    if (!currentRace) return;
    const races = (profile.races||[]).filter(r=>r.id!==currentRace.id);
    const nextCR = races slice().sort((a,b)=>parseHM(a.date,a.start)-parseHM(b.date,b.start))[0];
    upsertProfile({ races, currentRaceId: nextCR?nextCR.id:'' });
    setCurrentRaceId(nextCR?nextCR.id:'');
  }

  // Create a new race and select it
  function addNewRace(){
    const name = (newRaceName||'').trim();
    if (!name) return;
    if (!isValidHHmm(newRaceStart) || !isValidHHmm(newRaceEnd)) return;
    const id = 'N' + Math.random().toString(36).slice(2,8);
    const newRace = { id, name, type:newRaceType, date:newRaceDate, start:newRaceStart, end:newRaceEnd };
    const races = [ ...(profile.races||[]), newRace ];
    upsertProfile({ races, currentRaceId: id });
    setCurrentRaceId(id);
  }

  // ---- Team switch helpers ----
  function switchTeam(id){ setProfileId(id); }

  function scrollToCreate(){
    const el = typeof document !== 'undefined' ? document.getElementById('create-race') : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Ajout d'un relais à la fin de la liste pour la course courante
  function addStint(){
    if (!currentRace) return;
    if (drivers.length === 0) { alert("Ajoutez d'abord un pilote"); return; }
    const driverId = drivers[0]?.id || '';
    const newStint = { id: 's' + Math.random().toString(36).slice(2,8), driverId, dur: 10 };
    setStints(prev => [...prev, newStint]);
  }

  return (
    <div style={UI.app} className="mx-auto max-w-sm p-3">
      <header className="mb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏁 Kart Relay</h1>
          <span className="text-xs opacity-70">Aperçu</span>
        </div>
        {/* ... content omitted for brevity in this file ... */}
      </header>
    </div>
  );
}

function RenameDriver({ d, setDrivers }){
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(d.name);
  return editing ? (
    <div className="flex items-center gap-2">
      <input style={{...UI.input, height:40, width:140}} value={tmp} onChange={e=>setTmp(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ const v=tmp.trim(); if(v) setDrivers(ds=>ds.map(x=>x.id===d.id?{...x,name:v}:x)); setEditing(false);} if(e.key==='Escape'){ setEditing(false);} }} />
      <button className="px-3 py-2" style={UI.muted} onClick={()=>{ const v=tmp.trim(); if(v) setDrivers(ds=>ds.map(x=>x.id===d.id?{...x,name:v}:x)); setEditing(false); }}>OK</button>
    </div>
  ) : (
    <button className="text-sm font-medium text-left" onClick={()=>setEditing(true)} aria-label="Renommer le pilote">{d.name}</button>
  );
}
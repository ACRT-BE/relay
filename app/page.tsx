'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Race } from '@/lib/types';
import ScheduleEditor from '@/components/ScheduleEditor';
import dayjs from 'dayjs';

export default function Home() {
  const [races, setRaces] = useState<Race[]>([]);
  const [currentRaceId, setCurrentRaceId] = useState<string | null>(null);
  const [name, setName] = useState('Course 1');
  const [type, setType] = useState('race');
  const [start, setStart] = useState(dayjs().minute(0).second(0).add(10, 'minute').format('YYYY-MM-DDTHH:mm'));

  const loadRaces = async () => {
    const { data } = await supabase.from('races').select('*').order('created_at', { ascending: false });
    setRaces(data || []);
    if (!currentRaceId && data && data[0]) setCurrentRaceId(data[0].id);
  };

  useEffect(() => {
    loadRaces();
    const ch = supabase.channel('races-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'races' }, loadRaces).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const createRace = async () => {
    const { data } = await supabase.from('races').insert({ name, type, start_time: new Date(start).toISOString() }).select().single();
    if (data) {
      setRaces([data, ...races]);
      setCurrentRaceId(data.id);
    }
  };

  const updateRace = async (field: 'name'|'type'|'start_time', value: string) => {
    if (!currentRaceId) return;
    await supabase.from('races').update({ [field]: value }).eq('id', currentRaceId);
    await loadRaces();
  };

  const currentRace = races.find(r => r.id === currentRaceId) || null;

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏁 Kart Relay</h1>
      </header>

      <section className="card space-y-3">
        <div className="label">Créer une course</div>
        <div className="flex flex-col gap-2">
          <input className="input" placeholder="Nom" value={name} onChange={(e)=>setName(e.target.value)} />
          <div className="flex gap-2">
            <select className="input flex-1" value={type} onChange={(e)=>setType(e.target.value)}>
              <option value="practice">Entrainement</option>
              <option value="qualifying">Qualification</option>
              <option value="sprint">Sprint</option>
              <option value="race">Course</option>
              <option value="endurance">Endurance</option>
            </select>
            <input className="input" type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)} />
          </div>
          <button className="btn bg-brand-500" onClick={createRace}>+ Nouvelle course</button>
        </div>
      </section>

      <section className="card space-y-2">
        <div className="label">Sélectionner / éditer la course</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {races.map(r => (
            <button key={r.id} onClick={()=>setCurrentRaceId(r.id)}
              className={"btn whitespace-nowrap " + (currentRaceId===r.id ? "bg-brand-600" : "bg-white/10")}>
              {r.name}
            </button>
          ))}
        </div>
        {currentRace && (
          <div className="grid grid-cols-2 gap-2">
            <input className="input" value={currentRace.name} onChange={(e)=>updateRace('name', e.target.value)} />
            <select className="input" value={currentRace.type} onChange={(e)=>updateRace('type', e.target.value)}>
              <option value="practice">Entrainement</option>
              <option value="qualifying">Qualification</option>
              <option value="sprint">Sprint</option>
              <option value="race">Course</option>
              <option value="endurance">Endurance</option>
            </select>
            <input className="input col-span-2" type="datetime-local"
              value={currentRace.start_time ? new Date(currentRace.start_time).toISOString().slice(0,16) : ''}
              onChange={(e)=>updateRace('start_time', new Date(e.target.value).toISOString())} />
          </div>
        )}
      </section>

      <ScheduleEditor race={currentRace} />
    </main>
  );
}

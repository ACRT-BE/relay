'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Driver, Race, Stint } from '@/lib/types';
import { addMinutes, formatHM } from '@/lib/time';
import clsx from 'clsx';

type Props = { race: Race | null };

export default function ScheduleEditor({ race }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      const { data: dDrivers } = await supabase.from('drivers').select('*').order('created_at', { ascending: true });
      setDrivers(dDrivers ?? []);
      if (race?.id) {
        const { data: dStints } = await supabase.from('stints').select('*').eq('race_id', race.id).order('order_index');
        setStints((dStints as Stint[]) ?? []);
      } else {
        setStints([]);
      }
    };
    loadAll();
  }, [race?.id]);

  // Realtime subscriptions
  useEffect(() => {
    const chDrivers = supabase
      .channel('drivers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, async () => {
        const { data } = await supabase.from('drivers').select('*').order('created_at', { ascending: true });
        setDrivers(data ?? []);
      })
      .subscribe();

    const chStints = supabase
      .channel('stints-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stints' }, async () => {
        if (!race?.id) return;
        const { data } = await supabase.from('stints').select('*').eq('race_id', race.id).order('order_index');
        setStints((data as Stint[]) ?? []);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chDrivers);
      supabase.removeChannel(chStints);
    };
  }, [race?.id]);

  const computed: Stint[] = useMemo(() => {
    if (!race?.start_time) return stints;
    let cursor = race.start_time;
    return stints.map((s) => {
      const withStart: Stint = { ...s, start_time: cursor };
      cursor = addMinutes(cursor, s.duration_minutes);
      return withStart;
    });
  }, [stints, race?.start_time]);

  // Actions
  const addStint = async () => {
    if (!race?.id) return;
    const order_index = stints.length;
    const { data, error } = await supabase
      .from('stints')
      .insert({ race_id: race.id, driver_id: null, order_index, duration_minutes: 10 })
      .select()
      .single();
    if (!error && data) {
      setStints((prev) => [...prev, data as Stint]);
    }
  };

  const moveStint = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= stints.length) return;
    const copy = [...stints];
    const tmp = copy[idx];
    copy[idx] = copy[j];
    copy[j] = tmp;
    const reindexed = copy.map((s, i) => ({ ...s, order_index: i }));
    setStints(reindexed);
    await supabase.from('stints').upsert(reindexed.map((s) => ({ id: s.id, order_index: s.order_index })));
  };

  const assignDriver = async (stintId: string, driverId: string | null) => {
    setStints((prev) => prev.map((s) => (s.id === stintId ? { ...s, driver_id: driverId } : s)));
    await supabase.from('stints').update({ driver_id: driverId }).eq('id', stintId);
  };

  const changeDuration = async (stintId: string, minutes: number) => {
    if (minutes < 1) return;
    setStints((prev) => prev.map((s) => (s.id === stintId ? { ...s, duration_minutes: minutes } : s)));
    await supabase.from('stints').update({ duration_minutes: minutes }).eq('id', stintId);
  };

  const removeStint = async (stintId: string) => {
    await supabase.from('stints').delete().eq('id', stintId);
    const filtered = stints.filter((s) => s.id !== stintId);
    const reindexed = filtered.map((s, i) => ({ ...s, order_index: i }));
    setStints(reindexed);
    await supabase.from('stints').upsert(reindexed.map((s) => ({ id: s.id, order_index: s.order_index })));
  };

  const swapDrivers = async (aIndex: number, bIndex: number) => {
    const a = aIndex;
    const b = bIndex;
    if (a < 0 || b < 0 || a >= stints.length || b >= stints.length) return;
    const sA = stints[a];
    const sB = stints[b];
    const copy = [...stints];
    copy[a] = { ...sA, driver_id: sB.driver_id };
    copy[b] = { ...sB, driver_id: sA.driver_id };
    setStints(copy);
    await supabase
      .from('stints')
      .upsert([
        { id: sA.id, driver_id: copy[a].driver_id },
        { id: sB.id, driver_id: copy[b].driver_id },
      ]);
  };

  if (!race) {
    return (
      <div className="card">
        <p className="text-sm text-slate-300">Créez une course ci-dessous pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card flex items-center justify-between">
        <div>
          <div className="label">Course</div>
          <div className="font-semibold">{race.name}</div>
          <div className="text-sm text-slate-400">
            {race.type} • départ {formatHM(race.start_time)}
          </div>
        </div>
        <button onClick={addStint} className="btn bg-brand-500">
          + Relais
        </button>
      </div>

      <div className="card space-y-3">
        {computed.length === 0 && (
          <div className="text-sm text-slate-400">Aucun relais pour l’instant.</div>
        )}
        {computed.map((s, i) => {
          const d = drivers.find((dr) => dr.id === s.driver_id) || null;
          return (
            <div key={s.id} className="flex items-center gap-2 bg-white/5 rounded-xl p-2">
              <div className="w-10 text-center text-xs opacity-70">#{i + 1}</div>
              <div
                className={clsx('h-8 w-1 rounded')}
                style={{ backgroundColor: d?.color || 'transparent' }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {d ? d.name : <span className="text-slate-400">Non assigné</span>}
                </div>
                <div className="text-xs text-slate-400">
                  {formatHM(s.start_time)} • {s.duration_minutes} min
                </div>
              </div>
              <select
                className="input text-sm"
                value={s.driver_id ?? ''}
                onChange={(e) => assignDriver(s.id, e.target.value || null)}
              >
                <option value="">— Pilote —</option>
                {drivers.map((dr) => (
                  <option key={dr.id} value={dr.id}>
                    {dr.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input w-20 text-sm"
                value={s.duration_minutes}
                min={1}
                onChange={(e) => changeDuration(s.id, parseInt(e.target.value || '0', 10))}
              />
              <div className="flex flex-col gap-1">
                <button className="btn bg-white/10" onClick={() => moveStint(i, -1)}>
                  ↑
                </button>
                <button className="btn bg-white/10" onClick={() => moveStint(i, 1)}>
                  ↓
                </button>
              </div>
              <button className="btn bg-red-600" onClick={() => removeStint(s.id)}>✕</button>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="label mb-2">Permuter deux pilotes (positions)</div>
        <SwapWidget maxIndex={stints.length} onSwap={(a, b) => swapDrivers(a - 1, b - 1)} />
      </div>

      <div className="card">
        <div className="label mb-2">Pilotes</div>
        <DriverManager drivers={drivers} onChange={setDrivers} />
      </div>
    </div>
  );
}

function SwapWidget({ maxIndex, onSwap }: { maxIndex: number; onSwap: (a: number, b: number) => void }) {
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(2);
  return (
    <div className="flex items-center gap-2">
      <input
        className="input w-16"
        type="number"
        min={1}
        max={maxIndex}
        value={a}
        onChange={(e) => setA(parseInt(e.target.value || '1', 10))}
      />
      <span className="opacity-70">↔</span>
      <input
        className="input w-16"
        type="number"
        min={1}
        max={maxIndex}
        value={b}
        onChange={(e) => setB(parseInt(e.target.value || '2', 10))}
      />
      <button className="btn bg-white/10" onClick={() => onSwap(a, b)}>
        Permuter
      </button>
    </div>
  );
}

function DriverManager({ drivers, onChange }: { drivers: Driver[]; onChange: (d: Driver[]) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#49abff');

  const create = async () => {
    if (!name.trim()) return;
    const { data } = await supabase.from('drivers').insert({ name: name.trim(), color }).select().single();
    if (data) onChange([...(drivers || []), data as Driver]);
    setName('');
  };

  const remove = async (id: string) => {
    await supabase.from('drivers').delete().eq('id', id);
    onChange(drivers.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          className="input flex-1"
          placeholder="Nom du pilote"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="color"
          className="h-10 w-14 rounded-xl border border-white/20"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button className="btn bg-brand-500" onClick={create}>
          + Pilote
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {drivers.map((d) => (
          <div key={d.id} className="rounded-xl bg-white/5 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: d.color || '#49abff' }} />
              <div className="text-sm">{d.name}</div>
            </div>
            <button className="btn bg-red-600" onClick={() => remove(d.id)}>
              Suppr
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

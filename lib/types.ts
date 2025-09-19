export type Driver = {
  id: string;
  name: string;
  color: string | null;
  created_at?: string;
};

export type Race = {
  id: string;
  name: string;
  type: 'practice' | 'qualifying' | 'sprint' | 'race' | 'endurance' | string;
  start_time: string | null; // ISO
  notes: string | null;
  created_at?: string;
};

export type Stint = {
  id: string;
  race_id: string;
  driver_id: string | null;
  order_index: number;
  duration_minutes: number;
  start_time: string | null; // calculated client-side for display
  created_at?: string;
};

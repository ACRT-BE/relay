import dayjs from 'dayjs';

export function addMinutes(iso: string, minutes: number): string {
  return dayjs(iso).add(minutes, 'minute').toISOString();
}

export function formatHM(iso: string | null): string {
  if (!iso) return '--:--';
  return dayjs(iso).format('HH:mm');
}

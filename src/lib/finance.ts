/** All dates are UTC calendar days. Rates are percentages, not fractions. */
export const MAX_DATE = '2026-12-31';
export const DAY = 86_400_000;
export const MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];
export const LONG_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
export type Method = 'simple' | 'compound';
export interface Deposit {
  id: string;
  date: string;
  amount: number;
}
export interface Rate {
  from: string;
  to: string;
  ea: number;
  daily: number;
}
export interface Point {
  date: string;
  principal: number;
  interest: number;
  dailyInterest: number;
  balance: number;
  rate: number;
}
export interface Position extends Deposit {
  days: number;
  interest: number;
  balance: number;
  history: Point[];
}
export interface Calculation {
  cutoff: string;
  method: Method;
  positions: Position[];
  active: Position[];
  points: Point[];
  principal: number;
  interest: number;
  balance: number;
  yieldPct: number;
}
export function validISO(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export const epoch = (iso: string) => Date.parse(iso + 'T00:00:00Z');
export const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);
export function parseDate(value: string): string {
  const v = value.trim().toLowerCase();
  if (validISO(v)) return v;
  const match = v.match(/^(?:(\d{1,2})-)?([a-z]{3})-(\d{2}|\d{4})$/);
  if (match) {
    const month = MONTHS.findIndex((m) => m.toLowerCase() === match[2]) + 1;
    const iso = `${match[3].length === 2 ? '20' : ''}${match[3]}-${String(month).padStart(2, '0')}-${(match[1] || '1').padStart(2, '0')}`;
    if (validISO(iso)) return iso;
  }
  throw new Error(`Fecha no válida: ${value}`);
}
export function parseNumber(value: string): number {
  const s = value.replace(/[\s$%]/g, '');
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(s)) throw new Error(`Número no válido: ${value}`);
  const n = Number(s.replaceAll('.', '').replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error(`Número fuera de rango: ${value}`);
  return n;
}
function csvRows(csv: string) {
  return csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.split(';').map((c) => c.trim()))
    .filter((cells) => cells.some(Boolean));
}
export function parseDeposits(csv: string): Deposit[] {
  return csvRows(csv).map(([date, amount], i) => {
    const a = parseNumber(amount || '');
    if (a <= 0) throw new Error('El capital debe ser positivo.');
    return { id: `Giro ${String(i + 1).padStart(3, '0')}`, date: parseDate(date), amount: a };
  });
}
export function parseRates(csv: string): Rate[] {
  return csvRows(csv)
    .map(([from, to, ea, daily]) => ({
      from: parseDate(from),
      to: parseDate(to),
      ea: parseNumber(ea),
      daily: parseNumber(daily),
    }))
    .sort((a, b) => a.from.localeCompare(b.from));
}
export const rateOn = (rates: Rate[], date: string) => rates.find((r) => r.from <= date && r.to >= date);
export function calculate(
  deposits: Deposit[],
  rates: Rate[],
  cutoff: string,
  method: Method = 'simple',
): Calculation {
  if (!validISO(cutoff) || cutoff > MAX_DATE)
    throw new Error('La fecha de salida no puede superar el 31 de diciembre de 2026.');
  const positions: Position[] = [...deposits]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((d) => ({ ...d, days: 0, interest: 0, balance: 0, history: [] }));
  const points: Point[] = [];
  const start = positions[0]?.date;
  if (start)
    for (let t = epoch(start); t <= epoch(cutoff); t += DAY) {
      const date = isoDay(t);
      const rate = rateOn(rates, date);
      if (!rate) throw new Error(`No hay una tasa diaria para el ${date}.`);
      let principal = 0,
        interest = 0,
        dailyInterest = 0;
      for (const p of positions) {
        if (p.date > date) continue;
        const gain = (p.amount + (method === 'compound' ? p.interest : 0)) * (rate.daily / 100);
        p.days++;
        p.interest += gain;
        p.balance = p.amount + p.interest;
        p.history.push({
          date,
          principal: p.amount,
          interest: p.interest,
          dailyInterest: gain,
          balance: p.balance,
          rate: rate.daily,
        });
        principal += p.amount;
        interest += p.interest;
        dailyInterest += gain;
      }
      points.push({
        date,
        principal,
        interest,
        dailyInterest,
        balance: principal + interest,
        rate: rate.daily,
      });
    }
  const active = positions.filter((p) => p.days > 0);
  const principal = active.reduce((s, p) => s + p.amount, 0);
  const interest = active.reduce((s, p) => s + p.interest, 0);
  return {
    cutoff,
    method,
    positions,
    active,
    points,
    principal,
    interest,
    balance: principal + interest,
    yieldPct: principal ? (interest / principal) * 100 : 0,
  };
}
export function nextUncoveredDay(rates: Rate[], from: string, to: string): string | null {
  let cursor = from;
  for (const r of [...rates].sort((a, b) => a.from.localeCompare(b.from))) {
    if (r.to < cursor) continue;
    if (r.from > cursor) return cursor;
    cursor = isoDay(epoch(r.to) + DAY);
    if (cursor > to) return null;
  }
  return cursor <= to ? cursor : null;
}

import { MONTHS, type Calculation, type Point, type Position } from './finance';
const numberFormat = new Map<string, Intl.NumberFormat>();
export function num(n: number, digits = 0, min = digits) {
  const key = `${digits}-${min}`;
  if (!numberFormat.has(key))
    numberFormat.set(
      key,
      new Intl.NumberFormat('es-CO', { minimumFractionDigits: min, maximumFractionDigits: digits }),
    );
  return numberFormat.get(key)!.format(n);
}
export const money = (n: number, decimals = 0) => `$ ${num(n, decimals)}`;
export const pct = (n: number, digits = 2) => `${num(n, digits)} %`;
export function dateLabel(iso: string, short = false) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1].toLowerCase()}${short ? '' : ' ' + y}`;
}
export function compact(n: number) {
  return n >= 1e6
    ? `${num(n / 1e6, n >= 1e8 ? 0 : 1, 0)} M`
    : n >= 1e3
      ? `${num(n / 1e3, 0)} mil`
      : num(n);
}
export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8;') {
  const href = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1500);
}
const csvN = (n: number, digits = 2) => n.toFixed(digits).replace('.', ',');
export function exportSummary(c: Calculation) {
  const rows: (string | number)[][] = [
    [
      'Consignación',
      'Fecha inicial',
      'Fecha de salida',
      'Capital (COP)',
      'Días',
      'Intereses (COP)',
      'Saldo final (COP)',
      'Método',
    ],
  ];
  const m = c.method === 'simple' ? 'Simple' : 'Compuesto';
  for (const p of c.active)
    rows.push([p.id, p.date, c.cutoff, csvN(p.amount), p.days, csvN(p.interest), csvN(p.balance), m]);
  rows.push(['TOTAL', '', c.cutoff, csvN(c.principal), '', csvN(c.interest), csvN(c.balance), m]);
  downloadFile(`Rendia-resumen-${c.cutoff}.csv`, '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n'));
}
export function exportDaily(c: Calculation, position?: Position) {
  const rows = [
    [
      'Consignación',
      'Fecha',
      'Fecha de salida',
      'Capital (COP)',
      'Tasa diaria (%)',
      'Interés del día (COP)',
      'Interés acumulado (COP)',
      'Saldo (COP)',
      'Método',
    ],
  ];
  const add = (id: string, p: Point) =>
    rows.push([
      id,
      p.date,
      c.cutoff,
      csvN(p.principal),
      csvN(p.rate, 9),
      csvN(p.dailyInterest),
      csvN(p.interest),
      csvN(p.balance),
      c.method === 'simple' ? 'Simple' : 'Compuesto',
    ]);
  if (position) position.history.forEach((p) => add(position.id, p));
  else for (const d of c.active) d.history.forEach((p) => add(d.id, p));
  downloadFile(
    `Rendia-diario-${position ? position.id.replace(' ', '-') + '-' : ''}${c.cutoff}.csv`,
    '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n'),
  );
}

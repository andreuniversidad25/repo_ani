import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseDeposits,
  parseRates,
  parseDate,
  parseNumber,
  calculate,
  nextUncoveredDay,
  MAX_DATE,
} from '../src/lib/finance.ts';
const deposits = parseDeposits(readFileSync(new URL('../src/data/Giros.csv', import.meta.url), 'utf8'));
const rates = parseRates(readFileSync(new URL('../src/data/Tasas.csv', import.meta.url), 'utf8'));
const round = (n) => Number(n.toFixed(2));
test('CSV original: fechas mensuales, formato colombiano y filas en blanco', () => {
  assert.equal(deposits.length, 10);
  assert.equal(rates.length, 27);
  assert.deepEqual(deposits[0], { id: 'Giro 001', date: '2026-01-01', amount: 2889269154.69 });
  assert.equal(parseNumber('12.345.678,90'), 12345678.9);
  assert.equal(parseDate('9-feb-26'), '2026-02-09');
  assert.throws(() => parseDate('31-feb-26'));
  assert.throws(() => parseNumber('4,0,0'));
});
test('Un día incluye el día de ingreso y excluye el capital futuro', () => {
  const c = calculate(deposits, rates, '2026-01-01');
  assert.equal(c.active.length, 1);
  assert.equal(c.active[0].days, 1);
  assert.equal(c.principal, deposits[0].amount);
  assert.equal(round(c.interest), round((deposits[0].amount * 0.0223534) / 100));
  assert.equal(c.positions[1].balance, 0);
  assert.equal(c.points.length, 1);
});
test('No hay saldo ni intereses antes del primer giro', () => {
  const c = calculate(deposits, rates, '2025-12-31');
  assert.equal(c.principal, 0);
  assert.equal(c.balance, 0);
  assert.equal(c.interest, 0);
  assert.deepEqual(c.points, []);
});
test('Cambio de tramo: se aplica la tasa nominal de cada día, no la E.A.', () => {
  const c = calculate([{ id: 'Giro 001', amount: 1000000, date: '2026-02-08' }], rates, '2026-02-09');
  assert.equal(c.active[0].days, 2);
  assert.equal(round(c.interest), round((1e6 * (0.0223534 + 0.0248685)) / 100));
  assert.deepEqual(
    c.points.map((p) => p.rate),
    [0.0223534, 0.0248685],
  );
});
test('Cierre del año: cifras contrastadas por tramos, sin capitalización', () => {
  const c = calculate(deposits, rates, MAX_DATE);
  const byIntervals = deposits.map((d) =>
    rates.reduce((s, r) => {
      const start = [d.date, r.from].sort().at(-1),
        end = [MAX_DATE, r.to].sort()[0];
      const days = Math.max(0, (Date.parse(end) - Date.parse(start)) / 86_400_000 + 1);
      return s + (d.amount * days * r.daily) / 100;
    }, 0),
  );
  assert.equal(c.active.length, 10);
  assert.equal(c.active[0].days, 365);
  assert.equal(c.active[9].days, 92);
  assert.equal(c.points.length, 365);
  assert.equal(round(c.principal), 24696186274.28);
  assert.equal(round(c.interest), 1575905918.96);
  assert.equal(round(c.balance), 26272092193.24);
  assert.deepEqual(
    c.active.map((p) => round(p.interest)),
    byIntervals.map(round),
  );
  assert.equal(round(c.points.reduce((s, p) => s + p.dailyInterest, 0)), round(c.interest));
});
test('Capitalización compuesta diaria opcional', () => {
  const small = [{ id: 'Giro 001', date: '2026-11-01', amount: 100 }],
    customRates = [{ from: '2026-11-01', to: MAX_DATE, daily: 1, ea: 0 }];
  const c = calculate(small, customRates, '2026-11-02', 'compound');
  assert.equal(round(c.interest), 2.01);
  assert.equal(round(c.balance), 102.01);
  assert.equal(c.points[1].dailyInterest, 1.01);
});
test('Límite de la fecha de salida y fechas imposibles', () => {
  assert.throws(() => calculate(deposits, rates, '2027-01-01'));
  assert.throws(() => calculate(deposits, rates, '2026-02-29'));
});
test('No se inventan tasas en los huecos de los datos originales', () => {
  assert.equal(nextUncoveredDay(rates, '2022-02-01', MAX_DATE), '2022-02-07');
  assert.equal(nextUncoveredDay(rates, '2026-01-01', MAX_DATE), null);
  assert.throws(
    () => calculate([{ id: 'Giro 001', date: '2022-02-07', amount: 10 }], rates, '2022-02-07'),
    /No hay una tasa/,
  );
});

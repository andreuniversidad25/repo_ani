import template from '../reports/interactive.html?raw';
import { type Calculation, type Point } from './finance';
import { downloadFile } from './format';
/** A self-contained snapshot: no CDN, account data transmission or recalculation. */
export function exportInteractive(calc: Calculation) {
  const series = (p: Point) => [p.date, p.dailyInterest, p.interest];
  const payload = {
    cutoff: calc.cutoff,
    method: calc.method,
    principal: calc.principal,
    interest: calc.interest,
    balance: calc.balance,
    series: calc.points.map(series),
    positions: calc.active.map(({ history, ...position }) => ({
      ...position,
      series: history.map(series),
    })),
  };
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  downloadFile(
    `Rendia-reporte-interactivo-${calc.cutoff}.html`,
    template.replace('__RENDIA_DATA__', () => json),
    'text/html;charset=utf-8',
  );
}

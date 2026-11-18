import { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileBarChart2,
  FileSpreadsheet,
  Info,
  Percent,
  TrendingUp,
} from 'lucide-react';
import { rates } from '../data';
import { type Calculation, type Position, rateOn } from '../lib/finance';
import { dateLabel, money, num, pct } from '../lib/format';
import { Charts, Metrics } from './Charts';
import { DailyTable, DepositTable, Pagination } from './Tables';
import { Logo, NoData } from './Chrome';
export function RatesPage({ calc, onGuide }: { calc: Calculation; onGuide: () => void }) {
  const [scope, setScope] = useState('account'),
    [page, setPage] = useState(0);
  const current = rateOn(rates, calc.cutoff),
    start = calc.positions[0]?.date ?? calc.cutoff;
  const rows =
    scope === 'all' ? [...rates].reverse() : rates.filter((r) => r.to >= start && r.from <= calc.cutoff);
  const size = 8,
    p = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1));
  return (
    <>
      <div className="rate-metrics">
        <div className="panel rate-metric">
          <span>
            <Percent size={17} />
            Tasa diaria al corte
          </span>
          <strong className="interest-text">{current ? num(current.daily, 9, 0) + ' %' : '—'}</strong>
          <small>Tasa nominal aplicada al cálculo</small>
        </div>
        <div className="panel rate-metric">
          <span>
            <TrendingUp size={17} />
            Tasa efectiva anual
          </span>
          <strong>{current ? pct(current.ea) : '—'}</strong>
          <small>Referencia anual correspondiente</small>
        </div>
        <div className="panel rate-metric">
          <span>
            <CalendarDays size={17} />
            Vigencia al corte
          </span>
          <strong className="range-value">
            {current ? `${dateLabel(current.from, true)} – ${dateLabel(current.to)}` : 'Sin cobertura'}
          </strong>
          <small>Ambas fechas están incluidas</small>
        </div>
      </div>
      <section className="panel rates-table-panel">
        <div className="panel-heading">
          <div>
            <div className="heading-with-count">
              <h2>Historial de tasas</h2>
              <span className="count-chip">{rows.length}</span>
            </div>
            <p>Intervalos de vigencia registrados en Tasas.csv.</p>
          </div>
          <label className="select-shell">
            <select
              value={scope}
              aria-label="Periodos de tasas"
              onChange={(e) => {
                setScope(e.target.value);
                setPage(0);
              }}
            >
              <option value="account">Periodo de la cuenta</option>
              <option value="all">Historial completo</option>
            </select>
            <ChevronDown size={13} />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Desde</th>
                <th>Hasta</th>
                <th className="numeric">Tasa E.A.</th>
                <th className="numeric">Tasa nominal diaria</th>
                <th>Estado al corte</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(p * size, (p + 1) * size).map((r) => (
                <tr key={r.from}>
                  <td>{dateLabel(r.from)}</td>
                  <td>{dateLabel(r.to)}</td>
                  <td className="numeric">{pct(r.ea)}</td>
                  <td className="numeric interest-text">{num(r.daily, 9, 0)} %</td>
                  <td>
                    <span className={'tag ' + (current?.from === r.from ? 'success' : 'neutral')}>
                      {current?.from === r.from
                        ? 'Vigente'
                        : r.from > calc.cutoff
                          ? 'Posterior'
                          : 'Anterior'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <NoData
            title="Sin tasas en el periodo de la cuenta"
            text="Puedes consultar todos los intervalos en «Historial completo»."
          />
        )}
        <Pagination total={rows.length} page={p} size={size} onPage={setPage} noun="periodos" />
      </section>
      <div className="page-note">
        <Info size={16} />
        <p>La tasa nominal diaria se usa directamente, sin convertir de nuevo la tasa efectiva anual.</p>
        <button onClick={onGuide}>Ver metodología</button>
      </div>
    </>
  );
}
export function ReportsPage({
  calc,
  onExport,
  onDetail,
}: {
  calc: Calculation;
  onExport: () => void;
  onDetail: (p: Position) => void;
}) {
  const [tab, setTab] = useState('summary');
  return (
    <>
      <div className="report-banner panel">
        <span className="report-icon">
          <FileBarChart2 size={25} />
        </span>
        <div>
          <div className="heading-with-count">
            <h2>Reporte de la cuenta</h2>
            <span className="tag success">
              <CheckCircle2 size={11} />
              Listo
            </span>
          </div>
          <p>
            Corte al {dateLabel(calc.cutoff)} · Interés{' '}
            {calc.method === 'simple' ? 'simple' : 'compuesto'} diario
          </p>
        </div>
        <button className="button green" onClick={onExport}>
          <Download size={15} />
          Exportar reporte
        </button>
      </div>
      <Metrics calc={calc} />
      <div className="tab-bar report-tabs">
        <button className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>
          <FileBarChart2 size={15} />
          Resumen y gráficos
        </button>
        <button className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>
          <FileSpreadsheet size={15} />
          Consolidado diario
        </button>
      </div>
      {tab === 'summary' ? (
        <>
          <Charts calc={calc} />
          <DepositTable
            calc={calc}
            onExport={onExport}
            onDetail={onDetail}
            title="Resumen por consignación"
          />
        </>
      ) : (
        <DailyTable points={calc.points} title="Consolidado diario de la cuenta" />
      )}
    </>
  );
}
export function PrintReport({ calc }: { calc: Calculation }) {
  return (
    <article className="print-only">
      <div className="print-header">
        <Logo />
        <span>INFORME FINANCIERO · COP</span>
      </div>
      <h1>Reporte de rendimientos</h1>
      <p>
        Fecha de salida: <b>{dateLabel(calc.cutoff)}</b> · {calc.active.length} consignaciones · Interés{' '}
        {calc.method === 'simple' ? 'simple' : 'compuesto'} diario
      </p>
      <div className="print-metrics">
        <div>
          Capital consignado<strong>{money(calc.principal, 2)}</strong>
        </div>
        <div>
          Intereses generados<strong>{money(calc.interest, 2)}</strong>
        </div>
        <div>
          Saldo total<strong>{money(calc.balance, 2)}</strong>
        </div>
      </div>
      <Charts calc={calc} />
      <h2>Resumen por consignación</h2>
      <table>
        <thead>
          <tr>
            <th>Giro</th>
            <th>Fecha inicial</th>
            <th className="numeric">Capital (COP)</th>
            <th>Días</th>
            <th className="numeric">Intereses (COP)</th>
            <th className="numeric">Saldo final (COP)</th>
          </tr>
        </thead>
        <tbody>
          {calc.active.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{dateLabel(p.date)}</td>
              <td className="numeric">{money(p.amount, 2)}</td>
              <td>{p.days}</td>
              <td className="numeric">{money(p.interest, 2)}</td>
              <td className="numeric">{money(p.balance, 2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={2}>Totales</th>
            <th className="numeric">{money(calc.principal, 2)}</th>
            <th />
            <th className="numeric">{money(calc.interest, 2)}</th>
            <th className="numeric">{money(calc.balance, 2)}</th>
          </tr>
        </tfoot>
      </table>
      <div className="print-method">
        <h3>Notas de cálculo</h3>
        <p>
          Fuentes: Giros.csv, Tasas.csv y consignaciones añadidas en este navegador. Las fechas mensuales
          de Giros.csv se interpretan como el primer día del mes. Se incluyen los días inicial y final,
          aplicando la tasa nominal diaria vigente{' '}
          {calc.method === 'simple'
            ? 'al capital original, sin capitalización'
            : 'al saldo del día anterior, con capitalización diaria'}
          . Los giros posteriores al corte se excluyen. Las cifras se redondean únicamente para
          presentación.
        </p>
      </div>
    </article>
  );
}

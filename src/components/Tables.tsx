import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownUp,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from 'lucide-react';
import { type Calculation, type Point, type Position } from '../lib/finance';
import { dateLabel, money, num } from '../lib/format';
import { NoData } from './Chrome';
export function Pagination({
  total,
  size,
  page,
  onPage,
  noun = 'registros',
}: {
  total: number;
  size: number;
  page: number;
  onPage: (p: number) => void;
  noun?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(page, pages - 1);
  return (
    <div className="pagination">
      <span>
        {total ? (
          <>
            <strong>
              {p * size + 1}–{Math.min((p + 1) * size, total)}
            </strong>{' '}
            de {total} {noun}
          </>
        ) : (
          '0 ' + noun
        )}
      </span>
      <div>
        <button aria-label="Página anterior" disabled={p === 0} onClick={() => onPage(p - 1)}>
          <ChevronLeft size={15} />
        </button>
        {pages <= 4 ? (
          Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              aria-label={'Página ' + (i + 1)}
              aria-current={p === i ? 'page' : undefined}
              className={p === i ? 'current' : ''}
              onClick={() => onPage(i)}
            >
              {i + 1}
            </button>
          ))
        ) : (
          <span className="page-indicator">
            {p + 1} / {pages}
          </span>
        )}
        <button aria-label="Página siguiente" disabled={p + 1 >= pages} onClick={() => onPage(p + 1)}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
type SortKey = 'id' | 'date' | 'amount' | 'days' | 'interest' | 'balance';
export function DepositTable({
  calc,
  full = false,
  onDetail,
  onExport,
  title = 'Detalle de consignaciones',
}: {
  calc: Calculation;
  full?: boolean;
  onDetail: (p: Position) => void;
  onExport: () => void;
  title?: string;
}) {
  const [page, setPage] = useState(0),
    [key, setKey] = useState<SortKey>('date'),
    [asc, setAsc] = useState(true),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('all');
  const data = full ? calc.positions : calc.active;
  const list = useMemo(
    () =>
      data
        .filter(
          (d) =>
            (!full || status === 'all' || d.days > 0 === (status === 'active')) &&
            (!search ||
              (d.id + ' ' + d.date + ' ' + dateLabel(d.date))
                .toLowerCase()
                .includes(search.toLowerCase().trim())),
        )
        .sort((a, b) => {
          const a1 = a[key],
            b1 = b[key];
          return (
            (typeof a1 === 'number' && typeof b1 === 'number'
              ? a1 - b1
              : String(a1).localeCompare(String(b1))) * (asc ? 1 : -1)
          );
        }),
    [data, key, asc, search, status, full],
  );
  const size = full ? 8 : 5,
    p = Math.max(0, Math.min(page, Math.ceil(list.length / size) - 1));
  const sort = (k: SortKey) => {
    setAsc(k === key ? !asc : k === 'date' || k === 'id');
    setKey(k);
    setPage(0);
  };
  const head = (k: SortKey, label: string, cls = '') => (
    <th className={cls} aria-sort={k === key ? (asc ? 'ascending' : 'descending') : 'none'}>
      <button className={'sort-button ' + (key === k ? 'sorted' : '')} onClick={() => sort(k)}>
        {label}
        {key === k ? asc ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ArrowDownUp size={10} />}
      </button>
    </th>
  );
  return (
    <section className="panel deposits-panel">
      <div className="panel-heading table-panel-heading">
        <div>
          <div className="heading-with-count">
            <h2>{title}</h2>
            <span className="count-chip">{data.length}</span>
          </div>
          <p>
            {full
              ? 'Consulta y explora todos los giros registrados.'
              : 'Capital e intereses individuales a la fecha de salida.'}
          </p>
        </div>
        <button className="button green" onClick={onExport}>
          <Download size={15} />
          Exportar reporte
        </button>
      </div>
      {full && (
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={15} />
            <input
              type="search"
              aria-label="Buscar consignaciones"
              placeholder="Buscar por giro o fecha…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label className="select-shell">
            <select
              aria-label="Estado de consignación"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">Todos los giros</option>
              <option value="active">Al corte</option>
              <option value="pending">Pendientes</option>
            </select>
            <ChevronDown size={13} />
          </label>
        </div>
      )}
      <div className="table-scroll">
        <table className="deposits-table">
          <thead>
            <tr>
              {head('id', 'Consignación')}
              {head('date', 'Fecha inicial')}
              {head('amount', 'Capital', 'numeric')}
              {head('days', 'Días', 'numeric days-col')}
              {head('interest', 'Intereses', 'numeric')}
              {head('balance', 'Saldo final', 'numeric')}
              <th className="row-action">
                <span className="sr-only">Ver detalle</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.slice(p * size, (p + 1) * size).map((row) => (
              <tr key={row.id} onClick={() => onDetail(row)} className="clickable-row">
                <td>
                  <button
                    className="deposit-id"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDetail(row);
                    }}
                    aria-label={'Ver detalle de ' + row.id}
                  >
                    <span className={'deposit-icon' + (!row.days ? ' muted-icon' : '')}>
                      <ArrowDownLeft size={15} />
                    </span>
                    {row.id}
                  </button>
                </td>
                <td className="date-cell">{dateLabel(row.date)}</td>
                <td className="numeric" title={money(row.amount, 2)}>
                  {money(row.amount)}
                </td>
                <td className="numeric days-col muted">{num(row.days)}</td>
                <td className="numeric interest-text" title={money(row.interest, 2)}>
                  {row.days ? money(row.interest) : <span className="tag neutral">Pendiente</span>}
                </td>
                <td className="numeric" title={money(row.balance, 2)}>
                  {row.days ? money(row.balance) : '—'}
                </td>
                <td className="row-action">
                  <ChevronRight size={14} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && (
        <NoData
          title={full ? 'No hay coincidencias' : undefined}
          text={full ? 'Prueba otro giro, fecha o estado.' : undefined}
        />
      )}
      <Pagination total={list.length} size={size} page={p} onPage={setPage} noun="consignaciones" />
    </section>
  );
}
export function DailyTable({
  points,
  title = 'Detalle diario',
  compact = false,
}: {
  points: Point[];
  title?: string;
  compact?: boolean;
}) {
  const [page, setPage] = useState(0),
    [reverse, setReverse] = useState(true),
    [month, setMonth] = useState('all');
  const months = [...new Set(points.map((p) => p.date.slice(0, 7)))];
  const filteredMonth = months.includes(month) ? month : 'all';
  const rows = points.filter((p) => filteredMonth === 'all' || p.date.startsWith(filteredMonth));
  if (reverse) rows.reverse();
  const size = compact ? 6 : 10,
    p = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1));
  return (
    <section className={'panel daily-table-panel' + (compact ? ' nested-panel' : '')}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>Intereses de cada día y saldo acumulado.</p>
        </div>
        <label className="select-shell">
          <select
            aria-label="Filtrar detalle diario por mes"
            value={filteredMonth}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Todos los meses</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {dateLabel(m + '-01').slice(3)}
              </option>
            ))}
          </select>
          <ChevronDown size={12} />
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <button
                  className="sort-button"
                  onClick={() => {
                    setReverse(!reverse);
                    setPage(0);
                  }}
                >
                  Fecha {reverse ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                </button>
              </th>
              <th className="numeric">Tasa diaria</th>
              <th className="numeric">Interés del día</th>
              <th className="numeric">Interés acumulado</th>
              <th className="numeric">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(p * size, (p + 1) * size).map((r) => (
              <tr key={r.date}>
                <td>{dateLabel(r.date)}</td>
                <td className="numeric muted">{num(r.rate, 9, 0)} %</td>
                <td className="numeric interest-text">{money(r.dailyInterest, 2)}</td>
                <td className="numeric">{money(r.interest, 2)}</td>
                <td className="numeric">{money(r.balance, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <NoData />}
      <Pagination total={rows.length} size={size} page={p} onPage={setPage} noun="días" />
    </section>
  );
}

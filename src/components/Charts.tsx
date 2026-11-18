import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ChartNoAxesCombined, ChevronDown, Info, Layers3, Wallet } from 'lucide-react';
import { MONTHS, type Calculation, type Point } from '../lib/finance';
import { compact, dateLabel, money, pct } from '../lib/format';
import { NoData } from './Chrome';

function Sparkline({
  points,
  field,
  color,
}: {
  points: Point[];
  field: 'principal' | 'interest' | 'balance';
  color: string;
}) {
  const id = useId().replace(/:/g, '');
  const values = points
    .filter(
      (_, i) =>
        i === 0 || i % Math.max(1, Math.floor(points.length / 50)) === 0 || i === points.length - 1,
    )
    .map((p) => p[field]);
  if (!values.length) return <span />;
  const max = Math.max(...values, 1),
    min = Math.min(...values) * 0.85;
  const coords = values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * 90,
    30 - ((v - min) / (max - min)) * 24,
  ]);
  const line = coords
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : field === 'principal' ? `H${x}V${y}` : `L${x},${y}`))
    .join(' ');
  return (
    <svg className="sparkline" viewBox="0 0 92 34" aria-hidden="true">
      <defs>
        <linearGradient id={'spark' + id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={color} stopOpacity=".19" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={line + ' L90,34 L0,34 Z'} fill={`url(#spark${id})`} />
      <path
        d={line}
        stroke={color}
        strokeWidth="1.7"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Metrics({ calc }: { calc: Calculation }) {
  return (
    <section className="metrics" aria-label="Indicadores de la cuenta">
      <article className="metric-card capital">
        <div className="metric-label">
          <span className="metric-icon">
            <Wallet size={17} />
          </span>
          <h2>Capital consignado</h2>
        </div>
        <p className="metric-value" title={money(calc.principal, 2)}>
          {money(calc.principal)}
        </p>
        <div className="metric-bottom">
          <span className="metric-note">
            <span className="mini-dot blue" />
            {calc.active.length} consignaci{calc.active.length === 1 ? 'ón activa' : 'ones activas'}
          </span>
          <Sparkline points={calc.points} field="principal" color="#81a9ed" />
        </div>
      </article>
      <article className="metric-card interest">
        <div className="metric-label">
          <span className="metric-icon">
            <ChartNoAxesCombined size={18} />
          </span>
          <h2>Intereses generados</h2>
        </div>
        <p className="metric-value" title={money(calc.interest, 2)}>
          {money(calc.interest)}
        </p>
        <div className="metric-bottom">
          <span className="metric-note">
            <span className="return-chip">
              <ArrowUpRight size={12} />
              {pct(calc.yieldPct)}
            </span>
            <span>de retorno</span>
          </span>
          <Sparkline points={calc.points} field="interest" color="#6fe2b8" />
        </div>
      </article>
      <article className="metric-card balance">
        <div className="metric-label">
          <span className="metric-icon">
            <Layers3 size={17} />
          </span>
          <h2>Saldo total</h2>
        </div>
        <p className="metric-value" title={money(calc.balance, 2)}>
          {money(calc.balance)}
        </p>
        <div className="metric-bottom">
          <span className="metric-note">
            <span className="mini-dot purple" />
            Capital + intereses
          </span>
          <Sparkline points={calc.points} field="balance" color="#b19be9" />
        </div>
      </article>
    </section>
  );
}
const COLORS = ['#67dfb5', '#8a9aeb', '#b49ae1', '#ddba80'];
const QUARTERS = ['Ene – Mar', 'Abr – Jun', 'Jul – Sep', 'Oct – Dic'];
export function Distribution({ calc }: { calc: Calculation }) {
  const [hover, setHover] = useState<number | null>(null),
    [locked, setLocked] = useState<number | null>(null),
    [info, setInfo] = useState(false);
  const selected = hover ?? locked;
  const parts = [0, 0, 0, 0];
  for (const d of calc.active) parts[Math.floor((+d.date.slice(5, 7) - 1) / 3)] += d.interest;
  const total = calc.interest,
    circumference = 2 * Math.PI * 65;
  let offset = 0;
  const fractions = parts.map((v) => (total ? v / total : 0));
  const choose = (i: number) => setLocked(locked === i ? null : i);
  return (
    <section className="panel distribution-card">
      <div className="panel-heading">
        <div>
          <h2>Distribución de intereses</h2>
          <p>Por trimestre de consignación</p>
        </div>
        <button
          className="plain-icon info-trigger"
          aria-label="Acerca de la distribución"
          aria-expanded={info}
          onClick={() => setInfo(!info)}
        >
          <Info size={15} />
        </button>
        {info && (
          <div className="chart-info" role="status">
            Cada segmento agrupa los intereses de los giros según su trimestre de ingreso. Selecciona uno
            para ver su valor.<button onClick={() => setInfo(false)}>Entendido</button>
          </div>
        )}
      </div>
      <div className="donut-container">
        <div className="donut">
          <svg
            viewBox="0 0 160 160"
            role="group"
            aria-label="Participación en los intereses por trimestre"
          >
            <circle cx="80" cy="80" r="79" fill="none" stroke="var(--donut-guide)" strokeWidth=".7" />
            <circle cx="80" cy="80" r="65" fill="none" stroke="var(--border)" strokeWidth="21" />
            {fractions.map((f, i) => {
              const start = offset;
              offset += f * circumference;
              return (
                f > 0 && (
                  <circle
                    key={i}
                    className="donut-segment"
                    cx="80"
                    cy="80"
                    r="65"
                    transform="rotate(-90 80 80)"
                    fill="none"
                    stroke={COLORS[i]}
                    strokeWidth={selected === i ? 23 : 21}
                    strokeDasharray={`${Math.max(0.1, f * circumference - (f === 1 ? 0 : 2.6))} ${circumference - Math.max(0.1, f * circumference - (f === 1 ? 0 : 2.6))}`}
                    strokeDashoffset={-start}
                    opacity={selected !== null && selected !== i ? 0.35 : 1}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => choose(i)}
                  >
                    <title>
                      {QUARTERS[i]}: {money(parts[i], 2)} ({pct(f * 100, 1)})
                    </title>
                  </circle>
                )
              );
            })}
            <circle cx="80" cy="80" r="51" fill="none" stroke="var(--donut-guide)" strokeWidth=".7" />
          </svg>
          <div className="donut-center">
            <span>{selected !== null ? 'TRIMESTRE ' + (selected + 1) : 'TOTAL INTERESES'}</span>
            <strong>{'$ ' + compact(selected === null ? total : parts[selected])}</strong>
            <small>{selected !== null ? pct(fractions[selected] * 100, 1) : 'COP'}</small>
          </div>
        </div>
      </div>
      <div className="donut-legend">
        {QUARTERS.map((q, i) => (
          <button
            key={q}
            aria-label={`${q}: ${pct(fractions[i] * 100, 1)}, ${money(parts[i])}`}
            aria-pressed={locked === i}
            onClick={() => choose(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <span className="legend-dot" style={{ background: COLORS[i] }} />
            <span>{q}</span>
            <strong>{pct(fractions[i] * 100, 1)}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
function niceStep(n: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(n || 1))),
    norm = n / exp;
  return ([1, 2, 2.5, 4, 5, 10].find((x) => x >= norm) || 10) * exp;
}
function graphTicks(data: Point[], maxTicks: number) {
  if (data.length < 2) return [0];
  const ends = data
    .map((p, i) => (!data[i + 1] || p.date.slice(0, 7) !== data[i + 1].date.slice(0, 7) ? i : -1))
    .filter((i) => i !== -1);
  if (ends.length > 1)
    return ends
      .filter((_, i) => i % Math.ceil(ends.length / maxTicks) === 0 || i === ends.length - 1)
      .filter((v, i, arr) => i === arr.length - 1 || (arr[i + 1] - v) / (data.length - 1) > 0.045);
  return [
    ...new Set(
      Array.from({ length: Math.min(5, data.length) }, (_, i) =>
        Math.round((i * (data.length - 1)) / (Math.min(5, data.length) - 1)),
      ),
    ),
  ];
}
export function Evolution({
  points,
  title = 'Evolución de intereses',
  initialMode = 'cumulative',
}: {
  points: Point[];
  title?: string;
  initialMode?: 'cumulative' | 'daily';
}) {
  const [mode, setMode] = useState(initialMode),
    [hover, setHover] = useState<number | null>(null),
    [width, setWidth] = useState(580);
  const [height, setHeight] = useState(205);
  const wrap = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, '');
  useEffect(() => {
    if (!wrap.current) return;
    const el = wrap.current;
    const resize = () => {
      if (el.clientWidth > 0) {
        setWidth(el.clientWidth);
        setHeight(el.querySelector('svg')?.clientHeight || 205);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [points.length]);
  const field = mode === 'cumulative' ? 'interest' : 'dailyInterest';
  // The cumulative curve shows each month-end, including the selected partial month.
  const data = useMemo(
    () =>
      mode === 'daily' || points.length < 62
        ? points
        : points.filter(
            (p, i) => !points[i + 1] || p.date.slice(0, 7) !== points[i + 1].date.slice(0, 7),
          ),
    [points, mode],
  );
  const H = height,
    left = width < 400 ? 46 : 57,
    right = 12,
    top = 15,
    bottom = 28,
    gw = Math.max(width - left - right, 1),
    gh = H - top - bottom;
  const max = Math.max(0, ...data.map((p) => p[field]));
  const step = niceStep(max / 4 || 1),
    ceiling = step * 4;
  const x = (i: number) => left + (data.length <= 1 ? 0.5 : i / (data.length - 1)) * gw;
  const y = (v: number) => top + gh - (v / ceiling) * gh;
  const d = data.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(p[field]).toFixed(2)}`).join(' ');
  const ticks = graphTicks(data, width < 470 ? 6 : 12);
  const monthly = data.length > 1 && data[0].date.slice(0, 7) !== data.at(-1)!.date.slice(0, 7);
  const active = hover === null ? null : Math.min(hover, data.length - 1),
    hp = active !== null ? data[active] : undefined;
  return (
    <section className="panel evolution-card">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>
            {mode === 'cumulative'
              ? 'Intereses acumulados durante el periodo'
              : 'Intereses generados cada día del periodo'}
          </p>
        </div>
        <label className="select-shell chart-select">
          <select
            aria-label="Vista del gráfico"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as typeof mode);
              setHover(null);
            }}
          >
            <option value="cumulative">Acumulado</option>
            <option value="daily">Diario</option>
          </select>
          <ChevronDown size={12} />
        </label>
      </div>
      {data.length ? (
        <>
          <div className="plot-wrap" ref={wrap}>
            <svg
              role="img"
              tabIndex={0}
              aria-label={`${title}. ${dateLabel(data[0].date)} a ${dateLabel(data.at(-1)!.date)}. Usa las flechas para explorar los valores.`}
              viewBox={`0 0 ${width} ${H}`}
              onPointerMove={(e) => {
                const bounds = e.currentTarget.getBoundingClientRect();
                const px = ((e.clientX - bounds.left) * width) / bounds.width;
                setHover(
                  Math.max(
                    0,
                    Math.min(data.length - 1, Math.round(((px - left) / gw) * (data.length - 1))),
                  ),
                );
              }}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(data.length - 1)}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setHover(
                    Math.max(
                      0,
                      Math.min(data.length - 1, (active ?? 0) + (e.key === 'ArrowRight' ? 1 : -1)),
                    ),
                  );
                } else if (e.key === 'Escape') setHover(null);
              }}
            >
              <defs>
                <linearGradient id={'area' + uid} x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#53dba9" stopOpacity=".24" />
                  <stop offset="1" stopColor="#53dba9" stopOpacity=".015" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line
                    x1={left}
                    x2={width - right}
                    y1={y(step * i)}
                    y2={y(step * i)}
                    stroke="var(--grid)"
                    strokeDasharray="3 4"
                  />
                  <text x={left - 12} y={y(step * i) + 3.5} textAnchor="end" className="axis-label">
                    {compact(step * i)}
                  </text>
                </g>
              ))}
              <path
                d={d + ` L${x(data.length - 1)},${top + gh} L${x(0)},${top + gh} Z`}
                fill={`url(#area${uid})`}
              />
              <path
                d={d}
                fill="none"
                stroke="#64dfb0"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {ticks.map((i) => (
                <g key={i}>
                  <text x={x(i)} y={H - 6} textAnchor="middle" className="axis-label">
                    {monthly
                      ? MONTHS[Number(data[i].date.slice(5, 7)) - 1]
                      : dateLabel(data[i].date, true)}
                  </text>
                  {mode === 'cumulative' && (
                    <circle
                      cx={x(i)}
                      cy={y(data[i][field])}
                      r="2.9"
                      fill="#172720"
                      stroke="#80edc3"
                      strokeWidth="1.6"
                    />
                  )}
                </g>
              ))}
              <circle
                cx={x(data.length - 1)}
                cy={y(data.at(-1)![field])}
                r="6.8"
                fill="#68e5b5"
                opacity=".12"
              />
              <circle cx={x(data.length - 1)} cy={y(data.at(-1)![field])} r="3.4" fill="#78e9bc" />
              {active !== null && hp && (
                <g>
                  <line
                    x1={x(active)}
                    x2={x(active)}
                    y1={top}
                    y2={top + gh}
                    stroke="#6ab99b"
                    strokeDasharray="3 4"
                  />
                  <circle
                    cx={x(active)}
                    cy={y(hp[field])}
                    r="4.2"
                    fill="#6deab6"
                    stroke="#14241e"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
            {active !== null && hp && (
              <div
                className="chart-tooltip"
                role="status"
                style={{
                  left: Math.max(4, Math.min(width - 170, x(active) - 78)),
                  top: Math.max(0, Math.min(H - 66, y(hp[field]) - 62)),
                }}
              >
                <span>{dateLabel(hp.date)}</span>
                <strong>
                  <i />
                  {money(hp[field])}
                </strong>
              </div>
            )}
          </div>
          <div className="chart-foot">
            <span>
              <i className="line-legend" />
              {mode === 'cumulative' ? 'Intereses acumulados' : 'Interés diario'}
            </span>
            <small>Valores en COP</small>
          </div>
        </>
      ) : (
        <NoData />
      )}
    </section>
  );
}
export function Charts({ calc }: { calc: Calculation }) {
  return (
    <div className="charts-grid">
      <Evolution points={calc.points} />
      <Distribution calc={calc} />
    </div>
  );
}

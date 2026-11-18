import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DAY, LONG_MONTHS, MAX_DATE, epoch, isoDay, validISO } from '../lib/finance';
import { dateLabel } from '../lib/format';
export function DateControl({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false),
    [view, setView] = useState(value.slice(0, 7)),
    [draft, setDraft] = useState(value),
    [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', click);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const pick = (v: string) => {
    if (!validISO(v) || v > MAX_DATE || v < '0001-01-01') {
      setError('Elige una fecha válida, hasta el 31 dic 2026.');
      return;
    }
    onChange(v);
    setOpen(false);
    trigger.current?.focus();
  };
  const [year, month] = view.split('-').map(Number);
  const first = epoch(view + '-01');
  const offset = (new Date(first).getUTCDay() + 6) % 7;
  const nDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const move = (n: number) => {
    const d = new Date(first);
    d.setUTCMonth(d.getUTCMonth() + n);
    setView(isoDay(+d).slice(0, 7));
  };
  return (
    <div className="date-control" ref={ref}>
      <label id="cutoff-label">Fecha de salida</label>
      <button
        className={'date-trigger' + (open ? ' chosen' : '')}
        ref={trigger}
        aria-label={'Fecha de salida: ' + dateLabel(value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setView(value.slice(0, 7));
          setDraft(value);
          setError('');
          setOpen(!open);
        }}
      >
        <CalendarDays size={16} />
        <strong>{dateLabel(value)}</strong>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="calendar-popover" role="dialog" aria-label="Seleccionar fecha de salida">
          <div className="calendar-title">
            <strong>
              {LONG_MONTHS[month - 1]} de {year}
            </strong>
            <div>
              <button className="icon-button" aria-label="Mes anterior" onClick={() => move(-1)}>
                <ChevronLeft size={16} />
              </button>
              <button
                className="icon-button"
                disabled={view >= MAX_DATE.slice(0, 7)}
                aria-label="Mes siguiente"
                onClick={() => move(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={'w' + i} className="weekday">
                {d}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={'o' + i} />
            ))}
            {Array.from({ length: nDays }, (_, i) => {
              const d = isoDay(first + i * DAY);
              return (
                <button
                  key={d}
                  className={d === value ? 'selected' : ''}
                  aria-pressed={d === value}
                  aria-label={dateLabel(d)}
                  onClick={() => pick(d)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="calendar-presets">
            <button
              onClick={() => {
                const now = new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'America/Bogota',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }).format(new Date());
                pick(now > MAX_DATE ? MAX_DATE : now);
              }}
            >
              Hoy
            </button>
            <button onClick={() => pick(MAX_DATE)}>Fin de 2026</button>
          </div>
          <form
            className="manual-date"
            onSubmit={(e) => {
              e.preventDefault();
              pick(draft);
            }}
          >
            <label htmlFor="manual-cutoff">Escribir fecha</label>
            <div>
              <input
                id="manual-cutoff"
                type="date"
                max={MAX_DATE}
                required
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="button green small" type="submit">
                Aplicar
              </button>
            </div>
            {error && <small role="alert">{error}</small>}
          </form>
        </div>
      )}
    </div>
  );
}

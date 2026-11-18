import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Info, Plus, X } from 'lucide-react';
import { originalDeposits, rates } from './data';
import {
  calculate,
  MAX_DATE,
  nextUncoveredDay,
  validISO,
  type Deposit,
  type Method,
  type Position,
} from './lib/finance';
import { Eyebrow, Footer, pageNames, Sidebar, Topbar, type Page } from './components/Chrome';
import { DateControl } from './components/DateControl';
import { Charts, Metrics } from './components/Charts';
import { DepositTable } from './components/Tables';
import {
  DepositDialog,
  DetailDialog,
  ExportDialog,
  GuideDialog,
  SourceDialog,
} from './components/Dialogs';
import { PrintReport, RatesPage, ReportsPage } from './components/Pages';
const STORAGE = 'rendia.workspace.v1';
function readSession(): { cutoff: string; method: Method; extra: Deposit[] } {
  const initial = { cutoff: MAX_DATE, method: 'simple' as Method, extra: [] as Deposit[] };
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    if (!v || typeof v !== 'object') return initial;
    const extra: Deposit[] = [],
      seen = new Set(originalDeposits.map((d) => d.id));
    if (Array.isArray(v.extra))
      for (const d of v.extra) {
        if (
          d &&
          typeof d.id === 'string' &&
          /^Giro \d{3,}$/.test(d.id) &&
          !seen.has(d.id) &&
          Number.isFinite(d.amount) &&
          d.amount > 0 &&
          d.amount <= 1e13 &&
          validISO(d.date) &&
          d.date <= MAX_DATE &&
          nextUncoveredDay(rates, d.date, MAX_DATE) === null
        ) {
          extra.push(d);
          seen.add(d.id);
        }
      }
    return {
      cutoff:
        validISO(v.cutoff) && v.cutoff <= MAX_DATE && v.cutoff >= '0001-01-01' ? v.cutoff : MAX_DATE,
      method: v.method === 'compound' ? 'compound' : 'simple',
      extra,
    };
  } catch {
    return initial;
  }
}
function getPage(): Page {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return Object.hasOwn(pageNames, hash) ? (hash as Page) : 'resumen';
}
type Dialog = 'export' | 'guide' | 'giros' | 'tasas' | 'add' | 'detail' | 'edit' | null;
const headings: Record<Page, { over: string; title: string; sub: string }> = {
  resumen: {
    over: 'ANALÍTICA FINANCIERA',
    title: 'Panel de rendimientos',
    sub: 'Una visión del capital, los intereses y la evolución de tu cuenta.',
  },
  consignaciones: {
    over: 'MOVIMIENTOS DE LA CUENTA',
    title: 'Consignaciones',
    sub: 'Consulta el capital y el rendimiento individual de cada giro.',
  },
  tasas: {
    over: 'PARÁMETROS FINANCIEROS',
    title: 'Tasas de interés',
    sub: 'Explora las tasas diarias que determinan el rendimiento de tu cuenta.',
  },
  reportes: {
    over: 'CENTRO DE REPORTES',
    title: 'Reportes de rendimiento',
    sub: 'Explora los resultados al corte y exporta el detalle de tu cuenta.',
  },
};
export default function App() {
  const [session, setSession] = useState(readSession),
    [page, setPage] = useState<Page>(getPage),
    [menu, setMenu] = useState(false),
    [dialog, setDialog] = useState<Dialog>(null),
    [selected, setSelected] = useState<string | null>(null),
    [toast, setToast] = useState('');
  const deposits = useMemo(() => [...originalDeposits, ...session.extra], [session.extra]);
  const calc = useMemo(
    () => calculate(deposits, rates, session.cutoff, session.method),
    [deposits, session.cutoff, session.method],
  );
  const pos = calc.positions.find((p) => p.id === selected);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(session));
    } catch {
      setToast('El almacenamiento local no está disponible. Los cambios durarán esta sesión.');
    }
  }, [session]);
  useEffect(() => {
    const update = () => {
      setPage(getPage());
      setMenu(false);
      setDialog(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    document.title = `${headings[page].title} · Rendia`;
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!menu) return;
    const cb = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', cb);
    return () => window.removeEventListener('keydown', cb);
  }, [menu]);
  const navigate = (p: Page) => {
    window.location.hash = '/' + p;
    setPage(p);
    setMenu(false);
    setDialog(null);
    window.scrollTo(0, 0);
  };
  const detail = (p: Position) => {
    setSelected(p.id);
    setDialog('detail');
  };
  const close = () => setDialog(null),
    onExport = () => setDialog('export');
  const setMethod = (m: Method) => {
    setSession((s) => ({ ...s, method: m }));
    setToast('Método de cálculo aplicado');
  };
  const saveDeposit = (amount: number, date: string) => {
    const editing = dialog === 'edit' && pos;
    setSession((s) => ({
      ...s,
      extra: editing
        ? s.extra.map((d) => (d.id === editing.id ? { ...d, date, amount } : d))
        : [
            ...s.extra,
            {
              id:
                'Giro ' +
                String(Math.max(...deposits.map((d) => Number(d.id.slice(5)))) + 1).padStart(3, '0'),
              amount,
              date,
            },
          ],
    }));
    setToast(editing ? 'Consignación actualizada' : 'Consignación registrada');
  };
  return (
    <>
      <div className="application">
        <a
          className="skip-link"
          href="#contenido"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('contenido')?.focus();
          }}
        >
          Saltar al contenido
        </a>
        <Sidebar
          page={page}
          method={session.method}
          open={menu}
          onClose={() => setMenu(false)}
          onPage={navigate}
          onSource={(s) => setDialog(s)}
          onGuide={() => setDialog('guide')}
        />
        <div className="main-shell">
          <Topbar page={page} onMenu={() => setMenu(!menu)} />
          <main id="contenido" tabIndex={-1} className="workspace">
            <div className="page-heading">
              <div className="page-intro">
                <Eyebrow>{headings[page].over}</Eyebrow>
                <h1>{headings[page].title}</h1>
                <p>{headings[page].sub}</p>
              </div>
              <DateControl
                value={session.cutoff}
                onChange={(cutoff) => setSession((s) => ({ ...s, cutoff }))}
              />
            </div>
            {page === 'resumen' && (
              <>
                <Metrics calc={calc} />
                <Charts calc={calc} />
                <DepositTable calc={calc} onDetail={detail} onExport={onExport} />
                <button className="method-footnote" onClick={() => setDialog('guide')}>
                  <Info size={13} />
                  Interés {session.method === 'simple' ? 'simple' : 'compuesto'} diario · Fechas de
                  consignación y salida incluidas
                  <ChevronRight size={12} />
                </button>
              </>
            )}
            {page === 'consignaciones' && (
              <>
                <Metrics calc={calc} />
                <div className="section-topline">
                  <div className="section-kicker">
                    <span className="eyebrow-line" />
                    REGISTRO DE GIROS
                  </div>
                  <button className="button secondary" onClick={() => setDialog('add')}>
                    <Plus size={15} />
                    Nueva consignación
                  </button>
                </div>
                <DepositTable
                  calc={calc}
                  full
                  title="Consignaciones registradas"
                  onDetail={detail}
                  onExport={onExport}
                />
                <div className="page-note">
                  <Info size={16} />
                  <p>
                    Los giros mensuales de Giros.csv se registran el primer día de cada mes. Los giros
                    pendientes no se incluyen en los totales.
                  </p>
                </div>
              </>
            )}
            {page === 'tasas' && <RatesPage calc={calc} onGuide={() => setDialog('guide')} />}
            {page === 'reportes' && <ReportsPage calc={calc} onExport={onExport} onDetail={detail} />}
            <Footer />
          </main>
        </div>
      </div>
      {dialog === 'guide' && (
        <GuideDialog method={session.method} onMethod={setMethod} onClose={close} />
      )}
      {dialog === 'export' && <ExportDialog calc={calc} onClose={close} onToast={setToast} />}
      {(dialog === 'giros' || dialog === 'tasas') && (
        <SourceDialog
          source={dialog}
          onClose={close}
          onView={() => navigate(dialog === 'giros' ? 'consignaciones' : 'tasas')}
        />
      )}
      {(dialog === 'add' || dialog === 'edit') && (
        <DepositDialog
          cutoff={session.cutoff}
          original={dialog === 'edit' ? pos : undefined}
          onSave={saveDeposit}
          onRemove={(id) => {
            setSession((s) => ({ ...s, extra: s.extra.filter((d) => d.id !== id) }));
            setSelected(null);
            setToast('Consignación eliminada');
          }}
          onClose={close}
        />
      )}
      {dialog === 'detail' && pos && (
        <DetailDialog
          pos={pos}
          calc={calc}
          onClose={close}
          onEdit={session.extra.some((d) => d.id === pos.id) ? () => setDialog('edit') : undefined}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          {toast}
          <button aria-label="Cerrar aviso" onClick={() => setToast('')}>
            <X size={13} />
          </button>
        </div>
      )}
      <PrintReport calc={calc} />
    </>
  );
}

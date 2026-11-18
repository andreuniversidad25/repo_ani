import { useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChartNoAxesCombined,
  CircleHelp,
  Clock3,
  Download,
  FileBarChart2,
  FileSpreadsheet,
  FileText,
  Info,
  Layers2,
  Pencil,
  Printer,
  Sigma,
  Trash2,
  Wallet,
} from 'lucide-react';
import { girosCSV, originalDeposits, rates, tasasCSV } from '../data';
import {
  MAX_DATE,
  nextUncoveredDay,
  parseNumber,
  validISO,
  type Calculation,
  type Deposit,
  type Method,
  type Position,
} from '../lib/finance';
import { dateLabel, downloadFile, exportDaily, exportSummary, money, num, pct } from '../lib/format';
import { Modal } from './Modal';
import { exportInteractive } from '../lib/interactiveReport';
import { Evolution } from './Charts';
import { DailyTable } from './Tables';
export function GuideDialog({
  method,
  onMethod,
  onClose,
}: {
  method: Method;
  onMethod: (m: Method) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(method);
  return (
    <Modal title="Guía de cálculo" eyebrow="METODOLOGÍA" onClose={onClose}>
      <p className="modal-intro">
        Así se calcula el rendimiento de tu cuenta con los datos de los archivos cargados.
      </p>
      <div className="method-box">
        <h3>
          <Sigma size={16} />
          Método de interés
        </h3>
        <div className="segmented" aria-label="Método de cálculo">
          <button
            aria-pressed={draft === 'simple'}
            className={draft === 'simple' ? 'selected' : ''}
            onClick={() => setDraft('simple')}
          >
            Simple diario
          </button>
          <button
            aria-pressed={draft === 'compound'}
            className={draft === 'compound' ? 'selected' : ''}
            onClick={() => setDraft('compound')}
          >
            Compuesto diario
          </button>
        </div>
        <p>
          {draft === 'simple'
            ? 'Cada día, la tasa se aplica al capital original del giro, sin capitalizar los intereses.'
            : 'Cada día, la tasa se aplica al capital más los intereses acumulados hasta el día anterior.'}
        </p>
        <div className="formula">
          {draft === 'simple'
            ? 'Interés del día = capital × tasa diaria / 100'
            : 'Interés del día = saldo inicial del día × tasa diaria / 100'}
        </div>
      </div>
      <div className="guide-list">
        <div>
          <CalendarDays />
          <span>
            <strong>Fecha de consignación</strong>
            <p>
              Giros.csv indica mes y año. Se toma el primer día de ese mes como inicio. Los giros
              añadidos usan la fecha exacta ingresada.
            </p>
          </span>
        </div>
        <div>
          <Clock3 />
          <span>
            <strong>Periodo inclusivo</strong>
            <p>
              Se cuentan la fecha inicial y la fecha de salida, incluidos fines de semana. Los giros
              posteriores al corte no generan saldo ni intereses.
            </p>
          </span>
        </div>
        <div>
          <ChartNoAxesCombined />
          <span>
            <strong>Tasa nominal diaria</strong>
            <p>
              Se utiliza directamente «Tasa nominal» de Tasas.csv para cada día de vigencia. La tasa E.A.
              se muestra como referencia.
            </p>
          </span>
        </div>
        <div>
          <Wallet />
          <span>
            <strong>Precisión en COP</strong>
            <p>
              No se redondea entre días. El panel muestra pesos enteros; el detalle y los reportes
              conservan centavos. Los totales se obtienen antes de redondear los giros individuales. El
              retorno es interés total dividido por capital.
            </p>
          </span>
        </div>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          Cerrar
        </button>
        <button
          className="button green"
          onClick={() => {
            onMethod(draft);
            onClose();
          }}
        >
          <Check size={15} />
          Aplicar método
        </button>
      </div>
    </Modal>
  );
}
export function ExportDialog({
  calc,
  onClose,
  onToast,
}: {
  calc: Calculation;
  onClose: () => void;
  onToast: (s: string) => void;
}) {
  const [kind, setKind] = useState('summary');
  const options = [
    {
      id: 'summary',
      icon: FileSpreadsheet,
      label: 'Resumen por consignación',
      desc: 'Capital, días, intereses y saldo de cada giro.',
      ext: 'CSV',
    },
    {
      id: 'daily',
      icon: Layers2,
      label: 'Detalle diario por consignación',
      desc: 'Una fila por día y giro, con su tasa aplicada.',
      ext: 'CSV',
    },
    {
      id: 'html',
      icon: ChartNoAxesCombined,
      label: 'Reporte interactivo sin conexión',
      desc: 'Explora los gráficos y la tabla en un archivo HTML.',
      ext: 'HTML',
    },
    {
      id: 'print',
      icon: FileBarChart2,
      label: 'Informe con tablas y gráficos',
      desc: 'Imprime el informe o guárdalo como PDF.',
      ext: 'PDF',
    },
  ];
  function run() {
    if (kind === 'print') {
      onClose();
      setTimeout(() => window.print(), 100);
    } else if (kind === 'html') {
      exportInteractive(calc);
      onClose();
      onToast('Reporte interactivo descargado');
    } else {
      if (kind === 'daily') exportDaily(calc);
      else exportSummary(calc);
      onClose();
      onToast('Reporte CSV descargado');
    }
  }
  return (
    <Modal title="Exportar reporte" eyebrow="REPORTES DE LA CUENTA" onClose={onClose}>
      <p className="modal-intro">Elige el formato del reporte para la fecha de salida seleccionada.</p>
      <div className="export-summary">
        <span>
          <CalendarDays size={15} />
          {dateLabel(calc.cutoff)}
        </span>
        <i />
        <span>{calc.active.length} consignaciones</span>
      </div>
      <div className="export-options" role="radiogroup" aria-label="Tipo de reporte">
        {options.map((o) => (
          <button
            key={o.id}
            className={kind === o.id ? 'chosen' : ''}
            role="radio"
            aria-checked={kind === o.id}
            onClick={() => setKind(o.id)}
          >
            <span className="export-option-icon">
              <o.icon size={20} />
            </span>
            <span>
              <strong>{o.label}</strong>
              <small>{o.desc}</small>
            </span>
            <em>{o.ext}</em>
            <span className="radio-indicator" />
          </button>
        ))}
      </div>
      <div className="info-note">
        <Info size={15} />
        <span>
          {kind === 'print'
            ? 'En el diálogo de impresión, selecciona «Guardar como PDF» como destino.'
            : kind === 'html'
              ? 'Abre el archivo HTML descargado en tu navegador. Incluye los valores al corte y no necesita conexión.'
              : 'El CSV utiliza punto y coma como separador y coma decimal, compatible con Excel en español.'}
        </span>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="button green" onClick={run}>
          {kind === 'print' ? <Printer size={15} /> : <Download size={15} />}{' '}
          {kind === 'print'
            ? 'Imprimir / Guardar PDF'
            : kind === 'html'
              ? 'Descargar HTML'
              : 'Descargar CSV'}
        </button>
      </div>
    </Modal>
  );
}
export function SourceDialog({
  source,
  onClose,
  onView,
}: {
  source: 'giros' | 'tasas';
  onClose: () => void;
  onView: () => void;
}) {
  const giro = source === 'giros',
    name = giro ? 'Giros.csv' : 'Tasas.csv';
  return (
    <Modal title={name} eyebrow="FUENTE DE DATOS" onClose={onClose}>
      <div className="source-summary">
        <span className="source-big-icon">
          <FileSpreadsheet size={26} />
        </span>
        <div>
          <strong>Archivo de origen</strong>
          <p>
            {giro
              ? `${originalDeposits.length} consignaciones mensuales`
              : `${rates.length} intervalos de vigencia`}
          </p>
        </div>
        <span className="tag success">
          <CheckCircle2 size={12} />
          Cargado
        </span>
      </div>
      <p className="modal-intro">
        {giro
          ? 'Capitales en pesos colombianos. Las fechas mensuales se interpretan como el primer día del mes.'
          : 'Tasas efectivas anuales y tasas nominales diarias. Para el cálculo se utiliza el porcentaje diario del intervalo correspondiente.'}
      </p>
      <h3 className="small-heading">Vista previa del archivo</h3>
      <div className="source-preview table-scroll">
        <table>
          <thead>
            <tr>
              {(giro ? ['Fecha inicial', 'Valor consignado'] : ['Desde', 'Hasta', 'Tasa diaria']).map(
                (h) => (
                  <th key={h}>{h}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {giro
              ? originalDeposits.slice(0, 4).map((d) => (
                  <tr key={d.id}>
                    <td>{dateLabel(d.date)}</td>
                    <td>{money(d.amount, 2)}</td>
                  </tr>
                ))
              : rates.slice(-4).map((r) => (
                  <tr key={r.from}>
                    <td>{dateLabel(r.from)}</td>
                    <td>{dateLabel(r.to)}</td>
                    <td>{num(r.daily, 9, 0)} %</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="modal-actions">
        <button
          className="button secondary"
          onClick={() => downloadFile(name, giro ? girosCSV : tasasCSV)}
        >
          <Download size={14} />
          Archivo original
        </button>
        <button className="button green" onClick={onView}>
          Ver {giro ? 'consignaciones' : 'tasas'}
          <ArrowRight size={14} />
        </button>
      </div>
    </Modal>
  );
}
export function DepositDialog({
  cutoff,
  original,
  onSave,
  onRemove,
  onClose,
}: {
  cutoff: string;
  original?: Deposit;
  onSave: (a: number, d: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [date, setDate] = useState(original?.date || cutoff),
    [amount, setAmount] = useState(original ? num(original.amount, 2) : ''),
    [error, setError] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!validISO(date) || date > MAX_DATE)
        throw new Error('Selecciona una fecha válida hasta el 31 dic 2026.');
      const a = parseNumber(amount);
      if (a < 0.01 || a > 1e13 || (amount.trim().split(',')[1]?.length || 0) > 2)
        throw new Error(
          'Ingresa un capital positivo de hasta 10 billones de COP, con máximo dos decimales.',
        );
      const gap = nextUncoveredDay(rates, date, MAX_DATE);
      if (gap)
        throw new Error(
          `No hay cobertura de tasas para el ${dateLabel(gap)}. Elige una fecha posterior.`,
        );
      onSave(a, date);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revisa los datos ingresados.');
    }
  };
  if (confirmRemoval && original)
    return (
      <Modal title={`¿Eliminar ${original.id}?`} eyebrow="CONFIRMAR ELIMINACIÓN" onClose={onClose}>
        <p className="modal-intro">
          Se eliminará de este navegador la consignación del {dateLabel(original.date)} por{' '}
          {money(original.amount, 2)}. El panel recalculará los totales. El archivo Giros.csv no se
          modificará.
        </p>
        <div className="modal-actions">
          <button className="button secondary" onClick={() => setConfirmRemoval(false)}>
            Conservar giro
          </button>
          <button
            className="button danger"
            onClick={() => {
              onRemove(original.id);
              onClose();
            }}
          >
            <Trash2 size={14} />
            Confirmar eliminación
          </button>
        </div>
      </Modal>
    );
  return (
    <Modal
      title={original ? 'Editar consignación' : 'Nueva consignación'}
      eyebrow="MOVIMIENTOS DE LA CUENTA"
      onClose={onClose}
    >
      <p className="modal-intro">
        Registra el capital y su fecha de ingreso. Los intereses se calcularán con las tasas diarias
        vigentes.
      </p>
      <form onSubmit={submit} className="deposit-form">
        <label>
          Fecha de consignación
          <input
            type="date"
            required
            max={MAX_DATE}
            min={rates[0].from}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Capital consignado (COP)
          <input
            type="text"
            inputMode="decimal"
            required
            placeholder="Ej. 1.500.000,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <div className="info-note">
          <Info size={15} />
          <span>
            Este giro se guarda en este navegador. Los archivos de origen permanecen sin cambios.
          </span>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {original && (
            <button
              type="button"
              className="button remove-deposit"
              onClick={() => setConfirmRemoval(true)}
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          )}
          <button type="button" className="button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="button green">
            <Check size={15} />
            Guardar consignación
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function DetailDialog({
  pos,
  calc,
  onClose,
  onEdit,
}: {
  pos: Position;
  calc: Calculation;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const [tab, setTab] = useState('overview');
  return (
    <Modal title={pos.id} eyebrow="DETALLE DE CONSIGNACIÓN" wide onClose={onClose}>
      <div className="detail-period">
        <span>
          <CalendarDays size={14} />
          {dateLabel(pos.date)} — {dateLabel(calc.cutoff)}
        </span>
        <span className={'tag ' + (pos.days ? 'success' : 'neutral')}>
          {pos.days ? num(pos.days) + ' días liquidados' : 'Pendiente al corte'}
        </span>
      </div>
      <div className="detail-metrics">
        {[
          ['Capital consignado', money(pos.amount, 2)],
          ['Intereses generados', money(pos.interest, 2)],
          ['Saldo al corte', money(pos.balance, 2)],
        ].map(([label, val], i) => (
          <div key={label}>
            <small>{label}</small>
            <strong className={i === 1 ? 'interest-text' : ''}>{val}</strong>
          </div>
        ))}
      </div>
      {pos.days > 0 ? (
        <>
          <div className="tab-bar">
            <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
              Rendimiento
            </button>
            <button className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>
              Detalle diario
            </button>
          </div>
          {tab === 'overview' ? (
            <Evolution points={pos.history} title="Rendimiento del giro" />
          ) : (
            <DailyTable points={pos.history} compact />
          )}
          <div className="detail-stats">
            <span>
              Retorno sobre el capital <strong>{pct((pos.interest / pos.amount) * 100)}</strong>
            </span>
            <span>
              Método <strong>{calc.method === 'simple' ? 'Simple diario' : 'Compuesto diario'}</strong>
            </span>
          </div>
        </>
      ) : (
        <div className="info-note">
          <CircleHelp size={16} />
          La consignación es posterior a la fecha de salida seleccionada.
        </div>
      )}
      <div className="modal-actions">
        {onEdit && (
          <button className="button secondary" onClick={onEdit}>
            <Pencil size={14} />
            Editar
          </button>
        )}
        <button className="button secondary" onClick={onClose}>
          Cerrar
        </button>
        <button className="button green" disabled={!pos.days} onClick={() => exportDaily(calc, pos)}>
          <FileText size={14} />
          Exportar detalle diario
        </button>
      </div>
    </Modal>
  );
}

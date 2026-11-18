import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  FileBarChart2,
  FileSpreadsheet,
  FolderOpen,
  Landmark,
  Layers2,
  LayoutDashboard,
  Menu,
  PanelLeft,
  Percent,
  ShieldCheck,
  X,
} from 'lucide-react';
import { originalDeposits, rates } from '../data';
export type Page = 'resumen' | 'consignaciones' | 'tasas' | 'reportes';
export const pageNames: Record<Page, string> = {
  resumen: 'Panel general',
  consignaciones: 'Consignaciones',
  tasas: 'Tasas de interés',
  reportes: 'Reportes',
};
export function Logo() {
  return (
    <div className="brand" aria-label="Rendia">
      <svg viewBox="0 0 38 34" fill="none" aria-hidden="true">
        <path d="M1.5 26.8 9.8 12.5h8.4L9.9 26.8z" fill="#479b81" />
        <path d="M11.8 26.8 25.4 3.2h8.5L20.2 26.8z" fill="#72edc4" />
        <path d="m22.2 26.8 8.1-14.1 4.3 7.3-3.9 6.8z" fill="#56caa4" />
      </svg>
      <span>
        Rendia<span className="brand-period">.</span>
      </span>
    </div>
  );
}
const navIcons = {
  resumen: LayoutDashboard,
  consignaciones: Layers2,
  tasas: Percent,
  reportes: FileBarChart2,
};
export function Sidebar({
  page,
  method,
  open,
  onClose,
  onPage,
  onSource,
  onGuide,
}: {
  page: Page;
  method: 'simple' | 'compound';
  open: boolean;
  onClose: () => void;
  onPage: (p: Page) => void;
  onSource: (s: 'giros' | 'tasas') => void;
  onGuide: () => void;
}) {
  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="Cerrar navegación" onClick={onClose} />}
      <aside className={'sidebar' + (open ? ' is-open' : '')}>
        <div className="brand-row">
          <Logo />
          <button className="icon-button mobile-close" aria-label="Cerrar navegación" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="nav-block">
          <div className="sidebar-label">ESPACIO DE TRABAJO</div>
          <nav aria-label="Navegación principal">
            {(Object.keys(pageNames) as Page[]).map((key) => {
              const Icon = navIcons[key];
              return (
                <a
                  key={key}
                  href={'#/' + key}
                  className={'nav-item ' + (page === key ? 'active' : '')}
                  aria-current={page === key ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onPage(key);
                    onClose();
                  }}
                >
                  <Icon size={18} strokeWidth={1.7} />
                  <span>{pageNames[key]}</span>
                  {page === key && <span className="nav-active-dot" />}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="source-block">
          <div className="sidebar-label">FUENTES DE DATOS</div>
          {(['giros', 'tasas'] as const).map((type, i) => (
            <button
              key={type}
              className="source-link"
              onClick={() => {
                onSource(type);
                onClose();
              }}
            >
              <span className={'file-icon file-' + type}>
                <FileSpreadsheet size={17} strokeWidth={1.55} />
              </span>
              <span>
                <strong>{i === 0 ? 'Giros.csv' : 'Tasas.csv'}</strong>
                <small>
                  {i === 0
                    ? originalDeposits.length + ' consignaciones'
                    : rates.length + ' periodos de tasa'}
                </small>
              </span>
              <span className="source-verified" title="Archivo cargado">
                <Check size={9} strokeWidth={3} />
              </span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button
            className="guide-link"
            onClick={() => {
              onGuide();
              onClose();
            }}
          >
            <span className="guide-icon">
              <BookOpen size={16} />
            </span>
            <span className="guide-text">
              <strong>Guía de cálculo</strong>
              <small>Interés {method === 'simple' ? 'simple' : 'compuesto'} diario</small>
            </span>
            <ArrowUpRight size={13} />
          </button>
          <div className="account-block">
            <div className="account-icon">
              <Landmark size={19} strokeWidth={1.5} />
            </div>
            <div>
              <strong>Cuenta principal</strong>
              <small>Espacio financiero</small>
            </div>
            <ShieldCheck size={15} className="account-shield" />
          </div>
        </div>
      </aside>
    </>
  );
}
export function Topbar({ page, onMenu }: { page: Page; onMenu: () => void }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button className="icon-button mobile-menu" aria-label="Abrir navegación" onClick={onMenu}>
          <Menu size={20} />
        </button>
        <span className="mobile-brand">
          <Logo />
        </span>
        <PanelLeft size={16} className="breadcrumb-icon" />
        <span className="workspace-label">Espacio de trabajo</span>
        <ChevronRight size={12} className="crumb-chevron" />
        <strong>{pageNames[page]}</strong>
      </div>
      <div className="topbar-info">
        <span className="data-status">
          <i />
          Datos cargados
        </span>
        <span className="topbar-divider" />
        <span className="currency-badge">
          <span className="colombian-flag" />
          COP
        </span>
      </div>
    </header>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow">
      <span className="eyebrow-line" />
      {children}
    </div>
  );
}
export function Footer() {
  return (
    <footer className="workspace-footer">
      <span>
        <ShieldCheck size={13} />
        Cálculos en pesos colombianos (COP)
      </span>
      <span>
        <ChartNoAxesCombined size={13} />
        Rendia Analytics
      </span>
    </footer>
  );
}
export function NoData({
  title = 'Sin consignaciones al corte',
  text = 'Selecciona una fecha de salida posterior a la primera consignación.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty-state">
      <FolderOpen size={28} strokeWidth={1.4} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

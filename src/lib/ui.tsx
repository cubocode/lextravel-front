import { FileSpreadsheet, Printer, X } from 'lucide-react'
import { fmtDate, money, pct, today } from './format'
import type { ReactNode } from 'react'
import type { TravelPackage } from './mock'

export const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const statusColors: Record<string, string> = {
  Presupuesto: 'bg-slate-100 text-slate-700',
  Confirmado: 'bg-blue-50 text-azul ring-1 ring-azul/20',
  'En viaje': 'bg-magenta/10 text-magenta-dark',
  Cerrado: 'bg-emerald-50 text-emerald-700',
  Cancelado: 'bg-red-50 text-red-700',
  Nueva: 'bg-magenta text-white',
  Contactado: 'bg-blue-50 text-azul',
  Cotizada: 'bg-amber-50 text-amber-700',
  Cerrada: 'bg-slate-100 text-slate-600',
  Pagado: 'bg-emerald-50 text-emerald-700',
  'Al día': 'bg-blue-50 text-azul',
  Atrasado: 'bg-red-50 text-red-700',
}

export function Badge({ children }: { children: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[children] ?? 'bg-slate-100'}`}>{children}</span>
}

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <h2 className="text-sm font-bold text-azul">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${accent ? 'border-magenta/30 bg-magenta text-white' : 'border-slate-200 bg-white'}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-white/80' : 'text-slate-500'}`}>{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accent ? '' : 'text-azul'}`}>{value}</div>
      {hint && <div className={`mt-0.5 text-xs ${accent ? 'text-white/80' : 'text-slate-500'}`}>{hint}</div>}
    </div>
  )
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-azul-dark/50 p-4 pt-12" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-lg bg-white shadow-xl`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="font-bold text-azul">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={18} /></button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  )
}

const gradients: Record<string, string> = {
  'Egresados secundaria': 'from-magenta via-azul to-azul-dark',
  'Egresados primaria': 'from-sky-500 via-azul to-magenta',
  'Viaje educativo': 'from-emerald-600 via-azul to-azul-dark',
  Turismo: 'from-cyan-500 via-azul to-azul-dark',
}

/** Portada del paquete: foto subida o, si no hay, un degradé con el destino. */
export function PackageCover({ pkg, className = '' }: { pkg: TravelPackage; className?: string }) {
  if (pkg.image?.startsWith('data:image/')) {
    return <img src={pkg.image} alt={pkg.title} className={`object-cover ${className}`} />
  }
  return (
    <div className={`relative flex items-end overflow-hidden bg-gradient-to-br ${gradients[pkg.region] ?? 'from-azul to-magenta'} ${className}`}>
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-magenta/40" />
      <span className="relative p-4 text-2xl font-extrabold leading-tight text-white drop-shadow">{pkg.destination}</span>
    </div>
  )
}

/* ---------- Reportes: tabla imprimible y exportable a Excel ---------- */
export type ColKind = 'text' | 'usd' | 'ars' | 'int' | 'pct'
export interface Col { label: string; kind?: ColKind }
export type Cell = string | number

const fmtCell = (v: Cell, k: ColKind = 'text') =>
  typeof v !== 'number' ? v : k === 'usd' ? money(v) : k === 'ars' ? money(v, 'ARS') : k === 'pct' ? pct(v) : v.toLocaleString('es-AR')

/** Descarga un CSV que Excel abre directo (separador ; y coma decimal). Neutraliza fórmulas en celdas de texto. */
export function downloadExcel(name: string, cols: Col[], rows: Cell[][], totals?: Cell[]) {
  const cell = (v: Cell) => {
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',')
    const s = /^[=+\-@]/.test(v) ? `'${v}` : v
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = [cols.map((c) => c.label), ...rows, ...(totals ? [totals] : [])].map((r) => r.map(cell).join(';'))
  const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = `${name}.csv`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Report({ title, subtitle, cols, rows, totals, fileName, empty = 'Sin datos para mostrar.' }: {
  title: string; subtitle?: string; cols: Col[]; rows: Cell[][]; totals?: Cell[]; fileName: string; empty?: string
}) {
  return (
    <div className="print-area rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <img src={logoUrl} alt="Lex Travel" className="h-12" />
        <div className="text-right">
          <h2 className="text-lg font-bold text-azul">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          <p className="text-xs text-slate-400">Emitido el {fmtDate(today())} · {rows.length} registros</p>
        </div>
      </div>
      <div className="no-print mb-3 flex justify-end gap-2">
        <button className="btn-ghost" onClick={() => window.print()} disabled={!rows.length}><Printer size={16} /> Imprimir / PDF</button>
        <button className="btn-primary" onClick={() => downloadExcel(fileName, cols, rows, totals)} disabled={!rows.length}><FileSpreadsheet size={16} /> Exportar a Excel</button>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr>{cols.map((c) => <th key={c.label} className={c.kind && c.kind !== 'text' ? 'num' : ''}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className={cols[j].kind && cols[j].kind !== 'text' ? 'num' : ''}>{fmtCell(v, cols[j].kind)}</td>)}</tr>)}
            {totals && rows.length > 0 && <tr className="bg-slate-50 font-bold">{totals.map((v, j) => <td key={j} className={cols[j].kind && cols[j].kind !== 'text' ? 'num' : ''}>{fmtCell(v, cols[j].kind)}</td>)}</tr>}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-slate-500">{empty}</p>}
      </div>
      <p className="mt-4 text-[10px] text-slate-400">Lex Travel · Sistema de gestión · CuboCode</p>
    </div>
  )
}

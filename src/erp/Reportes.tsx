import { useState } from 'react'
import { useStore } from '../lib/store'
import { fileTotals, paxStatus, supplierBalances } from '../lib/calc'
import { suppliers, type TravelFile } from '../lib/mock'
import { fmtDate, round2, today } from '../lib/format'
import { Field, Report, type Cell, type Col } from '../lib/ui'

const REPORTS = [
  { id: 'cuenta', label: 'Estado de cuenta del grupo', hint: 'Pagos y saldo de cada alumno' },
  { id: 'morosos', label: 'Cuotas atrasadas', hint: 'Alumnos para hacer seguimiento' },
  { id: 'pasajeros', label: 'Listado de pasajeros', hint: 'Para transporte, hotel y seguro' },
  { id: 'cobranzas', label: 'Cobranzas por período', hint: 'Recibos entre dos fechas' },
  { id: 'rentabilidad', label: 'Rentabilidad por file', hint: 'Venta, costo y margen' },
  { id: 'proveedores', label: 'Saldos con proveedores', hint: 'Lo que falta pagar' },
  { id: 'comisiones', label: 'Comisiones de promotores', hint: 'Sobre el margen de sus grupos' },
] as const
type RId = (typeof REPORTS)[number]['id']

const age = (birth: string, at: string) => {
  const [by, bm, bd] = birth.split('-').map(Number), [y, m, d] = at.split('-').map(Number)
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0)
}

export default function Reportes() {
  const files = useStore((s) => s.files)
  const clients = useStore((s) => s.clients)
  const promoters = useStore((s) => s.promoters)
  const [rid, setRid] = useState<RId>('cuenta')
  const active = files.filter((f) => f.status !== 'Cancelado')
  const [fid, setFid] = useState(active[0]?.id ?? '')
  const [from, setFrom] = useState(today().slice(0, 8) + '01')
  const [to, setTo] = useState(today())
  const ym = today().slice(0, 7)
  const group = (f: TravelFile) => `${clients.find((c) => c.id === f.clientId)?.name ?? ''} · ${f.course}`
  const file = files.find((f) => f.id === fid)
  const sold = active.filter((f) => f.status !== 'Presupuesto')

  let title = '', subtitle = '', cols: Col[] = [], rows: Cell[][] = [], totals: Cell[] | undefined
  const sum = (i: number) => round2(rows.reduce((a, r) => a + (r[i] as number), 0))

  switch (rid) {
    case 'cuenta': {
      title = 'Estado de cuenta del grupo'
      subtitle = file ? `${file.code} · ${group(file)} · ${file.destination}` : ''
      cols = [{ label: 'Alumno' }, { label: 'DNI' }, { label: 'Tutor' }, { label: 'Teléfono' }, { label: 'Cuotas pagas', kind: 'int' }, { label: 'Pagado', kind: 'usd' }, { label: 'Saldo', kind: 'usd' }, { label: 'Estado' }]
      rows = file ? paxStatus(file, ym).map((s) => [s.pax.name, s.pax.doc.replace('DNI ', ''), s.pax.tutor ?? '', s.pax.phone ?? '', Math.min(s.cuotasPagas, file.installments), s.paid, Math.max(s.balance, 0), s.state]) : []
      totals = ['Total', '', '', '', '', sum(5), sum(6), '']
      break
    }
    case 'morosos': {
      title = 'Alumnos con cuotas atrasadas'
      subtitle = 'Grupos confirmados · cuotas vencidas al mes actual'
      cols = [{ label: 'Grupo' }, { label: 'Destino' }, { label: 'Alumno' }, { label: 'Tutor' }, { label: 'Teléfono' }, { label: 'Pagas', kind: 'int' }, { label: 'Vencidas', kind: 'int' }, { label: 'Saldo', kind: 'usd' }]
      rows = active.filter((f) => f.status === 'Confirmado').flatMap((f) => paxStatus(f, ym).filter((s) => s.state === 'Atrasado')
        .map((s) => [group(f), f.destination, s.pax.name, s.pax.tutor ?? '', s.pax.phone ?? '', s.cuotasPagas, s.expected, s.balance]))
      totals = ['Total', '', '', '', '', '', '', sum(7)]
      break
    }
    case 'pasajeros': {
      title = 'Listado de pasajeros'
      subtitle = file ? `${file.code} · ${group(file)} · ${file.destination} · ${fmtDate(file.travelDate)} al ${fmtDate(file.returnDate)}` : ''
      cols = [{ label: 'N.º', kind: 'int' }, { label: 'Apellido y nombre' }, { label: 'DNI' }, { label: 'Nacimiento' }, { label: 'Edad al viajar', kind: 'int' }, { label: 'Tutor' }, { label: 'Teléfono de emergencia' }]
      rows = file ? file.pax.map((p, i) => [i + 1, p.name, p.doc.replace('DNI ', ''), fmtDate(p.birth), age(p.birth, file.travelDate), p.tutor ?? '', p.phone ?? '']) : []
      break
    }
    case 'cobranzas': {
      title = 'Cobranzas por período'
      subtitle = `Del ${fmtDate(from)} al ${fmtDate(to)}`
      cols = [{ label: 'Fecha' }, { label: 'Grupo' }, { label: 'Alumno' }, { label: 'Medio' }, { label: 'Moneda' }, { label: 'Importe', kind: 'int' }, { label: 'TC', kind: 'int' }, { label: 'Acreditado USD', kind: 'usd' }]
      rows = files.flatMap((f) => f.receipts.filter((r) => r.date >= from && r.date <= to).map((r) => ({ f, r })))
        .sort((a, b) => a.r.date.localeCompare(b.r.date))
        .map(({ f, r }) => [fmtDate(r.date), group(f), f.pax.find((p) => p.doc === r.paxDoc)?.name ?? 'Grupal', r.method, r.currency, r.amount, r.currency === 'ARS' ? r.rate : 1, r.usd])
      totals = ['Total', '', '', '', '', '', '', sum(7)]
      break
    }
    case 'rentabilidad': {
      title = 'Rentabilidad por file'
      subtitle = 'Files confirmados, en viaje y cerrados'
      cols = [{ label: 'File' }, { label: 'Grupo' }, { label: 'Destino' }, { label: 'Estado' }, { label: 'Alumnos', kind: 'int' }, { label: 'Venta', kind: 'usd' }, { label: 'Costo', kind: 'usd' }, { label: 'Margen bruto', kind: 'usd' }, { label: 'Margen neto', kind: 'usd' }, { label: '% margen', kind: 'pct' }]
      rows = sold.map((f) => { const t = fileTotals(f); return [f.code, group(f), f.destination, f.status, f.pax.length, t.sale, t.cost, t.gross, t.net, t.marginPct] })
      totals = ['Total', '', '', '', sum(4), sum(5), sum(6), sum(7), sum(8), sum(5) ? sum(7) / sum(5) : 0]
      break
    }
    case 'proveedores': {
      title = 'Saldos con proveedores'
      subtitle = 'Todos los files activos'
      cols = [{ label: 'Proveedor' }, { label: 'Rubro' }, { label: 'Files', kind: 'int' }, { label: 'Costo total', kind: 'usd' }, { label: 'Pagado', kind: 'usd' }, { label: 'Saldo a pagar', kind: 'usd' }]
      rows = suppliers.map((s) => {
        const xs = sold.flatMap((f) => supplierBalances(f).filter((b) => b.supplier.id === s.id))
        return [s.name, s.kind, xs.length, round2(xs.reduce((a, b) => a + b.cost, 0)), round2(xs.reduce((a, b) => a + b.paid, 0)), round2(xs.reduce((a, b) => a + b.balance, 0))] as Cell[]
      }).filter((r) => (r[2] as number) > 0)
      totals = ['Total', '', '', sum(3), sum(4), sum(5)]
      break
    }
    case 'comisiones': {
      title = 'Comisiones de promotores'
      subtitle = 'Sobre el margen bruto de los grupos confirmados, en viaje y cerrados'
      cols = [{ label: 'Promotor' }, { label: 'Zona' }, { label: 'Grupos', kind: 'int' }, { label: 'Alumnos', kind: 'int' }, { label: 'Ventas', kind: 'usd' }, { label: 'Margen bruto', kind: 'usd' }, { label: '% comisión', kind: 'pct' }, { label: 'Comisión', kind: 'usd' }]
      rows = promoters.map((p) => {
        const mine = sold.filter((f) => f.seller === p.name), t = mine.map(fileTotals)
        const gross = round2(t.reduce((a, x) => a + x.gross, 0))
        return [p.name, p.zone, mine.length, mine.reduce((a, f) => a + f.pax.length, 0), round2(t.reduce((a, x) => a + x.sale, 0)), gross, p.commission, round2(gross * p.commission)]
      })
      totals = ['Total', '', sum(2), sum(3), sum(4), sum(5), '', sum(7)]
      break
    }
  }

  const needsFile = rid === 'cuenta' || rid === 'pasajeros'
  return (
    <div className="space-y-4">
      <h1 className="no-print text-xl font-bold text-azul">Reportes</h1>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr] [&>*]:min-w-0">
        <nav className="no-print flex gap-2 overflow-x-auto lg:flex-col">
          {REPORTS.map((r) => (
            <button key={r.id} onClick={() => setRid(r.id)} className={`shrink-0 rounded-lg border px-3 py-2 text-left ${rid === r.id ? 'border-magenta bg-magenta text-white' : 'border-slate-200 bg-white hover:border-azul/40'}`}>
              <div className="text-sm font-semibold">{r.label}</div>
              <div className={`text-xs ${rid === r.id ? 'text-white/80' : 'text-slate-500'}`}>{r.hint}</div>
            </button>
          ))}
        </nav>
        <div className="space-y-3">
          {(needsFile || rid === 'cobranzas') && (
            <div className="no-print flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3">
              {needsFile && (
                <Field label="Grupo" className="min-w-0 flex-1">
                  <select value={fid} onChange={(e) => setFid(e.target.value)} className="inp">
                    {active.map((f) => <option key={f.id} value={f.id}>{f.code} · {group(f)} → {f.destination}</option>)}
                  </select>
                </Field>
              )}
              {rid === 'cobranzas' && <>
                <Field label="Desde"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="inp" /></Field>
                <Field label="Hasta"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="inp" /></Field>
              </>}
            </div>
          )}
          <Report title={title} subtitle={subtitle} cols={cols} rows={rows} totals={totals} fileName={`${rid}-${today()}`} />
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { fileTotals, paxStatus } from '../lib/calc'
import { MONTHLY_SALES } from '../lib/mock'
import { fmtDate, money, money0, today } from '../lib/format'
import { Badge, Card, Kpi } from '../lib/ui'

export default function Dashboard() {
  const files = useStore((s) => s.files)
  const inquiries = useStore((s) => s.inquiries)
  const clients = useStore((s) => s.clients)
  const active = files.filter((f) => f.status !== 'Cancelado')
  const t = active.map((f) => ({ f, ...fileTotals(f) }))
  const confirmed = t.filter((x) => x.f.status !== 'Presupuesto')
  const sum = (k: 'sale' | 'gross' | 'clientBalance' | 'supplierBalance' | 'net') => confirmed.reduce((a, x) => a + x[k], 0)
  const upcoming = t.filter((x) => x.f.travelDate >= today() && x.f.status !== 'Presupuesto').sort((a, b) => a.f.travelDate.localeCompare(b.f.travelDate)).slice(0, 5)
  const max = Math.max(...MONTHLY_SALES.map((m) => m.usd))
  const late = confirmed.filter((x) => x.f.status === 'Confirmado').flatMap((x) => paxStatus(x.f, today().slice(0, 7))).filter((s) => s.state === 'Atrasado').length

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-azul">Tablero</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Ventas en files" value={money0(sum('sale'))} hint={`${confirmed.length} grupos · ${confirmed.reduce((a, x) => a + x.f.pax.length, 0)} alumnos`} />
        <Kpi label="Margen bruto" value={money0(sum('gross'))} hint={`Neto estimado ${money0(sum('net'))}`} />
        <Kpi label="A cobrar a familias" value={money0(sum('clientBalance'))} hint={`${late} alumnos con cuotas atrasadas`} />
        <Kpi label="A pagar a proveedores" value={money0(sum('supplierBalance'))} />
        <Kpi accent label="Consultas web nuevas" value={String(inquiries.filter((q) => q.status === 'Nueva').length)} hint={`${t.filter((x) => x.f.status === 'Presupuesto').length} presupuestos abiertos`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
        <Card title="Ventas últimos 6 meses (USD)">
          <div className="flex h-56 items-end gap-3 px-5 pb-4 pt-6">
            {MONTHLY_SALES.map((m, i) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] font-semibold tabular-nums text-slate-600">{money0(m.usd).replace('US$ ', '')}</span>
                <div className={`w-full rounded-t ${i === MONTHLY_SALES.length - 1 ? 'bg-magenta' : 'bg-azul'}`} style={{ height: `${(m.usd / max) * 150}px` }} />
                <span className="text-xs text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Próximas salidas" action={<Link to="/admin/files" className="text-xs font-semibold text-magenta">Ver files →</Link>}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Salida</th><th>File</th><th>Colegio / curso</th><th>Destino</th><th className="num">Alumnos</th><th className="num">Saldo cliente</th><th className="num">Saldo proveedor</th></tr></thead>
              <tbody>
                {upcoming.map(({ f, clientBalance, supplierBalance }) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td>{fmtDate(f.travelDate)}</td>
                    <td><Link to={`/admin/files/${f.id}`} className="font-semibold text-azul hover:text-magenta">{f.code}</Link></td>
                    <td><div>{clients.find((c) => c.id === f.clientId)?.name}</div><div className="text-xs text-slate-500">{f.course}</div></td>
                    <td>{f.destination}</td>
                    <td className="num">{f.pax.length}</td>
                    <td className={`num ${clientBalance > 0 ? 'font-semibold text-magenta' : 'text-emerald-600'}`}>{money(clientBalance)}</td>
                    <td className={`num ${supplierBalance > 0 ? 'font-semibold text-amber-600' : 'text-emerald-600'}`}>{money(supplierBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Últimas consultas desde la web" action={<Link to="/admin/consultas" className="text-xs font-semibold text-magenta">Ver todas →</Link>}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Mensaje</th><th>Estado</th></tr></thead>
            <tbody>
              {inquiries.slice(0, 4).map((q) => (
                <tr key={q.id}><td>{fmtDate(q.date)}</td><td className="font-medium">{q.name}</td><td className="max-w-md truncate text-slate-600">{q.message}</td><td><Badge>{q.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

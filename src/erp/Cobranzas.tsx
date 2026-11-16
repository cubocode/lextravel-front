import { useState } from 'react'
import { CircleDollarSign, Printer } from 'lucide-react'
import { useStore } from '../lib/store'
import { paxStatus } from '../lib/calc'
import type { Receipt, TravelFile } from '../lib/mock'
import { fmtDate, money, today } from '../lib/format'
import { Card, Field, Kpi } from '../lib/ui'
import { CobroModal } from './Files'
import { ReceiptModal, receiptNumber } from './modals'

export default function Cobranzas() {
  const files = useStore((s) => s.files)
  const clients = useStore((s) => s.clients)
  const open = files.filter((f) => f.status === 'Confirmado' || f.status === 'Presupuesto' || f.status === 'En viaje')
  const [fid, setFid] = useState(open[0]?.id ?? '')
  const [cobro, setCobro] = useState(false)
  const [rec, setRec] = useState<{ fileId: string; r: Receipt } | null>(null)
  const [from, setFrom] = useState(today().slice(0, 8) + '01')
  const [to, setTo] = useState(today())
  const [q, setQ] = useState('')

  const ym = today().slice(0, 7)
  const groupName = (f: TravelFile) => `${clients.find((c) => c.id === f.clientId)?.name ?? ''} · ${f.course}`
  const all = files.flatMap((f) => f.receipts.map((r) => ({ f, r, pax: f.pax.find((p) => p.doc === r.paxDoc) })))
  const inRange = all.filter(({ r }) => r.date >= from && r.date <= to)
  const rows = inRange.filter(({ f, pax }) => `${pax?.name ?? ''} ${pax?.doc ?? ''} ${groupName(f)}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.r.date.localeCompare(a.r.date))
  const sumUsd = (xs: typeof all) => xs.reduce((a, x) => a + x.r.usd, 0)
  const todayRows = all.filter(({ r }) => r.date === today())
  const file = files.find((f) => f.id === fid)
  const recFile = rec && files.find((f) => f.id === rec.fileId)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-azul">Cobranzas</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Cobrado hoy" value={money(sumUsd(todayRows))} hint={`${todayRows.length} recibos`} />
        <Kpi label="Cobrado en el período" value={money(sumUsd(inRange))} hint={`${inRange.length} recibos`} />
        <Kpi label="En pesos (período)" value={money(inRange.filter((x) => x.r.currency === 'ARS').reduce((a, x) => a + x.r.amount, 0), 'ARS')} />
        <Kpi accent label="Alumnos con cuotas atrasadas" value={String(files.filter((f) => f.status === 'Confirmado').flatMap((f) => paxStatus(f, ym)).filter((s) => s.state === 'Atrasado').length)} hint="Detalle en Reportes" />
      </div>

      <Card title="Registrar pago de un alumno">
        <div className="flex flex-wrap items-end gap-3 p-4">
          <Field label="Grupo" className="min-w-0 flex-1">
            <select value={fid} onChange={(e) => setFid(e.target.value)} className="inp">
              {open.map((f) => <option key={f.id} value={f.id}>{f.code} · {groupName(f)} → {f.destination}</option>)}
            </select>
          </Field>
          <button className="btn-accent" disabled={!file} onClick={() => setCobro(true)}><CircleDollarSign size={16} /> Registrar cobro</button>
        </div>
      </Card>

      <Card title="Recibos emitidos" action={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="inp w-36 py-1 text-xs" />
          <span>a</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="inp w-36 py-1 text-xs" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Alumno, DNI, colegio…" className="inp w-44 py-1 text-xs" />
        </div>
      }>
        <div className="max-h-[60vh] overflow-auto">
          <table className="tbl">
            <thead className="sticky top-0"><tr><th>Fecha</th><th>Recibo</th><th>Alumno</th><th>Grupo</th><th>Medio</th><th className="num">Importe</th><th className="num">TC</th><th className="num">Acreditado</th><th></th></tr></thead>
            <tbody>
              {rows.map(({ f, r, pax }) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.date)}</td><td className="font-mono text-xs">{receiptNumber(f, r)}</td>
                  <td className="font-medium">{pax?.name ?? 'Grupal'}</td><td className="text-slate-600">{groupName(f)}</td><td>{r.method}</td>
                  <td className="num">{money(r.amount, r.currency)}</td><td className="num text-slate-500">{r.currency === 'ARS' ? r.rate : '—'}</td><td className="num font-semibold">{money(r.usd)}</td>
                  <td><button onClick={() => setRec({ fileId: f.id, r })} title="Ver / imprimir recibo" className="text-slate-400 hover:text-azul"><Printer size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay recibos en el período.</p>}
        </div>
      </Card>

      {cobro && file && <CobroModal file={file} students={paxStatus(file, ym)} onClose={() => setCobro(false)} onSaved={(r) => { setCobro(false); setRec({ fileId: file.id, r }) }} />}
      {rec && recFile && <ReceiptModal file={recFile} receipt={rec.r} onClose={() => setRec(null)} />}
    </div>
  )
}

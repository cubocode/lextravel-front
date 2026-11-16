import { useState } from 'react'
import { Plus } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import { CASH_OPENING, type CashMovement, type Currency } from '../lib/mock'
import { fmtDate, money, today } from '../lib/format'
import { Card, Field, Kpi, Modal } from '../lib/ui'

export default function Caja() {
  const cash = useStore((s) => s.cash)
  const [cur, setCur] = useState<'Todas' | Currency>('Todas')
  const [open, setOpen] = useState(false)
  const balance = (c: Currency) => cash.filter((m) => m.currency === c).reduce((a, m) => a + (m.kind === 'Ingreso' ? m.amount : -m.amount), CASH_OPENING[c])
  const rows = [...cash].filter((m) => cur === 'Todas' || m.currency === cur).sort((a, b) => b.date.localeCompare(a.date))
  const todayIn = (c: Currency) => cash.filter((m) => m.date === today() && m.currency === c && m.kind === 'Ingreso').reduce((a, m) => a + m.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-bold text-azul">Caja</h1>
        <select value={cur} onChange={(e) => setCur(e.target.value as typeof cur)} className="inp w-36"><option>Todas</option><option>ARS</option><option>USD</option></select>
        <button className="btn-accent" onClick={() => setOpen(true)}><Plus size={16} /> Nuevo movimiento</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Saldo en pesos" value={money(balance('ARS'), 'ARS')} hint={`Inicial ${money(CASH_OPENING.ARS, 'ARS')}`} />
        <Kpi label="Saldo en dólares" value={money(balance('USD'))} hint={`Inicial ${money(CASH_OPENING.USD)}`} />
        <Kpi label="Ingresos de hoy (ARS)" value={money(todayIn('ARS'), 'ARS')} />
        <Kpi label="Ingresos de hoy (USD)" value={money(todayIn('USD'))} />
      </div>
      <Card title="Movimientos">
        <div className="overflow-x-auto"><table className="tbl">
          <thead><tr><th>Fecha</th><th>Concepto</th><th>File</th><th>Medio</th><th className="num">Ingreso</th><th className="num">Egreso</th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{fmtDate(m.date)}</td><td>{m.concept}</td><td className="text-azul">{m.fileCode ?? '—'}</td><td className="text-slate-600">{m.method}</td>
                <td className="num font-medium text-emerald-700">{m.kind === 'Ingreso' ? money(m.amount, m.currency) : ''}</td>
                <td className="num font-medium text-red-600">{m.kind === 'Egreso' ? money(m.amount, m.currency) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
      {open && <NewMovement onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewMovement({ onClose }: { onClose: () => void }) {
  const [m, setM] = useState<Omit<CashMovement, 'id'>>({ date: today(), kind: 'Egreso', concept: '', currency: 'ARS', amount: 0, method: 'Efectivo' })
  const valid = m.concept.trim().length > 2 && m.amount > 0
  return (
    <Modal title="Nuevo movimiento de caja" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo"><select value={m.kind} onChange={(e) => setM({ ...m, kind: e.target.value as CashMovement['kind'] })} className="inp"><option>Ingreso</option><option>Egreso</option></select></Field>
        <Field label="Fecha"><input type="date" value={m.date} onChange={(e) => setM({ ...m, date: e.target.value })} className="inp" /></Field>
        <Field label="Concepto" className="col-span-2"><input value={m.concept} maxLength={100} onChange={(e) => setM({ ...m, concept: e.target.value })} className="inp" /></Field>
        <Field label="Moneda"><select value={m.currency} onChange={(e) => setM({ ...m, currency: e.target.value as Currency })} className="inp"><option>ARS</option><option>USD</option></select></Field>
        <Field label="Importe"><input type="number" min={0} step="0.01" onChange={(e) => setM({ ...m, amount: Math.max(parseFloat(e.target.value) || 0, 0) })} className="inp" /></Field>
        <Field label="Medio" className="col-span-2"><select value={m.method} onChange={(e) => setM({ ...m, method: e.target.value })} className="inp">{['Efectivo', 'Transferencia', 'Débito', 'Tarjeta'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-accent" disabled={!valid} onClick={() => { actions.addCash({ ...m, concept: m.concept.trim() }); onClose() }}>Guardar</button></div>
    </Modal>
  )
}

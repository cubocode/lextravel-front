import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleDollarSign, Info, Plane, Plus, Printer, Send, UserPlus } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import { COMMISSION_RATE, fileTotals, IIBB_RATE, paxStatus, supplierBalances } from '../lib/calc'
import { MARKET_TODAY, RATE_TODAY, suppliers, type Currency, type FileStatus, type Receipt, type TravelFile } from '../lib/mock'
import { fmtDate, money, pct, round2, today } from '../lib/format'
import { Badge, Card, Field, Modal } from '../lib/ui'
import { NewFileModal, PaxModal, ReceiptModal } from './modals'

const STATUSES: FileStatus[] = ['Presupuesto', 'Confirmado', 'En viaje', 'Cerrado', 'Cancelado']
const supName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '—'

/* ---------- Listado de files ---------- */
export function FilesList() {
  const files = useStore((s) => s.files)
  const clients = useStore((s) => s.clients)
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—'
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('Todos')
  const [creating, setCreating] = useState(false)
  const term = q.toLowerCase()
  const rows = files
    .filter((f) => (status === 'Todos' || f.status === status) && `${f.code} ${clientName(f.clientId)} ${f.course} ${f.destination} ${f.seller}`.toLowerCase().includes(term))
    .map((f) => ({ f, ...fileTotals(f) }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-bold text-azul">Files / grupos</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código, colegio, destino…" className="inp w-full sm:w-72" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="inp w-40">
          <option>Todos</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-accent" onClick={() => setCreating(true)}><Plus size={16} /> Nuevo file</button>
      </div>
      {creating && <NewFileModal onClose={() => setCreating(false)} onCreated={(id) => nav(`/admin/files/${id}`)} />}
      <Card>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>File</th><th>Colegio / curso</th><th>Destino</th><th>Salida</th><th>Promotor</th><th className="num">Alumnos</th><th className="num">Venta</th><th className="num">Saldo cliente</th><th className="num">Saldo proveedor</th><th className="num">Margen</th><th>Estado</th></tr></thead>
            <tbody>
              {rows.map(({ f, sale, clientBalance, supplierBalance, gross, marginPct }) => (
                <tr key={f.id} onClick={() => nav(`/admin/files/${f.id}`)} className="cursor-pointer hover:bg-azul/5">
                  <td className="font-semibold text-azul">{f.code}</td>
                  <td><div className="font-medium">{clientName(f.clientId)}</div><div className="text-xs text-slate-500">{f.course}</div></td>
                  <td>{f.destination}</td>
                  <td>{fmtDate(f.travelDate)}</td>
                  <td className="text-slate-600">{f.seller}</td>
                  <td className="num">{f.pax.length}</td>
                  <td className="num font-medium">{money(sale)}</td>
                  <td className={`num ${clientBalance > 0.009 ? 'font-semibold text-magenta' : 'text-emerald-600'}`}>{money(clientBalance)}</td>
                  <td className={`num ${supplierBalance > 0.009 ? 'font-semibold text-amber-600' : 'text-emerald-600'}`}>{money(supplierBalance)}</td>
                  <td className="num">{money(gross)} <span className="text-xs text-slate-400">({pct(marginPct)})</span></td>
                  <td><Badge>{f.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay files con ese filtro.</p>}
      </Card>
    </div>
  )
}

/* ---------- Detalle de un file ---------- */
export function FileDetail() {
  const { id } = useParams()
  const file = useStore((s) => s.files.find((f) => f.id === id))
  const [modal, setModal] = useState<'cobro' | 'pago' | null>(null)
  const [payDoc, setPayDoc] = useState<string>()
  const [q, setQ] = useState('')
  const [onlyDebt, setOnlyDebt] = useState(false)
  const [printRec, setPrintRec] = useState<Receipt | null>(null)
  const [addingPax, setAddingPax] = useState(false)
  const client = useStore((s) => s.clients.find((c) => c.id === file?.clientId))
  if (!file) return <p>File inexistente. <Link to="/admin/files" className="text-magenta">Volver</Link></p>
  const t = fileTotals(file)
  const n = file.pax.length
  const sups = supplierBalances(file)
  const students = paxStatus(file, today().slice(0, 7))
  const late = students.filter((s) => s.state === 'Atrasado').length
  const shown = students.filter((s) => (!onlyDebt || s.state === 'Atrasado') && `${s.pax.name} ${s.pax.doc}`.toLowerCase().includes(q.toLowerCase()))
  const paxName = (doc?: string) => file.pax.find((p) => p.doc === doc)?.name ?? 'Grupal'
  const openCobro = (doc?: string) => { setPayDoc(doc); setModal('cobro') }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/files" className="rounded p-1 text-slate-500 hover:bg-white"><ArrowLeft size={20} /></Link>
        <div className="mr-auto">
          <h1 className="flex items-center gap-2 text-xl font-bold text-azul">{file.code} <span className="font-normal text-slate-400">·</span> {file.destination}</h1>
          <p className="text-xs text-slate-500">{client?.name} · {file.course} · Promotor: {file.seller} · Moneda del file: USD</p>
        </div>
        <select value={file.status} onChange={(e) => actions.setFileStatus(file.id, e.target.value as FileStatus)} className="inp w-full font-semibold sm:w-40">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-accent" onClick={() => openCobro(students.find((s) => s.balance > 0.01)?.pax.doc)} disabled={t.clientBalance <= 0}><CircleDollarSign size={16} /> Registrar cobro</button>
        <button className="btn-primary" onClick={() => setModal('pago')} disabled={t.supplierBalance <= 0}><Send size={16} /> Orden de pago</button>
      </div>
      {file.autoClosed && file.status === 'Cerrado' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <Info size={16} /> Este file se cerró automáticamente el {fmtDate(file.returnDate)}, al terminar el viaje.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px] [&>*]:min-w-0">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
            <Card title="Colegio">
              <dl className="grid grid-cols-[90px_1fr] gap-y-1 px-4 py-3 text-sm">
                <dt className="text-slate-500">Colegio</dt><dd className="font-semibold">{client?.name}</dd>
                <dt className="text-slate-500">Curso</dt><dd>{file.course}</dd>
                <dt className="text-slate-500">Localidad</dt><dd>{client?.city}</dd>
                <dt className="text-slate-500">Referente</dt><dd>{client?.contact}</dd>
                <dt className="text-slate-500">Contacto</dt><dd>{client?.phone} · {client?.email}</dd>
              </dl>
            </Card>
            <Card title="Viaje y plan de pagos">
              <dl className="grid grid-cols-[90px_1fr] gap-y-1 px-4 py-3 text-sm">
                <dt className="text-slate-500">Destino</dt><dd className="font-semibold">{file.destination}</dd>
                <dt className="text-slate-500">Salida</dt><dd className="flex items-center gap-1"><Plane size={14} className="text-magenta" /> {fmtDate(file.travelDate)} → {fmtDate(file.returnDate)}</dd>
                <dt className="text-slate-500">Por alumno</dt><dd className="font-semibold">{money(students[0]?.price ?? 0)}</dd>
                <dt className="text-slate-500">Plan</dt><dd>{file.installments} cuotas de {money(students[0]?.cuota ?? 0)} desde {file.planStart.split('-').reverse().join('/')}</dd>
                <dt className="text-slate-500">Estado</dt><dd><Badge>{file.status}</Badge></dd>
              </dl>
            </Card>
          </div>

          <Card title={`Alumnos (${file.pax.length})`} action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button onClick={() => setAddingPax(true)} className="btn-ghost px-2 py-1 text-xs"><UserPlus size={14} /> Agregar</button>
              {late > 0 && <button onClick={() => setOnlyDebt(!onlyDebt)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${onlyDebt ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>{late} con cuotas atrasadas</button>}
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alumno o DNI…" className="inp w-48 py-1 text-xs" />
            </div>
          }>
            <div className="max-h-96 overflow-auto"><table className="tbl">
              <thead className="sticky top-0"><tr><th>#</th><th>Alumno</th><th>DNI</th><th>Nacimiento</th><th className="num">Cuotas</th><th className="num">Pagado</th><th className="num">Saldo</th><th>Estado</th><th></th></tr></thead>
              <tbody>{shown.map((s) => (
                <tr key={s.pax.doc} className="hover:bg-slate-50">
                  <td className="text-slate-400">{file.pax.indexOf(s.pax) + 1}</td><td className="font-medium">{s.pax.name}</td><td>{s.pax.doc.replace('DNI ', '')}</td><td>{fmtDate(s.pax.birth)}</td>
                  <td className="num">{Math.min(s.cuotasPagas, file.installments)}/{file.installments}</td>
                  <td className="num">{money(s.paid)}</td>
                  <td className={`num font-semibold ${s.balance > 0.01 ? 'text-magenta' : 'text-emerald-600'}`}>{money(Math.max(s.balance, 0))}</td>
                  <td><Badge>{s.state}</Badge></td>
                  <td>{s.balance > 0.01 && <button onClick={() => openCobro(s.pax.doc)} className="text-xs font-semibold text-magenta hover:underline">Cobrar</button>}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>

          <Card title="Servicios">
            <div className="overflow-x-auto"><table className="tbl">
              <thead><tr><th>Tipo</th><th>Descripción</th><th>Proveedor</th><th className="num">Venta x alumno</th><th className="num">Costo x alumno</th><th className="num">Venta total ({n})</th><th className="num">Costo total</th><th className="num">Margen</th></tr></thead>
              <tbody>
                {file.services.map((s) => (
                  <tr key={s.id}><td><span className="rounded bg-azul/10 px-1.5 py-0.5 text-xs font-semibold text-azul">{s.type}</span></td><td>{s.description}</td><td className="text-slate-600">{supName(s.supplierId)}</td><td className="num">{money(s.sale)}</td><td className="num text-slate-600">{money(s.cost)}</td><td className="num">{money(s.sale * n)}</td><td className="num text-slate-600">{money(s.cost * n)}</td><td className="num font-semibold text-emerald-700">{money((s.sale - s.cost) * n)}</td></tr>
                ))}
                <tr className="bg-slate-50 font-bold"><td colSpan={3}>Total</td><td className="num">{money(n ? t.sale / n : 0)}</td><td className="num">{money(n ? t.cost / n : 0)}</td><td className="num">{money(t.sale)}</td><td className="num">{money(t.cost)}</td><td className="num text-emerald-700">{money(t.gross)}</td></tr>
              </tbody>
            </table></div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            <Card title={`Cobros del grupo (${file.receipts.length})`} action={<span className={`text-sm font-bold ${t.clientBalance > 0.009 ? 'text-magenta' : 'text-emerald-600'}`}>Saldo {money(t.clientBalance)}</span>}>
              <div className="max-h-80 overflow-auto"><table className="tbl">
                <thead className="sticky top-0"><tr><th>Fecha</th><th>Alumno</th><th>Medio</th><th className="num">Importe</th><th className="num">TC</th><th className="num">Acreditado</th><th></th></tr></thead>
                <tbody>
                  {[...file.receipts].reverse().map((r) => <tr key={r.id}><td>{fmtDate(r.date)}</td><td className="max-w-40 truncate">{paxName(r.paxDoc)}</td><td>{r.method}</td><td className="num">{money(r.amount, r.currency)}</td><td className="num text-slate-500">{r.currency === 'ARS' ? r.rate : '—'}</td><td className="num font-medium">{money(r.usd)}</td><td><button onClick={() => setPrintRec(r)} title="Ver / imprimir recibo" className="text-slate-400 hover:text-azul"><Printer size={15} /></button></td></tr>)}
                  {file.receipts.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400">Sin cobros registrados</td></tr>}
                </tbody>
              </table></div>
            </Card>
            <Card title="Cuenta corriente de proveedores" action={<span className={`text-sm font-bold ${t.supplierBalance > 0.009 ? 'text-amber-600' : 'text-emerald-600'}`}>Saldo {money(t.supplierBalance)}</span>}>
              <div className="overflow-x-auto"><table className="tbl">
                <thead><tr><th>Proveedor</th><th className="num">Costo</th><th className="num">Pagado</th><th className="num">Saldo</th></tr></thead>
                <tbody>{sups.map((x) => <tr key={x.supplier.id}><td>{x.supplier.name}</td><td className="num">{money(x.cost)}</td><td className="num">{money(x.paid)}</td><td className={`num font-semibold ${x.balance > 0.009 ? 'text-amber-600' : 'text-emerald-600'}`}>{money(x.balance)}</td></tr>)}</tbody>
              </table></div>
            </Card>
          </div>
        </div>

        <Card title="Rentabilidad del file" className="h-fit xl:sticky xl:top-5">
          <dl className="space-y-1.5 px-4 py-3 text-sm">
            {[
              ['Venta total', t.sale, ''],
              ['Costo neto proveedores', -t.cost, ''],
              ['Margen bruto', t.gross, 'font-bold border-t pt-1.5'],
              [`IIBB estimado (${pct(IIBB_RATE)})`, -t.taxes, ''],
              [`Comisión promotor (${pct(COMMISSION_RATE)} del margen)`, -t.commission, ''],
              ['Diferencia de cambio', t.fx, t.fx >= 0 ? 'text-emerald-700' : 'text-red-600'],
            ].map(([l, v, c]) => (
              <div key={l as string} className={`flex justify-between gap-2 ${c}`}><dt className="text-slate-600">{l}</dt><dd className="tabular-nums">{money(v as number)}</dd></div>
            ))}
          </dl>
          <div className="mx-4 mb-4 rounded-lg bg-azul p-4 text-white">
            <div className="text-xs uppercase tracking-wide text-white/70">Margen neto</div>
            <div className="text-2xl font-extrabold tabular-nums">{money(t.net)}</div>
            <div className="text-xs text-white/70">{pct(t.sale ? t.net / t.sale : 0)} sobre la venta · margen bruto {pct(t.marginPct)}</div>
          </div>
          <div className="space-y-2 px-4 pb-4 text-xs">
            <Bar label="Cobrado al cliente" value={t.collected} total={t.sale} color="bg-magenta" />
            <Bar label="Pagado a proveedores" value={t.paid} total={t.cost} color="bg-azul" />
          </div>
        </Card>
      </div>

      {modal === 'cobro' && <CobroModal file={file} students={students} initialDoc={payDoc} onClose={() => setModal(null)} onSaved={(r) => { setModal(null); setPrintRec(r) }} />}
      {modal === 'pago' && <PagoModal file={file} onClose={() => setModal(null)} />}
      {printRec && <ReceiptModal file={file} receipt={printRec} onClose={() => setPrintRec(null)} />}
      {addingPax && <PaxModal fileId={file.id} onClose={() => setAddingPax(false)} />}
    </div>
  )
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const p = total ? Math.min(value / total, 1) : 0
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-slate-600"><span>{label}</span><span className="font-semibold">{pct(p)}</span></div>
      <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${color}`} style={{ width: `${p * 100}%` }} /></div>
    </div>
  )
}

/* ---------- Cobro multimoneda ---------- */
export function CobroModal({ file, students, initialDoc, onClose, onSaved }: { file: TravelFile; students: ReturnType<typeof paxStatus>; initialDoc?: string; onClose: () => void; onSaved?: (r: Receipt) => void }) {
  const debtors = students.filter((s) => s.balance > 0.01)
  const [doc, setDoc] = useState(initialDoc ?? debtors[0]?.pax.doc ?? '')
  const st = students.find((s) => s.pax.doc === doc)
  const balance = st?.balance ?? 0
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(String(RATE_TODAY))
  const [market, setMarket] = useState(String(MARKET_TODAY))
  const [method, setMethod] = useState('Transferencia')
  const [date, setDate] = useState(today())

  const amt = Math.max(parseFloat(amount) || 0, 0)
  const r = parseFloat(rate) || 0
  const m = parseFloat(market) || 0
  const usd = currency === 'USD' ? amt : r > 0 ? round2(amt / r) : 0
  const fx = currency === 'ARS' && m > 0 ? round2(amt / m - usd) : 0
  const valid = !!st && amt > 0 && usd <= balance + 0.01 && (currency === 'USD' || (r > 0 && m > 0))

  function save() {
    const rec = actions.addReceipt(file.id, { date, method, currency, amount: amt, rate: currency === 'USD' ? 1 : r, marketRate: currency === 'USD' ? 1 : m, usd, paxDoc: doc })
    if (onSaved) onSaved(rec)
    else onClose()
  }
  const fill = (usdValue: number) => setAmount(String(currency === 'USD' ? usdValue : round2(usdValue * r)))

  return (
    <Modal title={`Registrar cobro · ${file.code}`} onClose={onClose}>
      <Field label="Alumno">
        <select value={doc} onChange={(e) => { setDoc(e.target.value); setAmount('') }} className="inp">
          {debtors.map((s) => <option key={s.pax.doc} value={s.pax.doc}>{s.pax.name} — saldo {money(s.balance)}{s.state === 'Atrasado' ? ' · ATRASADO' : ''}</option>)}
        </select>
      </Field>
      <div className="my-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
        <span className="text-slate-600">Cuotas pagas {st ? `${Math.min(st.cuotasPagas, file.installments)}/${file.installments}` : ''} · saldo del alumno</span><b className="text-magenta">{money(balance)}</b>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="inp" /></Field>
        <Field label="Medio de pago"><select value={method} onChange={(e) => setMethod(e.target.value)} className="inp">{['Transferencia', 'Efectivo', 'Tarjeta', 'Mercado Pago'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Moneda del pago">
          <div className="flex gap-1">{(['ARS', 'USD'] as Currency[]).map((c) => <button key={c} type="button" onClick={() => setCurrency(c)} className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${currency === c ? 'bg-azul text-white' : 'bg-slate-100 text-slate-600'}`}>{c}</button>)}</div>
        </Field>
        <Field label={`Importe en ${currency}`}>
          <div className="flex gap-1">
            <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="inp" autoFocus />
            <button type="button" className="btn-ghost px-2 text-xs" onClick={() => fill(Math.min(st?.cuota ?? 0, balance))}>Cuota</button>
            <button type="button" className="btn-ghost px-2 text-xs" onClick={() => fill(balance)}>Saldo</button>
          </div>
        </Field>
        {currency === 'ARS' && <>
          <Field label="TC aplicado al cliente"><input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className="inp" /></Field>
          <Field label="TC de mercado (referencia)"><input type="number" step="0.01" value={market} onChange={(e) => setMarket(e.target.value)} className="inp" /></Field>
        </>}
      </div>

      <div className="mt-4 space-y-1 rounded-lg border border-slate-200 p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Se acredita al file</span><b className="text-azul">{money(usd)}</b></div>
        {currency === 'ARS' && <div className="flex justify-between"><span className="text-slate-600">Diferencia de cambio</span><b className={fx >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fx >= 0 ? 'Ganancia' : 'Pérdida'} {money(Math.abs(fx))}</b></div>}
        <div className="flex justify-between border-t pt-1"><span className="text-slate-600">Saldo después del cobro</span><b>{money(Math.max(balance - usd, 0))}</b></div>
        {usd > balance + 0.01 && <p className="text-xs font-semibold text-red-600">El importe supera el saldo pendiente.</p>}
      </div>
      <p className="mt-2 text-xs text-slate-500">Al confirmar se genera el recibo, se actualiza la cuenta corriente del cliente y se registra el ingreso en caja, todo en una sola operación.</p>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-accent" disabled={!valid} onClick={save}>Confirmar cobro</button></div>
    </Modal>
  )
}

/* ---------- Orden de pago a proveedor ---------- */
function PagoModal({ file, onClose }: { file: TravelFile; onClose: () => void }) {
  const pending = supplierBalances(file).filter((x) => x.balance > 0.009)
  const [supplierId, setSupplierId] = useState(pending[0]?.supplier.id ?? '')
  const bal = pending.find((x) => x.supplier.id === supplierId)?.balance ?? 0
  const [amount, setAmount] = useState(String(bal))
  const [method, setMethod] = useState('Transferencia')
  const [ref, setRef] = useState('')
  const amt = Math.max(parseFloat(amount) || 0, 0)
  const valid = supplierId && amt > 0 && amt <= bal + 0.01

  return (
    <Modal title={`Orden de pago · ${file.code}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Proveedor" className="col-span-2">
          <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setAmount(String(pending.find((x) => x.supplier.id === e.target.value)?.balance ?? 0)) }} className="inp">
            {pending.map((x) => <option key={x.supplier.id} value={x.supplier.id}>{x.supplier.name} — saldo {money(x.balance)}</option>)}
          </select>
        </Field>
        <Field label="Importe (USD)"><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="inp" /></Field>
        <Field label="Medio"><select value={method} onChange={(e) => setMethod(e.target.value)} className="inp">{['Transferencia', 'Efectivo', 'Cheque'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Referencia / N.º de operación" className="col-span-2"><input value={ref} onChange={(e) => setRef(e.target.value)} maxLength={40} className="inp" placeholder="OP-0000" /></Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" disabled={!valid} onClick={() => { actions.addSupplierPayment(file.id, { date: today(), supplierId, usd: amt, method, ref: ref.trim() || 'S/R' }); onClose() }}>Confirmar pago</button>
      </div>
    </Modal>
  )
}

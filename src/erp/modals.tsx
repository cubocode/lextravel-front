import { useState } from 'react'
import { Printer } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import { paxStatus } from '../lib/calc'
import { suppliers, type Pax, type Receipt, type TravelFile } from '../lib/mock'
import { fmtDate, money, today, uid } from '../lib/format'
import { Field, logoUrl, Modal } from '../lib/ui'

const fmtDni = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/* ---------- Alta / edición de alumno ---------- */
export function PaxModal({ fileId, pax, onClose }: { fileId?: string; pax?: Pax; onClose: () => void }) {
  const files = useStore((s) => s.files)
  const clients = useStore((s) => s.clients)
  const open = files.filter((f) => f.status !== 'Cerrado' && f.status !== 'Cancelado')
  const [fid, setFid] = useState(fileId ?? open[0]?.id ?? '')
  const [last, first] = pax ? pax.name.split(', ') : ['', '']
  const [f, setF] = useState({ last, first: first ?? '', dni: pax ? pax.doc.replace(/\D/g, '') : '', birth: pax?.birth ?? '', tutor: pax?.tutor ?? '', phone: pax?.phone ?? '' })
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  function save() {
    const file = files.find((x) => x.id === fid)
    const dni = f.dni.replace(/\D/g, '')
    if (!file) return setErr('Elegí el grupo.')
    if (f.last.trim().length < 2 || f.first.trim().length < 2) return setErr('Completá apellido y nombre.')
    if (dni.length < 7 || dni.length > 8) return setErr('El DNI debe tener 7 u 8 números.')
    const doc = `DNI ${fmtDni(dni)}`
    if (doc !== pax?.doc && file.pax.some((p) => p.doc === doc)) return setErr('Ya hay un alumno con ese DNI en el grupo.')
    if (!f.birth || f.birth > today()) return setErr('Revisá la fecha de nacimiento.')
    actions.savePax(fid, { name: `${f.last.trim()}, ${f.first.trim()}`, doc, birth: f.birth, tutor: f.tutor.trim(), phone: f.phone.trim() }, pax?.doc)
    onClose()
  }

  return (
    <Modal title={pax ? 'Editar alumno' : 'Nuevo alumno'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Grupo / file" className="col-span-2">
          <select value={fid} onChange={(e) => setFid(e.target.value)} className="inp" disabled={!!fileId || !!pax}>
            {(fileId ? files.filter((x) => x.id === fileId) : open).map((x) => <option key={x.id} value={x.id}>{x.code} · {clients.find((c) => c.id === x.clientId)?.name} · {x.course} → {x.destination}</option>)}
          </select>
        </Field>
        <Field label="Apellido"><input value={f.last} onChange={set('last')} maxLength={50} className="inp" autoFocus /></Field>
        <Field label="Nombre"><input value={f.first} onChange={set('first')} maxLength={50} className="inp" /></Field>
        <Field label="DNI (solo números)"><input value={f.dni} onChange={set('dni')} inputMode="numeric" maxLength={10} className="inp" /></Field>
        <Field label="Fecha de nacimiento"><input type="date" value={f.birth} onChange={set('birth')} className="inp" /></Field>
        <Field label="Madre / padre / tutor"><input value={f.tutor} onChange={set('tutor')} maxLength={60} className="inp" /></Field>
        <Field label="Teléfono del tutor"><input value={f.phone} onChange={set('phone')} maxLength={25} type="tel" className="inp" /></Field>
      </div>
      {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
      <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-accent" onClick={save}>Guardar</button></div>
    </Modal>
  )
}

/* ---------- Recibo imprimible ---------- */
export const receiptNumber = (file: TravelFile, r: Receipt) => `${file.code.slice(3)}-${String(file.receipts.findIndex((x) => x.id === r.id) + 1).padStart(4, '0')}`

export function ReceiptModal({ file, receipt: r, onClose }: { file: TravelFile; receipt: Receipt; onClose: () => void }) {
  const client = useStore((s) => s.clients.find((c) => c.id === file.clientId))
  const st = paxStatus(file, today().slice(0, 7)).find((s) => s.pax.doc === r.paxDoc)
  return (
    <Modal title="Recibo de cobro" onClose={onClose} wide>
      <div className="print-area rounded-lg border border-slate-200 p-6 text-sm">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <img src={logoUrl} alt="Lex Travel" className="h-14" />
            <p className="mt-1 text-xs text-slate-500">Lex Travel · Viajes de egresados y educativos<br />Concepción · San Miguel de Tucumán · Catamarca</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold tracking-wide text-azul">RECIBO</div>
            <div className="font-mono font-semibold">N.º {receiptNumber(file, r)}</div>
            <div className="text-slate-600">Fecha: {fmtDate(r.date)}</div>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-[150px_1fr] gap-y-1.5">
          <dt className="text-slate-500">Recibimos de</dt><dd className="font-semibold">{st?.pax.tutor || '—'}</dd>
          <dt className="text-slate-500">Por el alumno/a</dt><dd className="font-semibold">{st?.pax.name ?? 'Pago grupal'} {st && <span className="font-normal text-slate-500">· {st.pax.doc}</span>}</dd>
          <dt className="text-slate-500">Colegio / curso</dt><dd>{client?.name} · {file.course}</dd>
          <dt className="text-slate-500">Viaje</dt><dd>{file.destination} · salida {fmtDate(file.travelDate)} · File {file.code}</dd>
          <dt className="text-slate-500">Concepto</dt><dd>Pago a cuenta del viaje (plan de {file.installments} cuotas)</dd>
          <dt className="text-slate-500">Medio de pago</dt><dd>{r.method}</dd>
        </dl>
        <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
          <div><div className="text-xs text-slate-500">Importe recibido</div><div className="text-xl font-extrabold text-azul">{money(r.amount, r.currency)}</div></div>
          <div><div className="text-xs text-slate-500">Tipo de cambio</div><div className="text-lg font-semibold">{r.currency === 'ARS' ? money(r.rate, 'ARS') : '—'}</div></div>
          <div><div className="text-xs text-slate-500">Equivalente acreditado</div><div className="text-lg font-semibold">{money(r.usd)}</div></div>
        </div>
        {st && <p className="mt-3 text-slate-600">Saldo pendiente del alumno a la fecha: <b className="text-azul">{money(Math.max(st.balance, 0))}</b> · Cuotas pagas: {Math.min(st.cuotasPagas, file.installments)} de {file.installments}</p>}
        <div className="mt-12 flex justify-end"><div className="w-56 border-t border-slate-400 pt-1 text-center text-xs text-slate-500">Firma y aclaración</div></div>
        <p className="mt-6 text-[10px] text-slate-400">Documento no válido como factura. · Sistema de gestión Lex Travel · CuboCode</p>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cerrar</button><button className="btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir recibo</button></div>
    </Modal>
  )
}

/* ---------- Nuevo file (grupo) ---------- */
export function NewFileModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const clients = useStore((s) => s.clients)
  const promoters = useStore((s) => s.promoters).filter((p) => p.active)
  const packages = useStore((s) => s.packages).filter((p) => p.active)
  const nextMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7) })()
  const [f, setF] = useState({
    clientId: clients[0]?.id ?? '', newName: '', newCity: '', newContact: '', newPhone: '',
    course: '', destination: '', travelDate: '', returnDate: '', seller: promoters[0]?.name ?? '',
    installments: '10', planStart: nextMonth, sale: '', cost: '', supplierId: 's7',
  })
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const isNew = f.clientId === '__new'

  function pickPackage(id: string) {
    const p = packages.find((x) => x.id === id)
    if (p) setF({ ...f, destination: p.destination, sale: p.currency === 'USD' ? String(p.priceFrom) : f.sale })
  }

  function create() {
    const sale = parseFloat(f.sale), cost = parseFloat(f.cost), inst = parseInt(f.installments)
    if (isNew ? f.newName.trim().length < 3 : !f.clientId) return setErr('Elegí o cargá el colegio.')
    if (f.course.trim().length < 2 || f.destination.trim().length < 2) return setErr('Completá curso y destino.')
    if (!f.travelDate || !f.returnDate || f.returnDate < f.travelDate) return setErr('Revisá las fechas del viaje.')
    if (!(sale > 0) || !(cost >= 0) || cost > sale) return setErr('Revisá precio y costo por alumno.')
    if (!(inst >= 1 && inst <= 24)) return setErr('Las cuotas van de 1 a 24.')
    const clientId = isNew ? actions.addClient({ name: f.newName.trim(), city: f.newCity.trim(), contact: f.newContact.trim(), phone: f.newPhone.trim(), email: '', doc: '' }) : f.clientId
    const id = uid()
    actions.addFile({
      id, code: actions.nextFileCode(f.travelDate.slice(0, 4)), created: today(), travelDate: f.travelDate, returnDate: f.returnDate,
      seller: f.seller, clientId, course: f.course.trim(), destination: f.destination.trim(), status: 'Presupuesto',
      installments: inst, planStart: f.planStart, pax: [], receipts: [], supplierPayments: [],
      services: [{ id: uid(), type: 'Paquete', description: `Paquete ${f.destination.trim()}`, supplierId: f.supplierId, date: f.travelDate, sale, cost }],
    })
    onCreated(id)
  }

  return (
    <Modal title="Nuevo file / grupo" onClose={onClose} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Colegio" className="sm:col-span-2">
          <select value={f.clientId} onChange={set('clientId')} className="inp">
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.city}</option>)}
            <option value="__new">+ Cargar colegio nuevo…</option>
          </select>
        </Field>
        {isNew && <>
          <Field label="Nombre del colegio"><input value={f.newName} onChange={set('newName')} maxLength={80} className="inp" /></Field>
          <Field label="Localidad"><input value={f.newCity} onChange={set('newCity')} maxLength={60} className="inp" /></Field>
          <Field label="Referente (padre delegado / docente)"><input value={f.newContact} onChange={set('newContact')} maxLength={60} className="inp" /></Field>
          <Field label="Teléfono"><input value={f.newPhone} onChange={set('newPhone')} maxLength={25} className="inp" /></Field>
        </>}
        <Field label="Curso"><input value={f.course} onChange={set('course')} maxLength={60} placeholder="Ej.: 5.º año A · Promo 2027" className="inp" /></Field>
        <Field label="Basado en paquete (opcional)">
          <select defaultValue="" onChange={(e) => pickPackage(e.target.value)} className="inp"><option value="">—</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        </Field>
        <Field label="Destino"><input value={f.destination} onChange={set('destination')} maxLength={60} className="inp" /></Field>
        <Field label="Promotor"><select value={f.seller} onChange={set('seller')} className="inp">{promoters.map((p) => <option key={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Salida"><input type="date" value={f.travelDate} onChange={set('travelDate')} className="inp" /></Field>
        <Field label="Regreso"><input type="date" value={f.returnDate} onChange={set('returnDate')} className="inp" /></Field>
        <Field label="Precio por alumno (USD)"><input type="number" min={0} value={f.sale} onChange={set('sale')} className="inp" /></Field>
        <Field label="Costo por alumno (USD)"><input type="number" min={0} value={f.cost} onChange={set('cost')} className="inp" /></Field>
        <Field label="Proveedor principal"><select value={f.supplierId} onChange={set('supplierId')} className="inp">{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cuotas"><input type="number" min={1} max={24} value={f.installments} onChange={set('installments')} className="inp" /></Field>
          <Field label="Primera cuota"><input type="month" value={f.planStart} onChange={set('planStart')} className="inp" /></Field>
        </div>
      </div>
      {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
      <p className="mt-3 text-xs text-slate-500">El file se crea como Presupuesto. Después cargás los alumnos y los servicios se calculan solos según la cantidad de alumnos.</p>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-accent" onClick={create}>Crear file</button></div>
    </Modal>
  )
}

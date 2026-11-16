import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import { paxStatus } from '../lib/calc'
import type { Pax, Receipt, TravelFile } from '../lib/mock'
import { fmtDate, money, today } from '../lib/format'
import { Badge, Card } from '../lib/ui'
import { CobroModal } from './Files'
import { PaxModal, ReceiptModal } from './modals'

export default function Alumnos() {
  const files = useStore((s) => s.files)
  const clients = useStore((s) => s.clients)
  const [q, setQ] = useState('')
  const [fid, setFid] = useState('Todos')
  const [state, setState] = useState('Todos')
  const [edit, setEdit] = useState<{ fileId?: string; pax?: Pax } | null>(null)
  const [cobro, setCobro] = useState<{ file: TravelFile; doc: string } | null>(null)
  const [rec, setRec] = useState<{ file: TravelFile; r: Receipt } | null>(null)

  const ym = today().slice(0, 7)
  const all = files
    .filter((f) => f.status !== 'Cancelado' && (fid === 'Todos' || f.id === fid))
    .flatMap((f) => paxStatus(f, ym).map((s) => ({ ...s, file: f })))
  const term = q.toLowerCase()
  const rows = all.filter((s) => (state === 'Todos' || s.state === state) && `${s.pax.name} ${s.pax.doc} ${s.pax.tutor ?? ''}`.toLowerCase().includes(term))
  const groupName = (f: TravelFile) => `${clients.find((c) => c.id === f.clientId)?.name ?? ''} · ${f.course}`

  function remove(f: TravelFile, p: Pax) {
    if (f.receipts.some((r) => r.paxDoc === p.doc)) return alert('No se puede eliminar: el alumno tiene pagos registrados.')
    if (confirm(`¿Eliminar a ${p.name} del grupo?`)) actions.removePax(f.id, p.doc)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-bold text-azul">Alumnos <span className="text-base font-normal text-slate-400">({all.length})</span></h1>
        <button className="btn-accent" onClick={() => setEdit({})}><UserPlus size={16} /> Nuevo alumno</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, DNI o tutor…" className="inp w-full sm:w-64" />
        <select value={fid} onChange={(e) => setFid(e.target.value)} className="inp w-full sm:w-80">
          <option value="Todos">Todos los grupos</option>
          {files.filter((f) => f.status !== 'Cancelado').map((f) => <option key={f.id} value={f.id}>{groupName(f)} → {f.destination}</option>)}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} className="inp w-full sm:w-40">
          {['Todos', 'Al día', 'Atrasado', 'Pagado'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <Card>
        <div className="max-h-[70vh] overflow-auto">
          <table className="tbl">
            <thead className="sticky top-0 z-10"><tr><th>Alumno</th><th>DNI</th><th>Grupo</th><th>Tutor</th><th>Teléfono</th><th className="num">Cuotas</th><th className="num">Saldo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.file.id + s.pax.doc} className="hover:bg-slate-50">
                  <td className="font-medium">{s.pax.name}<div className="text-xs font-normal text-slate-400">Nac. {fmtDate(s.pax.birth)}</div></td>
                  <td>{s.pax.doc.replace('DNI ', '')}</td>
                  <td><Link to={`/admin/files/${s.file.id}`} className="text-azul hover:text-magenta">{groupName(s.file)}</Link><div className="text-xs text-slate-400">{s.file.destination}</div></td>
                  <td>{s.pax.tutor || '—'}</td>
                  <td>{s.pax.phone || '—'}</td>
                  <td className="num">{Math.min(s.cuotasPagas, s.file.installments)}/{s.file.installments}</td>
                  <td className={`num font-semibold ${s.balance > 0.01 ? 'text-magenta' : 'text-emerald-600'}`}>{money(Math.max(s.balance, 0))}</td>
                  <td><Badge>{s.state}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2">
                      {s.balance > 0.01 && <button onClick={() => setCobro({ file: s.file, doc: s.pax.doc })} className="text-xs font-semibold text-magenta hover:underline">Cobrar</button>}
                      <button onClick={() => setEdit({ fileId: s.file.id, pax: s.pax })} title="Editar" className="text-slate-400 hover:text-azul"><Pencil size={15} /></button>
                      <button onClick={() => remove(s.file, s.pax)} title="Eliminar" className="text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay alumnos con ese filtro.</p>}
        </div>
      </Card>

      {edit && <PaxModal fileId={edit.fileId} pax={edit.pax} onClose={() => setEdit(null)} />}
      {cobro && <CobroModal file={cobro.file} students={paxStatus(cobro.file, ym)} initialDoc={cobro.doc} onClose={() => setCobro(null)}
        onSaved={(r) => { setRec({ file: files.find((f) => f.id === cobro.file.id)!, r }); setCobro(null) }} />}
      {rec && <ReceiptModal file={files.find((f) => f.id === rec.file.id) ?? rec.file} receipt={rec.r} onClose={() => setRec(null)} />}
    </div>
  )
}

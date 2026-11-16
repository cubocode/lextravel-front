import { useState } from 'react'
import { Mail, MapPin, Pencil, Phone, Plus } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import { fileTotals } from '../lib/calc'
import type { Promoter } from '../lib/mock'
import { money0, pct, uid } from '../lib/format'
import { Card, Field, Modal } from '../lib/ui'

export default function Promotores() {
  const promoters = useStore((s) => s.promoters)
  const files = useStore((s) => s.files)
  const [edit, setEdit] = useState<Promoter | null>(null)

  const stats = (p: Promoter) => {
    const mine = files.filter((f) => f.seller === p.name && f.status !== 'Cancelado')
    const sold = mine.filter((f) => f.status !== 'Presupuesto').map(fileTotals)
    const gross = sold.reduce((a, t) => a + t.gross, 0)
    return {
      groups: mine.filter((f) => f.status !== 'Presupuesto').length, budgets: mine.filter((f) => f.status === 'Presupuesto').length,
      students: mine.filter((f) => f.status !== 'Presupuesto').reduce((a, f) => a + f.pax.length, 0),
      sale: sold.reduce((a, t) => a + t.sale, 0), commission: gross * p.commission,
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="text-xl font-bold text-azul">Promotores</h1>
          <p className="text-xs text-slate-500">Quienes visitan los colegios y cierran los grupos. La comisión se calcula sobre el margen bruto de sus grupos.</p>
        </div>
        <button className="btn-accent" onClick={() => setEdit({ id: uid(), name: '', phone: '', email: '', zone: '', commission: 0.1, active: true })}><Plus size={16} /> Nuevo promotor</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promoters.map((p) => {
          const s = stats(p)
          return (
            <Card key={p.id} className={p.active ? '' : 'opacity-60'}>
              <div className="flex items-start gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-magenta text-lg font-bold text-white">{p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="truncate font-bold text-azul">{p.name}</h3>{!p.active && <span className="text-xs text-slate-500">(inactivo)</span>}</div>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> {p.zone}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><Phone size={12} /> {p.phone} <Mail size={12} className="ml-2" /> <span className="truncate">{p.email}</span></p>
                </div>
                <button onClick={() => setEdit(p)} title="Editar" className="text-slate-400 hover:text-azul"><Pencil size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 text-center sm:grid-cols-4">
                {[['Grupos', String(s.groups)], ['Alumnos', String(s.students)], ['Ventas', money0(s.sale)], [`Comisión ${pct(p.commission)}`, money0(s.commission)]].map(([l, v]) => (
                  <div key={l} className="bg-white px-2 py-2.5"><div className="text-[11px] text-slate-500">{l}</div><div className="font-bold text-azul">{v}</div></div>
                ))}
              </div>
              {s.budgets > 0 && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">{s.budgets} presupuesto{s.budgets > 1 ? 's' : ''} en curso</p>}
            </Card>
          )
        })}
      </div>
      {edit && <PromoterModal p={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

function PromoterModal({ p: initial, onClose }: { p: Promoter; onClose: () => void }) {
  const [p, setP] = useState(initial)
  const [pctTxt, setPctTxt] = useState(String(Math.round(initial.commission * 1000) / 10))
  const valid = p.name.trim().length > 2 && parseFloat(pctTxt) >= 0 && parseFloat(pctTxt) <= 50
  const set = (k: keyof Promoter) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value })
  return (
    <Modal title={initial.name ? `Editar · ${initial.name}` : 'Nuevo promotor'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre y apellido" className="col-span-2"><input value={p.name} onChange={set('name')} maxLength={60} className="inp" autoFocus /></Field>
        <Field label="Teléfono"><input value={p.phone} onChange={set('phone')} maxLength={25} className="inp" /></Field>
        <Field label="Correo"><input value={p.email} onChange={set('email')} maxLength={80} type="email" className="inp" /></Field>
        <Field label="Zona / colegios que atiende"><input value={p.zone} onChange={set('zone')} maxLength={60} className="inp" /></Field>
        <Field label="Comisión (% del margen)"><input type="number" min={0} max={50} step={0.5} value={pctTxt} onChange={(e) => setPctTxt(e.target.value)} className="inp" /></Field>
        <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} className="accent-magenta" /> Activo (aparece al crear files)</label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-accent" disabled={!valid} onClick={() => { actions.savePromoter({ ...p, name: p.name.trim(), commission: parseFloat(pctTxt) / 100 }); onClose() }}>Guardar</button>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import type { InquiryStatus } from '../lib/mock'
import { fmtDate } from '../lib/format'
import { Badge, Card } from '../lib/ui'

const STATUSES: InquiryStatus[] = ['Nueva', 'Contactado', 'Cotizada', 'Cerrada']

export default function Consultas() {
  const inquiries = useStore((s) => s.inquiries)
  const packages = useStore((s) => s.packages)
  const [filter, setFilter] = useState<'Todas' | InquiryStatus>('Todas')
  const rows = inquiries.filter((q) => filter === 'Todas' || q.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-bold text-azul">Consultas desde la web</h1>
        {(['Todas', ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === s ? 'bg-azul text-white' : 'bg-white text-azul hover:bg-slate-50'}`}>
            {s} {s !== 'Todas' && <span className="opacity-60">({inquiries.filter((q) => q.status === s).length})</span>}
          </button>
        ))}
      </div>
      <Card>
        <div className="overflow-x-auto"><table className="tbl">
          <thead><tr><th>Fecha</th><th>Nombre / colegio</th><th>Contacto</th><th>Paquete</th><th className="num">Pax</th><th>Mensaje</th><th>Estado</th></tr></thead>
          <tbody>
            {rows.map((q) => {
              const wa = q.phone.replace(/\D/g, '')
              return (
                <tr key={q.id} className={q.status === 'Nueva' ? 'bg-magenta/5' : ''}>
                  <td>{fmtDate(q.date)}</td>
                  <td><div className="font-semibold">{q.name}</div><div className="text-xs text-slate-500">{q.role}{q.school && ` · ${q.school}`}</div></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${encodeURIComponent(q.email)}`} title={q.email} className="text-azul hover:text-magenta"><Mail size={16} /></a>
                      <a href={`https://wa.me/549${wa}`} target="_blank" rel="noopener noreferrer" title={q.phone} className="text-emerald-600 hover:text-emerald-700"><MessageCircle size={16} /></a>
                      <span className="text-xs text-slate-500">{q.phone}</span>
                    </div>
                  </td>
                  <td className="text-azul">{packages.find((p) => p.id === q.packageId)?.title ?? <span className="text-slate-400">General</span>}</td>
                  <td className="num">{q.pax}</td>
                  <td className="max-w-xs whitespace-normal text-slate-600">{q.message}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Badge>{q.status}</Badge>
                      <select value={q.status} onChange={(e) => actions.setInquiryStatus(q.id, e.target.value as InquiryStatus)} className="rounded border border-slate-200 px-1 py-0.5 text-xs">
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay consultas en este estado.</p>}
      </Card>
    </div>
  )
}

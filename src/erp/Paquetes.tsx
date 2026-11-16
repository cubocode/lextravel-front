import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, ImagePlus, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import { CATEGORIES, type Currency, type TravelPackage } from '../lib/mock'
import { money0, uid } from '../lib/format'
import { Card, Field, Modal, PackageCover } from '../lib/ui'

const empty = (): TravelPackage => ({ id: uid(), title: '', destination: '', region: 'Egresados secundaria', nights: 7, priceFrom: 0, currency: 'USD', includes: [], description: '', departures: '', featured: false, active: true })

export default function Paquetes() {
  const pkgs = useStore((s) => s.packages)
  const [edit, setEdit] = useState<TravelPackage | null>(null)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-bold text-azul">Paquetes publicados en la web</h1>
          <p className="text-xs text-slate-500">Lo que cargues acá aparece al instante en el sitio público.</p>
        </div>
        <Link to="/paquetes" target="_blank" className="btn-ghost"><ExternalLink size={16} /> Ver sitio</Link>
        <button className="btn-accent" onClick={() => setEdit(empty())}><Plus size={16} /> Nuevo paquete</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pkgs.map((p) => (
          <Card key={p.id} className={`overflow-hidden ${p.active ? '' : 'opacity-60'}`}>
            <PackageCover pkg={p} className="h-32 w-full" />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="font-bold text-azul">{p.title}</h3><p className="text-xs text-slate-500">{p.region} · {p.nights} noches · desde {money0(p.priceFrom, p.currency)}</p></div>
                <button title="Destacado en la portada" onClick={() => actions.savePackage({ ...p, featured: !p.featured })} className={p.featured ? 'text-magenta' : 'text-slate-300 hover:text-slate-500'}><Star size={18} fill={p.featured ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <input type="checkbox" checked={p.active} onChange={() => actions.savePackage({ ...p, active: !p.active })} className="accent-magenta" /> Publicado
                </label>
                <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setEdit(p)}><Pencil size={14} /> Editar</button>
                <button className="btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => confirm(`¿Eliminar "${p.title}"?`) && actions.deletePackage(p.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {edit && <PackageForm initial={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

/** Valida y achica la imagen en el navegador (máx. 1200 px, JPEG). Re-codificarla descarta cualquier contenido extraño del archivo. */
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Formato no permitido. Usá JPG, PNG o WEBP.'))
    if (file.size > 8 * 1024 * 1024) return reject(new Error('La imagen supera los 8 MB.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1200 / img.width)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')) }
    img.src = url
  })
}

function PackageForm({ initial, onClose }: { initial: TravelPackage; onClose: () => void }) {
  const [p, setP] = useState(initial)
  const [includes, setIncludes] = useState(initial.includes.join('\n'))
  const [err, setErr] = useState('')
  const set = <K extends keyof TravelPackage>(k: K, v: TravelPackage[K]) => setP({ ...p, [k]: v })
  const valid = p.title.trim() && p.destination.trim() && p.priceFrom > 0 && p.nights > 0

  async function onImage(f?: File) {
    if (!f) return
    try { setErr(''); set('image', await processImage(f)) } catch (e) { setErr((e as Error).message) }
  }
  function save() {
    actions.savePackage({ ...p, title: p.title.trim(), destination: p.destination.trim(), includes: includes.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12) })
    onClose()
  }

  return (
    <Modal title={initial.title ? `Editar · ${initial.title}` : 'Nuevo paquete'} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Título" className="col-span-2"><input value={p.title} maxLength={60} onChange={(e) => set('title', e.target.value)} className="inp" /></Field>
        <Field label="Destino"><input value={p.destination} maxLength={60} onChange={(e) => set('destination', e.target.value)} className="inp" /></Field>
        <Field label="Categoría"><select value={p.region} onChange={(e) => set('region', e.target.value)} className="inp">{CATEGORIES.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Noches"><input type="number" min={1} value={p.nights} onChange={(e) => set('nights', Math.max(parseInt(e.target.value) || 0, 0))} className="inp" /></Field>
        <Field label="Precio desde">
          <div className="flex gap-1">
            <select value={p.currency} onChange={(e) => set('currency', e.target.value as Currency)} className="inp w-20"><option>USD</option><option>ARS</option></select>
            <input type="number" min={0} value={p.priceFrom || ''} onChange={(e) => set('priceFrom', Math.max(parseFloat(e.target.value) || 0, 0))} className="inp" />
          </div>
        </Field>
        <Field label="Salidas" className="col-span-2"><input value={p.departures} maxLength={80} onChange={(e) => set('departures', e.target.value)} className="inp" placeholder="Ej.: Salidas diarias desde Buenos Aires" /></Field>
        <Field label="Descripción" className="col-span-2"><textarea rows={3} value={p.description} maxLength={600} onChange={(e) => set('description', e.target.value)} className="inp" /></Field>
        <Field label="Incluye (uno por línea)"><textarea rows={5} value={includes} onChange={(e) => setIncludes(e.target.value)} className="inp" /></Field>
        <Field label="Foto de portada">
          <div className="space-y-2">
            <PackageCover pkg={p.destination ? p : { ...p, destination: 'Vista previa' }} className="h-24 w-full rounded-md" />
            <label className="btn-ghost w-full cursor-pointer text-xs"><ImagePlus size={14} /> Subir imagen<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} /></label>
            {p.image && <button className="w-full text-xs text-slate-500 hover:text-red-600" onClick={() => set('image', undefined)}>Quitar imagen</button>}
            {err && <p className="text-xs font-semibold text-red-600">{err}</p>}
          </div>
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={p.active} onChange={(e) => set('active', e.target.checked)} className="accent-magenta" /> Publicado</label>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} className="accent-magenta" /> Destacado en portada</label>
        <div className="ml-auto flex gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-accent" disabled={!valid} onClick={save}>Guardar</button></div>
      </div>
    </Modal>
  )
}

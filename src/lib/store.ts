// Estado de la maqueta en localStorage. Se sincroniza entre pestañas (web pública ↔ sistema).
import { useSyncExternalStore } from 'react'
import { seed, suppliers, type CashMovement, type Client, type FileStatus, type Inquiry, type InquiryStatus, type Pax, type Promoter, type Receipt, type SupplierPayment, type TravelFile, type TravelPackage } from './mock'
import { today, uid } from './format'

type State = ReturnType<typeof seed>
const KEY = 'lextravel-demo-v5'
const listeners = new Set<() => void>()

/** Files que se actualizan solos: pasan a "En viaje" al salir y a "Cerrado" cuando el viaje termina. */
function autoStatus(s: State): State {
  const t = today()
  return {
    ...s,
    files: s.files.map((f) => {
      if (f.status !== 'Confirmado' && f.status !== 'En viaje') return f
      if (f.returnDate < t) return { ...f, status: 'Cerrado' as FileStatus, autoClosed: true }
      if (f.travelDate <= t && f.status === 'Confirmado') return { ...f, status: 'En viaje' as FileStatus }
      return f
    }),
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return autoStatus(JSON.parse(raw) as State)
  } catch { /* sin almacenamiento: se usa la semilla */ }
  return autoStatus(seed())
}

let state: State = load()

function commit(next: State) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* cuota llena o bloqueado */ }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { state = load(); listeners.forEach((l) => l()) }
  })
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => select(state))
}

const cashMove = (m: Omit<CashMovement, 'id'>): CashMovement => ({ id: uid(), ...m })
const mapFile = (id: string, fn: (f: TravelFile) => TravelFile) => state.files.map((f) => (f.id === id ? fn(f) : f))

export const actions = {
  reset() { commit(autoStatus(seed())) },

  /* ---- Files ---- */
  addFile(f: TravelFile) { commit({ ...state, files: [f, ...state.files] }) },
  setFileStatus(fileId: string, status: FileStatus) {
    commit({ ...state, files: mapFile(fileId, (f) => ({ ...f, status, autoClosed: false })) })
  },
  nextFileCode(year: string) {
    const nums = state.files.filter((f) => f.code.startsWith(`LX-${year}-`)).map((f) => parseInt(f.code.slice(-4)))
    return `LX-${year}-${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`
  },

  /* ---- Alumnos ---- */
  savePax(fileId: string, pax: Pax, prevDoc?: string) {
    commit({
      ...state,
      files: mapFile(fileId, (f) => {
        const list = prevDoc ? f.pax.map((p) => (p.doc === prevDoc ? pax : p)) : [...f.pax, pax]
        // si cambió el DNI, los recibos del alumno siguen asociados a él
        const receipts = prevDoc && prevDoc !== pax.doc ? f.receipts.map((r) => (r.paxDoc === prevDoc ? { ...r, paxDoc: pax.doc } : r)) : f.receipts
        return { ...f, pax: list.sort((a, b) => a.name.localeCompare(b.name)), receipts }
      }),
    })
  },
  removePax(fileId: string, doc: string) {
    commit({ ...state, files: mapFile(fileId, (f) => ({ ...f, pax: f.pax.filter((p) => p.doc !== doc) })) })
  },

  /* ---- Cobros y pagos ---- */
  addReceipt(fileId: string, r: Omit<Receipt, 'id'>): Receipt {
    const file = state.files.find((f) => f.id === fileId)!
    const rec = { id: uid(), ...r }
    commit({
      ...state,
      files: mapFile(fileId, (f) => ({ ...f, receipts: [...f.receipts, rec] })),
      cash: [cashMove({ date: r.date, kind: 'Ingreso', concept: `Cuota ${file.code}${r.paxDoc ? ` · ${file.pax.find((p) => p.doc === r.paxDoc)?.name ?? ''}` : ''}`, currency: r.currency, amount: r.amount, method: r.method, fileCode: file.code }), ...state.cash],
    })
    return rec
  },
  addSupplierPayment(fileId: string, p: Omit<SupplierPayment, 'id'>) {
    const file = state.files.find((f) => f.id === fileId)!
    const sup = suppliers.find((s) => s.id === p.supplierId)
    commit({
      ...state,
      files: mapFile(fileId, (f) => ({ ...f, supplierPayments: [...f.supplierPayments, { id: uid(), ...p }] })),
      cash: [cashMove({ date: p.date, kind: 'Egreso', concept: `Pago a ${sup?.name} · File ${file.code}`, currency: 'USD', amount: p.usd, method: p.method, fileCode: file.code }), ...state.cash],
    })
  },
  addCash(m: Omit<CashMovement, 'id'>) { commit({ ...state, cash: [cashMove(m), ...state.cash] }) },

  /* ---- Colegios y promotores ---- */
  addClient(c: Omit<Client, 'id'>): string {
    const id = uid()
    commit({ ...state, clients: [...state.clients, { id, ...c }] })
    return id
  },
  savePromoter(p: Promoter) {
    const prev = state.promoters.find((x) => x.id === p.id)
    commit({
      ...state,
      promoters: prev ? state.promoters.map((x) => (x.id === p.id ? p : x)) : [...state.promoters, p],
      // si cambia el nombre, los files del promotor quedan vinculados
      files: prev && prev.name !== p.name ? state.files.map((f) => (f.seller === prev.name ? { ...f, seller: p.name } : f)) : state.files,
    })
  },

  /* ---- Web ---- */
  savePackage(pkg: TravelPackage) {
    const exists = state.packages.some((p) => p.id === pkg.id)
    commit({ ...state, packages: exists ? state.packages.map((p) => (p.id === pkg.id ? pkg : p)) : [pkg, ...state.packages] })
  },
  deletePackage(id: string) { commit({ ...state, packages: state.packages.filter((p) => p.id !== id) }) },
  addInquiry(q: Omit<Inquiry, 'id' | 'date' | 'status'>) {
    commit({ ...state, inquiries: [{ id: uid(), date: today(), status: 'Nueva', ...q }, ...state.inquiries] })
  },
  setInquiryStatus(id: string, status: InquiryStatus) {
    commit({ ...state, inquiries: state.inquiries.map((q) => (q.id === id ? { ...q, status } : q)) })
  },
}

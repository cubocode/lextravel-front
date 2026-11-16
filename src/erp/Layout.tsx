import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Briefcase, CircleDollarSign, Globe, GraduationCap, Inbox, LayoutDashboard, LogOut, Menu, RotateCcw, UserRound, Wallet, X } from 'lucide-react'
import { actions, useStore } from '../lib/store'
import { MARKET_TODAY, RATE_TODAY } from '../lib/mock'
import { logoUrl } from '../lib/ui'
import { money } from '../lib/format'

export type Role = 'Admin' | 'Vendedor' | 'Operador' | 'Administración'
const ROLES: Role[] = ['Admin', 'Vendedor', 'Operador', 'Administración']
const KEY = 'lextravel-demo-role'

export function getRole(): Role | null {
  try { const r = sessionStorage.getItem(KEY); return ROLES.includes(r as Role) ? (r as Role) : null } catch { return null }
}

const ALL = ROLES
const NAV: { to: string; label: string; icon: typeof Menu; roles: Role[]; end?: boolean; section?: string }[] = [
  { to: '/admin', end: true, label: 'Tablero', icon: LayoutDashboard, roles: ALL, section: 'Gestión' },
  { to: '/admin/files', label: 'Files / grupos', icon: Briefcase, roles: ALL },
  { to: '/admin/alumnos', label: 'Alumnos', icon: GraduationCap, roles: ALL },
  { to: '/admin/cobranzas', label: 'Cobranzas', icon: CircleDollarSign, roles: ['Admin', 'Administración', 'Vendedor'] },
  { to: '/admin/caja', label: 'Caja', icon: Wallet, roles: ['Admin', 'Administración'] },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart3, roles: ['Admin', 'Administración'] },
  { to: '/admin/promotores', label: 'Promotores', icon: UserRound, roles: ['Admin'], section: 'Equipo y web' },
  { to: '/admin/consultas', label: 'Consultas web', icon: Inbox, roles: ['Admin', 'Vendedor', 'Operador'] },
  { to: '/admin/paquetes', label: 'Paquetes web', icon: Globe, roles: ['Admin', 'Operador'] },
]

export function Login() {
  const nav = useNavigate()
  const [role, setRole] = useState<Role>('Admin')
  function submit(e: FormEvent) {
    e.preventDefault()
    try { sessionStorage.setItem(KEY, role) } catch { /* ignorar */ }
    nav('/admin')
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-azul p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <img src={logoUrl} alt="Lex Travel" className="mx-auto h-16" />
        <h1 className="mt-4 text-center text-lg font-bold text-azul">Sistema de gestión</h1>
        <p className="mb-6 text-center text-xs text-slate-500">Versión de demostración · datos ficticios</p>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Usuario</label>
        <input className="inp mb-3" defaultValue="demo@lextravel" readOnly />
        <label className="mb-1 block text-xs font-semibold text-slate-600">Contraseña</label>
        <input className="inp mb-3" type="password" defaultValue="demostracion" readOnly />
        <label className="mb-1 block text-xs font-semibold text-slate-600">Ingresar con el rol</label>
        <select className="inp mb-6" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button className="btn-accent w-full py-2">Ingresar</button>
        <Link to="/" className="mt-4 block text-center text-xs text-slate-500 hover:text-magenta">← Volver al sitio web</Link>
      </form>
    </div>
  )
}

export function ErpLayout() {
  const role = getRole()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const nuevas = useStore((s) => s.inquiries.filter((q) => q.status === 'Nueva').length)
  useEffect(() => { setOpen(false) }, [pathname])
  if (!role) return <Navigate to="/admin/login" replace />
  const items = NAV.filter((i) => i.roles.includes(role))
  const logout = () => { try { sessionStorage.removeItem(KEY) } catch { /* */ } nav('/admin/login') }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {open && <div className="fixed inset-0 z-40 bg-azul-dark/50 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-azul text-white transition-transform md:sticky md:top-0 md:h-screen md:w-56 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between bg-white px-4 py-3">
          <img src={logoUrl} alt="Lex Travel" className="h-10" />
          <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 md:hidden" aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map(({ to, end, label, icon: I, section }) => (
            <div key={to}>
              {section && <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">{section}</div>}
              <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-magenta text-white' : 'text-white/80 hover:bg-white/10'}`}>
                <I size={17} /> <span className="flex-1">{label}</span>
                {label === 'Consultas web' && nuevas > 0 && <span className="rounded-full bg-white px-1.5 text-xs font-bold text-magenta">{nuevas}</span>}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-2 text-xs">
          <button onClick={() => confirm('¿Restablecer los datos de demostración?') && actions.reset()} className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-white/60 hover:bg-white/10"><RotateCcw size={14} /> Restablecer demo</button>
          <Link to="/" className="flex items-center gap-2 rounded px-3 py-1.5 text-white/60 hover:bg-white/10"><Globe size={14} /> Ver sitio web</Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-5">
          <button onClick={() => setOpen(true)} className="rounded-md p-1.5 text-azul hover:bg-slate-100 md:hidden" aria-label="Abrir menú"><Menu size={22} /></button>
          <img src={logoUrl} alt="Lex Travel" className="h-8 md:hidden" />
          <div className="ml-auto flex items-center gap-3 text-sm sm:gap-4">
            <div className="hidden rounded-md bg-slate-50 px-3 py-1 text-xs lg:block">
              TC agencia <b className="text-azul">{money(RATE_TODAY, 'ARS')}</b> · Mercado <b className="text-slate-600">{money(MARKET_TODAY, 'ARS')}</b>
            </div>
            <div className="text-right leading-tight">
              <div className="font-semibold text-azul">Usuario demo</div>
              <div className="text-xs text-magenta">{role}</div>
            </div>
            <button onClick={logout} title="Salir" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-5"><Outlet context={role} /></main>
      </div>
    </div>
  )
}

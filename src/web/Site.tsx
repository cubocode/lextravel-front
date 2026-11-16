import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { CalendarDays, Check, GraduationCap, Headphones, MapPin, MessageCircle, Moon, ShieldCheck, Users, Wallet } from 'lucide-react'
import { useStore, actions } from '../lib/store'
import { money0 } from '../lib/format'
import { logoUrl, PackageCover } from '../lib/ui'
import { CATEGORIES, type TravelPackage } from '../lib/mock'

const OFFICES = ['Shipton 1225 · Concepción, Tucumán', 'Maipú 140, local 23 · San Miguel de Tucumán', 'Zurita 351 · Catamarca']

/* ---------- Layout ---------- */
export function SiteLayout() {
  const link = ({ isActive }: { isActive: boolean }) => `px-3 py-2 text-sm font-semibold ${isActive ? 'text-magenta' : 'text-azul hover:text-magenta'}`
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <Link to="/"><img src={logoUrl} alt="Lex Travel" className="h-12 w-auto" /></Link>
          <nav className="flex items-center">
            <NavLink to="/" end className={link}>Inicio</NavLink>
            <NavLink to="/paquetes" className={link}>Paquetes</NavLink>
            <NavLink to="/contacto" className={link}>Contacto</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="bg-azul text-white/90">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <div className="text-xl font-extrabold text-white">Lex <span className="text-magenta">Travel</span></div>
            <p className="mt-2 text-sm text-white/70">Viajes de egresados, viajes educativos y turismo. Tours y aventuras inolvidables.</p>
          </div>
          <ul className="space-y-2 text-sm">
            {OFFICES.map((o) => <li key={o} className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-magenta" /> {o}</li>)}
          </ul>
          <div className="text-sm sm:text-right">
            <Link to="/admin" className="font-semibold text-white underline-offset-4 hover:underline">Acceso agencia</Link>
            <p className="mt-6 text-xs text-white/50">Legajo EVT N.º 00000 · Sitio desarrollado por CuboCode</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ---------- Tarjeta de paquete ---------- */
function PackageCard({ pkg }: { pkg: TravelPackage }) {
  return (
    <Link to={`/paquete/${pkg.id}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <PackageCover pkg={pkg} className="h-44 w-full" />
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-magenta">{pkg.region}</div>
        <h3 className="mt-0.5 text-lg font-bold text-azul">{pkg.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Moon size={14} /> {pkg.nights} noches</div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-slate-500">Desde, por pasajero</div>
            <div className="text-xl font-extrabold text-azul">{money0(pkg.priceFrom, pkg.currency)}</div>
          </div>
          <span className="rounded-md bg-magenta px-3 py-1.5 text-sm font-semibold text-white group-hover:bg-magenta-dark">Ver más</span>
        </div>
      </div>
    </Link>
  )
}

/* ---------- Inicio ---------- */
export function Home() {
  const pkgs = useStore((s) => s.packages)
  const featured = pkgs.filter((p) => p.active && p.featured)
  return (
    <>
      <section className="relative overflow-hidden bg-azul text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-magenta/30" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"><GraduationCap size={16} className="text-magenta" /> Egresados · Viajes educativos · Turismo</div>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">El viaje que tu curso <span className="text-magenta">nunca va a olvidar</span>.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Viajes de egresados de primaria y secundaria, y viajes de estudio. Coordinación 24 h para que los chicos disfruten y las familias viajen tranquilas desde casa.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/paquetes" className="btn-accent px-6 py-3 text-base">Ver viajes 2027</Link>
            <Link to="/contacto" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">Cotizar para mi curso</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold text-azul">Viajes destacados</h2>
          <Link to="/paquetes" className="text-sm font-semibold text-magenta hover:underline">Ver todos →</Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <PackageCard key={p.id} pkg={p} />)}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Headphones, t: 'Coordinadores 24 h', d: 'Acompañan al grupo durante todo el viaje y mantienen informadas a las familias.' },
            { icon: Wallet, t: 'Planes de pago', d: 'Cuotas pensadas para que cada familia pague a su ritmo hasta la salida.' },
            { icon: ShieldCheck, t: 'Seguro médico', d: 'Cobertura médica y asistencia al viajero para todo el grupo.' },
            { icon: Users, t: 'Reuniones con padres', d: 'Presentamos la propuesta en el colegio y respondemos todas las dudas.' },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="inline-flex rounded-lg bg-magenta/10 p-3 text-magenta"><I size={22} /></div>
              <h3 className="mt-3 font-bold text-azul">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="text-2xl font-extrabold text-azul">¿Querés que visitemos tu colegio?</h2>
        <p className="mt-2 text-slate-600">Dejanos tus datos y coordinamos una reunión con el curso y las familias.</p>
        <Link to="/contacto" className="btn-accent mt-5 px-6 py-2.5 text-base"><MessageCircle size={18} /> Quiero que me contacten</Link>
      </section>
    </>
  )
}

/* ---------- Listado ---------- */
export function PackagesPage() {
  const list = useStore((s) => s.packages).filter((p) => p.active)
  const groups = [...CATEGORIES, ...new Set(list.map((p) => p.region))].filter((c, i, a) => a.indexOf(c) === i)
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-azul">Nuestros viajes</h1>
      <p className="mt-1 text-slate-600">Propuestas vigentes para la temporada. Consultanos por fechas y planes de pago para tu curso.</p>
      {groups.map((g) => {
        const items = list.filter((p) => p.region === g)
        if (!items.length) return null
        return (
          <section key={g} className="mt-10">
            <h2 className="mb-4 border-l-4 border-magenta pl-3 text-xl font-bold text-azul">{g}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <PackageCard key={p.id} pkg={p} />)}</div>
          </section>
        )
      })}
      {list.length === 0 && <p className="mt-10 text-center text-slate-500">Pronto vamos a publicar los viajes de la nueva temporada.</p>}
    </div>
  )
}

/* ---------- Detalle ---------- */
export function PackageDetail() {
  const { id } = useParams()
  const pkg = useStore((s) => s.packages.find((p) => p.id === id && p.active))
  if (!pkg) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-500">Paquete no disponible. <Link to="/paquetes" className="text-magenta">Ver paquetes</Link></div>
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PackageCover pkg={pkg} className="h-64 w-full rounded-2xl sm:h-80" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-magenta">{pkg.region}</div>
          <h1 className="text-3xl font-extrabold text-azul">{pkg.title}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1"><Moon size={16} /> {pkg.nights} noches</span>
            <span className="flex items-center gap-1"><CalendarDays size={16} /> {pkg.departures}</span>
          </div>
          <p className="mt-5 text-slate-700">{pkg.description}</p>
          <h2 className="mt-8 font-bold text-azul">Incluye</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {pkg.includes.map((i) => <li key={i} className="flex items-center gap-2 text-slate-700"><Check size={18} className="text-magenta" /> {i}</li>)}
          </ul>
          <div className="mt-8 rounded-xl bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Precio desde, por pasajero · consultá planes de pago en cuotas</div>
            <div className="text-3xl font-extrabold text-azul">{money0(pkg.priceFrom, pkg.currency)}</div>
            <div className="mt-1 text-xs text-slate-500">Tarifas sujetas a disponibilidad y a cambios sin previo aviso. Impuestos incluidos según corresponda.</div>
          </div>
        </div>
        <aside className="h-fit rounded-xl border border-slate-200 p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-azul">Pedí información</h2>
          <p className="mb-4 text-sm text-slate-500">Te respondemos en menos de 24 h hábiles.</p>
          <InquiryForm pkg={pkg} />
        </aside>
      </div>
    </div>
  )
}

/* ---------- Contacto ---------- */
export function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-azul">Contacto</h1>
      <p className="mt-2 text-slate-600">Contanos de qué colegio y curso son, cuántos viajarían y qué tipo de viaje buscan. Te armamos una propuesta y coordinamos una reunión.</p>
      <div className="mt-6 rounded-xl border border-slate-200 p-6 shadow-sm"><InquiryForm /></div>
    </div>
  )
}

/* ---------- Formulario de consulta ---------- */
const LIMIT_KEY = 'lextravel-consultas-enviadas'
function tooManyRecent() {
  try {
    const recent = (JSON.parse(localStorage.getItem(LIMIT_KEY) ?? '[]') as number[]).filter((t) => Date.now() - t < 10 * 60_000)
    if (recent.length >= 3) return true
    localStorage.setItem(LIMIT_KEY, JSON.stringify([...recent, Date.now()]))
  } catch { /* sin almacenamiento */ }
  return false
}

function InquiryForm({ pkg }: { pkg?: TravelPackage }) {
  const [f, setF] = useState({ name: '', role: 'Madre / padre', school: '', email: '', phone: '', pax: '', message: '', website: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (f.website) { setSent(true); return } // trampa para robots
    const name = f.name.trim(), school = f.school.trim(), email = f.email.trim(), phone = f.phone.replace(/[^\d+]/g, ''), message = f.message.trim()
    const pax = Math.min(Math.max(parseInt(f.pax) || 1, 1), 300)
    const role = ['Madre / padre', 'Alumno/a', 'Docente / directivo'].includes(f.role) ? f.role : 'Madre / padre'
    if (name.length < 2) return setError('Ingresá tu nombre.')
    if (school.length < 3) return setError('Indicá el colegio y el curso.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError('Ingresá un correo válido.')
    if (phone.length < 8) return setError('Ingresá un teléfono válido.')
    if (tooManyRecent()) return setError('Ya recibimos tus consultas. Probá de nuevo en unos minutos.')
    actions.addInquiry({ packageId: pkg?.id, name, role, school, email, phone, pax, message: message || (pkg ? `Consulta por ${pkg.title}` : '') })
    setSent(true)
  }

  if (sent) return (
    <div className="rounded-lg bg-magenta/10 p-5 text-center">
      <div className="mx-auto mb-2 inline-flex rounded-full bg-magenta p-2 text-white"><Check /></div>
      <p className="font-bold text-azul">¡Gracias! Recibimos tu consulta.</p>
      <p className="text-sm text-slate-600">Un asesor de Lex Travel se va a contactar con vos.</p>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <input value={f.name} onChange={set('name')} maxLength={80} placeholder="Nombre y apellido" className="inp py-2" autoComplete="name" />
      <select value={f.role} onChange={set('role')} className="inp py-2" aria-label="Soy">
        <option>Madre / padre</option><option>Alumno/a</option><option>Docente / directivo</option>
      </select>
      <input value={f.school} onChange={set('school')} maxLength={100} placeholder="Colegio y curso (ej.: Colegio San José · 5.º año)" className="inp py-2" />
      <input value={f.email} onChange={set('email')} maxLength={120} placeholder="Correo electrónico" type="email" className="inp py-2" autoComplete="email" />
      <div className="grid grid-cols-[1fr_130px] gap-3">
        <input value={f.phone} onChange={set('phone')} maxLength={25} placeholder="Teléfono / WhatsApp" type="tel" className="inp py-2" autoComplete="tel" />
        <input value={f.pax} onChange={set('pax')} type="number" min={1} max={300} placeholder="N.º de alumnos" className="inp py-2" aria-label="Cantidad de alumnos" />
      </div>
      <textarea value={f.message} onChange={set('message')} maxLength={1000} rows={3} placeholder={pkg ? 'Año de viaje, fechas tentativas, dudas…' : '¿Qué tipo de viaje buscan? Egresados, educativo, destino, fechas…'} className="inp py-2" />
      <input value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button className="btn-accent w-full py-2.5 text-base">Enviar consulta</button>
    </form>
  )
}

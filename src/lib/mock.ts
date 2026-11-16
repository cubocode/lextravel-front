// Datos ficticios para la maqueta de Lex Travel (viajes de egresados y educativos).
export type Currency = 'USD' | 'ARS'
export type FileStatus = 'Presupuesto' | 'Confirmado' | 'En viaje' | 'Cerrado' | 'Cancelado'
export type ServiceType = 'Aéreo' | 'Hotel' | 'Traslado' | 'Asistencia' | 'Paquete' | 'Excursión'
export type InquiryStatus = 'Nueva' | 'Contactado' | 'Cotizada' | 'Cerrada'

/** Cliente = colegio. `contact` es el referente del grupo (padre/madre delegado, docente). */
export interface Client { id: string; name: string; city: string; doc: string; contact: string; email: string; phone: string }
export interface Supplier { id: string; name: string; kind: string }
export interface Pax { name: string; doc: string; birth: string; tutor?: string; phone?: string }
/** Servicio de un File. `sale` y `cost` son importes POR ALUMNO; el total del grupo se calcula con la cantidad de alumnos. */
export interface Service { id: string; type: ServiceType; description: string; supplierId: string; date: string; sale: number; cost: number }
/** Recibo de cobro. `usd` = equivalente acreditado; `rate` = TC aplicado; `marketRate` = TC de mercado; `paxDoc` = alumno que paga. */
export interface Receipt { id: string; date: string; method: string; currency: Currency; amount: number; rate: number; marketRate: number; usd: number; paxDoc?: string }
export interface SupplierPayment { id: string; date: string; supplierId: string; usd: number; method: string; ref: string }
export interface TravelFile {
  id: string; code: string; created: string; travelDate: string; returnDate: string; seller: string; autoClosed?: boolean
  clientId: string; course: string; destination: string; status: FileStatus
  installments: number; planStart: string // plan de cuotas: cantidad y primer mes (AAAA-MM)
  pax: Pax[]; services: Service[]; receipts: Receipt[]; supplierPayments: SupplierPayment[]
}
export interface CashMovement { id: string; date: string; kind: 'Ingreso' | 'Egreso'; concept: string; currency: Currency; amount: number; method: string; fileCode?: string }
export interface TravelPackage {
  id: string; title: string; destination: string; region: string; nights: number; priceFrom: number; currency: Currency
  image?: string; includes: string[]; description: string; departures: string; featured: boolean; active: boolean
}
export interface Inquiry { id: string; date: string; packageId?: string; name: string; role?: string; school?: string; email: string; phone: string; pax: number; message: string; status: InquiryStatus }

export const RATE_TODAY = 1450   // TC que aplica la agencia (ARS por USD)
export const MARKET_TODAY = 1435 // TC de mercado de referencia
export const CASH_OPENING = { ARS: 4850000, USD: 12400 }
export const SELLERS = ['Laura Gómez', 'Martín Ruiz', 'Sofía Pereyra']

export const clients: Client[] = [
  { id: 'c1', name: 'Colegio San José', city: 'Concepción, Tucumán', doc: 'CUIT 30-50001111-2', contact: 'Florencia Acosta (madre delegada)', email: 'sanjose@example.com', phone: '3865 55-1111' },
  { id: 'c2', name: 'Escuela Normal Superior', city: 'San Miguel de Tucumán', doc: 'CUIT 30-50002222-3', contact: 'Hernán Vega (alumno delegado)', email: 'normal@example.com', phone: '381 555-2222' },
  { id: 'c3', name: 'Instituto Belgrano', city: 'San Miguel de Tucumán', doc: 'CUIT 30-50003333-4', contact: 'Prof. Marcela Ibáñez', email: 'belgrano@example.com', phone: '381 555-3333' },
  { id: 'c4', name: 'Escuela N.º 312', city: 'Concepción, Tucumán', doc: 'CUIT 30-50004444-5', contact: 'Dir. Gabriela Torres', email: 'esc312@example.com', phone: '3865 55-4444' },
  { id: 'c5', name: 'Colegio del Valle', city: 'S. F. del Valle de Catamarca', doc: 'CUIT 30-50005555-6', contact: 'Roberto Gutiérrez (padre delegado)', email: 'delvalle@example.com', phone: '383 555-5555' },
  { id: 'c6', name: 'Escuela Técnica N.º 1', city: 'S. F. del Valle de Catamarca', doc: 'CUIT 30-50006666-7', contact: 'Prof. Diego Herrera', email: 'tecnica1@example.com', phone: '383 555-6666' },
  { id: 'c7', name: 'Colegio Santa Rosa', city: 'San Miguel de Tucumán', doc: 'CUIT 30-50007777-8', contact: 'Ignacio Romero (padre delegado)', email: 'santarosa@example.com', phone: '381 555-7777' },
]

export const suppliers: Supplier[] = [
  { id: 's1', name: 'Transportes del Norte', kind: 'Transporte terrestre' },
  { id: 's2', name: 'Hotel Cumbres Bariloche', kind: 'Hotelería' },
  { id: 's3', name: 'Excursiones Patagonia', kind: 'Receptivo' },
  { id: 's4', name: 'Noches Bariloche Eventos', kind: 'Boliches y fiestas' },
  { id: 's5', name: 'Seguro Escolar SA', kind: 'Seguro / asistencia' },
  { id: 's6', name: 'Brasil Joven Operador', kind: 'Operador mayorista' },
  { id: 's7', name: 'Andes Mayorista', kind: 'Operador mayorista' },
]

export const MONTHLY_SALES = [
  { month: 'Jun', usd: 86400 }, { month: 'Jul', usd: 64200 }, { month: 'Ago', usd: 71800 },
  { month: 'Sep', usd: 52600 }, { month: 'Oct', usd: 93300 }, { month: 'Nov', usd: 41900 },
]

/* ---------- Generadores deterministas (siempre dan los mismos datos) ---------- */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pad = (x: number) => String(x).padStart(2, '0')
const r2 = (n: number) => Math.round(n * 100) / 100
const NAMES = ['Valentina', 'Mateo', 'Martina', 'Santiago', 'Catalina', 'Benjamín', 'Sofía', 'Joaquín', 'Emma', 'Thiago', 'Isabella', 'Lautaro', 'Delfina', 'Bautista', 'Mía', 'Tomás', 'Lucía', 'Felipe', 'Agustina', 'Facundo', 'Abril', 'Juan Cruz', 'Milagros', 'Ignacio', 'Camila', 'Nicolás', 'Julieta', 'Franco', 'Josefina', 'Gonzalo']
const SURNAMES = ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'Romero', 'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Giménez', 'Gutiérrez', 'Pereyra', 'Molina', 'Castro', 'Ortiz', 'Silva', 'Núñez', 'Luna', 'Juárez', 'Cabrera', 'Ríos', 'Ferreyra', 'Godoy', 'Morales', 'Paz', 'Toledo', 'Vera', 'Ledesma']
const PARENTS = ['Carolina', 'Marcelo', 'Silvana', 'Daniel', 'Verónica', 'Gustavo', 'Natalia', 'Pablo', 'Lorena', 'Sergio', 'Andrea', 'Javier']
const dniFmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

function students(n: number, seed: number, birthYear: number, dniBase: number): Pax[] {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const first = NAMES[Math.floor(r() * NAMES.length)], last = SURNAMES[Math.floor(r() * SURNAMES.length)]
    return { name: `${last}, ${first}`, doc: `DNI ${dniFmt(dniBase + i * 7919 + Math.floor(r() * 7000))}`, birth: `${birthYear}-${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 28))}`, tutor: `${PARENTS[Math.floor(r() * PARENTS.length)]} ${last}`, phone: `381 15${400 + Math.floor(r() * 599)}-${1000 + Math.floor(r() * 8999)}` }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

// TC aproximado de cada mes (para que los cobros viejos en pesos tengan su TC histórico)
const MONTH_RATE: Record<string, number> = { '2026-02': 1215, '2026-03': 1230, '2026-04': 1250, '2026-05': 1270, '2026-06': 1300, '2026-07': 1340, '2026-08': 1365, '2026-09': 1380, '2026-10': 1420, '2026-11': 1450 }
const addMonths = (ym: string, k: number) => { const [y, m] = ym.split('-').map(Number); const t = y * 12 + m - 1 + k; return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}` }
const LAST_MONTH = '2026-11'

let n = 0
const id = (p: string) => `${p}${++n}`

/** Cuotas pagadas por cada alumno: entre min y max cuotas desde `start`, la mayoría en pesos. */
function cuotas(pax: Pax[], price: number, total: number, start: string, [min, max]: [number, number], seed: number): Receipt[] {
  const r = rng(seed), out: Receipt[] = [], cuota = r2(price / total)
  for (const x of pax) {
    const k = r() < 0.15 ? Math.max(min, max - 1 - Math.floor(r() * 2)) : max // ~15 % de las familias se atrasa
    for (let j = 0; j < k; j++) {
      const month = addMonths(start, j)
      if (month > LAST_MONTH) break
      const usd = j === total - 1 ? r2(price - cuota * (total - 1)) : cuota
      const date = `${month}-${pad(month === LAST_MONTH ? 2 + Math.floor(r() * 9) : 3 + Math.floor(r() * 20))}`
      if (r() < 0.2) {
        out.push({ id: id('r'), date, method: 'Efectivo', currency: 'USD', amount: usd, rate: 1, marketRate: 1, usd, paxDoc: x.doc })
      } else {
        const rate = MONTH_RATE[month] ?? RATE_TODAY
        out.push({ id: id('r'), date, method: r() < 0.6 ? 'Transferencia' : 'Efectivo', currency: 'ARS', amount: r2(usd * rate), rate, marketRate: rate - 15 + Math.floor(r() * 25), usd, paxDoc: x.doc })
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

type Item = [ServiceType, string, string, string, number, number] // tipo, descripción, proveedor, fecha, venta x alumno, costo x alumno
interface GroupSpec {
  id: string; code: string; created: string; travelDate: string; returnDate: string; seller: string; clientId: string; course: string
  destination: string; status: FileStatus; students: number; birthYear: number; dniBase: number; seed: number
  installments: number; planStart: string; paid: [number, number]; items: Item[]; supplierPaid: [string, string, number, string][]
}

function group(g: GroupSpec): TravelFile {
  const pax = students(g.students, g.seed, g.birthYear, g.dniBase)
  const price = g.items.reduce((a, it) => a + it[4], 0)
  const services = g.items.map(([type, description, supplierId, date, sale, cost]) => ({ id: id('sv'), type, description, supplierId, date, sale, cost }))
  const supplierPayments = g.supplierPaid.map(([date, supplierId, frac, ref]) => ({
    id: id('op'), date, supplierId, method: 'Transferencia', ref,
    usd: r2(services.filter((s) => s.supplierId === supplierId).reduce((a, s) => a + s.cost, 0) * g.students * frac),
  }))
  return {
    id: g.id, code: g.code, created: g.created, travelDate: g.travelDate, returnDate: g.returnDate, seller: g.seller, clientId: g.clientId,
    course: g.course, destination: g.destination, status: g.status, installments: g.installments, planStart: g.planStart,
    pax, services, supplierPayments, receipts: cuotas(pax, price, g.installments, g.planStart, g.paid, g.seed + 1),
  }
}

const BARILOCHE: Item[] = [
  ['Traslado', 'Bus semicama Tucumán–Bariloche–Tucumán', 's1', '', 420, 340],
  ['Hotel', 'Hotel exclusivo egresados · 7 noches · pensión completa', 's2', '', 980, 820],
  ['Excursión', 'Cerro Catedral, Circuito Chico e Isla Victoria', 's3', '', 260, 200],
  ['Excursión', 'Pase de boliches y fiestas temáticas · 6 noches', 's4', '', 290, 230],
  ['Asistencia', 'Seguro médico escolar', 's5', '', 50, 30],
]
const dated = (items: Item[], date: string): Item[] => items.map((it) => [it[0], it[1], it[2], date, it[4], it[5]])

function files(): TravelFile[] {
  return [
    group({ id: 'f1', code: 'LX-2027-0012', created: '2026-02-20', travelDate: '2027-07-10', returnDate: '2027-07-18', seller: 'Laura Gómez', clientId: 'c1',
      course: '5.º año A · Promo 2027', destination: 'Bariloche', status: 'Confirmado', students: 38, birthYear: 2009, dniBase: 49100000, seed: 11,
      installments: 10, planStart: '2026-03', paid: [6, 9], items: dated(BARILOCHE, '2027-07-10'),
      supplierPaid: [['2026-06-15', 's2', 0.5, 'OP-0411'], ['2026-09-10', 's1', 0.3, 'OP-0452']] }),
    group({ id: 'f2', code: 'LX-2027-0015', created: '2026-05-28', travelDate: '2027-12-06', returnDate: '2027-12-14', seller: 'Martín Ruiz', clientId: 'c2',
      course: '5.º año B · Promo 2027', destination: 'Balneário Camboriú', status: 'Confirmado', students: 25, birthYear: 2009, dniBase: 49400000, seed: 22,
      installments: 12, planStart: '2026-06', paid: [4, 6],
      items: [
        ['Traslado', 'Bus semicama Tucumán–Camboriú–Tucumán', 's1', '2027-12-06', 520, 430],
        ['Hotel', 'Hotel frente al mar · 7 noches · media pensión', 's6', '2027-12-07', 640, 530],
        ['Excursión', 'Parque Unipraias y Beto Carrero World', 's6', '2027-12-08', 180, 140],
        ['Excursión', 'Fiestas exclusivas egresados', 's6', '2027-12-07', 160, 120],
        ['Asistencia', 'Seguro médico internacional', 's5', '2027-12-06', 60, 38],
      ],
      supplierPaid: [['2026-10-05', 's6', 0.2, 'OP-0461']] }),
    group({ id: 'f3', code: 'LX-2026-0131', created: '2026-02-12', travelDate: '2026-11-10', returnDate: '2026-11-14', seller: 'Sofía Pereyra', clientId: 'c3',
      course: '7.º grado · Egresados de primaria', destination: 'Villa Carlos Paz', status: 'En viaje', students: 32, birthYear: 2014, dniBase: 54200000, seed: 33,
      installments: 8, planStart: '2026-03', paid: [8, 8],
      items: [
        ['Traslado', 'Bus Tucumán–Carlos Paz–Tucumán', 's1', '2026-11-10', 120, 95],
        ['Hotel', 'Hotel 4 noches · pensión completa', 's7', '2026-11-10', 310, 250],
        ['Excursión', 'Parque acuático, aerosilla y noche de juegos', 's7', '2026-11-11', 70, 50],
        ['Asistencia', 'Seguro médico escolar', 's5', '2026-11-10', 20, 12],
      ],
      supplierPaid: [['2026-10-20', 's1', 1, 'OP-0470'], ['2026-10-20', 's7', 1, 'OP-0471'], ['2026-10-20', 's5', 1, 'OP-0472']] }),
    group({ id: 'f4', code: 'LX-2026-0118', created: '2026-02-25', travelDate: '2026-09-15', returnDate: '2026-09-18', seller: 'Sofía Pereyra', clientId: 'c4',
      course: '6.º grado · Viaje educativo', destination: 'Puerto Iguazú', status: 'Cerrado', students: 30, birthYear: 2014, dniBase: 54600000, seed: 44,
      installments: 6, planStart: '2026-03', paid: [6, 6],
      items: [
        ['Traslado', 'Bus Tucumán–Iguazú–Tucumán', 's1', '2026-09-15', 150, 120],
        ['Hotel', 'Hotel 3 noches · pensión completa', 's7', '2026-09-15', 230, 185],
        ['Excursión', 'Parque Nacional Iguazú y Ruinas de San Ignacio con guía', 's7', '2026-09-16', 70, 50],
        ['Asistencia', 'Seguro médico escolar', 's5', '2026-09-15', 20, 12],
      ],
      supplierPaid: [['2026-08-25', 's1', 1, 'OP-0431'], ['2026-08-25', 's7', 1, 'OP-0432'], ['2026-08-25', 's5', 1, 'OP-0433']] }),
    group({ id: 'f5', code: 'LX-2027-0018', created: '2026-04-15', travelDate: '2027-07-24', returnDate: '2027-08-01', seller: 'Martín Ruiz', clientId: 'c5',
      course: '5.º año · Promo 2027', destination: 'Bariloche', status: 'Confirmado', students: 42, birthYear: 2009, dniBase: 49700000, seed: 55,
      installments: 10, planStart: '2026-05', paid: [5, 7], items: dated(BARILOCHE, '2027-07-24'),
      supplierPaid: [['2026-08-20', 's2', 0.3, 'OP-0440']] }),
    group({ id: 'f6', code: 'LX-2027-0021', created: '2026-11-06', travelDate: '2027-05-12', returnDate: '2027-05-15', seller: 'Laura Gómez', clientId: 'c6',
      course: '4.º año · Viaje educativo', destination: 'Salta y Jujuy', status: 'Presupuesto', students: 28, birthYear: 2010, dniBase: 50300000, seed: 66,
      installments: 6, planStart: '2026-12', paid: [0, 0],
      items: [
        ['Traslado', 'Bus Catamarca–Salta–Jujuy–Catamarca', 's1', '2027-05-12', 110, 85],
        ['Hotel', 'Hotel 3 noches · pensión completa', 's7', '2027-05-12', 190, 150],
        ['Excursión', 'Quebrada de Humahuaca y Museo de Alta Montaña', 's7', '2027-05-13', 60, 42],
        ['Asistencia', 'Seguro médico escolar', 's5', '2027-05-12', 20, 12],
      ], supplierPaid: [] }),
    group({ id: 'f7', code: 'LX-2027-0023', created: '2026-11-10', travelDate: '2027-11-08', returnDate: '2027-11-12', seller: 'Sofía Pereyra', clientId: 'c7',
      course: '7.º grado · Egresados de primaria', destination: 'Villa Carlos Paz', status: 'Presupuesto', students: 35, birthYear: 2014, dniBase: 54900000, seed: 77,
      installments: 8, planStart: '2027-01', paid: [0, 0],
      items: [
        ['Traslado', 'Bus Tucumán–Carlos Paz–Tucumán', 's1', '2027-11-08', 130, 100],
        ['Hotel', 'Hotel 4 noches · pensión completa', 's7', '2027-11-08', 330, 265],
        ['Excursión', 'Parque acuático, aerosilla y noche de juegos', 's7', '2027-11-09', 75, 55],
        ['Asistencia', 'Seguro médico escolar', 's5', '2027-11-08', 20, 12],
      ], supplierPaid: [] }),
  ]
}

export const CATEGORIES = ['Egresados secundaria', 'Egresados primaria', 'Viaje educativo', 'Turismo'] as const

function packages(): TravelPackage[] {
  const T = 'Temporada 2027 · salidas desde Tucumán y Catamarca'
  return [
    { id: 'p1', title: 'Bariloche Egresados 2027', destination: 'Bariloche', region: 'Egresados secundaria', nights: 7, priceFrom: 2950000, currency: 'ARS', featured: true, active: true, departures: T,
      includes: ['Bus semicama ida y vuelta', '7 noches en hotel exclusivo', 'Pensión completa', 'Coordinadores 24 h', 'Excursiones y cerro Catedral', 'Boliches y fiestas temáticas', 'Seguro médico'],
      description: 'El viaje que esperan todo el secundario: nieve, excursiones, fiestas y la mejor coordinación para que los padres viajen tranquilos desde casa.' },
    { id: 'p2', title: 'Camboriú Egresados', destination: 'Balneário Camboriú', region: 'Egresados secundaria', nights: 7, priceFrom: 1290, currency: 'USD', featured: true, active: true, departures: T,
      includes: ['Bus semicama ida y vuelta', '7 noches frente al mar', 'Media pensión', 'Coordinadores 24 h', 'Parque Unipraias y playa', 'Fiestas exclusivas', 'Seguro médico internacional'],
      description: 'Egresados en la playa: sol, mar y fiestas en el destino más elegido de Brasil, con coordinación permanente.' },
    { id: 'p3', title: 'Carlos Paz – Egresados de primaria', destination: 'Villa Carlos Paz', region: 'Egresados primaria', nights: 4, priceFrom: 890000, currency: 'ARS', featured: true, active: true, departures: T,
      includes: ['Bus ida y vuelta', '4 noches con pensión completa', 'Docentes coordinadores', 'Parque acuático y aerosilla', 'Noche de juegos y disco infantil', 'Seguro médico'],
      description: 'El primer gran viaje con amigos, pensado para chicos de 7.º grado: diversión, actividades al aire libre y cuidado en todo momento.' },
    { id: 'p4', title: 'Educativo Cataratas del Iguazú', destination: 'Puerto Iguazú', region: 'Viaje educativo', nights: 3, priceFrom: 640000, currency: 'ARS', featured: false, active: true, departures: T,
      includes: ['Bus ida y vuelta', '3 noches con pensión completa', 'Guía con contenido curricular', 'Parque Nacional Iguazú', 'Ruinas de San Ignacio', 'Seguro médico'],
      description: 'Naturaleza, historia jesuítica y biodiversidad: un viaje de estudio con actividades pensadas junto a los docentes.' },
    { id: 'p5', title: 'Educativo Salta y Jujuy', destination: 'Salta · Quebrada de Humahuaca', region: 'Viaje educativo', nights: 3, priceFrom: 520000, currency: 'ARS', featured: false, active: true, departures: T,
      includes: ['Bus ida y vuelta', '3 noches con pensión completa', 'Guía local', 'Cerro de los 7 Colores y Purmamarca', 'Museo de Arqueología de Alta Montaña', 'Seguro médico'],
      description: 'Geografía, historia y cultura del NOA en primera persona. Ideal para cursos de primaria y secundaria.' },
    { id: 'p6', title: 'Educativo Buenos Aires', destination: 'Buenos Aires', region: 'Viaje educativo', nights: 3, priceFrom: 710000, currency: 'ARS', featured: false, active: true, departures: T,
      includes: ['Bus ida y vuelta', '3 noches con pensión completa', 'Visita al Congreso y Casa Rosada', 'Museos y Tecnópolis', 'Coordinadores', 'Seguro médico'],
      description: 'Las instituciones del país y los grandes museos de la capital, con un recorrido diseñado para aprender viajando.' },
  ]
}

function inquiries(): Inquiry[] {
  return [
    { id: 'q1', date: '2026-11-12', packageId: 'p1', name: 'Florencia Acosta', role: 'Madre / padre', school: 'Colegio San José · 5.º año', email: 'flor.acosta@example.com', phone: '381 666-1111', pax: 38, message: 'Queremos presentar la propuesta en la reunión de padres. ¿Qué planes de pago tienen?', status: 'Nueva' },
    { id: 'q2', date: '2026-11-11', packageId: 'p2', name: 'Hernán Vega', role: 'Alumno/a', school: 'Escuela Normal · 5.º B', email: 'hvega@example.com', phone: '383 666-2222', pax: 25, message: 'Somos 25 del curso, queremos info de Camboriú para 2027.', status: 'Nueva' },
    { id: 'q3', date: '2026-11-10', packageId: 'p4', name: 'Gabriela Torres', role: 'Docente / directivo', school: 'Escuela N.º 312 · 6.º grado', email: 'gtorres@example.com', phone: '381 666-3333', pax: 30, message: 'Viaje de estudio para septiembre. Necesitamos itinerario con contenidos de Ciencias Naturales.', status: 'Contactado' },
    { id: 'q4', date: '2026-11-07', packageId: 'p3', name: 'Ignacio Romero', role: 'Madre / padre', school: 'Instituto Belgrano · 7.º grado', email: 'iromero@example.com', phone: '381 666-4444', pax: 32, message: 'Cotización para egresados de primaria.', status: 'Cotizada' },
  ]
}

function cash(): CashMovement[] {
  return [
    { id: 'm1', date: '2026-11-12', kind: 'Ingreso', concept: 'Cuotas egresados (cobranza en oficina)', currency: 'ARS', amount: 3480000, method: 'Efectivo', fileCode: 'LX-2027-0012' },
    { id: 'm2', date: '2026-11-12', kind: 'Egreso', concept: 'Servicio de internet oficinas', currency: 'ARS', amount: 45000, method: 'Débito' },
    { id: 'm3', date: '2026-11-11', kind: 'Ingreso', concept: 'Cuotas egresados en dólares', currency: 'USD', amount: 600, method: 'Efectivo', fileCode: 'LX-2027-0015' },
    { id: 'm4', date: '2026-11-10', kind: 'Egreso', concept: 'Compra de USD para pago a proveedores', currency: 'ARS', amount: 2870000, method: 'Transferencia' },
    { id: 'm5', date: '2026-11-10', kind: 'Ingreso', concept: 'Compra de USD para pago a proveedores', currency: 'USD', amount: 2000, method: 'Transferencia' },
    { id: 'm6', date: '2026-11-09', kind: 'Egreso', concept: 'Viáticos coordinadores · Carlos Paz', currency: 'ARS', amount: 640000, method: 'Efectivo', fileCode: 'LX-2026-0131' },
    { id: 'm7', date: '2026-11-03', kind: 'Egreso', concept: 'Alquiler oficina Concepción', currency: 'ARS', amount: 980000, method: 'Transferencia' },
    { id: 'm8', date: '2026-11-03', kind: 'Egreso', concept: 'Alquiler oficina Catamarca', currency: 'ARS', amount: 720000, method: 'Transferencia' },
  ]
}

export function seed() {
  return { files: files(), packages: packages(), inquiries: inquiries(), cash: cash(), clients: clients.map((c) => ({ ...c })), promoters: promoters() }
}

export interface Promoter { id: string; name: string; phone: string; email: string; zone: string; commission: number; active: boolean }
function promoters(): Promoter[] {
  return [
    { id: 'pr1', name: 'Laura Gómez', phone: '3865 15-411-2233', email: 'laura@lextravel.example.com', zone: 'Concepción y sur tucumano', commission: 0.1, active: true },
    { id: 'pr2', name: 'Martín Ruiz', phone: '381 15-522-3344', email: 'martin@lextravel.example.com', zone: 'San Miguel de Tucumán', commission: 0.1, active: true },
    { id: 'pr3', name: 'Sofía Pereyra', phone: '383 15-633-4455', email: 'sofia@lextravel.example.com', zone: 'Catamarca', commission: 0.08, active: true },
    { id: 'pr4', name: 'Diego Paz', phone: '381 15-744-5566', email: 'diego@lextravel.example.com', zone: 'Yerba Buena y Tafí Viejo', commission: 0.12, active: true },
  ]
}

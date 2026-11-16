import { suppliers, type TravelFile } from './mock'
import { round2 } from './format'

export const IIBB_RATE = 0.035      // Ingresos Brutos estimado sobre la venta
export const COMMISSION_RATE = 0.1  // comisión del vendedor sobre el margen bruto

const sum = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0))

/** Totales financieros de un File (todo expresado en USD). */
export function fileTotals(f: TravelFile) {
  const n = f.pax.length // los servicios se cotizan por alumno
  const sale = round2(sum(f.services.map((s) => s.sale)) * n)
  const cost = round2(sum(f.services.map((s) => s.cost)) * n)
  const gross = round2(sale - cost)
  const taxes = round2(sale * IIBB_RATE)
  const commission = round2(Math.max(gross, 0) * COMMISSION_RATE)
  // Diferencia de cambio: lo que se cobró en ARS, valuado al TC de mercado, contra lo acreditado al cliente.
  const fx = sum(f.receipts.filter((r) => r.currency === 'ARS').map((r) => r.amount / r.marketRate - r.usd))
  const net = round2(gross - taxes - commission + fx)
  const collected = sum(f.receipts.map((r) => r.usd))
  const paid = sum(f.supplierPayments.map((p) => p.usd))
  return {
    sale, cost, gross, taxes, commission, fx, net,
    marginPct: sale ? gross / sale : 0,
    collected, clientBalance: round2(sale - collected),
    paid, supplierBalance: round2(cost - paid),
  }
}

export type PaxState = 'Pagado' | 'Al día' | 'Atrasado'

/** Estado de cuenta de cada alumno: precio por alumno, lo pagado, cuotas y si está al día con el plan. */
export function paxStatus(f: TravelFile, todayYM: string) {
  const price = sum(f.services.map((s) => s.sale))
  const cuota = round2(price / f.installments)
  const [y0, m0] = f.planStart.split('-').map(Number), [y1, m1] = todayYM.split('-').map(Number)
  const expected = Math.min(Math.max((y1 - y0) * 12 + (m1 - m0) + 1, 0), f.installments) // cuotas que ya vencieron
  return f.pax.map((pax) => {
    const paid = sum(f.receipts.filter((r) => r.paxDoc === pax.doc).map((r) => r.usd))
    const balance = round2(price - paid)
    const cuotasPagas = cuota ? Math.floor((paid + 0.01) / cuota) : 0
    const state: PaxState = balance <= 0.01 ? 'Pagado' : cuotasPagas >= expected ? 'Al día' : 'Atrasado'
    return { pax, price, cuota, paid, balance, cuotasPagas, expected, state }
  })
}

/** Cuenta corriente por proveedor dentro de un File. */
export function supplierBalances(f: TravelFile) {
  return suppliers
    .map((s) => {
      const cost = round2(sum(f.services.filter((x) => x.supplierId === s.id).map((x) => x.cost)) * f.pax.length)
      const paid = sum(f.supplierPayments.filter((x) => x.supplierId === s.id).map((x) => x.usd))
      return { supplier: s, cost, paid, balance: round2(cost - paid) }
    })
    .filter((x) => x.cost > 0)
}

import type { Currency } from './mock'

const nf = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

export const money = (n: number, cur: Currency = 'USD') => (cur === 'USD' ? 'US$ ' : '$ ') + nf.format(n)
export const money0 = (n: number, cur: Currency = 'USD') => (cur === 'USD' ? 'US$ ' : '$ ') + nf0.format(n)
export const fmtDate = (d?: string) => (d ? d.split('-').reverse().join('/') : '—')
export const round2 = (n: number) => Math.round(n * 100) / 100
export const uid = () => Math.random().toString(36).slice(2, 10)
export const today = () => {
  const d = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export const pct = (n: number) => `${nf.format(n * 100)} %`

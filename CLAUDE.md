# Lex Travel — maqueta (CuboCode)

Maqueta **solo frontend** con datos ficticios, para presentar a Lex Travel. Sin backend.

- Stack: Vite + React 18 + TS + Tailwind v4 + react-router (HashRouter) + lucide-react.
- Paleta: `azul` #023e68 (primario), `magenta` #ea2282 (acento), blanco. Clases utilitarias en `src/index.css` (`inp`, `btn-primary`, `btn-accent`, `btn-ghost`, `tbl`, `num`).
- Datos: `src/lib/mock.ts` (semilla) y `src/lib/store.ts` (estado en localStorage, sincroniza entre pestañas).
- Un File = un grupo escolar (colegio + curso) con alumnos y plan de cuotas; cobros por alumno (`paxDoc`). Cálculos en `src/lib/calc.ts` (`fileTotals`, `paxStatus`).
- `src/web/` = sitio público (paquetes + consultas). `src/erp/` = sistema de gestión (`#/admin`).
- Lo que se entrega se firma como CuboCode.
- Servicios del File: importes POR ALUMNO; los totales se multiplican por la cantidad de alumnos (`calc.ts`).
- Files se pasan solos a "En viaje" / "Cerrado" por fecha (`autoStatus` en `store.ts`).
- Reportes: componente `Report` en `lib/ui.tsx` (imprimir con `.print-area` + exportar CSV para Excel). Formularios compartidos en `erp/modals.tsx`.

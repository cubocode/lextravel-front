# lextravel-front

Maqueta del sistema de gestión y sitio web de **Lex Travel**: viajes de egresados y viajes educativos.
Solo frontend, con datos ficticios guardados en el navegador. Todavía no tiene backend.

## Qué incluye

- **Sitio web público:** viajes publicados por la agencia y formulario de consulta para colegios.
- **Sistema de gestión** (`#/admin`):
  - Tablero.
  - Files por grupo escolar, con alumnos y plan de cuotas. Los files se cierran solos cuando el viaje termina.
  - Alumnos.
  - Cobranzas en pesos o dólares, con recibo imprimible.
  - Caja.
  - Promotores y sus comisiones.
  - Reportes que se pueden imprimir o exportar a Excel.
  - Paquetes y consultas de la web.

## Uso

```bash
npm install
npm run dev
```

Para generar la versión de producción, `npm run build` crea la carpeta `dist/`.

Stack: Vite + React + TypeScript + Tailwind CSS.

---
Desarrollado por **CuboCode**.

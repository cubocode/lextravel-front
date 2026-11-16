import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './index.css'
import { ContactPage, Home, PackageDetail, PackagesPage, SiteLayout } from './web/Site'
import { ErpLayout, Login } from './erp/Layout'
import Dashboard from './erp/Dashboard'
import { FileDetail, FilesList } from './erp/Files'
import Caja from './erp/Caja'
import Paquetes from './erp/Paquetes'
import Consultas from './erp/Consultas'
import Alumnos from './erp/Alumnos'
import Cobranzas from './erp/Cobranzas'
import Promotores from './erp/Promotores'
import Reportes from './erp/Reportes'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ScrollTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="paquetes" element={<PackagesPage />} />
          <Route path="paquete/:id" element={<PackageDetail />} />
          <Route path="contacto" element={<ContactPage />} />
        </Route>
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<ErpLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="files" element={<FilesList />} />
          <Route path="files/:id" element={<FileDetail />} />
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="cobranzas" element={<Cobranzas />} />
          <Route path="promotores" element={<Promotores />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="caja" element={<Caja />} />
          <Route path="paquetes" element={<Paquetes />} />
          <Route path="consultas" element={<Consultas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)

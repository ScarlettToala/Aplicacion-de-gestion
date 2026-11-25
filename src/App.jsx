import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './views/LoginView'
import Recetas from './views/RecetasView'
import RecetaForm from './views/RecetaFormView'
import './App.css'

// Cualquier usuario con sesión. (Esto solo controla qué pantallas se ven:
// la protección real de los datos la hacen las políticas de Supabase.)
function Protegida() {
  const { session, rol, cargando, salir } = useAuth()
  if (cargando) return <p className="centrado">Cargando…</p>
  if (!session) return <Navigate to="/login" replace />

  return (
    <>
      <header className="cabecera">
        <strong>Pastelería</strong>
        <span className="cabecera-usuario">
          {session.user.email} ({rol ?? 'sin rol'})
        </span>
        <button className="btn btn-sec" onClick={salir}>Salir</button>
      </header>
      <Outlet />
    </>
  )
}

function SoloAdmin() {
  const { rol } = useAuth()
  return rol === 'admin' ? <Outlet /> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protegida />}>
        <Route path="/" element={<Recetas />} />
        <Route element={<SoloAdmin />}>
          <Route path="/recetas/nueva" element={<RecetaForm />} />
          <Route path="/recetas/:id/editar" element={<RecetaForm />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
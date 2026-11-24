import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Login() {
  const { session, entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function enviar(e) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    const { error } = await entrar(email, password)
    setEnviando(false)
    if (error) setError('Correo o contraseña incorrectos.')
    else navigate('/', { replace: true })
  }

  return (
    <div className="login">
      <form className="login-caja" onSubmit={enviar}>
        <h1>Entrar</h1>
        <label>
          Correo
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
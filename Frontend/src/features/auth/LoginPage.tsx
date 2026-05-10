import { ArrowRight, BadgeCheck, HeartPulse, ShieldCheck, Siren } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { env } from '../../config/env'
import { useAuth } from '../../contexts/useAuth'
import { ApiError } from '../../lib/api'
import { ErrorAlert } from '../../shared/components/ErrorAlert'

type LocationState = {
  from?: string
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const destination = (location.state as LocationState | null)?.from ?? '/app'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login({ usernameOrEmail, password })
      navigate(destination, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('No fue posible iniciar sesion.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-layout">
      <section className="login-hero">
        <p className="eyebrow">Sistema de emergencias</p>
        <h1>Controla validaciones de poliza sin friccion operativa.</h1>
        <p>
          Registra ingresos, dispara validaciones automaticas y sigue notificaciones desde una
          sola consola clinica.
        </p>

        <div className="hero-status-band">
          <span className="hero-status-pill">
            <ShieldCheck size={16} aria-hidden="true" /> JWT seguro
          </span>
          <span className="hero-status-pill">
            <Siren size={16} aria-hidden="true" /> Flujo critico
          </span>
          <span className="hero-status-pill">
            <BadgeCheck size={16} aria-hidden="true" /> Lectura por rol
          </span>
        </div>

        <div className="hero-grid">
          <article className="feature-card feature-card-hero">
            <div className="feature-icon-wrap">
              <HeartPulse size={20} aria-hidden="true" />
            </div>
            <strong>Registro agil</strong>
            <span>Busqueda por documento, poliza y caso en una sola vista.</span>
          </article>
          <article className="feature-card feature-card-hero">
            <div className="feature-icon-wrap">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <strong>Decision trazable</strong>
            <span>Estados, notificaciones e informes accesibles por rol.</span>
          </article>
          <article className="feature-card feature-card-hero">
            <div className="feature-icon-wrap">
              <BadgeCheck size={20} aria-hidden="true" />
            </div>
            <strong>Accesibilidad real</strong>
            <span>Contraste alto, foco visible y formularios claros.</span>
          </article>
        </div>
      </section>

      <section className="login-panel" aria-label="Inicio de sesion">
        <div className="panel-header">
          <p className="eyebrow">Acceso seguro</p>
          <h2>Iniciar sesion</h2>
          <p className="page-description">
            Usa tu usuario o correo institucional para entrar a {env.appName}.
          </p>
        </div>

        {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Usuario o correo</span>
            <input
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              placeholder="usuario.demo"
              autoComplete="username"
              required
            />
          </label>

          <label className="field-group">
            <span>Contrasena</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            <ArrowRight size={18} aria-hidden="true" />
            {isSubmitting ? 'Validando acceso...' : 'Entrar al sistema'}
          </button>
        </form>
      </section>
    </main>
  )
}

import { useAuth } from '../../contexts/useAuth'
import { PageHeader } from '../../shared/components/PageHeader'

export function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Cuenta activa"
        title="Perfil de usuario"
        description="Resumen de la identidad autenticada y el alcance operativo de la sesion."
      />

      <section className="panel-card">
        <dl className="details-grid">
          <div>
            <dt>Nombre completo</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt>Hospital</dt>
            <dd>{user.hospitalId ?? 'No aplica'}</dd>
          </div>
          <div>
            <dt>Aseguradora</dt>
            <dd>{user.insuranceCompanyId ?? 'No aplica'}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{user.status}</dd>
          </div>
        </dl>
      </section>
    </section>
  )
}

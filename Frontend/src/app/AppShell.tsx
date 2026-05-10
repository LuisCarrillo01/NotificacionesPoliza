import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldPlus,
  UserRound,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { env } from '../config/env'
import { useAuth } from '../contexts/useAuth'
import { emergencyAccessRoles } from '../shared/authorization/roles'

type NavigationItem = {
  to: string
  label: string
  icon: LucideIcon
  roles?: string[]
}

const navigationItems: NavigationItem[] = [
  { to: '/app', label: 'Resumen', icon: LayoutDashboard },
  {
    to: '/app/emergencies',
    label: 'Emergencias',
    icon: ShieldPlus,
    roles: emergencyAccessRoles,
  },
  {
    to: '/app/patients/new',
    label: 'Nuevo paciente',
    icon: UserPlus,
    roles: ['registrador_emergencia'],
  },
  { 
    to: '/app/notifications', 
    label: 'Notificaciones', 
    icon: Bell,
    roles: ['receptor_admisiones', 'receptor_aseguradora']
  },
  { to: '/app/reports', label: 'Informes', icon: FileText },
  { to: '/app/profile', label: 'Perfil', icon: UserRound },
]

function roleLabel(role: string) {
  switch (role) {
    case 'registrador_emergencia':
      return 'Registro hospitalario'
    case 'receptor_admisiones':
      return 'Admisiones'
    case 'receptor_aseguradora':
      return 'Aseguradora'
    default:
      return role
  }
}

export function AppShell() {
  const { user, logout } = useAuth()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1181px)')

    function syncNavigationState(event: MediaQueryListEvent | MediaQueryList) {
      if (event.matches) {
        setIsMobileNavOpen(false)
      }
    }

    syncNavigationState(mediaQuery)
    mediaQuery.addEventListener('change', syncNavigationState)

    return () => mediaQuery.removeEventListener('change', syncNavigationState)
  }, [])

  function closeMobileNavigation() {
    setIsMobileNavOpen(false)
  }

  if (!user) {
    return null
  }

  const visibleNavigation = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  )

  return (
    <div className={`app-shell ${isCollapsed ? 'app-shell--collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>

      <div className="mobile-topbar">
        <div className="mobile-brand">
          <div className="brand-mark brand-mark-compact" aria-hidden="true">
            NV
          </div>
          <div>
            <p className="eyebrow">Sistema clinico</p>
            <strong>{env.appName}</strong>
          </div>
        </div>
        <button
          type="button"
          className="icon-button mobile-menu-button"
          aria-label={isMobileNavOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isMobileNavOpen}
          onClick={() => setIsMobileNavOpen((current) => !current)}
        >
          {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        className={isMobileNavOpen ? 'mobile-overlay mobile-overlay-open' : 'mobile-overlay'}
        onClick={closeMobileNavigation}
        aria-hidden="true"
      />

      <aside className={isMobileNavOpen ? 'sidebar-panel sidebar-open' : 'sidebar-panel'}>
        <div className="brand-card">
          <div className="brand-mark" aria-hidden="true">
            NV
          </div>
          <div>
            <p className="eyebrow">Sistema clinico</p>
            <h1 className="brand-title">Validacion de polizas</h1>
          </div>
        </div>

        <button 
          type="button" 
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir menú' : 'Minimizar menú'}
        >
          {isCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        <div className="operator-card">
          <p className="eyebrow">Sesion activa</p>
          <strong>{user.fullName}</strong>
          <span>{roleLabel(user.role)}</span>
          <span>{user.email}</span>
        </div>

        <nav className="side-navigation" aria-label="Principal">
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              onClick={closeMobileNavigation}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
            >
              <item.icon size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="secondary-button sidebar-logout" onClick={logout}>
          <LogOut size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>Cerrar sesion</span>
        </button>
      </aside>

      <div className="content-shell">
        <header className="topbar-panel">
          <div>
            <p className="eyebrow">Coordinacion hospitalaria y aseguradora</p>
            <strong>Operacion en tiempo real para emergencias medicas</strong>
          </div>
          <div className="topbar-meta">
            <span className="meta-pill">JWT protegido</span>
            <span className="meta-pill">Acceso por rol</span>
            <span className="meta-pill">{env.appEnv}</span>
          </div>
        </header>

        <main id="main-content" className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n'

const navItems = [
  { to: '/dashboard',        icon: 'grid_view',       key: 'dashboard' },
  { to: '/fleet',            icon: 'apps',            key: 'fleet' },
  { to: '/permission-audit', icon: 'policy',          key: 'audit' },
  { to: '/sudo-monitor',     icon: 'manage_accounts', key: 'sudo' },
  { to: '/file-integrity',   icon: 'verified_user',   key: 'integrity' },
  { to: '/activity-logs',    icon: 'manage_history',  key: 'logs' },
  { to: '/terminal',         icon: 'terminal',        key: 'terminal',  adminOnly: true },
  { to: '/recordings',       icon: 'replay',          key: 'replays',   adminOnly: true },
  { to: '/servers',          icon: 'dns',             key: 'servers', adminOnly: true },
  { to: '/users',            icon: 'group',           key: 'users',   adminOnly: true },
]

const bottomItems = [
  { to: '/settings', icon: 'settings',     key: 'settings' },
  { to: '/support',  icon: 'help_outline', key: 'support' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { t } = useI18n()

  return (
    <aside className={`
      fixed left-0 top-0 bottom-0 w-[260px]
      lg:left-5 lg:top-5 lg:bottom-5 lg:w-60 lg:rounded-2xl
      glass flex flex-col z-30 overflow-hidden
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-[0_6px_18px_rgba(0,122,255,0.35)] shrink-0">
            <span className="material-symbols-outlined text-white text-xl filled">shield</span>
          </div>
          <div>
            <p className="text-ink font-bold text-sm leading-tight tracking-tight">SecureOps</p>
            <p className="text-ink-muted text-[11px] leading-tight mt-0.5">Polsri</p>
          </div>
        </div>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="lg:hidden text-ink-muted hover:text-ink p-1 rounded-lg transition-colors"
          aria-label={t('common.closeMenu')}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => !item.adminOnly || user?.role === 'admin')
          .map(({ to, icon, key }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-idle'}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-xl ${isActive ? 'filled' : ''}`}>{icon}</span>
                  {t(`nav.${key}`)}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 safe-bottom border-t border-white/40 pt-3 space-y-1">
        {bottomItems.map(({ to, icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-idle'}`}
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
            {t(`nav.${key}`)}
          </NavLink>
        ))}

        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded glass-recess">
          <div className="avatar bg-gradient-to-br from-primary to-primary-dark text-[11px] shrink-0">
            {user?.username?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ink text-xs font-semibold truncate">{user?.username}</p>
            <p className="text-ink-muted text-[10px] capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} title={t('menu.logout')} className="text-ink-muted hover:text-danger transition-colors">
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

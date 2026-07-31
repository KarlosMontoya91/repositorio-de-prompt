import {
  Bookmark,
  LayoutGrid,
  LogIn,
  LogOut,
  Plus,
  Settings2,
  X,
} from 'lucide-react'
import CategoryIcon from './CategoryIcon'

export default function Sidebar({
  categories,
  promptCounts,
  activeFilter,
  onSelect,
  isAdmin,
  user,
  onAuth,
  onSignOut,
  onAddCategory,
  mobileOpen,
  onClose,
}) {
  const select = (value) => {
    onSelect(value)
    onClose()
  }

  return (
    <>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">P.</span>
          <div>
            <strong>Prompt Repo</strong>
            <span>Open library</span>
          </div>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Cerrar menú">
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          <p className="sidebar-label">BIBLIOTECA</p>
          <button
            className={`sidebar-link ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => select('all')}
          >
            <span><LayoutGrid size={18} /> Todos</span>
            <small>{promptCounts.all}</small>
          </button>
          <button
            className={`sidebar-link ${activeFilter === 'favorites' ? 'active' : ''}`}
            onClick={() => select('favorites')}
          >
            <span><Bookmark size={18} /> Favoritos</span>
            <small>{promptCounts.favorites}</small>
          </button>

          <p className="sidebar-label category-label">CATEGORÍAS</p>
          <div className="sidebar-categories">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`sidebar-link ${activeFilter === category.id ? 'active' : ''}`}
                onClick={() => select(category.id)}
              >
                <span>
                  <i className="nav-icon" style={{ '--icon-color': category.color }}>
                    <CategoryIcon iconKey={category.icon_key} />
                  </i>
                  {category.name}
                </span>
                <small>{promptCounts[category.id] || 0}</small>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          {isAdmin && (
            <button className="sidebar-admin-button" onClick={onAddCategory}>
              <Plus size={17} /> Nueva categoría
            </button>
          )}
          {isAdmin && (
            <div className="admin-badge">
              <Settings2 size={15} />
              <span>Modo administrador</span>
            </div>
          )}
          {user ? (
            <button className="sidebar-account" onClick={onSignOut}>
              <span className="avatar">{user.email?.slice(0, 1).toUpperCase()}</span>
              <span className="account-copy">
                <strong>{user.email?.split('@')[0]}</strong>
                <small>{isAdmin ? 'Administrador' : 'Mi cuenta'}</small>
              </span>
              <LogOut size={16} />
            </button>
          ) : (
            <button className="sidebar-account guest" onClick={onAuth}>
              <span className="avatar"><LogIn size={16} /></span>
              <span className="account-copy">
                <strong>Iniciar sesión</strong>
                <small>Guarda tus favoritos</small>
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

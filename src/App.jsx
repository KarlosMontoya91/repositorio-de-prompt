import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bot,
  ChevronDown,
  FolderKanban,
  LockKeyhole,
  Menu,
  Pencil,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import AuthModal from './components/AuthModal'
import CategoryFormModal from './components/CategoryFormModal'
import CategoryIcon from './components/CategoryIcon'
import PromptCard from './components/PromptCard'
import PromptDetailModal from './components/PromptDetailModal'
import PromptFormModal from './components/PromptFormModal'
import Sidebar from './components/Sidebar'
import { demoCategories, demoPrompts } from './data/demoData'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  deletePrompt,
  fetchFavoriteIds,
  fetchPromptContent,
  fetchRepository,
  getSessionAndRole,
  saveCategory,
  savePrompt,
  sendMagicLink,
  signInWithGoogle,
  signOut,
  toggleFavorite,
} from './services/repository'

function App() {
  const [categories, setCategories] = useState([])
  const [prompts, setPrompts] = useState([])
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('demo')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [promptEditor, setPromptEditor] = useState(null)
  const [categoryEditor, setCategoryEditor] = useState(null)
  const [detail, setDetail] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [toast, setToast] = useState('')

  const notify = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }, [])

  const loadData = useCallback(async (adminMode = false, userId = null) => {
    try {
      const repository = await fetchRepository({ includeDrafts: adminMode })
      const favorites = await fetchFavoriteIds(userId)
      setCategories(repository.categories)
      setPrompts(repository.prompts)
      setFavoriteIds(favorites)
      setSource(repository.source)
    } catch (error) {
      console.error(error)
      setCategories(demoCategories)
      setPrompts(demoPrompts)
      setSource('error')
      notify('No se pudo conectar con Supabase. Se muestra la demo local.')
    }
  }, [notify])

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        const auth = await getSessionAndRole()
        if (!mounted) return
        setSession(auth.session)
        setIsAdmin(auth.isAdmin)
        await loadData(auth.isAdmin, auth.session?.user?.id)
      } catch (error) {
        console.error(error)
        await loadData(false, null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initialize()

    const subscription = supabase?.auth.onAuthStateChange(() => {
      window.setTimeout(async () => {
        const auth = await getSessionAndRole()
        if (!mounted) return
        setSession(auth.session)
        setIsAdmin(auth.isAdmin)
        await loadData(auth.isAdmin, auth.session?.user?.id)
      }, 0)
    })

    return () => {
      mounted = false
      subscription?.data?.subscription?.unsubscribe()
    }
  }, [loadData])

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const promptCounts = useMemo(() => {
    const counts = { all: prompts.length, favorites: favoriteIds.length }
    prompts.forEach((prompt) => {
      counts[prompt.category_id] = (counts[prompt.category_id] || 0) + 1
    })
    return counts
  }, [favoriteIds.length, prompts])

  const visiblePrompts = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = [...prompts]

    if (activeFilter === 'favorites') {
      result = result.filter((prompt) => favoriteIds.includes(prompt.id))
    } else if (activeFilter !== 'all') {
      result = result.filter((prompt) => prompt.category_id === activeFilter)
    }

    if (query) {
      result = result.filter((prompt) => (
        prompt.title?.toLowerCase().includes(query) ||
        prompt.description?.toLowerCase().includes(query) ||
        prompt.preview_text?.toLowerCase().includes(query) ||
        prompt.platform?.toLowerCase().includes(query) ||
        prompt.tags?.some((tag) => tag.toLowerCase().includes(query))
      ))
    }

    result.sort((a, b) => {
      if (sort === 'popular') return (b.copy_count || 0) - (a.copy_count || 0)
      if (sort === 'title') return a.title.localeCompare(b.title, 'es')
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return result
  }, [activeFilter, favoriteIds, prompts, search, sort])

  const activeCategory = categories.find((category) => category.id === activeFilter)
  const displayName = session?.user?.user_metadata?.full_name?.split(' ')[0]
  const greeting = displayName ? `Hola, ${displayName}_` : 'Hola, humano_'
  const premiumCount = prompts.filter((prompt) => prompt.access_level === 'premium').length

  const openPrompt = async (prompt) => {
    setDetail({ prompt, content: null, loading: true })
    try {
      const content = await fetchPromptContent(prompt)
      setDetail({ prompt, content, loading: false })
    } catch (error) {
      console.error(error)
      setDetail({ prompt, content: null, loading: false })
    }
  }

  const copyPrompt = async (prompt, knownContent = null) => {
    try {
      const content = knownContent || await fetchPromptContent(prompt)
      if (!content) {
        notify('Este contenido está protegido.')
        return
      }
      await navigator.clipboard.writeText(content)
      setCopiedId(prompt.id)
      notify('Prompt copiado. Ahora hazlo tuyo.')
      window.setTimeout(() => setCopiedId(null), 1800)
    } catch (error) {
      console.error(error)
      notify('No fue posible copiar el prompt.')
    }
  }

  const favoritePrompt = async (prompt) => {
    try {
      const next = await toggleFavorite({
        promptId: prompt.id,
        userId: session?.user?.id,
        isFavorite: favoriteIds.includes(prompt.id),
      })
      setFavoriteIds(next)
      if (!session) notify('Favorito guardado en este dispositivo.')
    } catch (error) {
      console.error(error)
      notify('No fue posible actualizar tus favoritos.')
    }
  }

  const editPrompt = async (prompt) => {
    try {
      const content = await fetchPromptContent(prompt)
      setPromptEditor({ ...prompt, content: content || '' })
    } catch (error) {
      notify(error.message)
    }
  }

  const submitPrompt = async (values) => {
    await savePrompt(values)
    setPromptEditor(null)
    await loadData(true, session?.user?.id)
    notify(values.id ? 'Prompt actualizado.' : 'Prompt creado.')
  }

  const submitCategory = async (values) => {
    await saveCategory(values)
    setCategoryEditor(null)
    await loadData(true, session?.user?.id)
    notify(values.id ? 'Categoría actualizada.' : 'Categoría creada.')
  }

  const removePrompt = async (prompt) => {
    if (!window.confirm(`¿Eliminar “${prompt.title}”? Esta acción no se puede deshacer.`)) return
    try {
      await deletePrompt(prompt.id)
      await loadData(true, session?.user?.id)
      notify('Prompt eliminado.')
    } catch (error) {
      notify(error.message)
    }
  }

  const closeSession = async () => {
    await signOut()
    setSession(null)
    setIsAdmin(false)
    await loadData(false, null)
  }

  return (
    <div className="app-background">
      <div className="app-shell">
        <Sidebar
          categories={categories}
          promptCounts={promptCounts}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          isAdmin={isAdmin}
          user={session?.user}
          onAuth={() => setAuthOpen(true)}
          onSignOut={closeSession}
          onAddCategory={() => setCategoryEditor({})}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="main-content">
          <header className="topbar">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
              <Menu size={20} />
            </button>
            <div className="mobile-brand">P.</div>
            <div className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar prompts, etiquetas o plataformas..."
                aria-label="Buscar prompts"
              />
              <kbd>⌘ K</kbd>
            </div>
            {isAdmin ? (
              <button className="primary-button compact" onClick={() => setPromptEditor({})}>
                <Plus size={17} /> Nuevo prompt
              </button>
            ) : (
              <button className="account-button" onClick={() => setAuthOpen(true)}>
                {session ? <span className="avatar light">{session.user.email?.slice(0, 1).toUpperCase()}</span> : 'Entrar'}
                <ChevronDown size={15} />
              </button>
            )}
          </header>

          <div className="page-scroll">
            <section className="welcome-grid">
              <div className="welcome-card">
                <div className="welcome-copy">
                  <span className="eyebrow">PROMPT_REPO / BIBLIOTECA ABIERTA</span>
                  <h1>{greeting}</h1>
                  <p>Explora ideas, copia lo que te sirva y conviértelo en algo increíble.</p>
                  <button className="text-button" onClick={() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explorar biblioteca <ArrowRight size={16} />
                  </button>
                </div>
                <div className="welcome-illustration" aria-hidden="true">
                  <span className="bot-orbit orbit-one" />
                  <span className="bot-orbit orbit-two" />
                  <Bot size={112} strokeWidth={1.15} />
                  <span className="bot-cursor">_</span>
                </div>
              </div>

              <div className="stats-grid">
                <article>
                  <span><Sparkles size={18} /></span>
                  <strong>{prompts.length}</strong>
                  <p>prompts disponibles</p>
                </article>
                <article>
                  <span><FolderKanban size={18} /></span>
                  <strong>{categories.length}</strong>
                  <p>categorías activas</p>
                </article>
                <article className="wide">
                  <span><LockKeyhole size={18} /></span>
                  <div>
                    <strong>{premiumCount}</strong>
                    <p>prompts preparados para contenido premium</p>
                  </div>
                  <small>Próximamente</small>
                </article>
              </div>
            </section>

            {source !== 'supabase' && (
              <div className="demo-banner">
                <span className="status-dot" />
                {source === 'error'
                  ? 'Mostrando datos de demostración porque Supabase no respondió.'
                  : 'Modo demostración: conecta Supabase para publicar prompts compartidos.'}
              </div>
            )}

            <section className="category-showcase" aria-labelledby="category-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">EXPLORA POR TEMA</span>
                  <h2 id="category-title">Encuentra tu siguiente punto de partida</h2>
                </div>
                <button className="text-button" onClick={() => setActiveFilter('all')}>Ver todo <ArrowRight size={16} /></button>
              </div>
              <div className="category-strip">
                {categories.map((category) => (
                  <article
                    key={category.id}
                    className={`category-tile ${activeFilter === category.id ? 'selected' : ''}`}
                  >
                    <button className="category-tile-main" onClick={() => setActiveFilter(category.id)}>
                      <span style={{ '--category-color': category.color, '--category-tint': `${category.color}17` }}>
                        <CategoryIcon iconKey={category.icon_key} size={24} />
                      </span>
                      <strong>{category.name}</strong>
                      <small>{promptCounts[category.id] || 0} prompts</small>
                    </button>
                    {isAdmin && (
                      <button
                        className="category-edit-button"
                        onClick={() => setCategoryEditor(category)}
                        aria-label={`Editar categoría ${category.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="library-section" id="library" aria-labelledby="library-title">
              <div className="library-toolbar">
                <div>
                  <span className="eyebrow">
                    {activeFilter === 'all' ? 'TODAS LAS CATEGORÍAS' : activeFilter === 'favorites' ? 'TU COLECCIÓN' : activeCategory?.name?.toUpperCase()}
                  </span>
                  <h2 id="library-title">
                    {activeFilter === 'favorites' ? 'Tus prompts favoritos' : activeCategory ? `Prompts de ${activeCategory.name}` : 'Últimos prompts'}
                  </h2>
                </div>
                <label className="sort-control">
                  Ordenar:
                  <select value={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="newest">Más recientes</option>
                    <option value="popular">Más copiados</option>
                    <option value="title">A–Z</option>
                  </select>
                </label>
              </div>

              {loading ? (
                <div className="loading-grid">
                  {[1, 2, 3, 4].map((item) => <span key={item} />)}
                </div>
              ) : visiblePrompts.length ? (
                <div className="prompt-grid">
                  {visiblePrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      category={prompt.category || categoryMap.get(prompt.category_id)}
                      isFavorite={favoriteIds.includes(prompt.id)}
                      justCopied={copiedId === prompt.id}
                      isAdmin={isAdmin}
                      onOpen={openPrompt}
                      onCopy={copyPrompt}
                      onFavorite={favoritePrompt}
                      onEdit={editPrompt}
                      onDelete={removePrompt}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>No encontramos coincidencias</h3>
                  <p>Prueba otra palabra, categoría o limpia los filtros.</p>
                  <button className="secondary-button" onClick={() => { setSearch(''); setActiveFilter('all') }}>Limpiar filtros</button>
                </div>
              )}
            </section>

            <footer>
              <span>Prompt Repo / {new Date().getFullYear()}</span>
              <p>Hecho para compartir ideas. Adapta cada prompt a tu contexto.</p>
            </footer>
          </div>
        </main>
      </div>

      {authOpen && (
        <AuthModal
          configured={isSupabaseConfigured}
          onMagicLink={sendMagicLink}
          onGoogle={signInWithGoogle}
          onClose={() => setAuthOpen(false)}
        />
      )}
      {promptEditor && (
        <PromptFormModal
          prompt={promptEditor.id ? promptEditor : null}
          categories={categories}
          onSave={submitPrompt}
          onClose={() => setPromptEditor(null)}
        />
      )}
      {categoryEditor && (
        <CategoryFormModal
          category={categoryEditor.id ? categoryEditor : null}
          onSave={submitCategory}
          onClose={() => setCategoryEditor(null)}
        />
      )}
      {detail && (
        <PromptDetailModal
          prompt={detail.prompt}
          category={detail.prompt.category || categoryMap.get(detail.prompt.category_id)}
          content={detail.content}
          loading={detail.loading}
          copied={copiedId === detail.prompt.id}
          onCopy={copyPrompt}
          onClose={() => setDetail(null)}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

export default App

import {
  Bookmark,
  Check,
  Copy,
  Eye,
  LockKeyhole,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react'
import CategoryIcon from './CategoryIcon'

export default function PromptCard({
  prompt,
  category,
  isFavorite,
  justCopied,
  isAdmin,
  onOpen,
  onCopy,
  onFavorite,
  onEdit,
  onDelete,
}) {
  const isPremium = prompt.access_level === 'premium'

  return (
    <article className="prompt-card">
      <div className="prompt-card-top">
        <span
          className="prompt-icon"
          style={{
            '--category-color': category?.color || '#7c85eb',
            '--category-tint': `${category?.color || '#7c85eb'}18`,
          }}
        >
          <CategoryIcon iconKey={category?.icon_key} size={20} />
        </span>
        <div className="prompt-meta">
          <span>{category?.name || 'Sin categoría'}</span>
          <span className="meta-dot">·</span>
          <span>{prompt.platform || prompt.prompt_type || 'Prompt'}</span>
        </div>
        <button
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={() => onFavorite(prompt)}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Bookmark size={17} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="prompt-card-copy">
        <div className="title-line">
          <h3>{prompt.title}</h3>
          {prompt.featured && <Sparkles className="featured-icon" size={16} aria-label="Destacado" />}
        </div>
        <p>{prompt.description}</p>
      </div>

      <div className={`prompt-preview ${isPremium ? 'premium-preview' : ''}`}>
        <code>{prompt.preview_text || 'Vista previa no disponible.'}</code>
        {isPremium && (
          <span className="premium-chip">
            <LockKeyhole size={13} />
            Premium
          </span>
        )}
      </div>

      <div className="tag-row">
        {(prompt.tags || []).slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
      </div>

      <div className="prompt-card-actions">
        <button className="secondary-button" onClick={() => onOpen(prompt)}>
          <Eye size={16} /> Ver prompt
        </button>
        <button
          className="copy-button"
          onClick={() => onCopy(prompt)}
          disabled={isPremium}
          title={isPremium ? 'El contenido de paga se habilitará más adelante' : 'Copiar prompt'}
        >
          {justCopied ? <Check size={16} /> : isPremium ? <LockKeyhole size={16} /> : <Copy size={16} />}
          {justCopied ? 'Copiado' : isPremium ? 'Próximamente' : 'Copiar'}
        </button>
      </div>

      {isAdmin && (
        <div className="admin-card-actions">
          <span>{prompt.status === 'published' ? 'Publicado' : 'Borrador'}</span>
          <button onClick={() => onEdit(prompt)}><Pencil size={15} /> Editar</button>
          <button className="danger-link" onClick={() => onDelete(prompt)}><Trash2 size={15} /> Eliminar</button>
        </div>
      )}
    </article>
  )
}

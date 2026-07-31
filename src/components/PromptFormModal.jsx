import { useState } from 'react'
import Modal from './Modal'

export default function PromptFormModal({ prompt, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    id: prompt?.id,
    title: prompt?.title || '',
    description: prompt?.description || '',
    preview_text: prompt?.preview_text || '',
    content: prompt?.content || '',
    category_id: prompt?.category_id || categories[0]?.id || '',
    platform: prompt?.platform || '',
    prompt_type: prompt?.prompt_type || '',
    tags: Array.isArray(prompt?.tags) ? prompt.tags.join(', ') : '',
    access_level: prompt?.access_level || 'free',
    price: prompt?.price_cents ? prompt.price_cents / 100 : 0,
    status: prompt?.status || 'draft',
    featured: Boolean(prompt?.featured),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave(form)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={prompt?.id ? 'Editar prompt' : 'Nuevo prompt'} eyebrow="ADMIN / EDITOR" onClose={onClose} className="editor-modal">
      <form className="editor-form" onSubmit={submit}>
        <div className="form-row">
          <label>
            Título
            <input value={form.title} onChange={(event) => update('title', event.target.value)} required />
          </label>
          <label>
            Categoría
            <select value={form.category_id} onChange={(event) => update('category_id', event.target.value)} required>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
        </div>
        <label>
          Descripción corta
          <input value={form.description} onChange={(event) => update('description', event.target.value)} maxLength="220" required />
        </label>
        <label>
          Vista previa pública
          <textarea value={form.preview_text} onChange={(event) => update('preview_text', event.target.value)} rows="3" maxLength="420" required />
          <small>Esta parte siempre será visible, incluso cuando el contenido sea premium.</small>
        </label>
        <label>
          Prompt completo
          <textarea value={form.content} onChange={(event) => update('content', event.target.value)} rows="9" required />
          <small>Se guarda en una tabla separada y protegida. No se envía al navegador sin permiso.</small>
        </label>
        <div className="form-row three">
          <label>
            Plataforma
            <input value={form.platform} onChange={(event) => update('platform', event.target.value)} placeholder="ChatGPT, Instagram..." />
          </label>
          <label>
            Tipo
            <input value={form.prompt_type} onChange={(event) => update('prompt_type', event.target.value)} placeholder="Texto, imagen, código..." />
          </label>
          <label>
            Etiquetas
            <input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="ux, react, video" />
          </label>
        </div>
        <div className="form-row three">
          <label>
            Acceso
            <select value={form.access_level} onChange={(event) => update('access_level', event.target.value)}>
              <option value="free">Gratis</option>
              <option value="premium">Premium (futuro)</option>
            </select>
          </label>
          <label>
            Precio MXN
            <input
              type="number"
              min="0"
              step="1"
              value={form.price}
              disabled={form.access_level !== 'premium'}
              onChange={(event) => update('price', event.target.value)}
            />
          </label>
          <label>
            Estado
            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
        </div>
        <label className="check-field">
          <input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} />
          Mostrar como prompt destacado
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Guardando...' : 'Guardar prompt'}</button>
        </div>
      </form>
    </Modal>
  )
}

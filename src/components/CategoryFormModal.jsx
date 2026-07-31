import { useState } from 'react'
import Modal from './Modal'
import CategoryIcon, { categoryIconOptions } from './CategoryIcon'

export default function CategoryFormModal({ category, onSave, onClose }) {
  const [form, setForm] = useState({
    id: category?.id,
    name: category?.name || '',
    description: category?.description || '',
    icon_key: category?.icon_key || 'sparkles',
    color: category?.color || '#7c85eb',
    sort_order: category?.sort_order || 0,
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
    <Modal title={category ? 'Editar categoría' : 'Nueva categoría'} eyebrow="ADMIN / CATEGORÍAS" onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <label>
          Nombre
          <input value={form.name} onChange={(event) => update('name', event.target.value)} required />
        </label>
        <label>
          Descripción
          <input value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="¿Qué tipo de prompts contiene?" />
        </label>
        <div className="form-row">
          <label>
            Color
            <span className="color-field">
              <input type="color" value={form.color} onChange={(event) => update('color', event.target.value)} />
              <input value={form.color} onChange={(event) => update('color', event.target.value)} pattern="^#[0-9A-Fa-f]{6}$" />
            </span>
          </label>
          <label>
            Orden
            <input type="number" min="0" value={form.sort_order} onChange={(event) => update('sort_order', event.target.value)} />
          </label>
        </div>
        <fieldset className="icon-picker">
          <legend>Ícono</legend>
          <div>
            {categoryIconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                className={form.icon_key === icon ? 'selected' : ''}
                onClick={() => update('icon_key', icon)}
                aria-label={`Ícono ${icon}`}
              >
                <CategoryIcon iconKey={icon} />
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Guardando...' : 'Guardar categoría'}</button>
        </div>
      </form>
    </Modal>
  )
}

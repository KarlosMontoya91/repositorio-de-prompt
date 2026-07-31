import { Check, Copy, LoaderCircle, LockKeyhole } from 'lucide-react'
import Modal from './Modal'

export default function PromptDetailModal({
  prompt,
  category,
  content,
  loading,
  copied,
  onCopy,
  onClose,
}) {
  const locked = !loading && !content

  return (
    <Modal title={prompt.title} eyebrow={`${category?.name || 'Prompt'} / ${prompt.prompt_type || 'Biblioteca'}`} onClose={onClose} className="detail-modal">
      <p className="detail-description">{prompt.description}</p>
      <div className="detail-tags">
        {(prompt.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}
      </div>

      {loading ? (
        <div className="modal-state"><LoaderCircle className="spin" size={24} /> Cargando contenido...</div>
      ) : locked ? (
        <div className="locked-state">
          <span><LockKeyhole size={24} /></span>
          <h3>Contenido protegido</h3>
          <p>
            La vista previa es pública, pero el prompt completo sólo se entrega a usuarios con acceso.
            La estructura ya está preparada para habilitar compras más adelante.
          </p>
          <button className="primary-button" disabled>Disponible próximamente</button>
        </div>
      ) : (
        <>
          <div className="full-prompt"><pre>{content}</pre></div>
          <button className="primary-button detail-copy" onClick={() => onCopy(prompt, content)}>
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? 'Copiado al portapapeles' : 'Copiar prompt completo'}
          </button>
        </>
      )}
    </Modal>
  )
}

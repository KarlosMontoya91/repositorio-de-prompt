import { useState } from 'react'
import { Mail, ShieldCheck } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import Modal from './Modal'

export default function AuthModal({ configured, onMagicLink, onGoogle, onClose }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onMagicLink(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setBusy(true)
    setError('')
    try {
      await onGoogle()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title="Tu espacio en Prompt Repo" eyebrow="ACCESO SEGURO" onClose={onClose} className="auth-modal">
      {!configured ? (
        <div className="configuration-note">
          <ShieldCheck size={24} />
          <div>
            <strong>La interfaz está en modo demostración.</strong>
            <p>Conecta las dos variables públicas de Supabase para activar cuentas y administración.</p>
          </div>
        </div>
      ) : sent ? (
        <div className="email-sent">
          <span><Mail size={25} /></span>
          <h3>Revisa tu correo</h3>
          <p>Te enviamos un enlace seguro para entrar sin contraseña.</p>
        </div>
      ) : (
        <>
          <p className="auth-intro">Inicia sesión para guardar favoritos. Las cuentas con permiso de administrador también pueden publicar y editar.</p>
          <button className="google-button" onClick={google} disabled={busy}>
            <FcGoogle size={20} /> Continuar con Google
          </button>
          <div className="auth-divider"><span>o usa tu correo</span></div>
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="auth-email">Correo electrónico</label>
            <div className="input-with-icon">
              <Mail size={17} />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Enviando...' : 'Enviarme un enlace'}
            </button>
          </form>
        </>
      )}
    </Modal>
  )
}

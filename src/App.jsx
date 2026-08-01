import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc 
} from 'firebase/firestore';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Terminal, Search, Plus, Trash2, Edit2, Copy, Check, 
  Folder, Image as ImageIcon, Code, Share2, Star, MessageSquare 
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBt6xxeoaA1-YB5JFBaml2RrzsdUW3ZjGs",
  authDomain: "repositorio-prompts-krm.firebaseapp.com",
  projectId: "repositorio-prompts-krm",
  storageBucket: "repositorio-prompts-krm.firebasestorage.app",
  messagingSenderId: "455602675987",
  appId: "1:455602675987:web:cf6a581223424663013ae6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = 'karlosmontoya091@gmail.com';

// --- Helper Components ---
const getCategoryIcon = (iconName, color) => {
  const icons = {
    image: <ImageIcon size={20} color={color} />,
    code: <Code size={20} color={color} />,
    social: <Share2 size={20} color={color} />,
    text: <MessageSquare size={20} color={color} />,
    default: <Folder size={20} color={color} />
  };
  return icons[iconName] || icons.default;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email !== ADMIN_EMAIL) {
        alert("Acceso denegado. Solo el administrador puede iniciar sesión.");
        await signOut(auth);
        setUser(null);
        setIsAdmin(false);
      } else {
        setUser(currentUser);
        setIsAdmin(currentUser?.email === ADMIN_EMAIL);
      }
    });

    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPrompts = onSnapshot(collection(db, "prompts"), (snap) => {
      setPrompts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubCategories();
      unsubPrompts();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}><Terminal size={28} color="#fff" /></div>
        </div>
        
        <nav style={styles.nav}>
          <div 
            style={{...styles.navItem, ...(activeCategory === 'all' ? styles.navItemActive : {})}}
            onClick={() => setActiveCategory('all')}
          >
            <Folder size={20} />
            <span>Todos los Prompts</span>
          </div>
          
          <div style={styles.navDividerContainer}>
            <div style={styles.navDivider}>Categorías</div>
            {isAdmin && (
              <button style={styles.addIconBtn} onClick={() => setIsCategoryModalOpen(true)}>
                <Plus size={16} color="#94a3b8" />
              </button>
            )}
          </div>
          
          {categories.map(cat => (
            <div 
              key={cat.id}
              style={{...styles.navItem, ...(activeCategory === cat.id ? styles.navItemActive : {})}}
              onClick={() => setActiveCategory(cat.id)}
            >
              {getCategoryIcon(cat.icon || 'default', cat.color || '#94a3b8')}
              <span>{cat.name}</span>
            </div>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          {user ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <span style={{fontSize: '12px', color: '#94a3b8'}}>{user.email}</span>
              <button style={styles.btnSecondary} onClick={() => signOut(auth)}>Cerrar Sesión</button>
            </div>
          ) : (
            <button style={styles.btnSecondary} onClick={handleLogin}>Admin Login</button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.welcomeArea}>
            <h1 style={styles.welcomeText}>
              <span className="typing-effect">Hola, humano_</span>
            </h1>
            <p style={styles.subtitle}>Explora y copia los mejores prompts para tu día a día.</p>
          </div>
          
          <div style={styles.headerActions}>
            <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Buscar prompt..." 
                style={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button 
                style={styles.btnPrimary}
                onClick={() => { setEditingPrompt(null); setIsPromptModalOpen(true); }}
              >
                <Plus size={18} /> Nuevo Prompt
              </button>
            )}
          </div>
        </header>

        <div style={styles.contentArea}>
          <div style={styles.grid}>
            {filteredPrompts.map(prompt => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                category={categories.find(c => c.id === prompt.categoryId)}
                isAdmin={isAdmin}
                onEdit={() => { setEditingPrompt(prompt); setIsPromptModalOpen(true); }}
                onDelete={async () => {
                  if(window.confirm('¿Eliminar prompt?')) {
                    await deleteDoc(doc(db, "prompts", prompt.id));
                  }
                }}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Admin Modals */}
      {isAdmin && isCategoryModalOpen && (
        <CategoryModal
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={async (name, icon, color) => {
            await addDoc(collection(db, "categories"), { name, icon, color });
            setIsCategoryModalOpen(false);
          }}
        />
      )}
      
      {isAdmin && isPromptModalOpen && (
        <PromptModal 
          prompt={editingPrompt} 
          categories={categories}
          onClose={() => setIsPromptModalOpen(false)} 
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onSave={async (data) => {
            if(editingPrompt) {
              await updateDoc(doc(db, "prompts", editingPrompt.id), data);
            } else {
              await addDoc(collection(db, "prompts"), { ...data, createdAt: Date.now() });
            }
            setIsPromptModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PromptCard({ prompt, category, isAdmin, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={{...styles.badge, color: category?.color || '#3b82f6', backgroundColor: `${category?.color || '#3b82f6'}15`}}>
          {category?.name || 'General'}
        </span>
        {isAdmin && (
          <div style={styles.cardActions}>
            <button style={styles.iconBtn} onClick={onEdit}><Edit2 size={16} /></button>
            <button style={{...styles.iconBtn, color: '#ef4444'}} onClick={onDelete}><Trash2 size={16} /></button>
          </div>
        )}
      </div>
      
      <h3 style={styles.cardTitle}>{prompt.title}</h3>
      <p style={styles.cardDesc}>{prompt.description}</p>
      
      <div style={styles.cardContentBox}>
        <pre style={styles.cardPre}>{prompt.content}</pre>
      </div>

      <div style={styles.cardFooter}>
        <button style={styles.copyBtn} onClick={handleCopy}>
          {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
          <span style={{color: copied ? '#10b981' : 'inherit'}}>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>
    </div>
  );
}

function PromptModal({ prompt, categories, onClose, onSave, onOpenCategoryModal }) {
  const [title, setTitle] = useState(prompt?.title || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [categoryId, setCategoryId] = useState(prompt?.categoryId || (categories[0]?.id || ''));

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2>{prompt ? 'Editar Prompt' : 'Nuevo Prompt'}</h2>
        
        <input style={styles.input} placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
        
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <select style={{...styles.input, flex: 1}} value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button style={styles.btnSecondary} onClick={onOpenCategoryModal} title="Nueva Categoría">
            <Plus size={16} />
          </button>
        </div>
        
        <input style={styles.input} placeholder="Descripción" value={description} onChange={e=>setDescription(e.target.value)} />
        <textarea style={{...styles.input, height: '150px'}} placeholder="Contenido del prompt" value={content} onChange={e=>setContent(e.target.value)} />
        
        <div style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end'}}>
          <button style={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={styles.btnPrimary} onClick={() => onSave({ title, description, content, categoryId })}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('default');
  const [color, setColor] = useState('#3b82f6');
  
  const iconOptions = ['default', 'image', 'code', 'social', 'text'];

  return (
    <div style={{...styles.modalOverlay, zIndex: 1100}}>
      <div style={styles.modal}>
        <h2>Nueva Categoría</h2>
        <input style={styles.input} placeholder="Nombre de la categoría" value={name} onChange={e=>setName(e.target.value)} />
        
        <label style={{fontSize: '14px', marginTop: '10px', color: '#64748b'}}>Color:</label>
        <input type="color" style={styles.colorInput} value={color} onChange={e=>setColor(e.target.value)} />
        
        <label style={{fontSize: '14px', marginTop: '10px', color: '#64748b'}}>Icono:</label>
        <div style={{display: 'flex', gap: '10px', padding: '10px 0'}}>
          {iconOptions.map(opt => (
            <div 
              key={opt}
              style={{
                ...styles.iconSelect, 
                backgroundColor: icon === opt ? `${color}20` : 'transparent',
                borderColor: icon === opt ? color : 'transparent'
              }}
              onClick={() => setIcon(opt)}
            >
              {getCategoryIcon(opt, icon === opt ? color : '#94a3b8')}
            </div>
          ))}
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end'}}>
          <button style={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={styles.btnPrimary} onClick={() => onSave(name, icon, color)}>
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Styles inline to keep it self-contained and fast for this iteration ---
const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--sidebar-bg)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    margin: '16px',
    borderRadius: '24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '40px',
    padding: '10px'
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    color: '#94a3b8',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: '500'
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff'
  },
  navDividerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '16px',
    paddingRight: '16px',
    marginTop: '20px',
    marginBottom: '10px'
  },
  navDivider: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#475569',
    fontWeight: '700'
  },
  addIconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '20px'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 40px',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px'
  },
  welcomeText: {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '8px',
    display: 'flex',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '15px'
  },
  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '10px 16px',
    gap: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    border: '1px solid var(--border)'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '14px',
    width: '200px'
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontFamily: 'inherit',
    fontSize: '14px',
    transition: 'opacity 0.2s'
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    fontFamily: 'inherit',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  card: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardActions: {
    display: 'flex',
    gap: '8px'
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  cardDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
    fontFamily: 'var(--font-sans)'
  },
  cardContentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    flex: 1,
    border: '1px solid #f1f5f9',
    marginBottom: '16px',
    overflowY: 'auto',
    maxHeight: '150px'
  },
  cardPre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontSize: '13px',
    color: '#334155',
    fontFamily: 'inherit'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-start',
    borderTop: '1px solid var(--border)',
    paddingTop: '16px'
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontFamily: 'inherit',
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'background 0.2s'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none'
  },
  colorInput: {
    width: '40px',
    height: '40px',
    padding: '0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  iconSelect: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

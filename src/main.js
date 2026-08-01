import * as bootstrap from 'bootstrap';
import { gsap } from 'gsap';
import { marked } from 'marked';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

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

// --- State Management ---
let appState = {
  categories: [],
  prompts: [],
  currentCategoryId: 'all' // 'all', 'favorites', or a category id
};

function loadData() {
  // Listen for real-time updates on categories
  onSnapshot(collection(db, "categories"), (snapshot) => {
    appState.categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCategories();
    updateCategoryDropdown();
    updateHeader();
  });

  // Listen for real-time updates on prompts
  onSnapshot(collection(db, "prompts"), (snapshot) => {
    appState.prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCategories();
    renderPrompts(DOM.searchInput.value);
  });
}

// --- DOM Elements ---
const DOM = {
  categoryList: document.getElementById('category-list'),
  promptsGrid: document.getElementById('prompts-grid'),
  currentCategoryTitle: document.getElementById('current-category-title'),
  currentCategoryLabel: document.getElementById('current-category-label'),
  promptCount: document.getElementById('prompt-count'),
  categoryActionsContainer: document.getElementById('category-actions-container'),
  searchInput: document.getElementById('search-input'),
  
  // Modals
  categoryModal: null,
  promptModal: null,
  
  // Forms
  categoryForm: document.getElementById('category-form'),
  categoryName: document.getElementById('category-name'),
  saveCategoryBtn: document.getElementById('save-category-btn'),
  
  promptForm: document.getElementById('prompt-form'),
  promptTitle: document.getElementById('prompt-title'),
  promptCategory: document.getElementById('prompt-category'),
  promptDescription: document.getElementById('prompt-description'),
  promptContent: document.getElementById('prompt-content'),
  promptFormat: document.getElementById('prompt-format'),
  promptPlatform: document.getElementById('prompt-platform'),
  promptTags: document.getElementById('prompt-tags'),
  savePromptBtn: document.getElementById('save-prompt-btn'),
  
  // Templates
  promptCardTemplate: document.getElementById('prompt-card-template')
};

let currentEditingPromptId = null;

// --- Initialization ---
function init() {
  loadData();
  
  // Init Modals
  DOM.categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
  DOM.promptModal = new bootstrap.Modal(document.getElementById('promptModal'));
  
  bindEvents();
  
  // Entry animation
  gsap.from('.sidebar', { x: -50, opacity: 0, duration: 0.8, ease: 'power3.out' });
  gsap.from('.top-header', { y: -50, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
  gsap.from('.content-area', { opacity: 0, duration: 0.8, delay: 0.4 });
}

// --- Event Binding ---
function bindEvents() {
  // Category Form
  DOM.saveCategoryBtn.addEventListener('click', handleSaveCategory);
  document.getElementById('add-category-btn').addEventListener('click', () => {
    DOM.categoryForm.reset();
  });
  
  // Prompt Form
  DOM.savePromptBtn.addEventListener('click', handleSavePrompt);
  document.getElementById('add-prompt-btn').addEventListener('click', () => {
    currentEditingPromptId = null;
    DOM.promptForm.reset();
    document.getElementById('promptModalTitle').textContent = 'New Prompt';
    if(appState.currentCategoryId !== 'all' && appState.currentCategoryId !== 'favorites') {
      DOM.promptCategory.value = appState.currentCategoryId;
    }
  });
  
  // Search
  DOM.searchInput.addEventListener('input', (e) => {
    renderPrompts(e.target.value);
  });
}

// --- Rendering ---
function renderCategories() {
  DOM.categoryList.innerHTML = '';
  
  // All Prompts
  DOM.categoryList.appendChild(createCategoryNode('all', 'All Prompts', 'bi-collection'));
  
  // Favorites
  DOM.categoryList.appendChild(createCategoryNode('favorites', 'Favorites', 'bi-star'));
  
  // Custom Categories
  appState.categories.forEach(cat => {
    DOM.categoryList.appendChild(createCategoryNode(cat.id, cat.name, 'bi-folder2'));
  });
}

function createCategoryNode(id, name, iconClass) {
  const li = document.createElement('li');
  li.className = 'nav-item';
  
  const a = document.createElement('a');
  a.className = `nav-category-item ${appState.currentCategoryId === id ? 'active' : ''}`;
  a.href = '#';
  
  const count = id === 'all' ? appState.prompts.length :
                id === 'favorites' ? appState.prompts.filter(p => p.isFavorite).length :
                appState.prompts.filter(p => p.categoryId === id).length;
  
  a.innerHTML = `
    <span><i class="bi ${iconClass} me-2"></i> ${name}</span>
    <span class="category-count">${count}</span>
  `;
  
  a.addEventListener('click', (e) => {
    e.preventDefault();
    appState.currentCategoryId = id;
    renderCategories(); // update active state
    renderPrompts(DOM.searchInput.value);
    updateHeader();
  });
  
  li.appendChild(a);
  return li;
}

function updateHeader() {
  let title = 'All Prompts';
  let label = 'Library';
  let showActions = false;
  
  if (appState.currentCategoryId === 'all') {
    title = 'All Prompts';
  } else if (appState.currentCategoryId === 'favorites') {
    title = 'Favorites';
    label = 'Library';
  } else {
    const cat = appState.categories.find(c => c.id === appState.currentCategoryId);
    if (cat) {
      title = cat.name;
      label = 'Category';
      showActions = true;
    }
  }
  
  DOM.currentCategoryTitle.textContent = title;
  DOM.currentCategoryLabel.textContent = label;
  DOM.categoryActionsContainer.style.setProperty('display', showActions ? 'flex' : 'none', 'important');
}

function renderPrompts(searchQuery = '') {
  DOM.promptsGrid.innerHTML = '';
  
  let filtered = appState.prompts;
  
  // Filter by category
  if (appState.currentCategoryId === 'favorites') {
    filtered = filtered.filter(p => p.isFavorite);
  } else if (appState.currentCategoryId !== 'all') {
    filtered = filtered.filter(p => p.categoryId === appState.currentCategoryId);
  }
  
  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.content.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }
  
  DOM.promptCount.textContent = `${filtered.length} prompt${filtered.length !== 1 ? 's' : ''}`;
  
  filtered.sort((a, b) => b.updatedAt - a.updatedAt).forEach((prompt, index) => {
    const clone = DOM.promptCardTemplate.content.cloneNode(true);
    const cardNode = clone.querySelector('.prompt-col');
    
    // Populate data
    const cat = appState.categories.find(c => c.id === prompt.categoryId);
    clone.querySelector('.prompt-card-category').textContent = cat ? cat.name : 'Uncategorized';
    clone.querySelector('.prompt-card-title').textContent = prompt.title;
    clone.querySelector('.prompt-card-desc').textContent = prompt.description || '';
    
    // Dynamic Accent Color
    const colors = [
      'linear-gradient(135deg, #f43f5e, #e11d48)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #3b82f6, #2563eb)',
      'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    ];
    const color = colors[index % colors.length];
    clone.querySelector('.card-accent-shape').style.background = color;
    
    // Render Markdown preview safely
    const previewContainer = clone.querySelector('.markdown-body');
    previewContainer.innerHTML = marked.parse(prompt.content);
    
    // Tags
    const tagsContainer = clone.querySelector('.prompt-card-tags');
    if (prompt.tags && prompt.tags.length > 0) {
      prompt.tags.forEach(tag => {
        if(tag.trim() !== '') {
          const t = document.createElement('span');
          t.className = 'badge bg-light border text-secondary fw-normal';
          t.textContent = tag.trim();
          tagsContainer.appendChild(t);
        }
      });
    }
    
    // Fav button
    const favBtn = clone.querySelector('.action-fav');
    if (prompt.isFavorite) {
      favBtn.innerHTML = '<i class="bi bi-star-fill text-warning"></i>';
    }
    
    // Bind Actions
    favBtn.addEventListener('click', () => toggleFavorite(prompt.id, prompt.isFavorite));
    clone.querySelector('.action-copy').addEventListener('click', (e) => copyToClipboard(prompt.content, e.target));
    clone.querySelector('.action-edit').addEventListener('click', (e) => {
      e.preventDefault();
      openEditPrompt(prompt);
    });
    clone.querySelector('.action-duplicate').addEventListener('click', (e) => {
      e.preventDefault();
      duplicatePrompt(prompt);
    });
    clone.querySelector('.action-delete').addEventListener('click', (e) => {
      e.preventDefault();
      if(confirm('Are you sure you want to delete this prompt?')) {
        deletePrompt(prompt.id);
      }
    });
    
    DOM.promptsGrid.appendChild(clone);
    
    // Staggered animation
    gsap.from(cardNode, { 
      y: 30, 
      opacity: 0, 
      duration: 0.5, 
      delay: index * 0.05,
      ease: 'back.out(1.2)' 
    });
  });
}

function updateCategoryDropdown() {
  DOM.promptCategory.innerHTML = '';
  appState.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    DOM.promptCategory.appendChild(opt);
  });
}

// --- Actions ---
async function handleSaveCategory() {
  const name = DOM.categoryName.value.trim();
  if (!name) return;
  
  try {
    await addDoc(collection(db, "categories"), { name: name });
    DOM.categoryModal.hide();
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("Error al guardar categoría");
  }
}

async function handleSavePrompt() {
  if (!DOM.promptForm.checkValidity()) {
    DOM.promptForm.reportValidity();
    return;
  }
  
  const promptData = {
    title: DOM.promptTitle.value.trim(),
    categoryId: DOM.promptCategory.value,
    description: DOM.promptDescription.value.trim(),
    content: DOM.promptContent.value.trim(),
    format: DOM.promptFormat.value.trim(),
    platform: DOM.promptPlatform.value.trim(),
    tags: DOM.promptTags.value.split(',').map(t => t.trim()).filter(t => t),
    updatedAt: Date.now()
  };
  
  try {
    if (currentEditingPromptId) {
      // Update
      const promptRef = doc(db, "prompts", currentEditingPromptId);
      await updateDoc(promptRef, promptData);
    } else {
      // Create
      promptData.isFavorite = false;
      await addDoc(collection(db, "prompts"), promptData);
    }
    DOM.promptModal.hide();
  } catch (e) {
    console.error("Error saving prompt: ", e);
    alert("Error al guardar prompt");
  }
}

function openEditPrompt(prompt) {
  currentEditingPromptId = prompt.id;
  document.getElementById('promptModalTitle').textContent = 'Edit Prompt';
  
  DOM.promptTitle.value = prompt.title || '';
  DOM.promptCategory.value = prompt.categoryId || '';
  DOM.promptDescription.value = prompt.description || '';
  DOM.promptContent.value = prompt.content || '';
  DOM.promptFormat.value = prompt.format || '';
  DOM.promptPlatform.value = prompt.platform || '';
  DOM.promptTags.value = prompt.tags ? prompt.tags.join(', ') : '';
  
  DOM.promptModal.show();
}

async function duplicatePrompt(prompt) {
  const newPrompt = { ...prompt };
  delete newPrompt.id; // ensure a new ID is generated
  newPrompt.title = prompt.title + ' (Copy)';
  newPrompt.updatedAt = Date.now();
  try {
    await addDoc(collection(db, "prompts"), newPrompt);
  } catch (e) {
    console.error("Error duplicating prompt", e);
  }
}

async function deletePrompt(id) {
  try {
    await deleteDoc(doc(db, "prompts", id));
  } catch (e) {
    console.error("Error deleting prompt", e);
  }
}

async function toggleFavorite(id, currentStatus) {
  try {
    const promptRef = doc(db, "prompts", id);
    await updateDoc(promptRef, {
      isFavorite: !currentStatus
    });
  } catch (e) {
    console.error("Error toggling favorite", e);
  }
}

function copyToClipboard(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHtml = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="bi bi-check2"></i> Copied';
    btnElement.classList.replace('btn-glass', 'btn-success');
    
    setTimeout(() => {
      btnElement.innerHTML = originalHtml;
      btnElement.classList.replace('btn-success', 'btn-glass');
    }, 2000);
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);

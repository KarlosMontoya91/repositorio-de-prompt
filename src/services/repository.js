import { demoCategories, demoPrompts } from '../data/demoData'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const FAVORITES_KEY = 'prompt-repo-local-favorites'

export function getLocalFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
}

export async function fetchRepository({ includeDrafts = false } = {}) {
  if (!isSupabaseConfigured) {
    return { categories: demoCategories, prompts: demoPrompts, source: 'demo' }
  }

  const [categoryResult, promptResult] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('name'),
    (() => {
      let query = supabase
        .from('prompts')
        .select('*, category:categories(*)')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (!includeDrafts) query = query.eq('status', 'published')
      return query
    })(),
  ])

  if (categoryResult.error) throw categoryResult.error
  if (promptResult.error) throw promptResult.error

  return {
    categories: categoryResult.data ?? [],
    prompts: promptResult.data ?? [],
    source: 'supabase',
  }
}

export async function fetchPromptContent(prompt) {
  if (!isSupabaseConfigured) return prompt.content ?? null

  const { data, error } = await supabase
    .from('prompt_contents')
    .select('content')
    .eq('prompt_id', prompt.id)
    .maybeSingle()

  if (error) throw error
  return data?.content ?? null
}

export async function fetchFavoriteIds(userId) {
  if (!isSupabaseConfigured || !userId) return getLocalFavorites()

  const { data, error } = await supabase
    .from('favorites')
    .select('prompt_id')
    .eq('user_id', userId)

  if (error) throw error
  return data.map((favorite) => favorite.prompt_id)
}

export async function toggleFavorite({ promptId, userId, isFavorite }) {
  if (!isSupabaseConfigured || !userId) {
    const favorites = new Set(getLocalFavorites())
    if (isFavorite) favorites.delete(promptId)
    else favorites.add(promptId)
    const next = [...favorites]
    saveLocalFavorites(next)
    return next
  }

  if (isFavorite) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, prompt_id: promptId })
    if (error) throw error
  }

  return fetchFavoriteIds(userId)
}

export async function getSessionAndRole() {
  if (!isSupabaseConfigured) return { session: null, isAdmin: false }

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session) return { session: null, isAdmin: false }

  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')
  if (roleError) throw roleError

  return { session: data.session, isAdmin: Boolean(isAdmin) }
}

export async function sendMagicLink(email) {
  if (!isSupabaseConfigured) throw new Error('Supabase todavía no está configurado.')

  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) throw error
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) throw new Error('Supabase todavía no está configurado.')

  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function saveCategory(category) {
  const payload = {
    ...(category.id ? { id: category.id } : {}),
    name: category.name.trim(),
    slug: category.slug?.trim() || slugify(category.name),
    description: category.description?.trim() || null,
    icon_key: category.icon_key || 'sparkles',
    color: category.color || '#7c85eb',
    sort_order: Number(category.sort_order || 0),
    is_active: category.is_active ?? true,
  }

  const { error } = await supabase.from('categories').upsert(payload)
  if (error) throw error
}

export async function savePrompt(prompt) {
  const promptId = prompt.id || crypto.randomUUID()
  const price = Math.max(0, Math.round(Number(prompt.price || 0) * 100))
  const metadata = {
    id: promptId,
    category_id: prompt.category_id,
    title: prompt.title.trim(),
    slug: prompt.slug?.trim() || slugify(prompt.title),
    description: prompt.description?.trim() || null,
    preview_text: prompt.preview_text?.trim() || null,
    platform: prompt.platform?.trim() || null,
    prompt_type: prompt.prompt_type?.trim() || null,
    tags: String(prompt.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    access_level: prompt.access_level || 'free',
    price_cents: prompt.access_level === 'premium' ? price : 0,
    currency: 'MXN',
    status: prompt.status || 'draft',
    featured: Boolean(prompt.featured),
  }

  const { error: promptError } = await supabase.from('prompts').upsert(metadata)
  if (promptError) throw promptError

  const { error: contentError } = await supabase
    .from('prompt_contents')
    .upsert({ prompt_id: promptId, content: prompt.content.trim() })

  if (contentError) throw contentError
}

export async function deletePrompt(promptId) {
  const { error } = await supabase.from('prompts').delete().eq('id', promptId)
  if (error) throw error
}

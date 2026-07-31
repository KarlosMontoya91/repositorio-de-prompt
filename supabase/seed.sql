-- Datos iniciales de ejemplo. Ejecuta después de 001_initial_schema.sql.

insert into public.categories (id, name, slug, description, icon_key, color, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'Instagram', 'instagram', 'Carruseles, captions y publicaciones', 'instagram', '#ef5da8', 1),
  ('10000000-0000-4000-8000-000000000002', 'Facebook', 'facebook', 'Anuncios, publicaciones y comunidad', 'facebook', '#5b8def', 2),
  ('10000000-0000-4000-8000-000000000003', 'TikTok', 'tiktok', 'Videos cortos, hooks y tendencias', 'tiktok', '#25c2a0', 3),
  ('10000000-0000-4000-8000-000000000004', 'Guiones', 'guiones', 'Estructuras narrativas y videos', 'script', '#f2b84b', 4),
  ('10000000-0000-4000-8000-000000000005', 'Marketing', 'marketing', 'Campañas, estrategia y conversión', 'marketing', '#a879e8', 5),
  ('10000000-0000-4000-8000-000000000006', 'Imágenes', 'imagenes', 'Fotografía, arte e ilustración con IA', 'image', '#ee6b5f', 6),
  ('10000000-0000-4000-8000-000000000007', 'Desarrollo web', 'desarrollo-web', 'Sitios, componentes y aplicaciones', 'code', '#36a2ae', 7),
  ('10000000-0000-4000-8000-000000000008', 'UX / UI', 'ux-ui', 'Producto, interfaces e investigación', 'palette', '#7c85eb', 8)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon_key = excluded.icon_key,
  color = excluded.color,
  sort_order = excluded.sort_order;

insert into public.prompts (
  id, category_id, title, slug, description, preview_text, platform,
  prompt_type, tags, access_level, price_cents, status, featured, copy_count
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Carrusel educativo que retiene',
    'carrusel-educativo-que-retiene',
    'Convierte un tema complejo en un carrusel claro, útil y fácil de guardar.',
    'Actúa como estratega de contenido. Crea un carrusel de 8 diapositivas sobre [TEMA]...',
    'Instagram', 'Contenido', array['carrusel', 'educativo', 'social media'],
    'free', 0, 'published', true, 128
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000006',
    'Imagen editorial fotorrealista',
    'imagen-editorial-fotorrealista',
    'Genera una escena 16:9 con dirección de arte editorial y luz cinematográfica.',
    'Crea una imagen editorial fotorrealista 16:9 que comunique el tema [TEMA]...',
    'Generador de imagen', 'Imagen', array['editorial', 'fotorrealista', '16:9'],
    'free', 0, 'published', true, 96
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000007',
    'Landing page cinematográfica',
    'landing-page-cinematografica',
    'Brief técnico y visual para construir una experiencia web fluida y memorable.',
    'Eres senior creative frontend engineer. Construye una landing page para [MARCA]...',
    'React', 'Desarrollo', array['react', 'motion', 'responsive'],
    'free', 0, 'published', false, 74
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000003',
    'Guion corto con hook inmediato',
    'guion-corto-hook-inmediato',
    'Estructura un video de 30 segundos que abre con una tensión concreta.',
    'Escribe un guion vertical de 30 segundos sobre [TEMA] con un hook en los primeros 2 segundos...',
    'TikTok', 'Guion', array['video', 'hook', 'storytelling'],
    'free', 0, 'published', false, 51
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000005',
    'Diagnóstico de propuesta de valor',
    'diagnostico-propuesta-valor',
    'Analiza una oferta y encuentra mensajes con mayor claridad y diferenciación.',
    'Analiza esta oferta: [OFERTA]. Identifica el cliente, problema y diferenciador...',
    'ChatGPT', 'Estrategia', array['oferta', 'copywriting', 'conversión'],
    'premium', 9900, 'published', false, 32
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000008',
    'Auditoría heurística accionable',
    'auditoria-heuristica-accionable',
    'Evalúa una interfaz y convierte hallazgos en recomendaciones priorizadas.',
    'Evalúa el siguiente flujo [FLUJO] usando heurísticas de usabilidad y accesibilidad...',
    'ChatGPT', 'UX', array['heurísticas', 'accesibilidad', 'producto'],
    'free', 0, 'published', false, 43
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  preview_text = excluded.preview_text,
  tags = excluded.tags,
  access_level = excluded.access_level,
  price_cents = excluded.price_cents,
  status = excluded.status;

insert into public.prompt_contents (prompt_id, content)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'Actúa como estratega de contenido. Crea un carrusel de 8 diapositivas sobre [TEMA] para [AUDIENCIA]. Incluye: portada con una promesa concreta, contexto, cinco ideas accionables y un cierre con llamada a guardar o compartir. Usa frases breves, lenguaje claro y evita afirmaciones sin sustento.'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Crea una imagen editorial fotorrealista 16:9 que comunique el tema [TEMA]. Usa una composición con profundidad, luz natural cinematográfica, materiales realistas y espacio negativo suficiente. Evita texto, marcas de agua, manos deformes y elementos visuales sin función.'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Eres senior creative frontend engineer y motion designer. Construye una landing page para [MARCA] con React, componentes reutilizables y animaciones ligadas al scroll. Prioriza rendimiento, accesibilidad WCAG AA y responsive real desde 320 px. No uses animaciones que impidan leer el contenido.'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'Escribe un guion vertical de 30 segundos sobre [TEMA] para [AUDIENCIA]. Abre con un hook de máximo 10 palabras durante los primeros 2 segundos. Desarrolla una sola idea, muestra un ejemplo y termina con una pregunta que invite a comentar. Incluye texto en pantalla y sugerencias de toma.'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    'Contenido premium de ejemplo. Sustituye este texto desde el editor administrativo antes de habilitar pagos.'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    'Evalúa el siguiente flujo [FLUJO] usando heurísticas de usabilidad, accesibilidad WCAG AA y consistencia del sistema de diseño. Por cada hallazgo indica: evidencia, impacto para el usuario, severidad del 1 al 4 y recomendación concreta. No inventes problemas sin evidencia observable.'
  )
on conflict (prompt_id) do update set content = excluded.content;

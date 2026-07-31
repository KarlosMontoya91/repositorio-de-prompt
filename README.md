# Prompt Repo

Biblioteca pública de prompts construida con React, Vite y Supabase. Incluye una
experiencia amigable para visitantes, favoritos, búsqueda, categorías y un editor
protegido para administradores.

El proyecto está diseñado para operar inicialmente sin pagar:

- GitHub Pages para el sitio público.
- Supabase Free para base de datos y autenticación.
- Sin Cloud Storage: los íconos son vectores incluidos en el código.
- Sin funciones de pago activas.
- Sin claves privadas en el navegador.

## Lo que ya funciona

- Listado público por categorías.
- Búsqueda por título, descripción, plataforma y etiquetas.
- Orden por fecha, popularidad o nombre.
- Copiar prompts gratuitos.
- Favoritos locales para visitantes y sincronizados para usuarios registrados.
- Acceso con enlace mágico y Google.
- Roles de visitante, usuario y administrador.
- Administración de categorías y prompts.
- Estados borrador, publicado y archivado.
- Metadatos premium visibles sin exponer el contenido completo.
- Diseño responsive y accesible desde móvil.
- Modo demostración si Supabase todavía no está conectado.

## 1. Ejecutar localmente

Requiere Node 22 o superior.

```bash
npm install
npm run dev
```

El proyecto inicia con datos de ejemplo aunque no exista una cuenta de Supabase.

## 2. Crear Supabase gratis

1. Crea una cuenta y un proyecto en [Supabase](https://supabase.com/).
2. No agregues método de pago ni cambies al plan Pro.
3. En `SQL Editor`, ejecuta en este orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/seed.sql`
4. En `Project Settings > API`, copia:
   - Project URL.
   - Publishable key o clave `anon`.
5. Copia `.env.example` como `.env.local` y completa:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
```

`anon` no es una contraseña. La seguridad real la aplican las políticas RLS del
archivo SQL. Nunca agregues la clave `service_role` a React ni a una variable
que comience por `VITE_`.

## 3. Configurar autenticación

En `Authentication > URL Configuration` agrega:

```text
http://localhost:5173/repositorio-de-prompt/
https://karlosmontoya91.github.io/repositorio-de-prompt/
```

El acceso por correo funciona con Supabase Auth. Para activar Google también se
debe habilitar su proveedor desde `Authentication > Providers`.

## 4. Convertir tu cuenta en administrador

1. Entra una vez a la aplicación con tu correo para crear el usuario.
2. Ejecuta lo siguiente en `SQL Editor`, sustituyendo el correo:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'TU_CORREO@EJEMPLO.COM'
on conflict (user_id) do nothing;
```

Al volver a iniciar sesión aparecerán `Nuevo prompt`, `Nueva categoría`, editar
y eliminar. La interfaz no decide quién es administrador: Supabase valida cada
operación mediante RLS.

## 5. Publicar gratis en GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` construye y publica `main`.

En GitHub configura:

1. `Settings > Pages > Source`: selecciona **GitHub Actions**.
2. `Settings > Secrets and variables > Actions > Variables`:
   - `VITE_SUPABASE_URL`
3. `Settings > Secrets and variables > Actions > Secrets`:
   - `VITE_SUPABASE_ANON_KEY`

Aunque la clave `anon` es pública, se guarda como secret para mantener una
configuración consistente. Si no agregas las variables, el sitio se publica en
modo demostración.

## Seguridad de prompts premium

El texto completo no vive en la tabla pública `prompts`. Está en
`prompt_contents`, protegida por estas condiciones:

- Prompt gratuito y publicado.
- Usuario administrador.
- Usuario con una compra pagada en `purchases`.

Ocultar un prompt sólo con CSS o React no sería seguro. Aquí la base de datos
evita que el contenido protegido sea enviado al navegador.

La tabla `purchases` ya está preparada, pero los pagos no están activados. Cuando
se elija Mercado Pago o Stripe deberá crearse un webhook firmado dentro de una
Supabase Edge Function. Consulta `supabase/functions/payment-webhook/README.md`.

Mientras los pagos no se activen, el proyecto completo puede mantenerse en
servicios gratuitos. Al vender, el proveedor de pagos sí cobrará su comisión por
transacción; eso no se puede eliminar de forma legítima.

## Comandos

```bash
npm run dev       # desarrollo
npm run build     # compilación de producción
npm run preview   # revisar la compilación
npm run check     # validación actual
```

# Meta Ads Integration

## Diagnóstico de errores comunes

### "Invalid Scopes"
**Causa:** El scope `instagram_basic` es de la Instagram Basic Display API (deprecada) y no es válido en Facebook Login. Remover ese scope resuelve el error — Meta rechaza la lista entera si encuentra un scope inválido.

**Otro motivo posible:** El producto Marketing API no está habilitado en la app de Meta Developers.

### "El dominio de esta URL no está incluido en los dominios de la app"
**Causa:** `localhost` no está en App Domains. Ver sección "Configuración para localhost" abajo.

---

## Permisos utilizados

| Permiso | Para qué sirve | Nivel de acceso |
|---|---|---|
| `ads_read` | Leer cuentas publicitarias y datos de ads | Standard Access |
| `ads_management` | Crear y gestionar campañas (fase futura) | Advanced Access |
| `pages_show_list` | Obtener lista de Páginas de Facebook del usuario | Standard Access |
| `pages_read_engagement` | Leer contenido de páginas + obtener Instagram vinculado | Standard Access |
| `business_management` | Acceder a Business Portfolio y activos del negocio | Advanced Access |

**Nota sobre Instagram:** No se usa `instagram_basic` ni ningún scope de Instagram. Las cuentas de Instagram Business se obtienen desde la Página vinculada mediante `/{page-id}?fields=instagram_business_account`, que no requiere permiso adicional.

### App Review

En **Development Mode** todos los permisos listados funcionan para el administrador de la app (el desarrollador que creó la app en Meta Developers) sin necesidad de App Review.

Para usuarios externos (producción), `ads_management` y `business_management` requieren **App Review** de Meta y posiblemente **Business Verification**.

---

## Producto de Meta recomendado

**Usar: Facebook Login** (no "Login for Business" ni otro flujo).

La URL del dialog OAuth es estándar: `https://www.facebook.com/v21.0/dialog/oauth`

Requerimientos en la app:
1. **Tipo de app:** "None" o "Business" (NO "Consumer" — el tipo Consumer restringe los productos disponibles)
2. **Producto requerido:** Marketing API (para `ads_read`, `ads_management`)
3. **Producto requerido:** Facebook Login (para el flujo OAuth)

---

## Configuración para localhost

### `.env.local`

```env
META_APP_ID=tu_app_id_aqui
META_APP_SECRET=tu_app_secret_aqui
META_REDIRECT_URI=http://localhost:3000/api/meta/callback
META_API_VERSION=v21.0
META_TOKEN_SECRET=minimo32caracteresaqui1234567890
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante:** `META_REDIRECT_URI` debe ser exactamente `http://localhost:3000/api/meta/callback` — sin slash final, sin `/` extra.

### Meta Developers — configuración exacta para localhost

**Settings → Basic:**
```
App Domains: localhost
```
(Solo `localhost`, sin `http://`, sin puerto.)

**Facebook Login → Settings:**
```
Valid OAuth Redirect URIs:
  http://localhost:3000/api/meta/callback

Client OAuth Login: ON
Web OAuth Login: ON
```

**Facebook Login → Settings → Web OAuth Settings:**
```
Site URL: http://localhost:3000
```

**Nota:** Meta permite `localhost` en App Domains para desarrollo. El error "El dominio de esta URL no está incluido" desaparece al agregar `localhost` en App Domains.

---

## Variables de entorno — referencia

| Variable | Descripción | Ejemplo valor |
|---|---|---|
| `META_APP_ID` | ID de la app en Meta Developers | `1234567890` |
| `META_APP_SECRET` | Secret de la app — NUNCA al browser | `abc123...` |
| `META_REDIRECT_URI` | Callback URI exacto (sin slash final) | `http://localhost:3000/api/meta/callback` |
| `META_API_VERSION` | Versión de la API Graph (opcional) | `v21.0` |
| `META_TOKEN_SECRET` | Clave AES-256 para cifrar tokens (≥32 chars) | `randomstring32charsminimum12345` |
| `NEXT_PUBLIC_APP_URL` | URL base de la app | `http://localhost:3000` |

---

## OAuth Flow

```
Usuario → /settings → botón "Conectar"
  → GET /api/meta/connect
    - Verifica sesión Supabase
    - Genera state CSRF aleatorio (cookie httpOnly, 10 min TTL)
    - Redirige a: https://www.facebook.com/v21.0/dialog/oauth?...
    - Scopes: ads_management, ads_read, pages_read_engagement, pages_show_list, business_management

Meta → GET /api/meta/callback?code=...&state=...
    - Valida CSRF state (compara cookie con param)
    - Intercambia code → access_token (server-side, META_APP_SECRET nunca sale del servidor)
    - Obtiene: user info, ad accounts, pages, Instagram accounts (vía páginas)
    - Cifra token con AES-256-GCM (META_TOKEN_SECRET)
    - Upsert en tabla meta_connections
    - Redirige a /settings?meta=connected

Usuario → /settings (muestra estado de conexión + dropdowns de selección)
  → Selecciona Ad Account / Página / Instagram
  → "Guardar selección" → updateMetaSelectionAction()
```

---

## Seguridad

- `META_APP_SECRET` — solo en variables de servidor, nunca en `NEXT_PUBLIC_*`, nunca logueado
- Tokens de acceso — cifrados en reposo con AES-256-GCM, la columna `access_token_enc` nunca se retorna al cliente
- CSRF — state aleatorio de 48 chars hex, cookie httpOnly
- RLS — cada usuario solo puede leer/escribir su propia fila en `meta_connections`

---

## Estructura de archivos

```
src/lib/meta/
├── meta-types.ts       — Interfaces TypeScript compartidas
├── meta-constants.ts   — Versión API, scopes, nombre cookie
├── meta-errors.ts      — MetaApiError + parseMetaError()
├── meta-auth.ts        — encrypt/decrypt token, buildMetaOAuthUrl
├── meta-client.ts      — Llamadas a Graph API
└── index.ts            — Re-exports

src/app/api/meta/
├── connect/route.ts    — GET: inicia OAuth, cookie CSRF, redirect a Meta
├── callback/route.ts   — GET: maneja callback, guarda token, redirect a /settings
└── disconnect/route.ts — POST: elimina fila meta_connections

src/features/integrations/
├── types.ts
├── actions.ts                      — getMetaConnectionAction, updateMetaSelectionAction
└── components/
    └── meta-connection-card.tsx    — UI completa: conectar/desconectar/seleccionar cuenta

src/features/meta-publisher/
└── types.ts            — Interfaces de publicación (skeleton; aún no implementado)

supabase/migrations/
└── 015_meta_connections.sql
```

---

## Limitaciones actuales

- Publicación de campañas en Meta no implementada (interfaces en `meta-publisher/types.ts`)
- Refresh de token no implementado — el usuario reconecta cuando expira
- Una sola conexión Meta por usuario

## Próximos pasos (FASE 6.8.2)

- Implementar `MetaPublisher.publishCampaign()` con la Marketing API
- Botón "Publicar en Meta" en revisión de campaña cuando hay conexión activa
- Token refresh con intercambio de long-lived token

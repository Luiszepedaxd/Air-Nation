# RLS scripts vs código — notas para el despliegue

## Variables de entorno

| Entorno | Variable | Valor |
|---------|----------|--------|
| **Railway** (API) | `SUPABASE_URL` | URL del proyecto |
| **Railway** | `SUPABASE_SERVICE_KEY` | JWT con `"role": "service_role"` (no anon) |
| **Vercel** (frontend) | `NEXT_PUBLIC_SUPABASE_URL` | Misma URL |
| **Vercel** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT anon |
| **Vercel** (opcional) | `SUPABASE_SERVICE_KEY` | Solo para rutas admin server-side que aún usan `createAdminClient()` (auth.admin, booth CSV con service role) |

## Desajustes detectados entre SQL subido y el esquema del repo

1. **`02_equipos_rls.sql` → `teams.founder_id`**  
   El backend y el frontend usan **`teams.created_by`** (p. ej. `POST /api/v1/teams`, RPC `create_team_group`). No aparece `founder_id` en el código. **Ajustar el script 02** a `created_by` o añadir columna/vista antes de aplicar.

2. **`01_users_rls.sql` → columnas sensibles `telefono`, `phone`**  
   El bloque `DO` solo revoca columnas que existan; si no están en `users`, no falla. Verificar con `00_diagnostico.sql`.

3. **`verificar_credencial`**  
   No devuelve `rol`, `ciudad` ni `created_at`; `/verify/[id]` los complementa con `select('ciudad, rol, created_at')` en columnas públicas.

4. **`store_orders` checkout**  
   Tras `04_privadas_admin_rls.sql`, `insert(...).select()` no devuelve filas a no-admin. El checkout genera **`id` con `randomUUID()`** en el servidor antes del insert.

5. **`reportada_robada` en `arsenal`**  
   No existe en el repo; `PATCH /replicas/:id/report` registra en `user_reports` vía service role.

## API auth (Hallazgo 2)

Middleware: `backend/src/middleware/apiAuthGate.js`. Test: `npm test` → `apiAuthGate.test.js`.

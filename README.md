# AirNation — airnation.online

> La plataforma central del Airsoft, Gotcha y Paintball en México.

---

## Estructura del proyecto

```
airnation/
├── frontend/          # Next.js 14 — web app (Vercel)
└── backend/           # Express.js REST API (VPS / Railway)
```

La separación frontend/backend es intencional: el mismo API de Express
será consumido por la web Y por las apps móviles de iOS/Android en el futuro.
**No usar Next.js API Routes para lógica de negocio** — todo va en el backend.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Express.js + Node.js |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage (imágenes) | Supabase Storage → Cloudflare Images (cuando escale) |
| Deploy frontend | Vercel |
| Deploy backend | Railway / VPS |
| DNS | Cloudflare |
| Dominio | airnation.online |

---

## Levantar en local

### Backend
```bash
cd backend
cp .env.example .env        # llenar variables de Supabase
npm install
npm run dev                 # corre en localhost:4000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                 # corre en localhost:3000
```

---

## API — Endpoints disponibles

Base URL: `http://localhost:4000/api/v1`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/teams` | Listar equipos |
| GET | `/teams/:id` | Detalle equipo |
| POST | `/teams` | Crear equipo |
| GET | `/users/:id` | Perfil usuario |
| POST | `/users/register` | Registrar usuario |
| GET | `/replicas/:serial` | Buscar réplica por serie |
| POST | `/replicas` | Registrar réplica |
| PATCH | `/replicas/:id/transfer` | Transferir réplica |
| PATCH | `/replicas/:id/report` | Reportar como robada |
| GET | `/docs` | Listar docs oficiales |
| POST | `/docs` | Subir documento (admin) |

---

## MVP — Features a implementar

- [ ] Autenticación (Supabase Auth — email/password + magic link)
- [ ] CRUD completo de equipos con Supabase
- [ ] Registro e invitación de integrantes
- [ ] Generación de credencial digital (PDF/imagen con QR)
- [ ] Registro de réplicas con número de serie
- [ ] Transferencia y reporte de réplicas
- [ ] Repositorio de documentos oficiales (GN, SSP, SCT, PM)
- [ ] Subida de fotos al perfil de equipo

## Próximamente (v2)

- [ ] Feed de fotos por equipo (tipo Instagram simple)
- [ ] Sistema de eventos y partidas
- [ ] Tienda AirNation integrada
- [ ] App iOS y Android (React Native — mismo API)

---

## Variables de entorno

### Backend (.env)
```
PORT=4000
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ALLOWED_ORIGINS=http://localhost:3000,https://airnation.online
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Convenciones de código

- **Commits en español** — feat: registrar equipos, fix: validación de serie, etc.
- **Componentes en PascalCase**, funciones en camelCase
- **Todas las llamadas al API** van en `/frontend/lib/api.ts` — nunca directo en componentes
- **Diseño**: dark tactical, fuente Bebas Neue para títulos, DM Sans para cuerpo
- **Mobile-first** — toda pantalla debe funcionar en 375px

---

## Paleta de colores

| Variable | Hex | Uso |
|---|---|---|
| `--air-bg` | `#080C0A` | Fondo principal |
| `--air-surface` | `#0F1612` | Cards, navbars |
| `--air-border` | `#1C2A20` | Bordes |
| `--air-green` | `#2ECC71` | Acento principal, CTAs |
| `--air-orange` | `#F97316` | Acento secundario, "próximamente" |
| `--air-text` | `#E8F0EA` | Texto principal |
| `--air-text-dim` | `#7A9980` | Texto secundario/muted |

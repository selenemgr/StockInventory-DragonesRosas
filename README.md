# 🐉 Dragones Rosas – Inventario

Web de inventario/registro para la banda. React + Vite + TypeScript, datos en Supabase, desplegable en GitHub Pages.

## Puesta en marcha
1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor** pega y ejecuta `supabase/schema.sql` (crea tablas, acceso abierto y realtime).
3. En **Project Settings → API** copia la *Project URL* y la *anon key*.
4. Local: `cp .env.example .env`, rellena los valores y ejecuta `npm install && npm run dev`.

## Despliegue en GitHub Pages
1. Sube el proyecto a un repo de GitHub (rama `main`).
2. **Settings → Secrets and variables → Actions**: crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. **Settings → Pages → Source: GitHub Actions**.
4. Cada push a `main` publica la web automáticamente.

## Notas
- El "login" solo elige quién eres para atribuir logs; no restringe nada.
- La anon key es pública por diseño; cualquiera con la URL de la web puede leer/escribir. No pongas datos sensibles reales.
- Todas las modificaciones (dinero, droga, valores, inventario, etc.) quedan en la pestaña **Logs**.

# Despliegue y vuelta atrás

> Cómo llega un cambio a producción, cómo comprobar que funciona y cómo deshacerlo si algo falla.

## Entornos

| | Código | Base de datos | URL |
|---|---|---|---|
| **Producción** | rama `main` | rama `production` de Neon | <https://www.cinepov.com> (`cinepov.com` redirige a `www`) |
| **Desarrollo** | rama `dev`, en local | rama `dev` de Neon (datos de prueba) | `http://localhost:3000` |

- Vercel despliega a producción cada push a `main`. Los pushes a otras ramas generan despliegues de vista previa.
- Las variables de entorno de producción están en Vercel (*Settings → Environment Variables*). La lista completa y su explicación están en `.env.example`.
- El DNS de `cinepov.com` lo gestiona Vercel (*nameservers* de Vercel en Namecheap). Los registros, incluidos los de Resend, se editan en Vercel → **Domains** del equipo, no en Namecheap.

## Desplegar un cambio

1. Trabaja en `dev`, con commits pequeños.
2. Antes de subir: `npm run typecheck && npm run lint && npm test`. En Windows, desde `D:\cinepov` (con la D mayúscula).
3. `git push origin dev`. El CI (`.github/workflows/ci.yml`) comprueba tipos, lint, tests, migraciones y build.
4. Con el CI en verde, lleva `dev` a `main`: `git push origin dev:main`. Vercel despliega en unos 2 minutos.
5. Comprueba el despliegue: `npm run smoke`. Termina con "Todo en orden" o dice qué falla.

## Cambios en la base de datos

Las migraciones solo avanzan. Nunca uses `prisma db push` contra producción.

1. Cambia `prisma/schema.prisma` y crea la migración contra `dev`: `npm run db:migrate -- --name descripcion-del-cambio`.
2. Haz commit de la carpeta `prisma/migrations/...` junto con el código que la usa.
3. **Antes** de llevar ese código a `main`, aplica la migración en producción, desde Git Bash y con las cadenas de la rama `production`:
   ```bash
   DATABASE_URL="cadena pooled de production" DIRECT_URL="cadena directa de production" npm run db:deploy
   ```
4. Si el cambio borra o renombra columnas, hazlo en dos despliegues: primero el código que deja de usarlas y después la migración que las quita. Así el código antiguo nunca convive con una base que no entiende.

### Seeds

- `npm run db:seed` solo crea o actualiza el catálogo del onboarding. Es seguro en cualquier base y se puede repetir.
- `npm run db:seed:dev` **borra todos los usuarios**. Solo para la rama `dev`; se niega a ejecutarse en producción y exige `SEED_DEV_CONFIRM=borrar-y-rellenar`.

## Volver atrás

### Si el fallo es del código

1. En Vercel → **Deployments**, busca el último despliegue que funcionaba, abre su menú ⋯ y pulsa **Promote to Production**. Es instantáneo y no hace falta tocar Git.
2. Después, deshaz el cambio en el repositorio para que el próximo push no lo vuelva a desplegar: `git revert <commit>` en `dev` y llévalo a `main`.

### Si el fallo afecta a los datos

1. En Neon, en la rama `production`, usa **Restore** (*point-in-time restore*) para crear una rama nueva con el estado de antes del fallo. Así puedes inspeccionarla sin tocar producción.
2. Si hay que recuperar todo, restaura `production` a ese momento. Si solo hay que recuperar algunas filas, cópialas desde la rama restaurada.
3. Una migración ya aplicada no se "desaplica": se escribe una migración nueva que deshaga el cambio.

> Prueba la restauración al menos una vez **antes** de necesitarla (roadmap, Hito 1.1).

## Tareas programadas

- `vercel.json` programa el email semanal (`/api/cron/weekly-trends`) los lunes a las 9:00 UTC.
- Vercel envía `Authorization: Bearer <CRON_SECRET>`. Sin `CRON_SECRET` configurada, la ruta responde 401 y no envía nada.

## Problemas conocidos

- **Windows y la letra de unidad.** Ejecuta las herramientas desde `D:\cinepov`, no desde `d:\cinepov`: con la minúscula, Node carga algunos módulos dos veces (fallan Vitest y los `Prisma.sql` en scripts).
- **Diferencias entre local y Vercel.** Algunas dependencias funcionan en local y no en Vercel (pasó con jsdom). Tras cada despliegue, `npm run smoke` lo detecta: comprueba que las rutas de formularios cargan.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 🛠️ Convenciones del Proyecto

Para mantener el código limpio y organizado, seguimos estas pautas de desarrollo:

### 1. Convención de Git y Commits (Conventional Commits)
Los mensajes de commit deben seguir la estructura: `<tipo>: <descripción en minúsculas>`
- `feat`: Nueva funcionalidad (ej: `feat: add demographic filters graph`)
- `fix`: Resolución de un bug (ej: `fix: solve database connection timeout`)
- `docs`: Cambios en la documentación (ej: `docs: update roadmap`)
- `style`: Cambios en formato/estilos sin alterar lógica (ej: `style: format with prettier`)
- `refactor`: Reorganización de código sin añadir features ni arreglar bugs
- `chore`: Tareas de mantenimiento, dependencias, etc. (ej: `chore: install prettier`)

### 2. Estructura de Ramas (Git Flow Simplificado)
- `main`: Rama de producción. Solo código estable y verificado.
- `dev`: Rama de desarrollo. Integración de nuevas características.
- `feature/*` o `bugfix/*`: Ramas temporales de trabajo creadas desde `dev`. Se integran de nuevo en `dev` mediante Pull Requests.

### 3. Convenciones de Nomenclatura (Naming)
- **Componentes React:** PascalCase (ej: `RatingWidget.tsx`, `Header.tsx`).
- **Páginas y Rutas:** Nombres de carpeta en minúscula y kebab-case (ej: `app/movie/[id]/page.tsx`).
- **Funciones y Variables:** camelCase (ej: `const getMovieStats = ...`).
- **Archivos de servicio/utilidad:** camelCase (ej: `lib/tmdb.ts`).


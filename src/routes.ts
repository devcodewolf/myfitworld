/**
 * Todas las URLs internas se construyen aquí, y solo aquí.
 *
 * Astro entrega `BASE_URL` sin barra final cuando se despliega en subcarpeta
 * (`/entreno`, no `/entreno/`), así que concatenar a mano produce `/entrenoX`.
 * Este módulo es lo que evita ese bug en cada enlace de la app.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

function url(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean === '' ? `${BASE}/` : `${BASE}/${clean}`;
}

export const routes = {
  home: () => url('/'),
  week: (week: number) => url(`semana/${week}`),
  day: (week: number, day: number) => url(`semana/${week}/dia/${day}`),
  train: (week: number, day: number) => url(`semana/${week}/dia/${day}/entrenar`),
  exercises: () => url('ejercicios'),
  exercise: (slug: string) => url(`ejercicios/${slug}`),
  history: () => url('historial'),
  settings: () => url('configuracion'),
  asset: (path: string) => url(path),
} as const;

/** Marca el enlace activo en la navegación comparando rutas normalizadas. */
export function isActiveRoute(current: string, target: string): boolean {
  const normalize = (value: string) => value.replace(/\/+$/, '') || '/';
  const currentPath = normalize(current);
  const targetPath = normalize(target);
  if (targetPath === normalize(BASE || '/')) return currentPath === targetPath;
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

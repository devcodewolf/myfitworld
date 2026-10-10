/**
 * Todas las URLs internas se construyen aquí, y solo aquí.
 *
 * Antes este módulo existía para sobrevivir al despliegue en subcarpeta: Astro
 * entrega `BASE_URL` sin barra final, así que concatenar a mano producía
 * `/entrenoX`. Esa complejidad desapareció al descartar la subcarpeta, pero el
 * módulo se queda: tener un único sitio donde se decide cómo es una URL es lo
 * que permite renombrar una ruta sin buscar cadenas por todo el proyecto.
 */

/** De qué día vienes, para poder volver ahí en vez de al catálogo entero. */
export interface DayContext {
  readonly week: number;
  readonly day: number;
}

export const routes = {
  home: () => '/',
  week: (week: number) => `/semana/${week}`,
  day: (week: number, day: number) => `/semana/${week}/dia/${day}`,
  train: (week: number, day: number) => `/semana/${week}/dia/${day}/entrenar`,
  exercises: () => '/ejercicios',
  exercise: (slug: string, from?: DayContext) =>
    `/ejercicios/${slug}` + (from ? `?desde=${from.week}-${from.day}` : ''),
  history: () => '/historial',
  advice: () => '/consejos',
  settings: () => '/configuracion',
  /**
   * La pantalla de entrada. `volver` es a dónde se vuelve después: sin él, un
   * login siempre te deja en la portada aunque hubieras pulsado «Entrenar».
   */
  login: (returnTo?: string) =>
    '/login' + (returnTo ? `?volver=${encodeURIComponent(returnTo)}` : ''),
  /**
   * Cerrar sesión. Es un `POST` a una ruta propia, no un enlace: un enlace lo
   * seguiría cualquier precarga del navegador y te sacaría de la app sola.
   */
  signOut: () => '/salir',
  /** Administración de cuentas. Solo la ve un admin; al resto le da 404. */
  admin: () => '/admin',
  adminTrash: () => '/admin/papelera',
  /**
   * TEMPORAL: los prompts para generar los vídeos de los ejercicios. Se va
   * con `pages/admin/videos.astro` cuando los vídeos estén dentro.
   */
  adminVideoPrompts: () => '/admin/videos',
  /** Entrar como otra persona. `POST`, por lo mismo que salir. */
  impersonate: () => '/admin/suplantar',
  /** El prefijo bajo el que Better Auth atiende todo lo suyo. */
  authApi: () => '/api/auth',
  /**
   * Un asset propio se sirve desde la raíz; uno remoto se devuelve tal cual.
   * Sin esta distinción, una foto de Unsplash acabaría pedida como
   * `/https://images.unsplash.com/...`.
   */
  asset: (path: string) => (isRemote(path) ? path : `/${path.replace(/^\/+/, '')}`),
} as const;

function isRemote(path: string): boolean {
  return /^(https?:)?\/\//.test(path) || path.startsWith('data:');
}

/**
 * Valida el `volver` que trae el login. Viene de la URL, o sea de cualquiera:
 * aceptarlo tal cual convertiría nuestra pantalla de entrada en un trampolín a
 * otro sitio («entra aquí» y acabas en otro dominio con la misma pinta). Solo
 * se admite una ruta propia, y `//` o `/\` no lo son: el navegador los lee
 * como el principio de una URL absoluta.
 */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith('/')) return null;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null;
  return raw;
}

/**
 * Lee el contexto de vuelta de una cadena de consulta. Es entrada no confiable
 * (viene de la URL), así que solo se acepta el formato exacto.
 */
export function parseDayContext(search: string): DayContext | null {
  const raw = new URLSearchParams(search).get('desde');
  const match = raw?.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  return { week: Number(match[1]), day: Number(match[2]) };
}

/** Marca el enlace activo en la navegación comparando rutas normalizadas. */
export function isActiveRoute(current: string, target: string): boolean {
  const normalize = (value: string) => value.replace(/\/+$/, '') || '/';
  const currentPath = normalize(current);
  const targetPath = normalize(target);
  if (targetPath === '/') return currentPath === '/';
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

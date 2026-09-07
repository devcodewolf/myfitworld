/**
 * El repositorio que usa la app en el navegador.
 *
 * Es el único sitio donde se decide qué implementación hay detrás, y por eso
 * cambiarla ha sido cambiar estas líneas y ninguna de las seis pantallas que lo
 * consumen. Esa era exactamente la promesa de tener una interfaz delante.
 *
 * Ahora la verdad vive en el servidor. `localStorage` sigue en el proyecto para
 * dos cosas muy concretas: el espejo de la sesión en curso mientras entrenas
 * (ver `remote-repository.ts`) y **lo que guardó la versión anterior**, que
 * sigue intacto ahí hasta que lo traigas a tu cuenta desde Ajustes.
 */
import { createLocalRepository, type AppRepository } from '@/storage/repository';
import { createBrowserStore } from '@/storage/kv';
import { createRemoteRepository } from '@/browser/remote-repository';

let instance: AppRepository | null = null;

export function getRepository(): AppRepository {
  instance ??= createRemoteRepository({
    store: createBrowserStore(),
    now: () => new Date().toISOString(),
  });
  return instance;
}

/**
 * El repositorio de la versión anterior, leyendo lo que quedó en este navegador.
 *
 * **No es el repositorio de la app.** Existe solo para la mudanza: leer lo que
 * hay guardado aquí de antes y subirlo a la cuenta. Nadie más debería llamarlo,
 * y cuando ya no quede nadie con datos viejos en un navegador, se borra.
 */
export function getLegacyLocalRepository(): AppRepository {
  return createLocalRepository({
    store: createBrowserStore(),
    now: () => new Date().toISOString(),
    uuid: () => crypto.randomUUID(),
  });
}

/** Descarga un objeto como archivo JSON, sin dependencias. */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Lee un archivo elegido por el usuario y lo devuelve ya parseado. */
export async function readJsonFile(file: File): Promise<unknown> {
  return JSON.parse(await file.text());
}

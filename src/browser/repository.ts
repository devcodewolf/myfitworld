/**
 * El repositorio que usa la app en el navegador.
 *
 * Es el único sitio donde se decide qué implementación hay detrás. Cambiar
 * `localStorage` por IndexedDB o por una API es cambiar estas tres líneas.
 */
import { createLocalRepository, type AppRepository } from '@/storage/repository';
import { createBrowserStore } from '@/storage/kv';

let instance: AppRepository | null = null;

export function getRepository(): AppRepository {
  instance ??= createLocalRepository({
    store: createBrowserStore(),
    now: () => new Date().toISOString(),
    uuid: () => crypto.randomUUID(),
  });
  return instance;
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

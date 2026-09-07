/**
 * El punto único donde se decide qué persistencia hay detrás.
 *
 * Hoy solo hay una, la que habla con el servidor. Este archivo sigue existiendo
 * porque es lo que hizo posible el cambio: pasar de `localStorage` a Postgres
 * fue reescribir estas líneas, y ninguna de las seis pantallas se enteró.
 */
import { createRemoteRepository } from '@/repository/remote';
import type { AppRepository } from '@/repository/contract';

let instance: AppRepository | null = null;

export function getRepository(): AppRepository {
  instance ??= createRemoteRepository();
  return instance;
}

/**
 * Lo que la aplicación puede pedirle a la persistencia. Solo el contrato.
 *
 * Ninguna pantalla sabe qué hay detrás. Hoy hay una única implementación, la
 * que habla con el servidor (`remote.ts`); hubo otra contra `localStorage` y
 * cambiar de una a otra fue cambiar una línea en `index.ts`. Esa es toda la
 * razón de que exista este archivo.
 *
 * **Todo es asíncrono a propósito**, incluso lo que podría no serlo. Una firma
 * síncrona que un día tiene que ir a la red obliga a reescribir a quien la
 * llama; una asíncrona que no lo necesita no molesta a nadie.
 *
 * ── COSTURA DE SINCRONIZACIÓN ──────────────────────────────────────────────
 * Cada registro lleva `id` estable, `createdAt` y `updatedAt`. Eso es lo que
 * permitiría resolver conflictos por «gana el más reciente» el día que haya
 * sincronización entre dispositivos. Hoy no la hay: el servidor manda y punto.
 */
import type { Profile, SessionLog, SessionStatus, Settings } from '@/core/model';

export interface SessionQuery {
  readonly mesocycleId?: string;
  readonly weekOrder?: number;
  readonly dayOrder?: number;
  readonly status?: SessionStatus;
  readonly profileId?: string;
  readonly limit?: number;
}

export interface WorkoutLogRepository {
  listSessions(query?: SessionQuery): Promise<readonly SessionLog[]>;
  getSession(id: string): Promise<SessionLog | null>;
  /** La sesión sin terminar, si la hay: es lo que permite reanudar tras recargar. */
  getActiveSession(): Promise<SessionLog | null>;
  /** Guarda la sesión en curso. Se llama en cada serie que marcas. */
  saveActiveSession(session: SessionLog): Promise<SessionLog>;
  /** Cierra la sesión en curso y la pasa al historial. */
  completeActiveSession(finishedAt: string): Promise<SessionLog | null>;
  discardActiveSession(): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  save(patch: Partial<Settings>): Promise<Settings>;
}

export interface ProfileRepository {
  /** El perfil en uso. Se crea solo la primera vez. */
  getActive(): Promise<Profile>;
  list(): Promise<readonly Profile[]>;
}

export interface AppRepository {
  readonly sessions: WorkoutLogRepository;
  readonly settings: SettingsRepository;
  readonly profiles: ProfileRepository;
}

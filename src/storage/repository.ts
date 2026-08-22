/**
 * La capa de persistencia, detrás de una interfaz.
 *
 * Todo es asíncrono desde el primer día aunque `localStorage` sea síncrono: el
 * día que detrás haya una API o Supabase, estas firmas no cambian y no hay que
 * tocar una sola línea fuera de esta carpeta.
 *
 * ── COSTURA DE SINCRONIZACIÓN ──────────────────────────────────────────────
 * Cada registro lleva `id` estable, `createdAt` y `updatedAt`. Eso es lo que
 * permitirá resolver conflictos por "gana el más reciente" cuando exista
 * sincronización entre dispositivos. Aquí no hay autenticación: cuando la haya,
 * entra como un `AuthContext` en `createLocalRepository` y se propaga al
 * `profileId` que ya llevan sesiones y ajustes.
 */
import {
  ProfileSchema,
  SessionLogSchema,
  SettingsSchema,
  STORAGE_SCHEMA_VERSION,
  StoredStateV1Schema,
  type Profile,
  type SessionLog,
  type SessionStatus,
  type Settings,
  type StoredState,
} from '@/core/model';
import { readDocument, writeDocument, type ReadStatus } from '@/storage/document';
import { STORAGE_KEYS, type KeyValueStore } from '@/storage/kv';

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
  /** Guarda la sesión en curso. Barata a propósito: se llama en cada serie. */
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
  /** Estado completo, para exportar. */
  snapshot(): Promise<StoredState>;
  /** Reemplaza el estado completo, al importar. */
  restore(state: StoredState): Promise<void>;
  /** Qué pasó al leer: sirve para avisar de datos apartados. */
  lastReadStatus(): ReadStatus;
}

export interface RepositoryDeps {
  readonly store: KeyValueStore;
  /** Inyectados para que los tests sean deterministas. */
  readonly now: () => string;
  readonly uuid: () => string;
}

const DEFAULT_PROFILE_NAME = 'Yo';

function emptyState(): StoredState {
  return { schemaVersion: STORAGE_SCHEMA_VERSION, profiles: [], sessions: [], settings: [] };
}

export function createLocalRepository({ store, now, uuid }: RepositoryDeps): AppRepository {
  let status: ReadStatus = 'empty';

  const readState = (): StoredState => {
    const result = readDocument({
      store,
      key: STORAGE_KEYS.state,
      schema: StoredStateV1Schema,
      fallback: emptyState(),
      targetVersion: STORAGE_SCHEMA_VERSION,
      stamp: now,
    });
    status = result.status;
    return result.value;
  };

  const writeState = (state: StoredState): void => {
    writeDocument(store, STORAGE_KEYS.state, state);
  };

  const readActive = (): SessionLog | null => {
    const result = readDocument<SessionLog | null>({
      store,
      key: STORAGE_KEYS.activeSession,
      schema: SessionLogSchema.nullable(),
      fallback: null,
      targetVersion: STORAGE_SCHEMA_VERSION,
      stamp: now,
    });
    return result.value;
  };

  const ensureProfile = (state: StoredState): { state: StoredState; profile: Profile } => {
    const existing = state.profiles[0];
    if (existing) return { state, profile: existing };
    const profile = ProfileSchema.parse({
      id: uuid(),
      name: DEFAULT_PROFILE_NAME,
      createdAt: now(),
    });
    return { state: { ...state, profiles: [profile] }, profile };
  };

  const ensureSettings = (
    state: StoredState,
    profileId: string,
  ): { state: StoredState; settings: Settings } => {
    const existing = state.settings.find((item) => item.profileId === profileId);
    if (existing) return { state, settings: existing };
    const settings = SettingsSchema.parse({ profileId, updatedAt: now() });
    return { state: { ...state, settings: [...state.settings, settings] }, settings };
  };

  const profiles: ProfileRepository = {
    async getActive() {
      const { state, profile } = ensureProfile(readState());
      writeState(state);
      return profile;
    },
    async list() {
      return readState().profiles;
    },
  };

  const settings: SettingsRepository = {
    async get() {
      const withProfile = ensureProfile(readState());
      const result = ensureSettings(withProfile.state, withProfile.profile.id);
      writeState(result.state);
      return result.settings;
    },
    async save(patch) {
      const withProfile = ensureProfile(readState());
      const current = ensureSettings(withProfile.state, withProfile.profile.id);
      const updated = SettingsSchema.parse({
        ...current.settings,
        ...patch,
        profileId: current.settings.profileId,
        updatedAt: now(),
      });
      writeState({
        ...current.state,
        settings: current.state.settings.map((item) =>
          item.profileId === updated.profileId ? updated : item,
        ),
      });
      return updated;
    },
  };

  const sessions: WorkoutLogRepository = {
    async listSessions(query = {}) {
      const all = readState().sessions;
      const filtered = all.filter(
        (session) =>
          (query.mesocycleId === undefined || session.mesocycleId === query.mesocycleId) &&
          (query.weekOrder === undefined || session.weekOrder === query.weekOrder) &&
          (query.dayOrder === undefined || session.dayOrder === query.dayOrder) &&
          (query.status === undefined || session.status === query.status) &&
          (query.profileId === undefined || session.profileId === query.profileId),
      );
      const ordered = [...filtered].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      return query.limit === undefined ? ordered : ordered.slice(0, query.limit);
    },

    async getSession(id) {
      return readState().sessions.find((session) => session.id === id) ?? null;
    },

    async getActiveSession() {
      return readActive();
    },

    async saveActiveSession(session) {
      const updated: SessionLog = { ...session, status: 'in_progress', updatedAt: now() };
      writeDocument(store, STORAGE_KEYS.activeSession, updated);
      return updated;
    },

    async completeActiveSession(finishedAt) {
      const active = readActive();
      if (!active) return null;
      const completed: SessionLog = {
        ...active,
        status: 'completed',
        finishedAt,
        updatedAt: now(),
      };
      const state = readState();
      const withoutDuplicate = state.sessions.filter((item) => item.id !== completed.id);
      writeState({ ...state, sessions: [...withoutDuplicate, completed] });
      store.remove(STORAGE_KEYS.activeSession);
      return completed;
    },

    async discardActiveSession() {
      store.remove(STORAGE_KEYS.activeSession);
    },

    async deleteSession(id) {
      const state = readState();
      writeState({ ...state, sessions: state.sessions.filter((session) => session.id !== id) });
    },
  };

  return {
    sessions,
    settings,
    profiles,
    async snapshot() {
      return readState();
    },
    async restore(state) {
      writeState(StoredStateV1Schema.parse(state));
      store.remove(STORAGE_KEYS.activeSession);
    },
    lastReadStatus: () => status,
  };
}

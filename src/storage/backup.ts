/**
 * Exportar e importar el historial completo.
 *
 * Esto es la única copia de seguridad que existe hoy, así que el import está
 * escrito a la defensiva: valida con Zod antes de tocar nada, y en modo fusión
 * jamás pisa un registro más reciente con uno más antiguo.
 */
import {
  BackupDocumentSchema,
  STORAGE_SCHEMA_VERSION,
  type BackupDocument,
  type StoredState,
} from '@/core/model';

export function buildBackup(state: StoredState, exportedAt: string): BackupDocument {
  return BackupDocumentSchema.parse({
    ...state,
    app: 'my-fitness-world',
    schemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt,
  });
}

export type ImportMode = 'replace' | 'merge';

export interface ImportReport {
  readonly ok: boolean;
  /** Por qué se rechazó, cuando `ok` es falso. */
  readonly error?: string;
  readonly sessionsAdded: number;
  readonly sessionsUpdated: number;
  readonly sessionsKept: number;
  readonly profilesAdded: number;
}

export interface ImportResult {
  readonly report: ImportReport;
  /** Estado resultante. Si el import falla, es el actual sin tocar. */
  readonly state: StoredState;
}

const REJECTED = (error: string, state: StoredState): ImportResult => ({
  report: {
    ok: false,
    error,
    sessionsAdded: 0,
    sessionsUpdated: 0,
    sessionsKept: 0,
    profilesAdded: 0,
  },
  state,
});

export function importBackup(raw: unknown, mode: ImportMode, current: StoredState): ImportResult {
  const parsed = BackupDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    return REJECTED('El archivo no es una copia válida de My Fitness World.', current);
  }
  const incoming = parsed.data;

  if (mode === 'replace') {
    return {
      report: {
        ok: true,
        sessionsAdded: incoming.sessions.length,
        sessionsUpdated: 0,
        sessionsKept: 0,
        profilesAdded: incoming.profiles.length,
      },
      state: {
        schemaVersion: STORAGE_SCHEMA_VERSION,
        profiles: incoming.profiles,
        sessions: incoming.sessions,
        settings: incoming.settings,
      },
    };
  }

  // Fusión: gana el registro con `updatedAt` más reciente, nunca la antigüedad.
  const byId = new Map(current.sessions.map((session) => [session.id, session]));
  let sessionsAdded = 0;
  let sessionsUpdated = 0;
  let sessionsKept = 0;

  for (const session of incoming.sessions) {
    const existing = byId.get(session.id);
    if (!existing) {
      byId.set(session.id, session);
      sessionsAdded += 1;
    } else if (session.updatedAt > existing.updatedAt) {
      byId.set(session.id, session);
      sessionsUpdated += 1;
    } else {
      sessionsKept += 1;
    }
  }

  const profileIds = new Set(current.profiles.map((profile) => profile.id));
  const newProfiles = incoming.profiles.filter((profile) => !profileIds.has(profile.id));

  const settingsByProfile = new Map(current.settings.map((item) => [item.profileId, item]));
  for (const item of incoming.settings) {
    const existing = settingsByProfile.get(item.profileId);
    if (!existing || item.updatedAt > existing.updatedAt)
      settingsByProfile.set(item.profileId, item);
  }

  return {
    report: {
      ok: true,
      sessionsAdded,
      sessionsUpdated,
      sessionsKept,
      profilesAdded: newProfiles.length,
    },
    state: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      profiles: [...current.profiles, ...newProfiles],
      sessions: [...byId.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
      settings: [...settingsByProfile.values()],
    },
  };
}

/** Nombre de archivo con fecha, para que las copias no se pisen entre ellas. */
export function backupFilename(exportedAt: string): string {
  return `my-fitness-world-${exportedAt.slice(0, 10)}.json`;
}

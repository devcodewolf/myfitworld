/**
 * Fuente de verdad de todo el dominio.
 *
 * Los esquemas Zod son lo primario y los tipos TypeScript se infieren de ellos:
 * mantener interfaces escritas a mano en paralelo garantiza que se desincronicen.
 *
 * Este archivo no importa nada de Astro ni del navegador a propósito. Es lo que
 * permite que lo usen a la vez las Content Collections (build), el cliente y,
 * el día que exista, el servidor.
 */
import { z } from 'zod';

/* ── Primitivas ─────────────────────────────────────────────────────────── */

export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: 'debe ser kebab-case' });

export const IdSchema = z.uuid();
export const TimestampSchema = z.iso.datetime();

export const MuscleGroupSchema = z.enum([
  'chest',
  'lats',
  'upper_back',
  'traps',
  'lower_back',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'adductors',
  'calves',
  'core',
]);

export const EquipmentSchema = z.enum([
  'bodyweight',
  'dumbbell',
  'kettlebell',
  'barbell',
  'plate',
  'bench',
  'chair',
  'floor',
  'wall',
  'mat',
  'band',
  'pullup_bar',
  'box',
]);

export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

/** Determina si la UI pide peso y cómo se agrega el volumen. */
export const LoadTypeSchema = z.enum(['external', 'bodyweight', 'bodyweight_plus']);

/** Tempo en segundos por fase. Una excéntrica de 3 s es { eccentricSeconds: 3 }. */
export const TempoSchema = z.object({
  eccentricSeconds: z.number().min(0).max(10).default(1),
  bottomPauseSeconds: z.number().min(0).max(10).default(0),
  concentricSeconds: z.number().min(0).max(10).default(1),
  topPauseSeconds: z.number().min(0).max(10).default(0),
});

export type Slug = z.infer<typeof SlugSchema>;
export type MuscleGroup = z.infer<typeof MuscleGroupSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type LoadType = z.infer<typeof LoadTypeSchema>;
export type Tempo = z.infer<typeof TempoSchema>;

/* ── Catálogo de ejercicios ─────────────────────────────────────────────── */

/** aspectRatio es obligatorio: es lo que reserva el hueco y evita saltos de layout. */
const MediaCommonSchema = z.object({
  alt: z.string().min(3),
  aspectRatio: z
    .string()
    .regex(/^\d+\/\d+$/)
    .default('4/3'),
});

export const MediaAssetSchema = z.discriminatedUnion('kind', [
  MediaCommonSchema.extend({
    kind: z.literal('image'),
    src: z.string().min(1),
  }),
  /** Croquis SVG animado: se inlinea en el DOM para heredar currentColor. */
  MediaCommonSchema.extend({
    kind: z.literal('croquis'),
    src: z.string().min(1),
    loopSeconds: z.number().min(0.5).max(10).default(3),
  }),
  MediaCommonSchema.extend({
    kind: z.literal('video'),
    sources: z.array(z.object({ src: z.string().min(1), type: z.string().min(1) })).min(1),
    poster: z.string().optional(),
  }),
  /** Vídeo de terceros: se carga tras un clic, nunca antes. */
  MediaCommonSchema.extend({
    kind: z.literal('embed'),
    provider: z.enum(['youtube', 'vimeo']),
    videoId: z.string().min(3),
    startSeconds: z.number().int().min(0).optional(),
  }),
]);

export const ExerciseMediaSchema = z.object({
  croquis: MediaAssetSchema.optional(),
  video: MediaAssetSchema.optional(),
  thumbnail: MediaAssetSchema.optional(),
});

/** El id no se declara: lo aporta el nombre del archivo (glob loader de Astro). */
export const ExerciseSchema = z.object({
  name: z.string().min(3),
  primaryMuscles: z.array(MuscleGroupSchema).min(1),
  secondaryMuscles: z.array(MuscleGroupSchema).default([]),
  equipment: z.array(EquipmentSchema).min(1),
  difficulty: DifficultySchema,
  loadType: LoadTypeSchema,
  unilateral: z.boolean().default(false),
  /** Cambia el cronómetro de serie a cuenta atrás. */
  isometric: z.boolean().default(false),
  cues: z.array(z.string().min(5)).min(2).max(4),
  commonMistakes: z.array(z.string().min(5)).min(1).max(4),
  defaultRestSeconds: z.number().int().min(0).max(600).optional(),
  /** Alternativas si un día no puedes hacerlo. Validado en data.ts. */
  substitutions: z.array(SlugSchema).default([]),
  media: ExerciseMediaSchema.optional(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type ExerciseData = z.infer<typeof ExerciseSchema>;
export type Exercise = ExerciseData & { readonly id: Slug };

/* ── Prescripción: qué toca hacer ───────────────────────────────────────── */

export const RepRangeSchema = z
  .object({
    min: z.number().int().min(1).max(100),
    max: z.number().int().min(1).max(100),
  })
  .refine((r) => r.max >= r.min, { error: 'max debe ser mayor o igual que min' });

export const ExerciseBlockSchema = z
  .object({
    exerciseId: SlugSchema,
    /**
     * Clave estable del bloque dentro del día: es lo que enlaza el historial.
     * Solo hace falta si el mismo ejercicio aparece dos veces el mismo día.
     */
    key: SlugSchema.optional(),
    sets: z.number().int().min(1).max(10),
    repRange: RepRangeSchema.optional(),
    /** Isométricos y series a tiempo. */
    workSeconds: z.number().int().min(5).max(600).optional(),
    tempo: TempoSchema.optional(),
    restSeconds: z.number().int().min(0).max(600),
    /** Entre lados de un unilateral. */
    intraSideRestSeconds: z.number().int().min(0).max(180).optional(),
    perSideLogging: z.boolean().default(false),
    repsInReserve: z.number().min(0).max(6).optional(),
    rpeTarget: z.number().min(5).max(10).optional(),
    supersetGroup: SlugSchema.optional(),
    notes: z.string().max(280).optional(),
  })
  .refine((b) => b.repRange !== undefined || b.workSeconds !== undefined, {
    error: 'un bloque necesita repRange o workSeconds',
  });

export const DaySchema = z.object({
  order: z.number().int().min(1).max(7),
  title: z.string().min(3),
  focus: z.string().min(3),
  warmupNotes: z.string().max(500).optional(),
  /** Override manual; si falta, se estima desde la prescripción. */
  estimatedMinutes: z.number().int().min(10).max(180).optional(),
  blocks: z.array(ExerciseBlockSchema).min(1),
});

export const WeekPhaseSchema = z.enum([
  'accumulation',
  'progression',
  'intensification',
  'deload',
]);

export const WeekSchema = z.object({
  order: z.number().int().min(1).max(12),
  phase: WeekPhaseSchema,
  focus: z.string().min(3),
  notes: z.string().max(500).optional(),
  days: z.array(DaySchema).min(1),
});

export const MesocycleSchema = z.object({
  name: z.string().min(3),
  description: z.string().max(500).optional(),
  /** Solo uno activo: es el que sirven las rutas /semana/[week]. */
  isActive: z.boolean().default(false),
  startedOn: z.iso.date().optional(),
  weeks: z.array(WeekSchema).min(1),
});

export type RepRange = z.infer<typeof RepRangeSchema>;
export type ExerciseBlock = z.infer<typeof ExerciseBlockSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Week = z.infer<typeof WeekSchema>;
export type WeekPhase = z.infer<typeof WeekPhaseSchema>;
export type MesocycleData = z.infer<typeof MesocycleSchema>;
export type Mesocycle = MesocycleData & { readonly id: Slug };

/* ── Registro: qué ocurrió de verdad ────────────────────────────────────── */

/** Hueco reservado para varios perfiles; hoy solo existe el activo. */
export const ProfileSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(40),
  createdAt: TimestampSchema,
});

export const SetLogSchema = z.object({
  id: IdSchema,
  setIndex: z.number().int().min(1),
  side: z.enum(['left', 'right']).optional(),
  reps: z.number().int().min(0).max(200).optional(),
  weightKg: z.number().min(0).max(500).optional(),
  seconds: z.number().int().min(0).max(3600).optional(),
  rpe: z.number().min(1).max(10).optional(),
  skipped: z.boolean().default(false),
  completedAt: TimestampSchema,
});

export const ExerciseLogSchema = z.object({
  blockKey: SlugSchema,
  /** Desnormalizado a propósito: el historial sobrevive a que la rutina cambie. */
  exerciseId: SlugSchema,
  sets: z.array(SetLogSchema),
  notes: z.string().max(500).optional(),
});

export const SessionStatusSchema = z.enum(['in_progress', 'completed', 'abandoned']);

export const SessionLogSchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  mesocycleId: SlugSchema,
  weekOrder: z.number().int().min(1),
  dayOrder: z.number().int().min(1),
  status: SessionStatusSchema,
  startedAt: TimestampSchema,
  finishedAt: TimestampSchema.optional(),
  /** Tiempo real entrenando; no se deriva de las marcas de inicio y fin. */
  activeSeconds: z.number().int().min(0).optional(),
  restMultiplier: z.number().min(0.5).max(1.5).default(1),
  exercises: z.array(ExerciseLogSchema),
  notes: z.string().max(1000).optional(),
  feeling: z.number().int().min(1).max(5).optional(),
  bodyweightKg: z.number().min(20).max(300).optional(),
  createdAt: TimestampSchema,
  /** Resolución de conflictos cuando exista sincronización. */
  updatedAt: TimestampSchema,
});

export type Profile = z.infer<typeof ProfileSchema>;
export type SetLog = z.infer<typeof SetLogSchema>;
export type ExerciseLog = z.infer<typeof ExerciseLogSchema>;
export type SessionLog = z.infer<typeof SessionLogSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/* ── Configuración ──────────────────────────────────────────────────────── */

export const LoadItemSchema = z.object({
  id: IdSchema,
  kind: z.enum(['dumbbell', 'plate', 'kettlebell', 'barbell']),
  weightKg: z.number().min(0.5).max(200),
  count: z.number().int().min(1).max(20),
  label: z.string().max(60).optional(),
});

export const SettingsSchema = z.object({
  profileId: IdSchema,
  /** De aquí sale el siguiente salto de peso. Nada hardcodeado. */
  availableLoads: z.array(LoadItemSchema).default([]),
  bodyweightKg: z.number().min(20).max(300).optional(),
  soundEnabled: z.boolean().default(true),
  vibrationEnabled: z.boolean().default(true),
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  restMultiplier: z.number().min(0.5).max(1.5).default(1),
  autoStartRest: z.boolean().default(true),
  keepScreenAwake: z.boolean().default(true),
  updatedAt: TimestampSchema,
});

export type LoadItem = z.infer<typeof LoadItemSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

/* ── Persistencia y copia de seguridad ──────────────────────────────────── */

export const STORAGE_SCHEMA_VERSION = 1 as const;

export const StoredStateV1Schema = z.object({
  schemaVersion: z.literal(1),
  profiles: z.array(ProfileSchema),
  sessions: z.array(SessionLogSchema),
  settings: z.array(SettingsSchema),
});

export const BackupDocumentSchema = StoredStateV1Schema.extend({
  app: z.literal('my-fitness-world'),
  exportedAt: TimestampSchema,
});

export type StoredState = z.infer<typeof StoredStateV1Schema>;
export type BackupDocument = z.infer<typeof BackupDocumentSchema>;

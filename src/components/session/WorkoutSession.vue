<script setup lang="ts">
/**
 * El modo entreno. La única isla de Vue del proyecto, y la única pantalla donde
 * el estado reactivo se gana el sitio: dos temporizadores, una serie en curso,
 * el progreso y el autoguardado reaccionan todos al mismo cambio.
 *
 * La lógica de qué toca ahora vive en `core/session.ts`, probada aparte. Aquí
 * solo hay orquestación: pintar, escuchar teclas y guardar.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import type { Day, Exercise, SessionLog, Settings } from '@/core/model';
import {
  buildSessionPlan,
  completedKeysOf,
  createSession,
  nextPendingIndex,
  recordStep,
  recordedValuesOf,
  sessionProgress,
  type SessionStep,
} from '@/core/session';
import { formatRepRange } from '@/core/labels';
import { routes } from '@/routes';
import { defaultValuesFor, findLastPerformance } from '@/core/prefill';
import { createAudioCues } from '@/browser/audio';
import { HAPTIC, vibrate } from '@/browser/haptics';
import { createWakeLock } from '@/browser/wake-lock';
import { getRepository } from '@/browser/repository';
import CircularTimer from '@/components/session/CircularTimer.vue';
import SessionHeader from '@/components/session/SessionHeader.vue';
import SessionSummary from '@/components/session/SessionSummary.vue';
import SetPad from '@/components/session/SetPad.vue';
import { useTimer } from '@/components/session/useTimer';

const props = defineProps<{
  day: Day;
  exercises: Record<string, Exercise>;
  mesocycleId: string;
  weekOrder: number;
  dayOrder: number;
  weekLabel: string;
  backHref: string;
  homeHref: string;
  historyHref: string;
}>();

const repo = getRepository();
const cues = createAudioCues();
const wakeLock = createWakeLock();

const catalog = new Map(Object.entries(props.exercises));
const plan = buildSessionPlan(props.day, catalog);

type Phase = 'loading' | 'conflict' | 'ready' | 'working' | 'resting' | 'done';

const phase = ref<Phase>('loading');
const session = ref<SessionLog | null>(null);
const previous = ref<SessionLog | null>(null);
const settings = ref<Settings | null>(null);
const foreign = ref<SessionLog | null>(null);
const index = ref(0);
const reps = ref<number | null>(null);
const weightKg = ref<number | null>(null);
const origin = ref<'history' | 'suggested' | 'none'>('none');
const restSeconds = ref(60);

const step = computed<SessionStep | undefined>(() => plan[index.value]);
const exercise = computed(() => (step.value ? catalog.get(step.value.exerciseId) : undefined));
const block = computed(() =>
  props.day.blocks.find((item) => (item.key ?? item.exerciseId) === step.value?.blockKey),
);
const completed = computed(() =>
  session.value ? completedKeysOf(session.value, plan) : new Set<string>(),
);
const progress = computed(() => sessionProgress(plan, completed.value));
/** Vídeo del ejercicio en pantalla, con la ruta ya resuelta contra el `base`. */
const video = computed(() => {
  const asset = exercise.value?.media?.video;
  if (asset?.kind !== 'video') return null;
  const source = asset.sources[0];
  if (!source) return null;
  return {
    src: routes.asset(source.src),
    type: source.type,
    alt: asset.alt,
    aspectRatio: asset.aspectRatio,
  };
});

/** Sin vídeo, la foto del ejercicio. Un hueco vacío no ayuda a nadie a las 23:00. */
const photo = computed(() => {
  const asset = exercise.value?.media?.thumbnail;
  if (asset?.kind !== 'image') return null;
  return { src: routes.asset(asset.src), alt: asset.alt, aspectRatio: asset.aspectRatio ?? '3/2' };
});

/**
 * Las series de este ejercicio y en cuál vas. Cada estado cambia la forma de la
 * marca además del color: hecha va maciza, la de ahora va anillada y las que
 * faltan van huecas, así que se distingue sin depender de ver el color.
 */
const setMarks = computed(() => {
  const current = step.value;
  if (!current) return [];
  return plan
    .filter((item) => item.blockKey === current.blockKey)
    .map((item) => ({
      key: item.key,
      label: item.side
        ? `${item.setIndex}${item.side === 'left' ? 'I' : 'D'}`
        : String(item.setIndex),
      done: completed.value.has(item.key),
      now: item.key === current.key,
    }));
});

const hint = computed(() =>
  block.value?.repRange
    ? formatRepRange(block.value.repRange)
    : String(block.value?.workSeconds ?? ''),
);

const restTimer = useTimer({
  mode: 'countdown',
  onFinalSecond: (left) => {
    if (left > 3) return;
    cues.countdownTick();
    vibrate(HAPTIC.countdownTick, settings.value?.vibrationEnabled ?? true);
  },
  onFinish: () => {
    cues.restOver();
    vibrate(HAPTIC.restOver, settings.value?.vibrationEnabled ?? true);
    phase.value = 'ready';
  },
});

const workTimer = useTimer({ mode: 'countup' });

/**
 * Deja la serie lista para marcarla sin teclear nada.
 *
 * Si ya la registraste en esta sesión, se recupera tal cual. Si no, manda lo
 * que hiciste la última vez, y a falta de historial, lo que dice el plan y tu
 * material declarado.
 */
async function loadValuesFor(current: SessionStep): Promise<void> {
  const already = session.value ? recordedValuesOf(session.value, current) : undefined;
  if (already) {
    reps.value = already.reps ?? already.seconds ?? null;
    weightKg.value = already.weightKg ?? null;
    origin.value = 'history';
    return;
  }

  const currentBlock = props.day.blocks.find(
    (item) => (item.key ?? item.exerciseId) === current.blockKey,
  );
  const currentExercise = catalog.get(current.exerciseId);
  if (!currentBlock || !currentExercise) return;

  const history = await repo.sessions.listSessions({ status: 'completed' });
  const last = findLastPerformance(history, current.exerciseId, {
    excludeSessionId: session.value?.id,
  });
  const match =
    last?.log.sets.find((set) => set.setIndex === current.setIndex) ?? last?.log.sets.at(-1);

  const values = defaultValuesFor({
    block: currentBlock,
    loadType: currentExercise.loadType,
    last: match,
    equipment: settings.value?.availableLoads ?? [],
  });
  reps.value = values.reps ?? values.seconds ?? null;
  weightKg.value = values.weightKg ?? null;
  origin.value = values.source;
}

async function persist(next: SessionLog): Promise<void> {
  session.value = await repo.sessions.saveActiveSession(next);
}

async function begin(fresh: SessionLog): Promise<void> {
  await persist(fresh);
  index.value = nextPendingIndex(plan, completed.value) ?? 0;
  phase.value = 'ready';
  if (step.value) await loadValuesFor(step.value);
}

onMounted(async () => {
  settings.value = await repo.settings.get();
  restSeconds.value = settings.value.restSeconds;
  cues.setEnabled(settings.value.soundEnabled);
  if (settings.value.keepScreenAwake) void wakeLock.request();

  const [profile, active, history] = await Promise.all([
    repo.profiles.getActive(),
    repo.sessions.getActiveSession(),
    repo.sessions.listSessions({
      status: 'completed',
      weekOrder: props.weekOrder - 1,
      dayOrder: props.dayOrder,
      limit: 1,
    }),
  ]);
  previous.value = history[0] ?? null;

  const sameDay =
    active !== null && active.weekOrder === props.weekOrder && active.dayOrder === props.dayOrder;

  if (active && !sameDay) {
    // Hay otra sesión a medias: no se descarta a espaldas de nadie.
    foreign.value = active;
    phase.value = 'conflict';
    return;
  }

  await begin(
    active ??
      createSession({
        profileId: profile.id,
        mesocycleId: props.mesocycleId,
        weekOrder: props.weekOrder,
        dayOrder: props.dayOrder,
        restMultiplier: settings.value.restMultiplier,
        ...(settings.value.bodyweightKg !== undefined
          ? { bodyweightKg: settings.value.bodyweightKg }
          : {}),
        now: new Date().toISOString(),
        uuid: crypto.randomUUID(),
      }),
  );
});

onUnmounted(() => wakeLock.dispose());

watch(restSeconds, (value) => {
  void repo.settings.save({ restSeconds: value });
});

function startWork(): void {
  cues.unlock();
  cues.setEnabled(settings.value?.soundEnabled ?? true);
  const seconds = step.value?.workSeconds;
  workTimer.stop();
  workTimer.start(seconds ?? 0);
  cues.setStart();
  vibrate(HAPTIC.setStart, settings.value?.vibrationEnabled ?? true);
  phase.value = 'working';
}

async function advance(skipped: boolean): Promise<void> {
  const current = step.value;
  if (!current || !session.value) return;
  cues.unlock();

  const timed = current.workSeconds !== undefined;
  const updated = recordStep(
    session.value,
    current,
    skipped
      ? { skipped: true }
      : {
          ...(timed ? { seconds: reps.value ?? undefined } : { reps: reps.value ?? undefined }),
          ...(weightKg.value !== null ? { weightKg: weightKg.value } : {}),
        },
    { now: new Date().toISOString(), uuid: crypto.randomUUID() },
  );
  await persist(updated);
  workTimer.stop();

  const following = nextPendingIndex(plan, completedKeysOf(updated, plan), index.value + 1);
  if (following === null) {
    await finish();
    return;
  }

  index.value = following;
  await loadValuesFor(plan[following]!);

  if (restSeconds.value > 0 && (settings.value?.autoStartRest ?? true)) {
    restTimer.start(restSeconds.value);
    phase.value = 'resting';
  } else {
    phase.value = 'ready';
  }
}

async function finish(): Promise<void> {
  const done = await repo.sessions.completeActiveSession(new Date().toISOString());
  if (done) session.value = done;
  cues.sessionDone();
  vibrate(HAPTIC.sessionDone, settings.value?.vibrationEnabled ?? true);
  void wakeLock.release();
  phase.value = 'done';
}

async function goTo(target: number): Promise<void> {
  if (target < 0 || target >= plan.length) return;
  restTimer.stop();
  workTimer.stop();
  index.value = target;
  phase.value = 'ready';
  await loadValuesFor(plan[target]!);
}

async function resumeForeign(): Promise<void> {
  if (foreign.value) window.location.assign(props.homeHref);
}

async function discardForeign(): Promise<void> {
  await repo.sessions.discardActiveSession();
  foreign.value = null;
  window.location.reload();
}

function onKey(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

  if (event.code === 'Space') {
    event.preventDefault();
    if (phase.value === 'ready') startWork();
    else if (phase.value === 'working') void advance(false);
    else if (phase.value === 'resting') restTimer.skip();
    return;
  }
  if (event.key === 'ArrowRight') void goTo(index.value + 1);
  if (event.key === 'ArrowLeft') void goTo(index.value - 1);
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div v-if="phase === 'loading'" class="py-20 text-center text-ink-dim">Cargando tu sesión…</div>

  <div v-else-if="phase === 'conflict'" class="mx-auto max-w-xl py-16 text-center">
    <h2 class="text-2xl font-extrabold text-ink">Tienes otra sesión a medias</h2>
    <p class="mt-3 text-base text-ink-dim">
      Quedó sin terminar la del día {{ foreign?.dayOrder }} de la semana {{ foreign?.weekOrder }}.
      Si empiezas esta, aquella se descarta.
    </p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <button
        type="button"
        class="accion-primaria min-h-14 rounded-full px-7 text-base font-extrabold text-accent-ink"
        @click="resumeForeign()"
      >
        Ir a buscarla
      </button>
      <button
        type="button"
        class="min-h-14 rounded-full border border-line px-7 text-base font-bold text-ink-dim hover:border-line-strong hover:text-ink"
        @click="discardForeign()"
      >
        Descartarla y empezar esta
      </button>
    </div>
  </div>

  <SessionSummary
    v-else-if="phase === 'done' && session"
    :session="session"
    :previous="previous"
    :day-title="day.title"
    :back-href="backHref"
    :home-href="homeHref"
    :history-href="historyHref"
  />

  <div v-else-if="step && exercise" class="flex flex-col gap-8">
    <SessionHeader
      v-model:rest-seconds="restSeconds"
      :title="day.title"
      :subtitle="`${weekLabel} · Día ${dayOrder}`"
      :done="progress.done"
      :total="progress.total"
      :ratio="progress.ratio"
      :back-href="backHref"
    />

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,21rem)] lg:gap-10">
      <section class="flex flex-col gap-6" aria-labelledby="ejercicio-actual">
        <div>
          <h2
            id="ejercicio-actual"
            class="text-figure font-black tracking-[-0.02em] text-balance text-ink"
          >
            {{ exercise.name }}
          </h2>
          <p class="figures mt-2 text-lg text-ink-dim">
            <span class="font-bold text-ink">
              Serie {{ step.setIndex }} de {{ step.totalSets }}
            </span>
            <span v-if="step.side">· {{ step.side === 'left' ? 'Izquierda' : 'Derecha' }}</span>
            · {{ hint }} {{ step.workSeconds ? 'segundos' : 'reps' }} · {{ restSeconds }} s de
            descanso
            <span v-if="step.chained" class="text-accent">· encadena con el siguiente</span>
          </p>
        </div>

        <!-- El vídeo del ejercicio activo se reproduce solo y en bucle: es lo que estás
             mirando entre serie y serie, sin tocar nada. Solo carga el del ejercicio en
             pantalla. Las plantillas de Vue no entienden los comentarios de Astro: con
             {/* */} el texto acaba impreso en la página. -->
        <video
          v-if="video"
          :key="video.src"
          class="max-h-104 w-full rounded-card border border-line object-cover"
          :style="{ aspectRatio: video.aspectRatio }"
          :aria-label="video.alt"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
        >
          <source :src="video.src" :type="video.type" />
        </video>
        <img
          v-else-if="photo"
          :key="photo.src"
          :src="photo.src"
          :alt="photo.alt"
          class="max-h-104 w-full rounded-card border border-line object-cover"
          :style="{ aspectRatio: photo.aspectRatio }"
        />
        <div
          v-else
          class="grid aspect-[16/10] max-h-104 place-content-center rounded-card border border-line bg-surface px-4 text-center"
        >
          <p class="max-w-[28ch] text-sm text-ink-faint">
            Sin imagen de {{ exercise.name }} todavía.
          </p>
        </div>

        <ul class="space-y-2">
          <li
            v-for="cue in exercise.cues"
            :key="cue"
            class="text-base leading-relaxed text-ink-dim"
          >
            {{ cue }}
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-8" aria-label="Serie en curso">
        <CircularTimer v-if="phase === 'resting'" :timer="restTimer" label="Descanso" :size="180" />
        <CircularTimer
          v-else
          :timer="workTimer"
          label="Serie"
          :size="180"
          :controls="phase === 'working'"
        />

        <!-- El anillo dice cuánto llevas de esta serie, pero no cuántas van del
             ejercicio. Esta fila sí, y es lo que se mira de reojo entre serie y serie. -->
        <ol v-if="setMarks.length > 1" class="flex flex-wrap items-center justify-center gap-2">
          <li
            v-for="mark in setMarks"
            :key="mark.key"
            class="figures grid size-9 place-content-center rounded-full border text-xs font-extrabold"
            :class="
              mark.now
                ? 'border-accent text-accent'
                : mark.done
                  ? 'border-ink bg-ink text-ground'
                  : 'border-line text-ink-faint'
            "
            :aria-current="mark.now ? 'step' : undefined"
          >
            {{ mark.label }}
          </li>
        </ol>

        <button
          v-if="phase === 'ready'"
          type="button"
          class="min-h-16 rounded-full border border-line-strong px-8 text-lg font-extrabold text-ink transition-colors hover:bg-raised"
          @click="startWork()"
        >
          Empezar serie
        </button>

        <SetPad
          v-model:reps="reps"
          v-model:weight-kg="weightKg"
          :load-type="exercise.loadType"
          :hint="hint"
          :timed="step.workSeconds !== undefined"
          :origin="origin"
          :disabled="phase === 'resting'"
          @complete="advance(false)"
          @skip="advance(true)"
        />

        <div class="flex flex-col gap-2 text-sm">
          <div class="flex items-center justify-between gap-4">
            <button
              type="button"
              class="min-h-11 font-bold text-ink-dim transition-colors hover:text-ink disabled:opacity-40"
              :disabled="index === 0"
              @click="goTo(index - 1)"
            >
              ← Anterior
            </button>
            <button
              type="button"
              class="min-h-11 font-bold text-ink-dim transition-colors hover:text-ink disabled:opacity-40"
              :disabled="index >= plan.length - 1"
              @click="goTo(index + 1)"
            >
              Siguiente →
            </button>
          </div>
          <p class="text-center text-ink-faint">Espacio para avanzar · flechas para moverte</p>
        </div>
      </section>
    </div>
  </div>
</template>

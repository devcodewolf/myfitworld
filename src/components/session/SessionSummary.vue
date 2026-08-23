<script setup lang="ts">
/**
 * Lo que ves al terminar.
 *
 * La comparativa con la semana anterior solo aparece si esa sesión existe. Sin
 * historial no se inventa un "+0 %": se dice que es la primera vez.
 */
import { computed } from 'vue';

import type { SessionLog } from '@/core/model';
import { formatDuration } from '@/core/labels';
import { compareVolume, sessionVolume } from '@/core/volume';

const props = defineProps<{
  session: SessionLog;
  /** La misma sesión de la semana anterior, si la hay. */
  previous: SessionLog | null;
  backHref: string;
  homeHref: string;
}>();

const volume = computed(() => sessionVolume(props.session));

const durationSeconds = computed(() => {
  if (!props.session.finishedAt) return 0;
  const start = Date.parse(props.session.startedAt);
  const end = Date.parse(props.session.finishedAt);
  return Math.max(0, Math.round((end - start) / 1000));
});

const comparison = computed(() =>
  props.previous ? compareVolume(volume.value, sessionVolume(props.previous)) : null,
);

const signed = (value: number, unit: string): string =>
  `${value > 0 ? '+' : ''}${Math.round(value * 10) / 10} ${unit}`;

const figures = computed(() => [
  {
    label: 'Volumen',
    value: `${volume.value.externalVolumeKg} kg`,
    show: volume.value.externalVolumeKg > 0,
  },
  {
    label: 'Reps peso corporal',
    value: `${volume.value.bodyweightReps}`,
    show: volume.value.bodyweightReps > 0,
  },
  { label: 'Series', value: `${volume.value.workingSets}`, show: true },
  {
    label: 'Duración',
    value: formatDuration(durationSeconds.value),
    show: durationSeconds.value > 0,
  },
]);
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-8 text-center">
    <div>
      <h2 class="text-display font-black tracking-[-0.03em] text-ink">Sesión terminada</h2>
      <p class="mt-2 text-lg text-ink-dim">Queda registrada en tu historial.</p>
    </div>

    <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div
        v-for="figure in figures.filter((item) => item.show)"
        :key="figure.label"
        class="panel rounded-card border border-line px-4 py-5"
      >
        <dt class="text-[0.7rem] font-bold tracking-[0.16em] text-ink-faint uppercase">
          {{ figure.label }}
        </dt>
        <dd class="figures mt-2 text-figure font-extrabold text-ink">{{ figure.value }}</dd>
      </div>
    </dl>

    <p v-if="comparison" class="figures text-base text-ink-dim">
      Frente a la misma sesión de la semana anterior:
      <span class="font-bold text-ink">{{ signed(comparison.externalVolumeKg, 'kg') }}</span>
      de volumen y
      <span class="font-bold text-ink">{{ signed(comparison.totalReps, 'reps') }}</span
      >.
    </p>
    <p v-else class="text-base text-ink-faint">
      Es la primera vez que registras esta sesión, así que todavía no hay con qué compararla.
    </p>

    <div class="flex flex-wrap justify-center gap-3">
      <a
        :href="homeHref"
        class="accion-primaria min-h-14 rounded-full px-7 text-base font-extrabold text-accent-ink"
      >
        Volver al mesociclo
      </a>
      <a
        :href="backHref"
        class="min-h-14 rounded-full border border-line px-7 py-4 text-base font-bold text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
      >
        Ver el plan del día
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Lo que ves al terminar.
 *
 * Las cifras van en una fila que no se parte: en la versión anterior "11 h 36
 * min" caía en tres líneas dentro de su tarjeta. La comparativa con la semana
 * anterior solo aparece si esa sesión existe; sin historial se dice que es la
 * primera vez, en lugar de fabricar un "+0 %".
 */
import { computed } from 'vue';

import type { SessionLog } from '@/core/model';
import { formatDuration } from '@/core/labels';
import { compareVolume, sessionVolume } from '@/core/volume';

const props = defineProps<{
  session: SessionLog;
  previous: SessionLog | null;
  dayTitle: string;
  backHref: string;
  homeHref: string;
  historyHref: string;
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

const figures = computed(() =>
  [
    { label: 'Series', value: String(volume.value.workingSets), show: true },
    {
      label: 'Volumen',
      value: `${volume.value.externalVolumeKg} kg`,
      show: volume.value.externalVolumeKg > 0,
    },
    {
      label: 'Reps sin carga',
      value: String(volume.value.bodyweightReps),
      show: volume.value.bodyweightReps > 0,
    },
    {
      label: 'Duración',
      value: formatDuration(durationSeconds.value),
      show: durationSeconds.value > 0,
    },
  ].filter((figure) => figure.show),
);

const SECONDARY =
  'inline-flex min-h-14 items-center rounded-full border border-line px-6 text-base font-bold text-ink-dim transition-colors hover:border-line-strong hover:text-ink';
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-10 py-6">
    <div>
      <h2 class="text-figure font-black tracking-[-0.02em] text-balance text-ink">
        {{ dayTitle }}
      </h2>
      <p class="mt-2 text-base text-ink-dim">
        <span class="font-bold text-ink">Sesión terminada.</span> Ya está registrada en tu
        historial.
      </p>
    </div>

    <dl class="panel flex flex-wrap gap-x-10 gap-y-6 rounded-card border border-line px-6 py-6">
      <div v-for="figure in figures" :key="figure.label" class="min-w-24">
        <dt class="text-[0.7rem] font-bold tracking-[0.16em] text-ink-faint uppercase">
          {{ figure.label }}
        </dt>
        <dd class="figures mt-1.5 text-figure font-extrabold whitespace-nowrap text-ink">
          {{ figure.value }}
        </dd>
      </div>
    </dl>

    <div class="border-l-2 border-line-strong pl-5">
      <p v-if="comparison" class="figures text-base leading-relaxed text-ink-dim">
        Frente a la misma sesión de la semana anterior:
        <span class="font-bold text-ink">{{ signed(comparison.externalVolumeKg, 'kg') }}</span>
        de volumen y
        <span class="font-bold text-ink">{{ signed(comparison.totalReps, 'reps') }}</span
        >.
      </p>
      <p v-else class="text-base leading-relaxed text-ink-dim">
        Es la primera vez que registras esta sesión, así que todavía no hay con qué compararla. La
        semana que viene sí.
      </p>
    </div>

    <div class="flex flex-wrap gap-3">
      <a
        :href="historyHref"
        class="accion-primaria inline-flex min-h-14 items-center rounded-full px-7 text-base font-extrabold text-accent-ink transition-transform hover:scale-[1.02] active:scale-100"
      >
        Ver el historial
      </a>
      <a :href="homeHref" :class="SECONDARY">Volver al mesociclo</a>
      <a :href="backHref" :class="SECONDARY">Ver el plan del día</a>
    </div>
  </div>
</template>

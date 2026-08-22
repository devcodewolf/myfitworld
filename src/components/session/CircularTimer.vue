<script setup lang="ts">
/**
 * La pieza protagonista del modo entreno.
 *
 * Un círculo grande con los segundos en el centro y un arco que recorre la
 * circunferencia: se vacía en el descanso y se llena en la serie. Dibujado con
 * SVG y `stroke-dashoffset`, sin librerías.
 *
 * Pensado para leerse de un vistazo a dos o tres metros: cifra enorme, contraste
 * alto, y en los últimos segundos cambia de color **y** de grosor, para que el
 * aviso no dependa solo del color.
 */
import { computed } from 'vue';

import { formatClock } from '@/core/timer';
import type { TimerHandle } from '@/components/session/useTimer';

const props = withDefaults(
  defineProps<{
    timer: TimerHandle;
    /** Qué se está cronometrando; se lee encima de la cifra. */
    label: string;
    /** Oculta los controles cuando el temporizador aún no ha arrancado. */
    controls?: boolean;
    size?: number;
  }>(),
  { controls: true, size: 260 },
);

const STROKE = 14;
const radius = computed(() => (props.size - STROKE) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashoffset = computed(() => circumference.value * (1 - props.timer.reading.value.progress));
const clock = computed(() => formatClock(props.timer.seconds.value));

// Escrita entera y literal: Tailwind escanea el código fuente, así que una
// clase compuesta en tiempo de ejecución no se generaría. Va en una constante
// y no en una regla CSS: este proyecto extrae repetición a componentes.
const CONTROL =
  'min-h-14 min-w-20 rounded-full border border-line px-5 text-base font-bold text-ink-dim transition-colors hover:border-line-strong hover:text-ink';
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg
        :width="size"
        :height="size"
        :viewBox="`0 0 ${size} ${size}`"
        class="-rotate-90"
        aria-hidden="true"
      >
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          stroke="var(--color-line)"
          :stroke-width="STROKE"
        />
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          :stroke="timer.isFinal.value ? 'var(--color-accent)' : 'var(--color-ink)'"
          :stroke-width="timer.isFinal.value ? STROKE + 5 : STROKE"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashoffset"
          class="transition-[stroke-width] duration-200"
        />
      </svg>

      <div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <p class="text-[0.7rem] font-bold tracking-[0.2em] text-ink-faint uppercase">
          {{ label }}
        </p>
        <p
          class="figures text-6xl font-black tabular-nums transition-colors"
          :class="timer.isFinal.value ? 'text-accent' : 'text-ink'"
          role="timer"
          aria-live="off"
        >
          {{ clock }}
        </p>
        <p v-if="timer.reading.value.isPaused" class="text-sm font-bold text-ink-dim">En pausa</p>
      </div>
    </div>

    <div v-if="controls" class="flex flex-wrap items-center justify-center gap-2">
      <button type="button" :class="CONTROL" @click="timer.adjust(-15)">−15 s</button>
      <button
        type="button"
        :class="[CONTROL, 'min-w-32 bg-raised font-extrabold text-ink']"
        @click="timer.toggle()"
      >
        {{ timer.reading.value.isPaused ? 'Seguir' : 'Pausa' }}
      </button>
      <button type="button" :class="CONTROL" @click="timer.adjust(15)">+15 s</button>
      <button type="button" :class="CONTROL" @click="timer.skip()">Saltar</button>
    </div>
  </div>
</template>

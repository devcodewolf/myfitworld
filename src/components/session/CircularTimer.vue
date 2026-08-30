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
    /** Habilita los controles. Apagados siguen viéndose: nunca desaparecen. */
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

// Clases escritas enteras y literales: Tailwind escanea el código fuente, así
// que una clase compuesta en tiempo de ejecución no se generaría. Van en
// constantes y no en reglas CSS: este proyecto extrae repetición a componentes.
//
// Los controles se ven siempre y solo se apagan cuando el reloj no corre.
// Ocultarlos y reservarles el hueco dejaba un vacío al lado del reloj que
// parecía un error de maquetado; apagados se leen como lo que son, un control
// que todavía no toca. 2,75rem de alto es el mínimo táctil del sistema: son
// secundarios al reloj, pero se pulsan con las manos sudadas igual que el resto.
const ADJUST =
  'min-h-11 flex-1 rounded-full border border-line text-xs font-bold text-ink-dim transition-colors enabled:hover:border-line-strong enabled:hover:text-ink disabled:opacity-40';

const PAUSE =
  'grid min-h-11 flex-1 place-items-center rounded-full border border-line-strong bg-raised text-ink transition-colors enabled:hover:border-ink-faint disabled:opacity-40';

const SKIP =
  'min-h-11 rounded-full border border-line bg-raised text-sm font-bold text-ink-dim transition-colors enabled:hover:border-line-strong enabled:hover:text-ink disabled:opacity-40';
</script>

<template>
  <!-- Reloj y controles en fila, y la fila no cambia nunca de tamaño: los
       controles no aparecen ni desaparecen con la fase, solo se apagan. Así el
       contenido de debajo no se mueve al empezar una serie o un descanso.
       Las plantillas de Vue no entienden los comentarios de Astro: con
       {/* */} el texto acaba impreso en la página. -->
  <div class="flex items-center justify-center gap-4">
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
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
          class="figures text-4xl font-black tabular-nums transition-colors"
          :class="timer.isFinal.value ? 'text-accent' : 'text-ink'"
          role="timer"
          aria-live="off"
        >
          {{ clock }}
        </p>
        <p v-if="timer.reading.value.isPaused" class="text-sm font-bold text-ink-dim">En pausa</p>
      </div>
    </div>

    <div class="flex w-36 shrink-0 flex-col gap-2">
      <div class="flex items-center gap-1.5">
        <button type="button" :class="ADJUST" :disabled="!controls" @click="timer.adjust(-15)">
          −15
        </button>
        <button
          type="button"
          :class="PAUSE"
          :disabled="!controls"
          :aria-label="timer.reading.value.isPaused ? 'Seguir' : 'Pausa'"
          @click="timer.toggle()"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="timer.reading.value.isPaused ? 'M7 5l12 7-12 7z' : 'M9 5v14M15 5v14'" />
          </svg>
        </button>
        <button type="button" :class="ADJUST" :disabled="!controls" @click="timer.adjust(15)">
          +15
        </button>
      </div>
      <button type="button" :class="SKIP" :disabled="!controls" @click="timer.skip()">
        Saltar
      </button>
    </div>
  </div>
</template>

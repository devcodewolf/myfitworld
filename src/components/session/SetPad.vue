<script setup lang="ts">
/**
 * Los dos campos que rellenas en cada serie y el botón de darla por hecha.
 *
 * Campos grandes y de tipo numérico: con las manos sudadas y a dos metros, un
 * desplegable o un campo de 32 px no sirven. El peso solo aparece cuando el
 * ejercicio lleva carga externa; en peso corporal sobra y estorba.
 */
import { computed } from 'vue';

import type { LoadType } from '@/core/model';

const props = defineProps<{
  reps: number | null;
  weightKg: number | null;
  loadType: LoadType;
  /** Rango prescrito, para enseñarlo como pista. */
  hint: string;
  /** Serie a tiempo: se registran segundos en vez de repeticiones. */
  timed: boolean;
  /** De dónde salen los valores prellenados. */
  origin: 'history' | 'suggested' | 'none';
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:reps': [value: number | null];
  'update:weightKg': [value: number | null];
  complete: [];
  skip: [];
}>();

const showsWeight = computed(() => props.loadType !== 'bodyweight');

const parse = (event: Event): number | null => {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const FIELD =
  'figures min-h-16 w-full rounded-card border border-line bg-surface px-4 text-3xl font-extrabold text-ink';
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-3" :class="showsWeight ? 'grid-cols-2' : 'grid-cols-1'">
      <label class="flex flex-col gap-1.5">
        <span class="text-[0.7rem] font-bold tracking-[0.16em] text-ink-faint uppercase">
          {{ timed ? 'Segundos' : 'Repeticiones' }}
        </span>
        <input
          :value="reps"
          type="number"
          inputmode="numeric"
          min="0"
          :placeholder="hint"
          :disabled="disabled"
          :class="FIELD"
          @input="emit('update:reps', parse($event))"
        />
      </label>

      <label v-if="showsWeight" class="flex flex-col gap-1.5">
        <span class="text-[0.7rem] font-bold tracking-[0.16em] text-ink-faint uppercase">
          Peso (kg)
        </span>
        <input
          :value="weightKg"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.5"
          :disabled="disabled"
          :class="FIELD"
          @input="emit('update:weightKg', parse($event))"
        />
      </label>
    </div>

    <p v-if="origin !== 'none'" class="text-sm text-ink-faint">
      {{
        origin === 'history'
          ? 'Prellenado con lo que hiciste la última vez.'
          : 'Sugerido por el plan y tu material. Cámbialo si hace falta.'
      }}
    </p>

    <div class="flex flex-wrap gap-3">
      <button
        type="button"
        :disabled="disabled"
        class="accion-primaria min-h-16 flex-1 rounded-full px-8 text-lg font-extrabold text-accent-ink transition-transform hover:scale-[1.01] active:scale-100 disabled:opacity-50"
        @click="emit('complete')"
      >
        Serie hecha
      </button>
      <button
        type="button"
        :disabled="disabled"
        class="min-h-16 rounded-full border border-line px-6 text-base font-bold text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
        @click="emit('skip')"
      >
        Saltar
      </button>
    </div>
  </div>
</template>

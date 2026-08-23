<script setup lang="ts">
/**
 * Barra superior del modo entreno: dónde vas, cuánto queda y la salida.
 *
 * El multiplicador de descanso está aquí y no en ajustes porque es una decisión
 * que se toma a mitad de sesión, cuando notas que vas sobrado o fundido.
 */
defineProps<{
  title: string;
  subtitle: string;
  done: number;
  total: number;
  ratio: number;
  restMultiplier: number;
  backHref: string;
}>();

const emit = defineEmits<{ 'update:restMultiplier': [value: number] }>();

const OPTIONS = [0.8, 1, 1.2] as const;
const LABELS: Record<number, string> = { 0.8: 'Apretado', 1: 'Normal', 1.2: 'Holgado' };
</script>

<template>
  <header class="border-b border-line pb-4">
    <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <div class="min-w-0">
        <h1 class="text-2xl font-extrabold tracking-[-0.02em] text-ink">{{ title }}</h1>
        <p class="figures mt-0.5 text-sm text-ink-dim">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5" role="group" aria-label="Multiplicador de descanso">
          <span class="text-[0.7rem] font-bold tracking-[0.16em] text-ink-faint uppercase">
            Descanso
          </span>
          <button
            v-for="option in OPTIONS"
            :key="option"
            type="button"
            :aria-pressed="restMultiplier === option"
            class="min-h-11 rounded-full border px-3 text-sm font-bold transition-colors"
            :class="
              restMultiplier === option
                ? 'border-line-strong bg-raised text-ink'
                : 'border-line text-ink-dim hover:text-ink'
            "
            @click="emit('update:restMultiplier', option)"
          >
            {{ LABELS[option] }}
          </button>
        </div>

        <a
          :href="backHref"
          class="min-h-11 self-center text-sm font-bold text-ink-dim transition-colors hover:text-ink"
        >
          Salir
        </a>
      </div>
    </div>

    <div class="mt-4 flex items-center gap-3">
      <div
        class="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        :aria-valuenow="done"
        :aria-valuemin="0"
        :aria-valuemax="total"
      >
        <div
          class="h-full rounded-full bg-accent transition-[width] duration-300"
          :style="{ width: `${Math.round(ratio * 100)}%` }"
        ></div>
      </div>
      <p class="figures shrink-0 text-sm font-bold text-ink-dim">{{ done }} / {{ total }} series</p>
    </div>
  </header>
</template>

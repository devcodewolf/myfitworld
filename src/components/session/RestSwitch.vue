<script setup lang="ts">
/**
 * Selector de descanso: tres posiciones con un indicador que se desliza.
 *
 * Es una decisión que se toma a mitad de sesión, cuando notas que vas sobrado
 * o fundido, así que vive en la barra del modo entreno y no en ajustes.
 */
import { computed } from 'vue';

const props = defineProps<{ seconds: number }>();
const emit = defineEmits<{ 'update:seconds': [value: number] }>();

export interface RestOption {
  readonly label: string;
  readonly seconds: number;
}

const OPTIONS: readonly RestOption[] = [
  { label: 'Apretado', seconds: 40 },
  { label: 'Normal', seconds: 60 },
  { label: 'Holgado', seconds: 80 },
];

const activeIndex = computed(() => {
  const found = OPTIONS.findIndex((option) => option.seconds === props.seconds);
  return found === -1 ? 1 : found;
});
</script>

<template>
  <div
    class="relative isolate flex rounded-full border border-line bg-surface p-1"
    role="group"
    aria-label="Descanso entre series"
  >
    <span
      class="absolute inset-y-1 -z-10 rounded-full bg-raised transition-transform duration-200"
      :style="{
        width: `calc((100% - 0.5rem) / 3)`,
        transform: `translateX(${activeIndex * 100}%)`,
      }"
      aria-hidden="true"
    ></span>
    <button
      v-for="option in OPTIONS"
      :key="option.seconds"
      type="button"
      :aria-pressed="option.seconds === seconds"
      class="figures min-h-11 flex-1 rounded-full px-4 text-sm whitespace-nowrap transition-colors"
      :class="option.seconds === seconds ? 'font-bold text-ink' : 'text-ink-dim hover:text-ink'"
      @click="emit('update:seconds', option.seconds)"
    >
      {{ option.label }}
      <span class="text-ink-faint">{{ option.seconds }}s</span>
    </button>
  </div>
</template>

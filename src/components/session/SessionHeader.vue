<script setup lang="ts">
/**
 * Barra superior del modo entreno: dónde vas, cuánto queda y la salida.
 */
import RestSwitch from '@/components/session/RestSwitch.vue';

defineProps<{
  title: string;
  subtitle: string;
  done: number;
  total: number;
  ratio: number;
  restSeconds: number;
  backHref: string;
}>();

const emit = defineEmits<{ 'update:restSeconds': [value: number] }>();
</script>

<template>
  <header class="border-b border-line pb-4">
    <!-- En móvil el selector de descanso baja a su propia fila a todo el ancho
         (junto a «Salir» no caben sus tres opciones en 360px) y «Salir» sube al
         lado del título. El grupo es `contents` hasta `sm` para que sus hijos
         puedan reordenarse dentro de la fila exterior; desde `sm` vuelve a ser
         el bloque de la derecha de siempre. -->
    <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div class="min-w-0">
        <h1 class="text-2xl font-extrabold tracking-[-0.02em] text-ink">{{ title }}</h1>
        <p class="figures mt-0.5 text-sm text-ink-dim">{{ subtitle }}</p>
      </div>

      <div class="contents sm:flex sm:items-center sm:gap-3">
        <RestSwitch
          class="order-3 basis-full sm:order-none sm:basis-auto"
          :seconds="restSeconds"
          @update:seconds="(value) => emit('update:restSeconds', value)"
        />
        <a
          :href="backHref"
          class="order-2 inline-flex min-h-11 shrink-0 items-center rounded-full border border-line-strong bg-raised px-5 text-sm font-bold text-ink transition-colors hover:border-ink-faint sm:order-none"
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

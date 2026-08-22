<script setup lang="ts">
/**
 * Banco de pruebas del temporizador. Provisional: se borra cuando el modo
 * entreno integre el círculo de verdad.
 */
import { onMounted, onUnmounted, ref } from 'vue';

import CircularTimer from '@/components/session/CircularTimer.vue';
import { useTimer } from '@/components/session/useTimer';
import { createAudioCues } from '@/browser/audio';
import { HAPTIC, vibrate } from '@/browser/haptics';
import { createWakeLock, isWakeLockSupported } from '@/browser/wake-lock';

const cues = createAudioCues();
const wakeLock = createWakeLock();

const sound = ref(true);
const haptics = ref(true);
const wakeLockActive = ref(false);
const log = ref<string[]>([]);

const note = (text: string): void => {
  log.value = [text, ...log.value].slice(0, 6);
};

const rest = useTimer({
  mode: 'countdown',
  durationSeconds: 20,
  onFinalSecond: (secondsLeft) => {
    if (secondsLeft > 3) return;
    cues.countdownTick();
    vibrate(HAPTIC.countdownTick, haptics.value);
  },
  onFinish: () => {
    cues.restOver();
    vibrate(HAPTIC.restOver, haptics.value);
    note('Descanso terminado.');
  },
});

const work = useTimer({
  mode: 'countup',
  durationSeconds: 60,
  onFinish: () => note('Objetivo de la serie alcanzado.'),
});

const startRest = (seconds: number): void => {
  cues.unlock();
  cues.setEnabled(sound.value);
  work.stop();
  rest.start(seconds);
  cues.setStart();
  vibrate(HAPTIC.setStart, haptics.value);
  note(`Descanso de ${seconds} s en marcha.`);
};

const startWork = (): void => {
  cues.unlock();
  cues.setEnabled(sound.value);
  rest.stop();
  work.start();
  cues.setStart();
  vibrate(HAPTIC.setStart, haptics.value);
  note('Serie en marcha, contando hacia arriba.');
};

const toggleWakeLock = async (): Promise<void> => {
  if (wakeLockActive.value) {
    await wakeLock.release();
    wakeLockActive.value = false;
    note('Bloqueo de pantalla liberado.');
    return;
  }
  const granted = await wakeLock.request();
  wakeLockActive.value = granted;
  note(granted ? 'Pantalla bloqueada, no se apagará.' : 'Este navegador no soporta Wake Lock.');
};

onMounted(() => {
  if (!isWakeLockSupported()) note('Wake Lock no disponible en este navegador.');
});
onUnmounted(() => wakeLock.dispose());

const BUTTON =
  'min-h-14 rounded-full border border-line px-6 text-base font-bold text-ink-dim transition-colors hover:border-line-strong hover:text-ink';
</script>

<template>
  <div class="flex flex-col items-center gap-10">
    <CircularTimer
      v-if="rest.isRunning.value || rest.reading.value.elapsedMs > 0"
      :timer="rest"
      label="Descanso"
    />
    <CircularTimer v-else :timer="work" label="Serie" />

    <div class="flex flex-wrap justify-center gap-3">
      <button
        type="button"
        class="accion-primaria min-h-14 rounded-full px-7 text-base font-extrabold text-accent-ink"
        @click="startWork()"
      >
        Empezar serie
      </button>
      <button type="button" :class="BUTTON" @click="startRest(20)">Descanso 20 s</button>
      <button type="button" :class="BUTTON" @click="startRest(90)">Descanso 90 s</button>
    </div>

    <div class="flex flex-wrap justify-center gap-6 text-sm">
      <label class="flex items-center gap-2 text-ink-dim">
        <input v-model="sound" type="checkbox" class="size-5 accent-accent" />
        Sonido
      </label>
      <label class="flex items-center gap-2 text-ink-dim">
        <input v-model="haptics" type="checkbox" class="size-5 accent-accent" />
        Vibración
      </label>
      <button
        type="button"
        class="font-bold text-ink-dim underline-offset-4 hover:underline"
        @click="toggleWakeLock()"
      >
        {{ wakeLockActive ? 'Soltar la pantalla' : 'Mantener pantalla encendida' }}
      </button>
    </div>

    <ul v-if="log.length > 0" class="w-full max-w-md space-y-1 text-sm text-ink-faint">
      <li v-for="(entry, index) in log" :key="index">{{ entry }}</li>
    </ul>
  </div>
</template>

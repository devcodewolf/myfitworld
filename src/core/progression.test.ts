import { describe, expect, it } from 'vitest';

import type { ExerciseLog, LoadItem, SetLog } from '@/core/model';
import { achievableLoads, heaviestLoad, nextLoadStep } from '@/core/equipment';
import {
  evaluateLoadProgression,
  personalRecords,
  toppedOut,
  workingWeightOf,
} from '@/core/progression';

/** El material real de partida: dos mancuernas de 9 kg y nada más. */
const DOS_DE_NUEVE: LoadItem[] = [
  { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 9, count: 2 },
];

const AMPLIADO: LoadItem[] = [
  { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 9, count: 2 },
  { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 12, count: 2 },
  { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 16, count: 1 },
];

const serie = (reps: number, weightKg?: number, extra: Partial<SetLog> = {}): SetLog => ({
  id: crypto.randomUUID(),
  setIndex: 1,
  reps,
  weightKg,
  skipped: false,
  completedAt: '2026-08-22T10:00:00.000Z',
  ...extra,
});

const sesion = (sets: SetLog[]): ExerciseLog => ({
  blockKey: 'press-militar-mancuernas',
  exerciseId: 'press-militar-mancuernas',
  sets,
});

describe('material disponible', () => {
  it('con dos mancuernas de 9 solo hay una carga posible', () => {
    expect(achievableLoads(DOS_DE_NUEVE, { mode: 'perHand' })).toEqual([9]);
  });

  it('un ejercicio a dos manos exige un par, así que la de 16 suelta no cuenta', () => {
    expect(achievableLoads(AMPLIADO, { mode: 'perHand', pairs: true })).toEqual([9, 12]);
    expect(achievableLoads(AMPLIADO, { mode: 'perHand', pairs: false })).toEqual([9, 12, 16]);
  });

  it('en modo total, un par de 9 son 18 kg levantados', () => {
    expect(achievableLoads(AMPLIADO, { mode: 'total', pairs: true })).toEqual([18, 24]);
  });

  it('los discos solo cuentan si hay barra, y se cargan simétricos', () => {
    const conBarra: LoadItem[] = [
      { id: crypto.randomUUID(), kind: 'barbell', weightKg: 20, count: 1 },
      { id: crypto.randomUUID(), kind: 'plate', weightKg: 5, count: 4 },
    ];
    // Barra sola, barra + 5 a cada lado, barra + 10 a cada lado.
    expect(achievableLoads(conBarra, { mode: 'total' })).toEqual([20, 30, 40]);
  });

  it('sin barra, unos discos sueltos no montan ninguna carga', () => {
    const sueltos: LoadItem[] = [{ id: crypto.randomUUID(), kind: 'plate', weightKg: 5, count: 4 }];
    expect(achievableLoads(sueltos, { mode: 'total' })).toEqual([]);
  });

  it('el siguiente salto es la carga inmediatamente superior', () => {
    expect(nextLoadStep(9, AMPLIADO, { mode: 'perHand' })).toEqual({ nextKg: 12, incrementKg: 3 });
  });

  it('en el tope del material no hay siguiente salto', () => {
    expect(nextLoadStep(9, DOS_DE_NUEVE, { mode: 'perHand' })).toBeNull();
    expect(heaviestLoad(DOS_DE_NUEVE, { mode: 'perHand' })).toBe(9);
  });
});

describe('cuándo toca subir peso', () => {
  const rango = { min: 10, max: 12 };
  const topeCompleto = sesion([serie(12, 9), serie(13, 9), serie(12, 9)]);
  const seQuedaCorta = sesion([serie(12, 9), serie(11, 9), serie(12, 9)]);

  it('una sesión toca techo solo si todas las series llegan al tope', () => {
    expect(toppedOut(topeCompleto, rango)).toBe(true);
    expect(toppedOut(seQuedaCorta, rango)).toBe(false);
  });

  it('una sesión sin series hechas no toca techo', () => {
    expect(toppedOut(sesion([]), rango)).toBe(false);
    expect(toppedOut(sesion([serie(12, 9, { skipped: true })]), rango)).toBe(false);
  });

  it('con una sola sesión al tope todavía no avisa', () => {
    const advice = evaluateLoadProgression({
      history: [topeCompleto, seQuedaCorta],
      repRange: rango,
      equipment: AMPLIADO,
      loadOptions: { mode: 'perHand', pairs: true },
    });
    expect(advice.status).toBe('hold');
    expect(advice.sessionsAtTop).toBe(1);
  });

  it('con dos seguidas avisa y dice cuánto subir según el material', () => {
    const advice = evaluateLoadProgression({
      history: [topeCompleto, topeCompleto, seQuedaCorta],
      repRange: rango,
      equipment: AMPLIADO,
      loadOptions: { mode: 'perHand', pairs: true },
    });
    expect(advice.status).toBe('raise-load');
    expect(advice.sessionsAtTop).toBe(2);
    expect(advice.nextKg).toBe(12);
    expect(advice.incrementKg).toBe(3);
  });

  it('la racha se corta con la primera sesión que no llega', () => {
    const advice = evaluateLoadProgression({
      history: [topeCompleto, seQuedaCorta, topeCompleto, topeCompleto],
      repRange: rango,
      equipment: AMPLIADO,
      loadOptions: { mode: 'perHand', pairs: true },
    });
    expect(advice.status).toBe('hold');
    expect(advice.sessionsAtTop).toBe(1);
  });

  it('sin historial suficiente no inventa un consejo', () => {
    const advice = evaluateLoadProgression({
      history: [topeCompleto],
      repRange: rango,
      equipment: AMPLIADO,
      loadOptions: { mode: 'perHand', pairs: true },
    });
    expect(advice.status).toBe('not-enough-data');
  });

  it('si ya estás en el tope del material lo dice, en vez de sugerir un peso que no tienes', () => {
    const advice = evaluateLoadProgression({
      history: [topeCompleto, topeCompleto],
      repRange: rango,
      equipment: DOS_DE_NUEVE,
      loadOptions: { mode: 'perHand', pairs: true },
    });
    expect(advice.status).toBe('at-equipment-limit');
    expect(advice.nextKg).toBeUndefined();
  });

  it('el peso de trabajo es el más repetido de la sesión', () => {
    expect(workingWeightOf(sesion([serie(10, 9), serie(10, 9), serie(8, 12)]))).toBe(9);
  });

  it('a igualdad de repeticiones se queda con el más pesado', () => {
    expect(workingWeightOf(sesion([serie(10, 9), serie(8, 12)]))).toBe(12);
  });

  it('sin pesos registrados no hay peso de trabajo', () => {
    expect(workingWeightOf(sesion([serie(20), serie(18)]))).toBeUndefined();
  });
});

describe('marcas personales', () => {
  it('recoge el peso más alto, el mejor volumen de serie y las reps a ese peso', () => {
    const logs = [sesion([serie(12, 9), serie(10, 12)]), sesion([serie(8, 12), serie(15, 9)])];
    const pr = personalRecords(logs);
    expect(pr.heaviestKg).toBe(12);
    expect(pr.mostRepsAtHeaviest).toBe(10);
    expect(pr.bestSetVolumeKg).toBe(135); // 9 kg × 15 reps
  });

  it('guarda el aguante más largo de los isométricos', () => {
    const logs = [
      sesion([serie(0, undefined, { seconds: 45 }), serie(0, undefined, { seconds: 60 })]),
    ];
    expect(personalRecords(logs).longestHoldSeconds).toBe(60);
  });

  it('sin series no inventa marcas', () => {
    expect(personalRecords([])).toEqual({});
    expect(personalRecords([sesion([])])).toEqual({});
  });

  it('el peso corporal no falsea el peso máximo', () => {
    const pr = personalRecords([sesion([serie(20), serie(18)])]);
    expect(pr.heaviestKg).toBeUndefined();
    expect(pr.bestSetVolumeKg).toBeUndefined();
  });
});

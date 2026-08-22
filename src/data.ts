/**
 * De dónde salen los datos de rutinas y ejercicios.
 *
 * Hoy hay una sola fuente, las Content Collections (build time). El día que
 * exista el panel de administración habrá una segunda fuente en runtime; por eso
 * todo lo que se exporta aquí es asíncrono y devuelve los mismos tipos.
 */
import { getCollection } from 'astro:content';

import type { Exercise, Mesocycle, Slug, Week, Day } from '@/core/model';
import type { ExerciseCatalog } from '@/core/training';
import { blockKeyOf } from '@/core/training';

let catalogCache: ExerciseCatalog | null = null;
let mesocyclesCache: Mesocycle[] | null = null;

export async function getExerciseCatalog(): Promise<ExerciseCatalog> {
  if (catalogCache) return catalogCache;
  const entries = await getCollection('exercises');
  const catalog = new Map<Slug, Exercise>(
    entries.map((entry) => [entry.id, { ...entry.data, id: entry.id }]),
  );
  catalogCache = catalog;
  return catalog;
}

export async function getMesocycles(): Promise<Mesocycle[]> {
  if (mesocyclesCache) return mesocyclesCache;
  const entries = await getCollection('mesocycles');
  mesocyclesCache = entries
    .map((entry) => ({ ...entry.data, id: entry.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return mesocyclesCache;
}

/** El mesociclo que sirven las rutas cortas. Falla si no hay ninguno activo. */
export async function getActiveMesocycle(): Promise<Mesocycle> {
  await assertRoutineIntegrity();
  const all = await getMesocycles();
  const active = all.find((meso) => meso.isActive) ?? all[0];
  if (!active) throw new Error('No hay ningún mesociclo en src/content/mesocycles.');
  return active;
}

export function findWeek(mesocycle: Mesocycle, order: number): Week | undefined {
  return mesocycle.weeks.find((week) => week.order === order);
}

export function findDay(week: Week, order: number): Day | undefined {
  return week.days.find((day) => day.order === order);
}

let integrityChecked = false;

/**
 * Rompe el build si la rutina referencia algo que no existe.
 *
 * Se hace aquí en vez de con `reference()` de Astro para poder señalar el bloque
 * exacto que falla y para cubrir también las sustituciones, las claves duplicadas
 * y las superseries de un solo ejercicio.
 */
export async function assertRoutineIntegrity(): Promise<void> {
  if (integrityChecked) return;
  const catalog = await getExerciseCatalog();
  const mesocycles = await getMesocycles();
  const problems: string[] = [];

  for (const [id, exercise] of catalog) {
    for (const substitution of exercise.substitutions) {
      if (!catalog.has(substitution)) {
        problems.push(`ejercicios/${id} › sustitución "${substitution}" no existe en el catálogo`);
      }
    }
  }

  for (const mesocycle of mesocycles) {
    mesocycle.weeks.forEach((week, weekIndex) => {
      if (week.order !== weekIndex + 1) {
        problems.push(`${mesocycle.id} › la semana ${week.order} rompe el orden consecutivo`);
      }
      week.days.forEach((day, dayIndex) => {
        const where = `${mesocycle.id} › semana ${week.order} › día ${day.order}`;
        if (day.order !== dayIndex + 1) {
          problems.push(`${where} › los días deben ir numerados sin huecos`);
        }
        const keys = new Set<string>();
        const supersets = new Map<string, number>();
        day.blocks.forEach((block, blockIndex) => {
          const position = `${where} › bloque ${blockIndex + 1}`;
          if (!catalog.has(block.exerciseId)) {
            problems.push(`${position} › el ejercicio "${block.exerciseId}" no existe en el catálogo`);
          }
          const key = blockKeyOf(block);
          if (keys.has(key)) {
            problems.push(`${position} › clave duplicada "${key}": añade "key" para distinguirlos`);
          }
          keys.add(key);
          if (block.supersetGroup !== undefined) {
            supersets.set(block.supersetGroup, (supersets.get(block.supersetGroup) ?? 0) + 1);
          }
        });
        for (const [group, count] of supersets) {
          if (count < 2) {
            problems.push(`${where} › la superserie "${group}" tiene un solo ejercicio`);
          }
        }
      });
    });
  }

  if (problems.length > 0) {
    throw new Error(
      `La rutina no es válida:\n${problems.map((problem) => `  · ${problem}`).join('\n')}`,
    );
  }
  integrityChecked = true;
}

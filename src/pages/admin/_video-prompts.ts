/**
 * TEMPORAL — los prompts para generar los vídeos de los ejercicios con una IA.
 *
 * Se borra junto con `videos.astro` en cuanto los vídeos estén dentro de la
 * app. Vive bajo `pages/admin/` con guion bajo delante para que Astro no lo
 * convierta en una ruta.
 *
 * **Los prompts van en inglés** porque es el idioma en el que mejor responden
 * los generadores de vídeo; la página explica en español qué es cada uno.
 *
 * Cada prompt se monta entero (personaje + escenario + movimiento + cámara +
 * lo que hay que evitar) para que se pueda copiar y pegar tal cual, sin
 * acordarse de añadir nada. Lo común está arriba en constantes: si un día
 * quieres otro personaje u otra habitación, se cambia en un sitio.
 */

/** El mismo hombre en todos los vídeos. Si la IA lo permite, mejor con imagen de referencia. */
export const CHARACTER =
  'a fit Mediterranean man in his mid-forties with a lean, defined, athletic build ' +
  '(visible muscle definition in arms, shoulders and chest, realistic, not a bodybuilder), ' +
  'short curly dark hair with a touch of grey and a short trimmed salt-and-pepper beard, ' +
  'wearing a fitted black sleeveless training shirt, dark grey shorts and black training shoes';

/**
 * Un cuarto de entreno en casa, de día. Se ve algo de material al fondo para
 * que se entienda dónde estamos, pero **desenfocado y poco**: con mucho, la IA
 * tiende a meterlo en el movimiento o roba la atención al ejercicio. La silla
 * se queda porque varios ejercicios se apoyan en ella.
 */
export const SETTING =
  'a bright home gym room in daylight with natural window light: light walls, wooden floor with a black exercise mat, ' +
  'a sturdy plain wooden chair nearby, and a few pieces of home training equipment in the softly blurred background ' +
  '(a small dumbbell rack, a kettlebell and a folded weight bench), not used in the exercise; tidy, uncluttered, realistic home';

const PAIR = 'black hexagonal 9 kg dumbbells';
const ONE = 'black hexagonal 9 kg dumbbell';

/**
 * Lo que la IA tiende a meter y estropea el vídeo. En los cuatro vídeos que ya
 * había salieron rótulos con letras deformadas y un contador que decía
 * «1 2 4»: la app ya enseña las indicaciones, el vídeo solo tiene que mostrar
 * el movimiento.
 */
export const AVOID =
  'No text, captions, subtitles, numbers, arrows, lines, graphics or overlays of any kind. ' +
  'No logos, no watermark, no mirror, no other people, no music. ' +
  'No camera movement, no zoom, no cuts, no slow motion. ' +
  'The dumbbells keep the same size the whole time; correct anatomy, five fingers on each hand.';

export const IMAGE_REFERENCE_PROMPT =
  `Photorealistic full-body photo of ${CHARACTER}, standing relaxed and facing the camera, ` +
  `holding a pair of ${PAIR} at his sides, in ${SETTING}. ` +
  'Eye-level camera, 16:9, natural skin texture, realistic lighting. No text, no logos.';

export type PromptStatus = 'new' | 'keep' | 'optional';

export interface VideoPrompt {
  /** El id del ejercicio, y el nombre del archivo: `public/ejercicios/<id>.mp4`. */
  readonly id: string;
  /** Solo para los nuevos; los que ya existen sacan el nombre del catálogo. */
  readonly name?: string;
  readonly status: PromptStatus;
  /** Por qué está, en una línea y en español. */
  readonly why: string;
  /** Ya hay un vídeo generado antes, con otro estilo. */
  readonly hasOldVideo?: boolean;
  /** Ángulo de cámara, elegido para que se vea lo que importa del movimiento. */
  readonly camera: string;
  /** Posición de inicio y repeticiones. */
  readonly action: string;
}

const SIDE = 'Static camera on a tripod at hip height, exact side view';
const SIDE_LOW = 'Static camera on a tripod close to the floor, exact side view';
const FRONT_34 = 'Static camera on a tripod at chest height, three-quarter front view';
const FRONT = 'Static camera on a tripod at chest height, straight front view';

/**
 * El prompt completo. Empieza y acaba en la misma postura porque la app
 * reproduce los vídeos en bucle: si no, cada vuelta da un salto.
 */
export function buildPrompt(p: VideoPrompt): string {
  return [
    `Photorealistic 8-second fitness demonstration video, 16:9. ${CHARACTER}, in ${SETTING}.`,
    p.action,
    'Real-time speed, smooth, controlled and technically perfect form. ' +
      'The clip starts and ends in exactly the same position so it loops seamlessly.',
    `${p.camera}, his whole body and the equipment fully in frame for the entire clip.`,
    AVOID,
  ].join(' ');
}

export const VIDEO_PROMPTS: readonly VideoPrompt[] = [
  /* ── Nuevos ─────────────────────────────────────────────────────────────── */
  {
    id: 'press-frances-suelo',
    name: 'Press francés en el suelo',
    status: 'new',
    why: 'Sustituye a los fondos entre bancos: tríceps con carga, sin forzar la parte delantera del hombro.',
    // Las IAs lo confunden con un press de pecho y bajan las mancuernas a la
    // frente o al pecho. Por eso se describe la postura de abajo con todo
    // detalle, se deja sitio libre detrás de la cabeza y se dice qué NO es.
    camera:
      'Static camera on a tripod at floor level, exact side view, his head on the left of the frame ' +
      'with clear empty floor behind his head so the path of the dumbbells is fully visible',
    action:
      `He lies on his back on the mat, knees bent and feet flat, holding two ${PAIR} with a neutral grip, palms facing each other. ` +
      'Start position: arms straight, angled slightly back from vertical so the dumbbells are above his forehead, not above his chest. ' +
      'His upper arms stay completely fixed and only his forearms move, hinging at the elbows like a lever. ' +
      'Over 3 seconds he lowers the dumbbells in an arc BEHIND HIS HEAD, past the top of his head, until his forearms point toward the floor behind him ' +
      'and the dumbbells are just above the mat behind the crown of his head; his elbows point up toward the ceiling and stay shoulder-width apart, never flaring out. ' +
      'Then, in 1 second, he straightens his elbows and brings the dumbbells back over his forehead to the start position. ' +
      'The dumbbells never come down to his face, forehead or chest: this is a triceps extension, not a chest press. Two repetitions.',
  },
  {
    id: 'remo-inclinado-mancuernas',
    name: 'Remo inclinado con dos mancuernas',
    status: 'new',
    why: 'Sustituye al renegade row, que con 9 kg trabaja más el abdomen que la espalda.',
    camera: SIDE,
    action:
      `He stands holding two ${PAIR}, hinges forward at the hips to about 45 degrees with a flat back and soft knees, arms hanging straight, palms facing each other. ` +
      'He rows both dumbbells up to his lower ribs, elbows close to his body, squeezes his shoulder blades together for 1 second, ' +
      'then lowers them slowly for 3 seconds to a full stretch. His torso stays completely still. Two repetitions.',
  },
  {
    id: 'curl-concentrado',
    name: 'Curl concentrado',
    status: 'new',
    why: 'Más bíceps, que era de lo más corto de la rutina. Con el codo apoyado no hay forma de hacer trampa.',
    camera: FRONT_34,
    action:
      `He sits on the edge of the wooden chair, feet wide, leaning slightly forward, holding one ${ONE} in his right hand ` +
      'with the back of his upper arm braced against the inside of his right thigh, arm fully extended. ' +
      'He curls the dumbbell up toward his shoulder, palm facing up, squeezes the biceps for 1 second at the top, then lowers it slowly for 3 seconds to full extension. ' +
      'The elbow never leaves the thigh. Two repetitions.',
  },
  {
    id: 'curl-inverso',
    name: 'Curl inverso',
    status: 'new',
    why: 'Antebrazo (braquial y braquiorradial), que solo tocaba el curl martillo. Es el que marca la parte de arriba del antebrazo.',
    // La IA lo convertía en un curl normal. Se describe dónde miran las manos
    // en tres momentos —abajo, a mitad y arriba— y la cámara va de lado: de
    // frente, la postura de arriba del inverso (palmas a cámara) se confunde
    // con la de un curl normal visto desde otro ángulo.
    camera:
      'Static camera on a tripod at chest height, three-quarter side view from about 45 degrees to his right, ' +
      'close enough that his hands, wrists and the grip on the dumbbells are clearly visible',
    action:
      `Reverse dumbbell curl with a pronated grip. He stands tall, feet shoulder-width apart, holding two ${PAIR} ` +
      'with an overhand grip, palms facing down, elbows close to his torso and upper arms stationary for the whole clip. ' +
      'Bottom: arms fully straight, dumbbells in front of his thighs, palms facing his thighs and knuckles facing forward. ' +
      'He bends his elbows and raises both dumbbells, keeping the same grip and his wrists straight. ' +
      'Halfway, with his forearms parallel to the floor, the backs of his hands and his knuckles face the ceiling and his palms face the floor. ' +
      'Top: forearms vertical or slightly beyond, knuckles pointing up and palms facing forward, away from him. ' +
      'Then he lowers the dumbbells slowly for 3 seconds back to full arm extension. ' +
      'His hands never rotate at any point: the palms never turn up toward the ceiling and never face each other, ' +
      'so this is not a regular biceps curl and not a hammer curl. No swinging of the torso. Two repetitions.',
  },

  /* ── Se quedan ──────────────────────────────────────────────────────────── */
  {
    id: 'flexiones',
    status: 'keep',
    hasOldVideo: true,
    why: 'Pectoral, hombro y tríceps con tu propio peso: más carga que una mancuerna de 9 kg.',
    camera: SIDE_LOW,
    action:
      'He holds a high plank on the black mat, hands slightly wider than his shoulders, body in one straight line from head to heels, glutes and abs tight. ' +
      'He lowers his chest slowly for 3 seconds until it is just above the floor, elbows at about 45 degrees from his torso, ' +
      'then pushes back up in 1 second to straight arms without bouncing. Two repetitions.',
  },
  {
    id: 'flexiones-declinadas',
    status: 'keep',
    why: 'Pectoral superior y hombro. La progresión natural de las flexiones.',
    camera: SIDE_LOW,
    action:
      'He is in a push-up position with his feet resting on the seat of the wooden chair behind him and his hands on the mat slightly wider than his shoulders, body in a straight line. ' +
      'He lowers his chest slowly for 3 seconds toward the floor, elbows at about 45 degrees, then pushes back up in 1 second without sagging his hips. Two repetitions.',
  },
  {
    id: 'floor-press',
    status: 'keep',
    why: 'Pectoral y tríceps con mancuernas; el suelo frena el codo y protege el hombro.',
    camera: SIDE_LOW,
    action:
      `He lies on his back on the mat, knees bent and feet flat, pressing two ${PAIR} straight up above his chest. ` +
      'He lowers them slowly for 3 seconds until his upper arms rest softly on the floor, elbows at about 45 degrees from his body, ' +
      'pauses briefly, then presses back up in 1 second. The dumbbells do not touch at the top. Two repetitions.',
  },
  {
    id: 'remo-mancuerna-una-mano',
    status: 'keep',
    hasOldVideo: true,
    why: 'El básico de espalda. Se graba apoyado en la silla, que es lo que tienes en casa.',
    camera: SIDE,
    action:
      `He braces his left hand on the seat of the wooden chair, left foot forward and right foot back, back flat and almost parallel to the floor, holding one ${ONE} in his right hand with the arm hanging straight. ` +
      'He pulls the dumbbell toward his hip, driving the elbow back close to his body, squeezes for 1 second, then lowers it slowly for 3 seconds to a full stretch. ' +
      'His torso does not rotate. Two repetitions.',
  },
  {
    id: 'press-militar-mancuernas',
    status: 'keep',
    why: 'Hombro completo y fuerza de empuje por encima de la cabeza.',
    camera: FRONT_34,
    action:
      `He stands tall, feet hip-width apart, ribs down and glutes tight, holding two ${PAIR} at shoulder height, palms facing forward. ` +
      'He presses them overhead in line with his ears until his arms are straight, without arching his lower back or shrugging, ' +
      'then lowers them slowly for 3 seconds back to chin level. Two repetitions.',
  },
  {
    id: 'elevaciones-laterales',
    status: 'keep',
    why: 'El deltoides lateral es el que da anchura de hombro. Con 9 kg ya es un peso exigente.',
    camera: FRONT,
    action:
      `He stands tall holding two ${PAIR} at his sides, elbows slightly bent and fixed. ` +
      'He raises both arms out to the sides up to exactly shoulder height, without shrugging his shoulders, ' +
      'then lowers them slowly for 3 seconds. No swinging. Two repetitions.',
  },
  {
    id: 'pajaros-vuelos-posteriores',
    status: 'keep',
    why: 'Hombro posterior y espalda alta: equilibra tanto empuje y ayuda a la postura.',
    camera: FRONT_34,
    action:
      `He stands holding two ${PAIR}, hinged forward at the hips almost parallel to the floor with a flat back and soft knees, dumbbells hanging under his chest, palms facing each other. ` +
      'With elbows slightly bent, he opens both arms out to the sides in a wide arc up to shoulder line, pauses for 1 second, ' +
      'then lowers them slowly for 3 seconds. His torso stays still. Two repetitions.',
  },
  {
    id: 'curl-biceps-supino',
    status: 'keep',
    hasOldVideo: true,
    why: 'El curl de bíceps de referencia.',
    camera: FRONT_34,
    action:
      `He stands tall holding two ${PAIR} at his sides, palms facing his thighs, elbows pinned to his sides. ` +
      'He curls both dumbbells up, rotating his wrists outward so the palms face his shoulders at the top, squeezes for 1 second, ' +
      'then lowers them slowly for 3 seconds to full extension. No swinging of the torso. Two repetitions.',
  },
  {
    id: 'curl-martillo',
    status: 'keep',
    why: 'Bíceps y antebrazo a la vez: el que más grosor da al brazo.',
    camera: FRONT_34,
    action:
      `He stands tall holding two ${PAIR} at his sides with palms facing each other, elbows pinned to his sides. ` +
      'Keeping the palms facing each other the whole time, like holding hammers, he curls both dumbbells up to shoulder height, ' +
      'then lowers them slowly for 3 seconds. No swinging. Two repetitions.',
  },
  {
    id: 'extension-triceps-tras-nuca',
    status: 'keep',
    why: 'La cabeza larga del tríceps, la que más volumen da al brazo, solo se estira con el brazo por encima de la cabeza.',
    camera: SIDE,
    action:
      `He sits upright on the wooden chair, holding one ${ONE} vertically with both hands by its top end, arms straight overhead. ` +
      'Keeping his elbows pointing at the ceiling and close to his head, he lowers the dumbbell behind his head slowly for 3 seconds to a deep stretch, ' +
      'then extends his arms back to straight in 1 second. His ribs stay down and his back does not arch. Two repetitions.',
  },
  {
    id: 'peso-muerto-rumano',
    status: 'keep',
    hasOldVideo: true,
    why: 'Isquios y glúteo, y de paso espalda baja y agarre. La pierna que más rinde para tu objetivo.',
    camera: SIDE,
    action:
      `He stands tall holding two ${PAIR} in front of his thighs. With soft knees and a flat back, he pushes his hips back ` +
      'and slowly lowers the dumbbells for 3 seconds, sliding them close along his legs to just below the knees, ' +
      'then drives his hips forward to stand tall again in 1 second. His back never rounds. Two repetitions.',
  },
  {
    id: 'sentadilla-bulgara',
    status: 'keep',
    why: 'Pierna entera con poco peso: al ser a una pierna, 9 kg siguen sirviendo.',
    camera: SIDE,
    action:
      `He stands in a long split stance with the top of his rear foot resting on the seat of the wooden chair behind him, holding two ${PAIR} at his sides. ` +
      'He lowers straight down slowly for 3 seconds until his front thigh is parallel to the floor, his weight on the front heel, ' +
      'then drives back up in 1 second. Two repetitions with the same leg.',
  },
  {
    id: 'sentadilla-goblet',
    status: 'keep',
    why: 'La sentadilla básica. Se queda, con una serie menos.',
    camera: FRONT_34,
    action:
      `He stands with feet slightly wider than his shoulders, holding one ${ONE} vertically against his chest by its top end, elbows down. ` +
      'He squats down slowly for 2 seconds, knees tracking over his toes and elbows inside his knees, pauses for 1 second at the bottom with heels flat, ' +
      'then stands back up in 1 second. Two repetitions.',
  },

  /* ── Depende del material ───────────────────────────────────────────────── */
  {
    id: 'dominadas',
    name: 'Dominadas (barra de puerta)',
    status: 'optional',
    why: 'Solo si compras una barra de puerta. Es el mejor ejercicio de espalda y bíceps que se puede hacer en casa.',
    camera: FRONT_34,
    action:
      'He hangs from a doorway pull-up bar mounted in the frame of an interior door, hands slightly wider than his shoulders, palms facing away, arms fully straight. ' +
      'He pulls himself up until his chin clears the bar, driving his elbows down toward his ribs, without swinging or kicking, ' +
      'then lowers himself slowly for 3 seconds to a full hang. Two repetitions.',
  },
];

/** Los que se van de la rutina. Sin prompt: no hace falta generar nada. */
export const DROPPED: readonly { readonly id: string; readonly why: string }[] = [
  {
    id: 'zancadas-mancuernas',
    why: 'Pierna repetida: la búlgara ya hace ese trabajo. Su hueco pasa a antebrazo.',
  },
  {
    id: 'fondos-entre-bancos',
    why: 'Cargan mucho la parte delantera del hombro, y pasados los 40 no compensa. Lo sustituye el press francés.',
  },
  {
    id: 'renegade-row',
    why: 'Con 9 kg es más ejercicio de abdomen que de espalda, y castiga la muñeca. Lo sustituye el remo inclinado.',
  },
];

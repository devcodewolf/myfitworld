/**
 * TEMPORAL — los prompts para generar los vídeos de los ejercicios con una IA.
 *
 * Se borra junto con `videos.astro` en cuanto los vídeos estén dentro de la
 * app. Vive bajo `pages/admin/` con guion bajo delante para que Astro no lo
 * convierta en una ruta.
 *
 * **Solo están los que faltan.** Cada vídeo que sale bien se engancha en su
 * ficha de `src/content/exercises/` y su prompt se quita de aquí.
 *
 * **Los prompts van en inglés** porque es el idioma en el que mejor responden
 * los generadores de vídeo; la página explica en español qué es cada uno.
 *
 * Cada prompt se monta entero (personaje + escenario + movimiento + cámara +
 * lo que hay que evitar) para que se pueda copiar y pegar tal cual.
 *
 * ── LO QUE HA FUNCIONADO, Y POR ESO TODOS SIGUEN EL MISMO PATRÓN ──────────
 * Nombrar el ejercicio por su nombre técnico en inglés; describir la postura
 * en tres momentos (abajo, a mitad, arriba) diciendo dónde miran las palmas o
 * los nudillos, que es algo que la IA sabe colocar; y decir explícitamente con
 * qué NO hay que confundirlo. Sin eso, la IA tira hacia la versión más común
 * del movimiento: el curl inverso le salía como un curl normal y el press
 * francés como un press de pecho.
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
 * Lo que la IA tiende a meter y estropea el vídeo. En los primeros vídeos
 * salieron rótulos con letras deformadas y un contador que decía «1 2 4»: la
 * app ya enseña las indicaciones, el vídeo solo tiene que mostrar el movimiento.
 */
export const AVOID =
  'No text, captions, subtitles, numbers, arrows, lines, graphics or overlays of any kind. ' +
  'No logos, no watermark, no mirror, no other people, no music. ' +
  'No camera, tripod, phone or filming equipment visible anywhere in the scene. ' +
  'No camera movement, no zoom, no cuts, no slow motion. ' +
  'The dumbbells keep the same size the whole time; correct anatomy, five fingers on each hand.';

export const IMAGE_REFERENCE_PROMPT =
  `Photorealistic full-body photo of ${CHARACTER}, standing relaxed and facing the camera, ` +
  `holding a pair of ${PAIR} at his sides, in ${SETTING}. ` +
  'Eye-level camera, 16:9, natural skin texture, realistic lighting. No text, no logos.';

/**
 * `new`: ejercicio nuevo en la rutina. `pending`: de los que ya había, sin
 * vídeo nuevo todavía. `redo`: ya hay vídeo, pero sale mal y conviene
 * rehacerlo. `optional`: solo si se compra el material que pide.
 */
export type PromptStatus = 'new' | 'pending' | 'redo' | 'optional';

export interface VideoPrompt {
  /** El id del ejercicio, y el nombre del archivo: `public/ejercicios/<id>.mp4`. */
  readonly id: string;
  /** Solo para los que aún no están en el catálogo. */
  readonly name?: string;
  readonly status: PromptStatus;
  /** Por qué está, en una línea y en español. */
  readonly why: string;
  /** Qué falla en el vídeo que ya hay. Solo en los `redo`. */
  readonly note?: string;
  /** Ángulo de cámara, elegido para que se vea lo que importa del movimiento. */
  readonly camera: string;
  /** El movimiento: postura de partida, recorrido y con qué no confundirlo. */
  readonly action: string;
  /**
   * Una foto de la postura de partida, para generar el vídeo desde ella
   * («imagen a vídeo»). Solo en los que han fallado varias veces con texto: si
   * la postura ya está en la imagen, la IA solo tiene que animarla.
   */
  readonly startFrame?: string;
}

/**
 * El encuadre. **No se nombra el trípode**: con «static camera on a tripod»,
 * en las flexiones declinadas la IA dibujó un trípode con una cámara dentro
 * del plano. Se pide un plano fijo y se prohíbe que se vea material de rodaje.
 */
const camera = (where: string, view: string, extra = '') =>
  `Fixed locked-off shot ${where}, ${view}` + (extra ? `, ${extra}` : '');

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
  /* ── Rehacer: salen mal y NO están enganchados ──────────────────────────── */
  {
    id: 'sentadilla-bulgara',
    status: 'redo',
    why: 'Pierna entera con poco peso: al ser a una pierna, 9 kg siguen sirviendo.',
    note:
      'Sin enganchar, y ha fallado dos veces: la IA la convierte en una zancada en el suelo y el pie de atrás ' +
      'no llega a subir a la silla. Con texto no hay manera, así que mejor «imagen a vídeo»: genera primero la ' +
      'foto de abajo, que ya tiene el pie en la silla, y anímala con el prompt de vídeo.',
    startFrame:
      `Photorealistic photo, 16:9. ${CHARACTER}, in ${SETTING}. Fixed shot at hip height, exact side view, ` +
      'the whole wooden chair visible behind him. He is in the starting position of a Bulgarian split squat: ' +
      'the top of his left foot, laces down, rests on the SEAT of the wooden chair behind him, with his left knee bent; ' +
      'his right foot is planted flat on the floor a long step in front of the chair, right leg almost straight; ' +
      `he stands tall holding two ${PAIR} at his sides. ` +
      'No text, no logos, no camera or tripod visible.',
    camera: camera('at hip height', 'exact side view', 'with the chair fully visible behind him'),
    action:
      `Bulgarian split squat with the rear foot elevated on a chair. He holds two ${PAIR} at his sides. ` +
      'The top of his rear foot (laces down) rests on the SEAT of the wooden chair behind him, and it STAYS ON THE CHAIR FOR THE ENTIRE CLIP, ' +
      'during every repetition and between them: it never touches the floor. His front foot is planted flat a long step ahead and never moves. ' +
      'Top: standing tall in that split stance, front leg almost straight, rear foot on the chair. ' +
      'Over 3 seconds he lowers straight down until his back knee almost touches the floor and his front thigh is parallel to the floor, ' +
      'front shin roughly vertical, weight on the front heel, torso upright with a slight forward lean. ' +
      'Then he drives back up in 1 second, still with the rear foot on the chair. ' +
      'This is not a lunge on the floor and he never steps: the rear foot is on the chair seat from the first frame to the last. ' +
      'Two repetitions with the same leg.',
  },

  /* ── Rehacer si quieres: enganchados, con un defecto ────────────────────── */
  {
    id: 'curl-concentrado',
    status: 'redo',
    why: 'Más bíceps. Con el codo apoyado no hay forma de hacer trampa.',
    note:
      'Enganchado, pero el codo no se apoya en el muslo: sale como un curl sentado normal. Vale, aunque pierde ' +
      'lo que tiene de especial. El prompt ahora dice exactamente dónde va el codo.',
    camera: camera(
      'at seated height',
      'three-quarter front view from his right side',
      'so his right elbow resting on the inside of his thigh is clearly visible',
    ),
    action:
      'Seated dumbbell concentration curl, one arm. He sits on the front edge of the wooden chair with his feet planted wide apart ' +
      'and leans his torso well forward over his right leg. ' +
      'His right ELBOW rests on the inside of his right thigh, just above the knee, with the back of his upper arm pressed against the thigh; ' +
      'it stays touching the thigh for the entire clip. His left hand rests on his left knee. ' +
      `Bottom: right arm straight, hanging down toward the floor between his legs, holding one ${ONE}, palm facing his left leg. ` +
      'He curls the dumbbell up toward his right shoulder, palm turning to face his shoulder at the top, squeezes 1 second, ' +
      'then lowers it slowly for 3 seconds to a straight arm. ' +
      'His arm is never free in the air and he does not sit upright: this is not an ordinary seated curl. Two repetitions with the right arm.',
  },
  {
    id: 'flexiones-declinadas',
    status: 'redo',
    why: 'Pectoral superior y hombro. La progresión natural de las flexiones.',
    note:
      'Enganchado y con buena técnica, pero se ve un trípode con una cámara a la izquierda: la IA se tomó al pie de la letra ' +
      '«cámara en un trípode». Ya está quitado de todos los prompts.',
    camera: camera(
      'close to the floor',
      'exact side view',
      'with the chair fully visible on one side of the frame',
    ),
    action:
      'Decline push-up with the feet raised on a chair. The tops of both of his feet rest on the SEAT of the wooden chair behind him; ' +
      'his hands are flat on the mat in front, slightly wider than and directly under his shoulders. ' +
      'His body is one straight, rigid line sloping downward from his heels on the chair to his head, so his head is lower than his feet. ' +
      'Top: arms straight. Over 3 seconds he bends his elbows, about 45 degrees from his torso, and lowers his chest until it is just above the mat between his hands. ' +
      'Then he pushes back up in 1 second to straight arms. ' +
      'His hips neither sag nor pike up, and his feet stay on the chair the whole time: ' +
      'this is not a regular push-up with the feet on the floor and not a pike push-up. Two repetitions.',
  },

  /* ── Depende del material ───────────────────────────────────────────────── */
  {
    id: 'dominadas',
    name: 'Dominadas (barra de puerta)',
    status: 'optional',
    why: 'Solo si compras una barra de puerta. Es el mejor ejercicio de espalda y bíceps que se puede hacer en casa.',
    camera: camera(
      'at chest height',
      'three-quarter front view',
      'with the whole door frame visible',
    ),
    action:
      'Strict pull-up on a doorway pull-up bar mounted in the frame of an interior door. ' +
      'Bottom: he hangs with arms fully straight, hands slightly wider than his shoulders, palms facing away from him, legs together and still. ' +
      'He pulls himself up, driving his elbows down toward his ribs, until his chin is above the bar, ' +
      'then lowers himself slowly for 3 seconds back to a full hang. ' +
      'No swinging, no kicking: this is not a kipping pull-up. Two repetitions.',
  },
];

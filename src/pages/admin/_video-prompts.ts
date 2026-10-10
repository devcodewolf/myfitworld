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
}

const camera = (where: string, view: string, extra = '') =>
  `Static camera on a tripod ${where}, ${view}` + (extra ? `, ${extra}` : '');

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
    id: 'curl-concentrado',
    name: 'Curl concentrado',
    status: 'new',
    why: 'Más bíceps, que era de lo más corto de la rutina. Con el codo apoyado no hay forma de hacer trampa.',
    camera: camera(
      'at seated height',
      'three-quarter front view from his right side',
      'so his right arm braced against his thigh is clearly visible',
    ),
    action:
      `Seated dumbbell concentration curl, one arm. He sits on the front edge of the wooden chair with his feet planted wide apart, ` +
      'leaning his torso forward from the hips. The back of his right upper arm rests firmly against the inside of his right thigh, just above the knee, ' +
      `and his left hand rests on his left thigh. He holds one ${ONE} in his right hand. ` +
      'Bottom: right arm fully straight, hanging down toward the floor between his legs, palm facing his left leg. ' +
      'He bends the elbow and curls the dumbbell up: halfway, his forearm is horizontal and his palm faces the ceiling; ' +
      'at the top, the dumbbell is in front of his right shoulder and his palm faces his shoulder. He squeezes for 1 second, ' +
      'then lowers it slowly for 3 seconds back to a straight arm. ' +
      'His upper arm stays glued to his thigh the whole time and his shoulder does not lift. ' +
      'He stays seated: this is not a standing curl and not a two-arm curl. Two repetitions with the right arm.',
  },
  {
    id: 'curl-inverso',
    name: 'Curl inverso',
    status: 'new',
    why: 'Antebrazo (braquial y braquiorradial), que solo tocaba el curl martillo. Es el que marca la parte de arriba del antebrazo.',
    // De frente, la postura de arriba del inverso (palmas a cámara) se
    // confunde con la de un curl normal visto desde otro ángulo.
    camera: camera(
      'at chest height',
      'three-quarter side view from about 45 degrees to his right',
      'close enough that his hands, wrists and the grip on the dumbbells are clearly visible',
    ),
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

  /* ── Rehacer ────────────────────────────────────────────────────────────── */
  {
    id: 'remo-mancuerna-una-mano',
    status: 'redo',
    why: 'El básico de espalda.',
    note:
      'El vídeo nuevo ya está enganchado, pero sale casi de pie, con la mano en el respaldo: así tira más ' +
      'el trapecio que la espalda. Este prompt insiste en el asiento y en el tronco horizontal.',
    camera: camera(
      'at hip height',
      'exact side view from his right side',
      'the whole chair visible, so it is obvious his hand is on the seat',
    ),
    action:
      'One-arm dumbbell row with a hand braced on a chair. ' +
      'His left hand is flat on the SEAT of the wooden chair, not on the backrest; because the seat is low, his torso is bent forward almost parallel to the floor, ' +
      'with a flat back, his left foot forward and his right leg stepped back. ' +
      `Bottom: his right arm hangs straight down toward the floor holding one ${ONE}, palm facing his body. ` +
      'He pulls the dumbbell up toward his right hip, driving the elbow up past his back toward the ceiling, close to his body; ' +
      'at the top the dumbbell is beside his lower ribs. He squeezes for 1 second, then lowers it slowly for 3 seconds to a full stretch. ' +
      'His torso stays horizontal and does not rotate or rise. ' +
      'He is not standing upright, his hand is not on the backrest, and this is not an upright row. Two repetitions with the right arm.',
  },
  {
    id: 'peso-muerto-rumano',
    status: 'redo',
    why: 'Isquios y glúteo, y de paso espalda baja y agarre. La pierna que más rinde para tu objetivo.',
    note: 'El vídeo que hay es de los primeros: otro hombre, otro escenario y rótulos encima. Por eso no está enganchado.',
    camera: camera('at hip height', 'exact side view'),
    action:
      `Romanian deadlift with dumbbells. He stands tall holding two ${PAIR} in front of his thighs, palms facing his thighs. ` +
      'He pushes his hips straight back as if closing a car door with his backside, keeping his back completely flat and his knees only slightly bent; ' +
      'his torso tilts forward and the dumbbells slide down close along the front of his legs. ' +
      'Bottom, after 3 seconds: hips far back, torso tilted well forward with a flat back, head in line with his spine, ' +
      'dumbbells just below his knees, shins still almost vertical. ' +
      'Then he drives his hips forward and stands tall again in 1 second, squeezing his glutes at the top. ' +
      'His hips never drop down and his knees barely bend: this is not a squat. His back never rounds. Two repetitions.',
  },

  /* ── Faltan ─────────────────────────────────────────────────────────────── */
  {
    id: 'flexiones-declinadas',
    status: 'pending',
    why: 'Pectoral superior y hombro. La progresión natural de las flexiones.',
    camera: camera(
      'close to the floor',
      'exact side view',
      'with the chair fully visible on one side of the frame',
    ),
    action:
      'Decline push-up with the feet raised on a chair. The tops of both of his feet rest on the SEAT of the wooden chair behind him; ' +
      'his hands are flat on the mat in front, slightly wider than his shoulders, directly under his shoulders. ' +
      'His body is one straight, rigid line sloping downward from his heels on the chair to his head, so his head is lower than his feet. ' +
      'Top: arms straight. Over 3 seconds he bends his elbows, about 45 degrees from his torso, and lowers his chest until it is just above the mat between his hands. ' +
      'Then he pushes back up in 1 second to straight arms. ' +
      'His hips neither sag nor pike up, and his feet stay on the chair the whole time: ' +
      'this is not a regular push-up with the feet on the floor and not a pike push-up. Two repetitions.',
  },
  {
    id: 'pajaros-vuelos-posteriores',
    status: 'pending',
    why: 'Hombro posterior y espalda alta: equilibra tanto empuje y ayuda a la postura.',
    camera: camera(
      'at hip height',
      'straight front view',
      'so his arms open toward the sides of the frame like wings',
    ),
    action:
      `Bent-over dumbbell reverse fly for the rear delts. He stands holding two ${PAIR}, hinged forward at the hips until his torso is almost parallel to the floor, ` +
      'with a flat back and soft knees. ' +
      'Bottom: arms hanging straight down under his chest, palms facing each other, elbows slightly bent. ' +
      'Keeping that slight elbow bend fixed, he opens both arms out to the sides in a wide arc until they are level with his shoulders, ' +
      'forming a T with his torso; he holds 1 second, then lowers them slowly for 3 seconds. ' +
      'His torso stays parallel to the floor and still the whole time. ' +
      'He does not stand up as he lifts, and he does not pull the elbows back toward his hips: this is not a row. Two repetitions.',
  },
  {
    id: 'curl-martillo',
    status: 'pending',
    why: 'Bíceps y antebrazo a la vez: el que más grosor da al brazo.',
    camera: camera('at chest height', 'three-quarter front view'),
    action:
      `Standing dumbbell hammer curl. He stands tall holding two ${PAIR} at his sides with a neutral grip: palms facing his thighs and thumbs pointing forward, ` +
      'elbows pinned to his sides. ' +
      'He curls both dumbbells up together. Halfway, his forearms are horizontal and his thumbs point up at the ceiling. ' +
      'Top: dumbbells in front of his shoulders, palms still facing each other, thumbs up, like holding two hammers upright. ' +
      'Then he lowers them slowly for 3 seconds. ' +
      'His wrists never rotate: the palms never turn up toward the ceiling, so this is not a regular biceps curl. ' +
      'His elbows stay at his sides and his torso does not swing. Two repetitions.',
  },
  {
    id: 'extension-triceps-tras-nuca',
    status: 'pending',
    why: 'La cabeza larga del tríceps, la que más volumen da al brazo, solo se estira con el brazo por encima de la cabeza.',
    camera: camera(
      'at shoulder height',
      'exact side view',
      'with clear space above and behind his head so the path of the dumbbell is fully visible',
    ),
    action:
      'Seated overhead dumbbell triceps extension with both hands. He sits upright on the wooden chair, feet flat. ' +
      `He holds one ${ONE} vertically with both hands cupping the top end of it, the dumbbell hanging down from his hands. ` +
      'Top: arms fully straight overhead, the dumbbell above his head. ' +
      'His upper arms stay vertical beside his head, elbows pointing at the ceiling and close to his ears; only his forearms move. ' +
      'Over 3 seconds he bends his elbows and lowers the dumbbell BEHIND HIS HEAD until it is behind his neck and his forearms are past horizontal. ' +
      'Then he straightens his arms back overhead in 1 second. ' +
      'His elbows never drop forward and never flare out, and the dumbbell never comes down in front of his face: this is not a shoulder press. ' +
      'Ribs down, no arching of the lower back. Two repetitions.',
  },
  {
    id: 'sentadilla-bulgara',
    status: 'pending',
    why: 'Pierna entera con poco peso: al ser a una pierna, 9 kg siguen sirviendo.',
    camera: camera('at hip height', 'exact side view', 'with the chair fully visible behind him'),
    action:
      `Bulgarian split squat with the rear foot on a chair. He holds two ${PAIR} at his sides. ` +
      'The top of his rear foot (laces down) rests on the SEAT of the wooden chair behind him; his front foot is planted flat on the floor a long step ahead. ' +
      'Top: standing tall in that split stance, front leg almost straight. ' +
      'Over 3 seconds he lowers straight down: his back knee drops toward the floor until it almost touches it, his front thigh becomes parallel to the floor, ' +
      'his front shin stays roughly vertical and his weight stays on his front heel; his torso stays upright with a slight forward lean. ' +
      'Then he drives back up in 1 second through the front heel. ' +
      'His front foot never moves and his rear foot never leaves the chair: this is not a walking lunge and he does not step. ' +
      'Two repetitions with the same leg.',
  },
  {
    id: 'sentadilla-goblet',
    status: 'pending',
    why: 'La sentadilla básica. Se queda, con una serie menos.',
    camera: camera('at hip height', 'three-quarter front view'),
    action:
      `Goblet squat with one dumbbell. He stands with his feet slightly wider than his shoulders, toes turned slightly out, ` +
      `holding one ${ONE} vertically against his chest with both hands cupping its top end, like holding a goblet, elbows pointing down. ` +
      'Over 2 seconds he squats down, sitting his hips down between his heels, knees pushing out over his toes, ' +
      'until his hips are below his knees; his torso stays upright, the dumbbell stays touching his chest and his elbows end up inside his knees. ' +
      'He pauses 1 second at the bottom with his heels flat on the floor, then stands back up in 1 second. ' +
      'The dumbbell never moves away from his chest and his heels never lift. Two repetitions.',
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

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7.2.4 con `output: 'static'` (ya instalado en el proyecto). TypeScript en modo `strict`, sin `any`.
Tailwind CSS v4 en configuración CSS-first (`@import "tailwindcss"` + `@theme`, plugin oficial de Vite,
sin `tailwind.config.js`). Vanilla JS por defecto para la interactividad; Vue 3 solo como isla de Astro
donde el estado reactivo lo justifique. Zod 4 como fuente de verdad de esquemas compartida entre
contenido, persistencia y futuro servidor. `vitest` para el dominio puro. Gestor de paquetes: pnpm.
Cero librerías de UI, de gráficas, de fechas o de audio.

## Users

Usuario único: Raúl, que entrena en casa siguiendo su propio mesociclo. Durante el entreno la app se
usa **principalmente desde escritorio**, con una pantalla grande apoyada cerca y leída a 2-3 metros,
con las manos ocupadas y a menudo de noche. El móvil es el caso secundario y debe ser igual de cómodo.

Confirmado como hueco de diseño, no como funcionalidad a construir ahora: en el futuro puede haber un
segundo perfil cercano (pareja o amigo) con historial separado. El modelo de datos reserva sitio para
varios perfiles desde el principio; la UI de gestión de perfiles no se construye todavía.

## Product Purpose

Ejecutar un mesociclo de entrenamiento en casa sin tener que pensar en la logística: qué toca hoy, qué
serie va, cuánto descanso queda y con cuánto peso se hizo la última vez. Éxito es completar la sesión
sin sacar el móvil para cronometrar, sin apuntar nada en papel y sin perder datos, y llegar al final
del mesociclo con un historial fiable del que sale la progresión del siguiente.

## Positioning

No es un catálogo de ejercicios ni un tracker genérico de gimnasio. Es la ejecución guiada de *este*
mesociclo concreto, diseñada alrededor de dos hechos que las apps generalistas ignoran: el material es
limitado y ampliable (la progresión se apoya en reps, tempo, variantes y densidad antes que en la
carga), y el usuario está de pie, sudando, a dos metros de la pantalla, con una sola cosa que decidir
en cada momento.

## Operating Context

- Mesociclo de 4 semanas, 3 días por semana, full body, sesiones de aproximadamente una hora.
- Material actual: mancuernas de 9 kg y peso corporal. Es **ampliable**: pueden aparecer mancuernas más
  pesadas o discos, y la app debe sugerir el siguiente salto según el material declarado.
- Escenario real de uso: casa, de pie, manos ocupadas o sudadas, a menudo de noche, pantalla a 2-3 m.
- Rutina de referencia real del usuario: día 1 torso/empuje, día 2 pierna/tracción, día 3 hipertrofia
  global (con superserie). Las semanas 2 a 4 derivan de ella con acumulación, progresión,
  intensificación y descarga.
- Los datos de rutinas y ejercicios viven en archivos de contenido tipados, editables sin tocar código.

## Capabilities and Constraints

Confirmado:

- Rutas: mesociclo, semana, día, modo entreno, catálogo de ejercicios, ficha de ejercicio, historial y
  configuración. Textos de UI en español; identificadores y código en inglés.
- Modo entreno como pantalla protagonista: un ejercicio a la vez, media visible, checklist de series
  con peso y reps reales prellenados con la última sesión, y progreso de sesión persistido frente a
  recargas.
- Temporizadores como elemento central: cronómetro de serie (hacia arriba, o hacia abajo en
  isométricos y series a tiempo) y cuenta atrás de descanso automática, con multiplicador global de
  descansos ajustable desde la propia sesión. Precisión contra `Date.now()`, nunca acumulando
  `setInterval`.
- Avisos sonoros generados con Web Audio API (sin archivos de audio), acompañados siempre de vibración
  y de un cambio visual evidente: la app debe funcionar entera con el sonido apagado.
- Wake Lock API para mantener la pantalla encendida, con fallback silencioso.
- Persistencia en `localStorage` detrás de una interfaz de repositorio asíncrona, con esquema versionado
  y migraciones. Todo lo leído se valida con Zod: los datos guardados son datos no confiables.
- Exportar e importar el historial completo en JSON desde la UI: es la **única copia de seguridad** que
  existe hoy.
- Progresión explícita: al superar el tope alto del rango de repeticiones en todas las series durante
  dos sesiones consecutivas, la app avisa de que toca subir peso e indica el incremento disponible
  según el material declarado. El peso nunca está hardcodeado, ni en los datos ni en la UI.

Decisiones cerradas por el usuario:

- **Sin PWA.** No se construye app instalable, ni service worker, ni modo offline.
- Media de ejercicios: **croquis animados en SVG** generados como código (formato principal, ligero,
  hereda el tema, legible a distancia) **y vídeos** que aporta el usuario para mostrar la ejecución. La
  abstracción de media soporta ambos, más imagen estática y placeholder.

Explícitamente sin decidir:

- Destino de despliegue. Se toman solo decisiones que no cierran puertas: `base` configurable y nada
  que dependa de servir desde la raíz de un dominio.
- Backend y sincronización entre dispositivos: recomendado Supabase para cuando llegue, no construido.
  La capa de persistencia se diseña para que migrar no obligue a tocar nada fuera de ella.
- Panel de administración para crear y editar rutinas desde la UI: previsto, no construido.

## Brand Commitments

Nombre del proyecto: `my-fitness-world`. No existe identidad visual previa, logo ni assets de marca.
Interfaz en español, código y datos en inglés. Tema oscuro por defecto, porque el gimnasio es la casa y
a menudo se entrena de noche.

## Evidence on Hand

- Real y aportado por el usuario: la rutina de referencia completa de la semana 1 (ejercicios, series,
  rangos de repeticiones, tempos) y la tabla de descansos recomendados por tipo de ejercicio.
- Material real: mancuernas de 9 kg y peso corporal.
- **No existe todavía**: ningún asset de media (los croquis SVG hay que producirlos; los vídeos los
  aportará el usuario), ni historial de entrenos, ni marcas personales, ni datos de progresión previos.
  Nada de eso debe fabricarse ni mostrarse como si existiera: las pantallas de historial, PRs y
  comparativas necesitan estados vacíos reales.

## Product Principles

1. **La prescripción manda; el peso lo registra el usuario.** La rutina se expresa en repeticiones,
   tempo y esfuerzo objetivo. Ninguna carga concreta se hornea en el modelo ni en la UI.
2. **Nada se pierde.** Una recarga a media sesión no cuesta un solo dato, y el export JSON es la copia
   de seguridad del usuario: ante datos corruptos se aísla el original, nunca se descarta en silencio.
3. **La app lleva el ritmo.** El usuario no mira el reloj, no cuenta descansos y no decide cuándo
   empieza la siguiente serie: se lo dicen el temporizador, el sonido y el cambio visual.
4. **Una decisión a la vez, grande y a dos metros.** En el modo entreno cada interacción es un objetivo
   táctil amplio, legible de un vistazo y alcanzable con las manos ocupadas.
5. **Los datos son del usuario y editables sin programar.** Hoy archivos de contenido validados en
   build; mañana un panel. La app no debe requerir tocar componentes para cambiar una rutina.

## Accessibility & Inclusion

Sin limitaciones físicas ni lesiones que restrinjan la selección de ejercicios (confirmado).
Requisitos de uso que sí son vinculantes: legibilidad a 2-3 metros de distancia, objetivos táctiles de
44px como mínimo, contraste alto sostenido en tema oscuro, toda señal sonora duplicada en visual y
háptica, y respeto de `prefers-reduced-motion` en croquis y transiciones.

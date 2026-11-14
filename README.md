# RIO360 · Instagram Studio

Planificador de perfiles de Instagram para preparar y presentar propuestas. Adaptación de mkgrid (Chris Vrakas, MIT; ver LICENSE). Incluye html2canvas 1.4.1, MIT, en dist/vendor. La tipografía Manrope se sirve localmente; su licencia SIL OFL está en dist/fonts/OFL-Manrope.txt.

Aplicación estática independiente: no requiere ChatGPT, inicio de sesión, API, servidor de aplicación ni secretos. Todos los recursos de ejecución están incluidos en `dist/`.

## Publicación

Dominio de producción: https://instagram.rio360.com.ar

El alojamiento de producción usa Cloudflare Workers con archivos estáticos de `dist/`. Para publicar desde una computadora autorizada, instalar Wrangler, ejecutar `npx wrangler login` y luego `npx wrangler deploy`. La configuración está en `wrangler.jsonc`. También se puede cargar un ZIP con el contenido de `dist/` desde Workers & Pages en el panel de Cloudflare.

Cloudflare Workers Builds conecta `peressa/rio360-instagram-studio` con el Worker de producción. Cada push a `main` ejecuta `node tests/run.cjs`; si pasan las pruebas, publica mediante `npx --yes wrangler@4.162.0 deploy` en https://instagram.rio360.com.ar. Los errores de pruebas o publicación se consultan en Workers & Pages → rio360-instagram-studio → Deployments. No hay secretos de Cloudflare almacenados en el repositorio.

Para usar Dokploy u otro alojamiento con Docker, construir el `Dockerfile` incluido y dirigir el dominio al puerto 80 del contenedor. No necesita volúmenes: las fotos y propuestas permanecen en el navegador de cada visitante.

Mantener el mismo dominio HTTPS conserva el almacenamiento local existente. Para cambiar de dominio o computadora, descargar e importar un respaldo JSON.

## Uso

Servir `dist/` con un servidor estático. No requiere instalación ni compilación. El panel permite editar usuario, nombre, verificación visual, seguidores, seguidos, publicaciones (manual o automático), avatar y recorte, bio, pronombres, categoría, enlaces, ubicación, contacto, privacidad y textos de botones. Las cifras son de la propuesta y no modifican ninguna cuenta real.

Las fotos se arrastran a la biblioteca y a la grilla. En Publicaciones se edita portada, tipo, fijación, texto, ubicación, fecha, Me gusta y comentarios. Reels, videos y carruseles usan imágenes de portada en este simulador, sin publicación ni reproducción de video.

Los destacados tienen nombre, portada, recorte, orden e imágenes de historias modificables. En la presentación se abren para recorrer la secuencia. La captura PNG se genera desde la misma vista seleccionada, con verificación, estilos y recortes.

## Guardado

El mockup ocupa la pantalla por defecto. Solo quedan visibles el selector de dispositivo, Fotos y Exportar. Nombre, usuario, biografía, enlace y cifras se escriben directamente sobre el mockup, con guardado automático. Enter termina una edición de una línea; en la bio agrega un salto. Esc restaura el valor anterior de ese campo. El avatar y las portadas abren directamente el selector de imagen al tocarlos, incluso si ya tienen foto. Los nombres de destacados se escriben en su lugar y se guardan automáticamente. El pequeño botón de reproducción sobre cada portada abre sus historias; los tres puntos del perfil abren los ajustes del proyecto, grilla y respaldos. La biblioteca se muestra como panel temporal y se cierra al tocar afuera o con Esc, sin cambiar el tamaño del mockup. Se puede tocar una foto para agregarla o arrastrarla; al arrastrar desde la biblioteca el panel se aparta y, al soltar la foto en el perfil, se cierra. Al completar la grilla, la siguiente foto agrega filas automáticamente hasta el límite de 27 casilleros. Las fotos que exceden ese límite permanecen en la biblioteca. Se mantienen los controles manuales de proporción y cantidad de filas en los ajustes del proyecto.

El scroll recorre el perfil sin modificar el recorte. Las fotos nuevas entran centradas y la publicación muestra la imagen completa. El encuadre anterior se puede restablecer desde la edición de la publicación. Las herramientas de composición y panorama permanecen dentro de esa edición.

Tocar una publicación abre su vista dentro del mockup, con anterior/siguiente, Me gusta, guardados y comentarios persistentes. Los destacados se recorren por historias, con pausa, avance automático, botones, teclado y deslizamiento lateral. Inicio, Reels, búsqueda, mensajes y notificaciones responden dentro de la propuesta. Todas estas interacciones son locales; no se conectan ni envían contenido a Instagram. Los comentarios y mensajes se incluyen en el respaldo JSON.

Los cambios se escriben sin espera de debounce en IndexedDB. Mientras se confirma cada transacción, se conserva un borrador de estado por propuesta en localStorage para recuperar cambios pendientes tras una recarga. Si localStorage está lleno se continúa usando IndexedDB; si falla el guardado, el editor muestra el error y permite reintentar o descargar un respaldo. Los borradores no sustituyen el respaldo de las fotos de la biblioteca. El estado «Guardado» se muestra después de completarse las transacciones.

Los perfiles anteriores se conservan. Cada propuesta usa una base IndexedDB independiente. El respaldo JSON incluye perfil, biblioteca, grilla, historias y ajustes de vista. No sincroniza entre computadoras. Borrar los datos del navegador elimina el guardado local: conservar respaldos descargados.

## Comparación visual

Se consultó directamente instagram.com/instagram el 13 de noviembre de 2026 con Chrome. `references/` conserva medidas de escritorio (1920, 1280 y 768 px) y web móvil (390 px de viewport, 375 px útiles por la barra de desplazamiento de Chrome). Se copiaron las formas SVG observadas de la interfaz y se reprodujeron tipografías, colores, medidas, columnas adaptables y distribución mediante CSS.

Las medidas de referencia se conservan en `references/`. La vista móvil predeterminada es App · iPhone. Las etiquetas de estadísticas se mantienen en una sola línea en iPhone, Android y la alternativa web móvil, en los anchos de 375, 390 y 412 px. Los perfiles guardados con la antigua vista web móvil pasan una sola vez a la vista de app; las elecciones posteriores se conservan.

Las vistas nativas de iPhone y Android están disponibles como variantes de presentación. Sin capturas de una versión concreta de las apps no puede certificarse igualdad de píxeles con ellas ni con todos los experimentos de interfaz de Instagram.

## Verificación

`node tests/backup.cjs` comprueba compatibilidad con respaldos anteriores y validación de los campos añadidos. La prueba de navegador cubre edición, recarga, portadas, historias, orden, pestañas, publicaciones y exportación. No usa la API de Instagram ni publica contenido.

`node tests/grid-resize.cjs` verifica que reducir la grilla conserve las fotos, el orden, los recortes y panoramas, y rechace una reducción cuando el contenido no entra.

`node tests/run.cjs` ejecuta todas las pruebas, incluyendo recuperación de borradores, transacciones abortadas, falta de espacio y aislamiento entre propuestas, y verifica la sintaxis de los scripts.

Revisión visual del 13/11/2026: contrastado con instagram.com/instagram en Chrome, escritorio y web móvil. Los casilleros libres aparecen solo al arrastrar. En modo visitante se oculta el círculo de nuevo destacado; se conserva su creación en las herramientas del perfil. La reproducción de historias aparece al interactuar con un destacado y también admite clic derecho/pulsación larga en la portada. Las opciones de las historias se concentran en sus tres puntos.

El avatar y las portadas se encuadran arrastrando dentro del círculo. El movimiento queda limitado a la imagen para no mostrar bordes vacíos. Un toque sin arrastrar reemplaza la foto. Pellizcar con dos dedos o usar +/− con el círculo enfocado acerca la imagen; la rueda mantiene el desplazamiento normal del perfil. Los recortes anteriores se conservan y se guardan también los nuevos encuadres.

Las cifras siguen la muestra real guardada en `references/counts/instagram-es-2026-11-13.json`: seguidores de cuatro dígitos sin separadores (5194, 9653), miles con coma decimal (10,1 mil, 18,5 mil), cientos de miles sin decimal (496 mil, 983 mil), millones con un decimal cuando corresponde (6,7 M, 38,2 M), cientos de millones enteros (268 M, 686 M). Las publicaciones se mantienen exactas y añaden puntos a partir de cinco dígitos (32.167, 176.097); los seguidos se mantienen exactos (1294, 1467).

La muestra se tomó directamente de 12 perfiles de Instagram web en español; dos se contrastaron también en web móvil. El corte exacto de 10.000 se infiere de las muestras 9653 y 10.101, sin una cuenta observada exactamente en 9999/10000. No se observaron cuentas con mil millones de seguidores: en ese rango se conservan las cifras completas, sin generar B ni mil M. El valor completo siempre se conserva y aparece al editar; en pantallas estrechas las cifras fuera de rango se pueden desplazar dentro del campo enfocado.

Revisión Android del 14/11/2026: se inspeccionaron videos públicos publicados en 2026. Se aceptó una grabación de un teléfono Android físico con Instagram en español y tres contadores en cero; el editor ya coincide en ese caso. No acredita el formato de miles/millones ni el salto exacto 9999/10000 en la app. Todas las vistas siguen compartiendo el formato derivado de la web; no se certifica equivalencia numérica con Android. Fuentes, fotograma, descartes y pendientes: [revisión de Android](references/counts/REVISION-ANDROID.md). Las pruebas distinguen observaciones externas de decisiones provisionales del código.

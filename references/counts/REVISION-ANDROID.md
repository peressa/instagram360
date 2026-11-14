# Contadores de Instagram · Android en español

Revisión: 14/11/2026. Se buscaron capturas y videos públicos y se inspeccionaron fotogramas en YouTube. No se usó un teléfono Android conectado ni se confundió la web móvil con la app.

## Evidencia aceptada, de alcance limitado

[WilDroid: crear una cuenta de Instagram, 03:34](https://www.youtube.com/watch?v=blolQToZh-I&t=214s), publicado el **13/03/2026** según la descripción expandida de YouTube. En 00:05 se ve la pantalla de inicio de un teléfono Android físico; en 03:34 se ve el perfil de la app en español, con **0 publicaciones, 0 seguidores y 0 seguidos**. [Recorte del fotograma](android-wildroid-2026-03-13-t214.png).

Esto permite contrastar únicamente esos tres ceros y sus etiquetas. El editor ya coincide en esos valores; no justifica cambiar las abreviaturas. La fecha de publicación no acredita la fecha de grabación ni la versión de Instagram, Android o la variante regional del español. La muestra se registra por separado en `android-es-2026-11-14.json`; no se agrega a la evidencia web como si fuera una prueba del mismo entorno.

## Fuentes revisadas que no verifican los contadores de Android

| Fuente | Observación | Motivo para no derivar reglas |
| --- | --- | --- |
| [CheznaTV: modo profesional](https://www.youtube.com/watch?v=3XYShKcSThw&t=5s), publicado 20/10/2026 | Interfaz y barra de estado de iPhone en el fotograma revisado | No acredita Android; además promociona Instagram Plus |
| [Invierte Capital: foto de perfil](https://www.youtube.com/watch?v=X2Cf6pxdIEk&t=29s), publicado 05/04/2026 | Perfil en español con tres ceros, insertado en un marco de teléfono | El marco y las barras no permiten establecer con suficiente certeza el sistema o la versión; no muestra abreviaturas |
| [Ann Hacks: ocultar seguidores](https://www.youtube.com/watch?v=POjuqTzX0HU&t=24s), publicado 11/04/2026 | Ajustes en español con barra de estado de iOS | No es evidencia de Android ni del formato de contadores |
| [Anxiety7u7x: crear cuenta](https://www.youtube.com/watch?v=j5K73dZnlGg) | El resultado de YouTube dice «2026», pero también «hace 2 años» y la descripción menciona 2024 | Título actualizado no acredita una grabación de 2026; no aceptado |
| [Guía sobre pérdida de seguidores](https://100seguidores.es/blog/por-que-bajan-los-seguidores-de-instagram/), actualizada 05/11/2026 | Texto que afirma pruebas en ambos sistemas; la captura identificada en el artículo es de estadísticas en iPhone | El texto no sustituye una captura del contador del perfil en Android |

## Pendiente y comportamiento que conserva el editor

- **9999 → 10000:** falta evidencia visual de ambos valores exactos en la app Android en español. El código conserva el corte en 10000 como decisión provisional, inferida previamente de **9653 → «9653» y 10101 → «10,1 mil» en la web**. No se presenta como corte comprobado en Android.
- **Separadores de cuatro cifras, mil/M, decimales, redondeo o truncamiento:** no comprobados en Android por esta revisión. El código continúa usando las muestras web documentadas. No se agregan K, B u otras unidades por intuición.
- **Variantes del español, versión de la app y experimentos por cuenta:** no identificados en las grabaciones; no se certifica una regla universal ni equivalencia de píxeles.
- **Miles de millones:** sin perfil real observado en ese rango; se conserva el valor completo.

Las pruebas separan las muestras externas observadas del comportamiento elegido por la implementación. Que una prueba de 9999/10000 pase solo verifica que el código mantenga ese comportamiento: no valida una regla de Instagram. No hubo una corrección numérica respaldada por nueva evidencia Android en esta revisión.

# RIO360 · Instagram Studio

Planificador de perfiles de Instagram para preparar y presentar propuestas. Adaptación de mkgrid (Chris Vrakas, MIT; ver LICENSE). Incluye html2canvas 1.4.1, MIT, en dist/vendor.

Aplicación estática independiente: no requiere ChatGPT, inicio de sesión, API, servidor de aplicación ni secretos. Todos los recursos de ejecución están incluidos en `dist/`.

## Publicación

Dominio de producción: https://instagram.rio360.com.ar

En Cloudflare Pages, conectar este repositorio, seleccionar la rama de producción, usar el preset «None», dejar vacío el comando de compilación y configurar `dist` como directorio de salida. Agregar `instagram.rio360.com.ar` en Custom domains y usar el registro DNS que indique Cloudflare.

Para usar Dokploy u otro alojamiento con Docker, construir el `Dockerfile` incluido y dirigir el dominio al puerto 80 del contenedor. No necesita volúmenes: las fotos y propuestas permanecen en el navegador de cada visitante.

Mantener el mismo dominio HTTPS conserva el almacenamiento local existente. Para cambiar de dominio o computadora, descargar e importar un respaldo JSON.

## Uso

Servir `dist/` con un servidor estático. No requiere instalación ni compilación. El panel permite editar usuario, nombre, verificación visual, seguidores, seguidos, publicaciones (manual o automático), avatar y recorte, bio, pronombres, categoría, enlaces, ubicación, contacto, privacidad y textos de botones. Las cifras son de la propuesta y no modifican ninguna cuenta real.

Las fotos se arrastran a la biblioteca y a la grilla. En Publicaciones se edita portada, tipo, fijación, texto, ubicación, fecha, Me gusta y comentarios. Reels, videos y carruseles usan imágenes de portada en este simulador, sin publicación ni reproducción de video.

Los destacados tienen nombre, portada, recorte, orden e imágenes de historias modificables. En la presentación se abren para recorrer la secuencia. La captura PNG se genera desde la misma vista seleccionada, con verificación, estilos y recortes.

## Guardado

Los perfiles anteriores se conservan. Cada propuesta usa una base IndexedDB independiente. El respaldo JSON incluye perfil, biblioteca, grilla, historias y ajustes de vista. No sincroniza entre computadoras. Borrar los datos del navegador elimina el guardado local: conservar respaldos descargados.

## Comparación visual

Se consultó directamente instagram.com/instagram el 13 de noviembre de 2026 con Chrome. `references/` conserva medidas de escritorio (1920, 1280 y 768 px) y web móvil (390 px de viewport, 375 px útiles por la barra de desplazamiento de Chrome). Se copiaron las formas SVG observadas de la interfaz y se reprodujeron tipografías, colores, medidas, columnas adaptables y distribución mediante CSS.

Las medidas de referencia se conservan en `references/`. La vista móvil predeterminada es App · iPhone. Las etiquetas de estadísticas se mantienen en una sola línea en iPhone, Android y la alternativa web móvil, en los anchos de 375, 390 y 412 px. Los perfiles guardados con la antigua vista web móvil pasan una sola vez a la vista de app; las elecciones posteriores se conservan.

Las vistas nativas de iPhone y Android están disponibles como variantes de presentación. Sin capturas de una versión concreta de las apps no puede certificarse igualdad de píxeles con ellas ni con todos los experimentos de interfaz de Instagram.

## Verificación

`node tests/backup.cjs` comprueba compatibilidad con respaldos anteriores y validación de los campos añadidos. La prueba de navegador cubre edición, recarga, portadas, historias, orden, pestañas, publicaciones y exportación. No usa la API de Instagram ni publica contenido.

`node tests/grid-resize.cjs` verifica que reducir la grilla conserve las fotos, el orden, los recortes y panoramas, y rechace una reducción cuando el contenido no entra.

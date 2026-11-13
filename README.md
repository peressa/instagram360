# RIO360 · Instagram Studio

Planificador de perfiles de Instagram para preparar y presentar propuestas. Adaptación de mkgrid (Chris Vrakas, MIT; ver LICENSE). Incluye html2canvas 1.4.1, MIT, en dist/vendor.

## Uso

Servir `dist/` con un servidor estático. No requiere instalación ni compilación. El panel permite editar usuario, nombre, verificación visual, seguidores, seguidos, publicaciones (manual o automático), avatar y recorte, bio, pronombres, categoría, enlaces, ubicación, contacto, privacidad y textos de botones. Las cifras son de la propuesta y no modifican ninguna cuenta real.

Las fotos se arrastran a la biblioteca y a la grilla. En Publicaciones se edita portada, tipo, fijación, texto, ubicación, fecha, Me gusta y comentarios. Reels, videos y carruseles usan imágenes de portada en este simulador, sin publicación ni reproducción de video.

Los destacados tienen nombre, portada, recorte, orden e imágenes de historias modificables. En la presentación se abren para recorrer la secuencia. La captura PNG se genera desde la misma vista seleccionada, con verificación, estilos y recortes.

## Guardado

Los perfiles anteriores se conservan. Cada propuesta usa una base IndexedDB independiente. El respaldo JSON incluye perfil, biblioteca, grilla, historias y ajustes de vista. No sincroniza entre computadoras. Borrar los datos del navegador elimina el guardado local: conservar respaldos descargados.

## Comparación visual

Se consultó directamente instagram.com/instagram el 13 de noviembre de 2026 con Chrome. `references/` conserva medidas de escritorio (1920, 1280 y 768 px) y web móvil (390 px de viewport, 375 px útiles por la barra de desplazamiento de Chrome). Se copiaron las formas SVG observadas de la interfaz y se reprodujeron tipografías, colores, medidas, columnas adaptables y distribución mediante CSS.

La geometría se contrastó con el mismo texto de referencia: en web móvil coinciden avatar (16, 87.5; 77×77), estadísticas (121, 121; 254×54), botones (16, 277; 343×32), destacados (y=337), pestañas (y=446) y grilla (y=491). Las pruebas se hicieron con un perfil local de prueba; ese contenido no se distribuye en el sitio.

Las vistas nativas de iPhone y Android están disponibles como variantes de presentación. Sin capturas de una versión concreta de las apps no puede certificarse igualdad de píxeles con ellas ni con todos los experimentos de interfaz de Instagram.

## Verificación

`node tests/backup.cjs` comprueba compatibilidad con respaldos anteriores y validación de los campos añadidos. La prueba de navegador cubre edición, recarga, portadas, historias, orden, pestañas, publicaciones y exportación. No usa la API de Instagram ni publica contenido.

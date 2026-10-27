# Ensayo del primer avance

## Preparación

- App original: http://localhost:3001/login.html; PostgreSQL local en 5433.
- Copia de ensayo: `node scripts/servidor-validacion.js`, puerto 3002.
  Usa el último respaldo aislado indicado en `.local-validation/actual.txt`.
  No genera correos. No ejecutar `db:init`.
- Roles de demostración existentes: 100001 sistema, 100002 biblioteca,
  100003 catálogo, 621234 lector. Usar sus credenciales de prueba existentes.
- Las operaciones de alta/baja/compras del ensayo deben hacerse en la copia.
  Revisar el puerto antes de confirmar una escritura.

## Recorrido sugerido

1. **Código:** mostrar ESTANDAR_MVC.md y seguir una consulta desde ruta,
   controlador HTTP y modelo SQL hasta modelo cliente, controlador y vista.
2. **Autenticación:** entrar con sistema; comprobar que una contraseña incorrecta
   produce error. Cerrar sesión y verificar que volver a una página protegida
   solicita autenticarse.
3. **Perfiles:** crear uno con Buscar libros y Chatbot; editar funciones,
   cancelar otro formulario y comprobar que no aparece un perfil adicional.
4. **Usuarios:** consultar, registrar una clave institucional aún libre, cambiar
   su perfil y comprobar baja/reactivación. No usar cuentas reales del equipo.
   El nombre/correo vienen del directorio de demostración; la edición cambia perfil.
5. **Libros:** crear ficha física con ISBN distinto, autor, editorial, tema y
   ejemplar con ubicación. Activar, consultar, modificar y retirar/reactivar.
   Distinguir retiro del título de baja de un ejemplar por motivo.
6. **Compra:** biblioteca solicita dentro del presupuesto; biblioteca o sistema
   autoriza; catálogo recibe en una ubicación. Confirmar incremento de ejemplares.
   Los digitales no requieren ubicación física. No hay envío real a Tesorería.
7. **Búsqueda:** entrar como lector; buscar por título, autor, tema, editorial,
   clave e ISBN; abrir ficha para mostrar estante/fila y disponibilidad.
8. **Listado:** abrir Lista de libros → Imprimir / Guardar PDF → Guardar como PDF.
   Abrir el archivo y comprobar ISBN, columnas, última fila y páginas completas.

## Verificación del 26 de octubre de 2026

- 37 pruebas automatizadas aprobadas; incluye MVC, permisos y concurrencia.
- 64 casos HTTP reales aprobados en copia restaurada: usuarios, perfiles,
  búsqueda por seis filtros, ubicación, catálogo, ejemplares y compras.
- Las 14 páginas y 49 recursos enlazados responden HTTP 200.
- Respaldo nuevo: 36 tablas/213 filas, contenido restaurado coincidente.
- Corregidos: ubicación obligatoria en compras digitales, resultados antiguos
  tras error de búsqueda, validación de cantidades/costos y recuperación de
  catálogos para baja/reactivación de usuarios después de fallo de conexión.

## Cierre de revisión en Brave

Login, búsqueda/ficha de Clean Code con ubicación, validación/cancelación de
perfil y cancelación de compra comprobados desde la interfaz de la copia.
PDF multipágina exportado: 32 páginas, 256 títulos e ISBN, sin faltantes,
con cabeceras repetidas. Revisado mediante render y extracción del archivo.
Evidencia privada: `listado-extenso.pdf` en la carpeta de la copia actual.

Se descubrió y corrigió un filtro ignorado en gestión de usuarios y libros.
La suite con PostgreSQL confirma coincidencias y resultados vacíos correctos.
La última comprobación visual de esos filtros quedó limitada porque Brave dejó
de aceptar entrada automatizada. Emulación móvil 440x956 con controles y
navegación disponibles; revisión de diseño completa pendiente por fallo de
captura de macOS (ScreenCaptureKit -3812). Ensayar todavía el recorrido completo
con quienes presentarán; no confundir la copia de 256 títulos con la base original.

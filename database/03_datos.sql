-- =====================================================================
--  Biblioteca Universidad Ducky · Base de datos (PostgreSQL 15+)
--  03_datos.sql · Catálogos base y datos de prueba
--  Ejecutar después de 02_reglas.sql
--  Contraseña de todos los usuarios de prueba: 1234
-- =====================================================================
SET search_path TO biblioteca, public;

-- ---------------------------------------------------------------------
--  Arranque: primer perfil + primer administrador (ciclo PERFILES <-> USUARIOS).
--  Las FK de PERFILES hacia USUARIOS son DEFERRABLE, así que se validan al COMMIT.
-- ---------------------------------------------------------------------
BEGIN;
INSERT INTO tipos_usuario (id_tipo_usuario, nombre, dias_prestamo, max_renovaciones, max_ejemplares, multa_diaria) VALUES
    (1, 'Alumno',      5, 2, 2, 10.00),   -- Reglas 1, 2, 3 y 5
    (2, 'Profesor',   10, 3, 3, 10.00),   -- Regla 6
    (3, 'Colaborador',10, 3, 3, 10.00);   -- Se adopta la misma política que Profesor

INSERT INTO perfiles (id_perfil, nombre, descripcion, clave_admin_alta) VALUES
    (1, 'Administrador del sistema', 'Gestiona usuarios, perfiles y tiene acceso a todas las funciones', '100001');

INSERT INTO usuarios (clave_usuario, nombre, correo, id_tipo_usuario, id_perfil, clave_admin_alta) VALUES
    ('100001', 'Diego Ramírez', 'diego.ramirez@ducky.edu.mx', 3, 1, NULL);   -- carga inicial: sin creador
COMMIT;

SET app.usuario = '100001';   -- a partir de aquí la bitácora registra al administrador

INSERT INTO perfiles (id_perfil, nombre, descripcion, clave_admin_alta) VALUES
    (2, 'Administrador de biblioteca', 'Bibliotecario: usuarios lectores, préstamos, devoluciones, multas y solicitudes a Tesorería', '100001'),
    (3, 'Administrador del catálogo',  'Fichas bibliográficas, ejemplares, ubicaciones y bajas de ejemplares', '100001'),
    (4, 'Lector',                      'Alumnos, profesores y colaboradores: búsqueda y solicitud de préstamo', '100001');
SELECT setval(pg_get_serial_sequence('perfiles', 'id_perfil'), 4);
SELECT setval(pg_get_serial_sequence('tipos_usuario', 'id_tipo_usuario'), 3);

INSERT INTO funciones (id_funcion, nombre, descripcion) VALUES
    (1, 'Gestionar usuarios', 'Alta, baja, reactivación y consulta de usuarios'),
    (2, 'Gestionar perfiles', 'Crear perfiles y asignarles funciones'),
    (3, 'Gestionar libros',   'Fichas bibliográficas, ejemplares, ubicaciones y bajas'),
    (4, 'Buscar libros',      'Consulta del catálogo por título, autor, tema, clave o editorial'),
    (5, 'Préstamos',          'Autorizar préstamos y renovaciones'),
    (6, 'Devoluciones',       'Registrar devoluciones, multas y pagos'),
    (7, 'Chatbot',            'Consultar dudas frecuentes del sistema');
SELECT setval(pg_get_serial_sequence('funciones', 'id_funcion'), 7);

INSERT INTO perfil_funcion (id_perfil, id_funcion) VALUES
    (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),
    (2,1),(2,4),(2,5),(2,6),(2,7),
    (3,3),(3,4),(3,7),
    (4,4),(4,7);

INSERT INTO usuarios (clave_usuario, nombre, correo, id_tipo_usuario, id_perfil, clave_admin_alta) VALUES
    ('100002', 'Pamela Torres',   'pamela.torres@ducky.edu.mx',   3, 2, '100001'),
    ('100003', 'Katya Hernández', 'katya.hernandez@ducky.edu.mx', 3, 3, '100001'),
    ('621234', 'Ana Paula García','ana.garcia@ducky.edu.mx',      1, 4, '100001'),
    ('612345', 'Elías Moreno',    'elias.moreno@ducky.edu.mx',    1, 4, '100001'),
    ('633456', 'Laura Sánchez',   'laura.sanchez@ducky.edu.mx',   1, 4, '100001'),
    ('700123', 'Roberto Castillo','roberto.castillo@ducky.edu.mx',2, 4, '100001'),
    ('800456', 'Sofía Mendoza',   'sofia.mendoza@ducky.edu.mx',   3, 4, '100001');

SELECT asignar_contrasena(clave_usuario, '1234', FALSE) FROM usuarios;
SELECT asignar_contrasena('800456', '1234', TRUE);   -- contraseña temporal: debe cambiarla al entrar

INSERT INTO motivos_baja (descripcion, aplica_a) VALUES
    ('Egreso','Usuario'), ('Fin de contrato','Usuario'), ('Solicitud','Usuario'), ('Otro','Usuario'),
    ('Perdido','Ejemplar'), ('Robado','Ejemplar'), ('Dañado','Ejemplar'), ('Obsoleto','Ejemplar'), ('Otro','Ejemplar');

-- Laura Sánchez egresó (usuario inactivo)
INSERT INTO bajas_usuario (clave_usuario, id_motivo, fecha_baja, clave_administrador)
VALUES ('633456', (SELECT id_motivo FROM motivos_baja WHERE descripcion='Egreso'), CURRENT_DATE - 40, '100001');

-- ---------------------------------------------------------------------
--  Catálogo
-- ---------------------------------------------------------------------
SET app.usuario = '100003';

INSERT INTO editoriales (nombre, correo_contacto) VALUES
    ('Pearson',          'ventas@pearson.com'),
    ('McGraw-Hill',      'contacto@mheducation.com'),
    ('Cengage Learning', 'mexico@cengage.com'),
    ('O''Reilly Media',  'orders@oreilly.com');

INSERT INTO temas (nombre) VALUES
    ('Bases de datos'), ('Ingeniería de software'), ('Matemáticas'), ('Programación');

INSERT INTO autores (nombre) VALUES
    ('Abraham Silberschatz'), ('Henry F. Korth'), ('S. Sudarshan'),
    ('Ian Sommerville'), ('James Stewart'), ('Robert C. Martin'), ('Roger S. Pressman');

INSERT INTO libros (id_libro, titulo, isbn, id_editorial, id_tema, edicion, anio_publicacion, paginas,
                    sinopsis, formato, enlace_digital, precio_ultima_compra_usd, estatus, fecha_alta_catalogo) VALUES
    ('L000128', 'Fundamentos de bases de datos', '9786071507730', 2, 1, '6a', 2014, 760,
     'Modelo relacional, SQL, diseño entidad-relación y normalización.', 'Físico', NULL, 85.50, 'Activo en catálogo', CURRENT_DATE - 300),
    ('L000129', 'Ingeniería de software',        '9786073206037', 1, 2, '9a', 2011, 792,
     'Procesos de software, requerimientos, diseño y pruebas.', 'Físico', NULL, 92.00, 'Activo en catálogo', CURRENT_DATE - 300),
    ('L000130', 'Cálculo de una variable',       '9786075228143', 3, 3, '8a', 2018, 912,
     'Límites, derivadas e integrales.', 'Físico', NULL, 110.00, 'Activo en catálogo', CURRENT_DATE - 200),
    ('L000131', 'Clean Code',                    '9780132350884', 1, 4, '1a', 2008, 464,
     'Buenas prácticas para escribir código legible y mantenible.', 'Físico', NULL, 48.99, 'Activo en catálogo', CURRENT_DATE - 150),
    ('L000132', 'Ingeniería del software: un enfoque práctico', '9786071503145', 2, 2, '7a', 2010, 805,
     'Enfoque práctico de la ingeniería de software.', 'Digital', 'https://biblioteca.ducky.edu.mx/digital/L000132', 70.00, 'Activo en catálogo', CURRENT_DATE - 100),
    ('L000133', 'Arquitectura limpia',           '9788441539907', 4, 2, '1a', 2018, 432,
     'Ficha en proceso de catalogación.', 'Físico', NULL, NULL, 'Ficha creada', NULL);

INSERT INTO libro_autor (id_libro, id_autor, es_principal) VALUES
    ('L000128', 1, TRUE), ('L000128', 2, FALSE), ('L000128', 3, FALSE),
    ('L000129', 4, TRUE),
    ('L000130', 5, TRUE),
    ('L000131', 6, TRUE),
    ('L000132', 7, TRUE),
    ('L000133', 6, TRUE);

INSERT INTO ubicaciones (seccion, estante, fila) VALUES
    ('Computación', 'E-01', 'F-01'),
    ('Computación', 'E-01', 'F-02'),
    ('Ciencias',    'E-03', 'F-01'),
    ('Reserva',     'E-09', 'F-01');

INSERT INTO ejemplares (id_ejemplar, id_libro, id_ubicacion, tipo_uso, condicion, fecha_ingreso) VALUES
    ('L000128-01', 'L000128', 1, 'Préstamo externo', 'Bueno',   CURRENT_DATE - 300),
    ('L000128-02', 'L000128', 1, 'Préstamo externo', 'Regular', CURRENT_DATE - 300),
    ('L000128-03', 'L000128', 4, 'Reservado',        'Bueno',   CURRENT_DATE - 300),
    ('L000129-01', 'L000129', 2, 'Préstamo externo', 'Bueno',   CURRENT_DATE - 300),
    ('L000129-02', 'L000129', 2, 'Préstamo en sala', 'Bueno',   CURRENT_DATE - 300),
    ('L000130-01', 'L000130', 3, 'Préstamo externo', 'Bueno',   CURRENT_DATE - 200),
    ('L000130-02', 'L000130', 3, 'Préstamo externo', 'Dañado',  CURRENT_DATE - 200),
    ('L000131-01', 'L000131', 2, 'Préstamo externo', 'Bueno',   CURRENT_DATE - 150),
    ('L000132-D1', 'L000132', NULL, 'Préstamo digital', 'Bueno', CURRENT_DATE - 100);

-- Ejemplar dañado retirado definitivamente
INSERT INTO bajas_ejemplar (id_ejemplar, id_motivo, descripcion, clave_administrador)
VALUES ('L000130-02', (SELECT id_motivo FROM motivos_baja WHERE descripcion='Dañado' AND aplica_a='Ejemplar'),
        'Hojas arrancadas en el capítulo 4', '100003');

-- ---------------------------------------------------------------------
--  Adquisiciones (pedido a Tesorería dentro del presupuesto mensual)
-- ---------------------------------------------------------------------
SET app.usuario = '100002';

INSERT INTO presupuestos_mensuales (periodo, monto_autorizado, clave_responsable)
VALUES (to_char(CURRENT_DATE, 'YYYY-MM'), 20000.00, '100002');

BEGIN;
INSERT INTO pedidos_tesoreria (id_pedido, id_presupuesto, clave_solicitante) VALUES (1, 1, '100002');
INSERT INTO detalle_pedido (id_pedido, numero_linea, id_libro, isbn_solicitado, titulo_solicitado,
                            id_editorial_solicitada, cantidad, costo_unitario_mxn, clave_peticionario) VALUES
    (1, 1, 'L000131', '9780132350884', 'Clean Code', 1, 2, 950.00, '621234'),
    (1, 2, NULL, '9780134494166', 'Clean Architecture', 1, 1, 1100.00, '700123');
INSERT INTO detalle_pedido_autor (id_pedido, numero_linea, id_autor) VALUES (1, 1, 6), (1, 2, 6);
COMMIT;
SELECT setval(pg_get_serial_sequence('pedidos_tesoreria', 'id_pedido'), 1);

-- ---------------------------------------------------------------------
--  Circulación (fechas relativas a hoy para que los ejemplos sigan vigentes)
-- ---------------------------------------------------------------------

-- 1) Ana Paula solicita y recibe "Fundamentos de bases de datos" (préstamo vigente)
INSERT INTO solicitudes_prestamo (clave_usuario, id_libro) VALUES ('621234', 'L000128');
INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario, id_solicitud_prestamo, fecha_prestamo)
VALUES ('621234', 'L000128-01', '100002', 1, CURRENT_DATE - 1);

-- 2) Elías tiene un préstamo vencido (será deudor en la lista de suspendidos)
INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario, fecha_prestamo)
VALUES ('612345', 'L000130-01', '100002', CURRENT_DATE - 20);

-- 3) El profesor Roberto renovó y devolvió con 3 días de atraso; pagó su multa en Tesorería
INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario, fecha_prestamo)
VALUES ('700123', 'L000129-01', '100002', CURRENT_DATE - 40);
INSERT INTO renovaciones (id_prestamo, fecha_renovacion, vencimiento_anterior, clave_autoriza)
SELECT 3, fecha_vencimiento - 1, fecha_vencimiento, '100002' FROM prestamos WHERE id_prestamo = 3;
INSERT INTO devoluciones (id_prestamo, fecha_devolucion, condicion_recibida, clave_bibliotecario)
SELECT 3, fecha_vencimiento + 3, 'Bueno', '100002' FROM prestamos WHERE id_prestamo = 3;
INSERT INTO pagos_multa (id_multa, folio_tesoreria, fecha_pago, clave_bibliotecario)
SELECT id_multa, 'TES-2026-00871', fecha_generacion + 1, '100002' FROM multas WHERE id_prestamo = 3;

-- 4) Sofía espera "Fundamentos de bases de datos" (no hay ejemplares de préstamo externo libres)
INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario, fecha_prestamo)
VALUES ('700123', 'L000128-02', '100002', CURRENT_DATE);
INSERT INTO lista_espera (clave_usuario, id_libro) VALUES ('800456', 'L000128');

-- ---------------------------------------------------------------------
--  Chatbot
-- ---------------------------------------------------------------------
SET app.usuario = '100001';

INSERT INTO contenidos_chatbot (tipo_fuente, referencia, titulo, contenido, version, clave_responsable) VALUES
    ('Regla de negocio', 'Requerimientos · Regla 5', 'Vigencia del préstamo para alumnos',
     'Un préstamo tiene vigencia de 5 días hábiles sin contar sábados y domingos.', '2.0', '100001'),
    ('Regla de negocio', 'Requerimientos · Regla 6', 'Reglas para maestros',
     'Los maestros tienen 10 días hábiles de préstamo y un máximo de 3 renovaciones.', '2.0', '100001'),
    ('Regla de negocio', 'Requerimientos · Regla 3', 'Costo diario de multa',
     'Por cada día de retraso se cobra una multa de 10 pesos.', '2.0', '100001'),
    ('Historia de usuario', 'HU-07 Renovar préstamo', 'Renovación de préstamo',
     'El lector puede renovar un préstamo activo si no excede el máximo de renovaciones de su tipo de usuario.', '1.1', '100001');

INSERT INTO preguntas_chatbot (pregunta, respuesta, clave_responsable) VALUES
    ('¿Cuánto dura el préstamo?',
     'Alumnos: 5 días hábiles. Profesores y colaboradores: 10 días hábiles. No se cuentan sábados ni domingos.', '100001'),
    ('¿Cuánto se paga por atraso?',
     'Se cobran 10 pesos por cada día de retraso. La multa se paga en Tesorería y se reporta al bibliotecario.', '100001'),
    ('¿Cuántas veces puedo renovar?',
     'Alumnos hasta 2 renovaciones; profesores y colaboradores hasta 3.', '100001');

INSERT INTO pregunta_contenido (id_pregunta, id_contenido) VALUES
    (1, 1), (1, 2), (2, 3), (3, 2), (3, 4);

RESET app.usuario;

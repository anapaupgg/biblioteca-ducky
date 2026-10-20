-- =====================================================================
--  Biblioteca Universidad Ducky · Base de datos (PostgreSQL 15+)
--  04_pruebas.sql · Demostración de reglas de negocio
--  Ejecutar después de 03_datos.sql. Todo corre dentro de una transacción
--  que se deshace al final (ROLLBACK), así que no cambia los datos.
--  Cada prueba imprime "OK" si el sistema se comporta como debe.
-- =====================================================================
SET search_path TO biblioteca, public;
\set QUIET on
\pset footer off

BEGIN;
SET LOCAL app.usuario = '100002';   -- la bibliotecaria opera durante las pruebas

-- Ayudantes: una prueba que debe ser rechazada y una que debe pasar
CREATE FUNCTION pg_temp.debe_fallar(p_prueba TEXT, p_sql TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE p_sql;
    RETURN 'FALLÓ  · ' || p_prueba || ' (se esperaba un rechazo)';
EXCEPTION WHEN OTHERS THEN
    RETURN 'OK     · ' || p_prueba || '  →  ' || SQLERRM;
END $$;

CREATE FUNCTION pg_temp.debe_pasar(p_prueba TEXT, p_sql TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE p_sql;
    RETURN 'OK     · ' || p_prueba;
EXCEPTION WHEN OTHERS THEN
    RETURN 'FALLÓ  · ' || p_prueba || '  →  ' || SQLERRM;
END $$;

\echo
\echo '=== 1. Autenticación y roles ======================================'
SELECT 'Login correcto 621234 / 1234' AS prueba, resultado, perfil FROM iniciar_sesion('621234', '1234', 'Chrome');
SELECT 'Login con contraseña incorrecta' AS prueba, resultado FROM iniciar_sesion('621234', 'xxxx');
SELECT 'Login de usuario dado de baja' AS prueba, resultado FROM iniciar_sesion('633456', '1234');
SELECT iniciar_sesion('612345', 'mal1'), iniciar_sesion('612345', 'mal2'), iniciar_sesion('612345', 'mal3') \g /dev/null
SELECT 'Tercer intento fallido bloquea 15 min' AS prueba, resultado FROM iniciar_sesion('612345', '1234');
SELECT 'Contraseña temporal pide cambio' AS prueba, resultado, cambiar_contrasena FROM iniciar_sesion('800456', '1234');
SELECT 'Menú del bibliotecario' AS prueba, string_agg(funcion, ', ') AS funciones FROM v_menu_usuario WHERE clave_usuario = '100002';
SELECT 'Menú del lector' AS prueba, string_agg(funcion, ', ') AS funciones FROM v_menu_usuario WHERE clave_usuario = '621234';

\echo
\echo '=== 2. Recuperación de contraseña (token de un solo uso, 30 min) ======'
SELECT solicitar_recuperacion('ana.garcia@ducky.edu.mx') AS token \gset
SELECT 'Restablecer con token válido' AS prueba, restablecer_contrasena(:'token', 'NuevaClave1') AS resultado;
SELECT 'Reutilizar el mismo token' AS prueba, restablecer_contrasena(:'token', 'OtraClave') AS resultado;
SELECT 'Login con la nueva contraseña' AS prueba, resultado FROM iniciar_sesion('621234', 'NuevaClave1');
SELECT 'Solo se guarda el hash del token' AS prueba,
       NOT EXISTS (SELECT 1 FROM recuperaciones_acceso WHERE token_hash = :'token') AS resultado;

\echo
\echo '=== 3. Gestión de usuarios, perfiles y libros ======================='
SELECT pg_temp.debe_fallar('Dar de baja un perfil con usuarios activos',
       $q$UPDATE perfiles SET estatus = 'Inactivo', clave_admin_baja = '100001' WHERE id_perfil = 4$q$);
SELECT pg_temp.debe_fallar('Baja de usuario con préstamos activos',
       $q$INSERT INTO bajas_usuario (clave_usuario, id_motivo, clave_administrador)
          VALUES ('621234', (SELECT id_motivo FROM motivos_baja WHERE descripcion='Egreso'), '100001')$q$);
SELECT pg_temp.debe_fallar('Baja de usuario con motivo "Otro" sin comentario',
       $q$INSERT INTO bajas_usuario (clave_usuario, id_motivo, clave_administrador)
          VALUES ('800456', (SELECT id_motivo FROM motivos_baja WHERE descripcion='Otro' AND aplica_a='Usuario'), '100001')$q$);
SELECT pg_temp.debe_fallar('Baja de ejemplar con motivo de usuario',
       $q$INSERT INTO bajas_ejemplar (id_ejemplar, id_motivo, clave_administrador)
          VALUES ('L000131-01', (SELECT id_motivo FROM motivos_baja WHERE descripcion='Egreso'), '100003')$q$);
SELECT pg_temp.debe_pasar('Reactivar a Laura Sánchez',
       $q$UPDATE bajas_usuario SET fecha_reactivacion = CURRENT_DATE, clave_admin_reactivacion = '100001'
          WHERE clave_usuario = '633456'$q$);
SELECT 'Laura queda activa' AS prueba, estatus FROM usuarios WHERE clave_usuario = '633456';
SELECT pg_temp.debe_fallar('Clave de usuario que no tiene 6 caracteres',
       $q$INSERT INTO usuarios (clave_usuario, nombre, correo, id_tipo_usuario, id_perfil)
          VALUES ('A12', 'X', 'x@ducky.edu.mx', 1, 4)$q$);
SELECT pg_temp.debe_fallar('Correo repetido',
       $q$INSERT INTO usuarios (clave_usuario, nombre, correo, id_tipo_usuario, id_perfil)
          VALUES ('699999', 'X', 'ana.garcia@ducky.edu.mx', 1, 4)$q$);
SELECT pg_temp.debe_fallar('ISBN repetido',
       $q$INSERT INTO libros (id_libro, titulo, isbn, id_editorial, id_tema, formato)
          VALUES ('L000199', 'Copia', '9780132350884', 1, 4, 'Físico')$q$);
SELECT pg_temp.debe_fallar('Libro digital sin enlace',
       $q$INSERT INTO libros (id_libro, titulo, isbn, id_editorial, id_tema, formato)
          VALUES ('L000198', 'Ebook', '9780000000001', 1, 4, 'Digital')$q$);
SELECT pg_temp.debe_fallar('Ejemplar físico sin ubicación',
       $q$INSERT INTO ejemplares (id_ejemplar, id_libro) VALUES ('L000131-02', 'L000131')$q$);
SELECT pg_temp.debe_fallar('Dos autores principales en el mismo libro',
       $q$INSERT INTO libro_autor VALUES ('L000128', 4, TRUE)$q$);

\echo
\echo '=== 4. Préstamos · Regla 1 y Reglas 5/6 ============================='
SELECT pg_temp.debe_fallar('Préstamo a usuario con préstamo vencido (Elías)',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('612345', 'L000131-01', '100002')$q$);
SELECT pg_temp.debe_fallar('Préstamo de ejemplar reservado',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('800456', 'L000128-03', '100002')$q$);
SELECT pg_temp.debe_fallar('Préstamo de ejemplar de uso en sala',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('800456', 'L000129-02', '100002')$q$);
SELECT pg_temp.debe_fallar('Préstamo de ejemplar ya prestado',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('800456', 'L000128-01', '100002')$q$);
SELECT pg_temp.debe_fallar('Un lector intenta autorizar un préstamo',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('800456', 'L000131-01', '621234')$q$);
SELECT pg_temp.debe_pasar('Segundo préstamo de Ana Paula (alumno, máximo 2)',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('621234', 'L000131-01', '100002')$q$);
SELECT 'Vencimiento a 5 días hábiles' AS prueba, fecha_prestamo, fecha_vencimiento,
       (ARRAY['lunes','martes','miércoles','jueves','viernes','sábado','domingo'])[EXTRACT(ISODOW FROM fecha_vencimiento)] AS dia
  FROM prestamos WHERE id_ejemplar = 'L000131-01' AND estatus = 'Activo';
SELECT pg_temp.debe_fallar('Tercer préstamo simultáneo de un alumno',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('621234', 'L000132-D1', '100002')$q$);
SELECT 'Profesor: vencimiento a 10 días hábiles' AS prueba, fecha_prestamo, fecha_vencimiento
  FROM prestamos WHERE id_prestamo = 4;

\echo
\echo '=== 5. Renovaciones · Regla 2 ======================================='
SELECT pg_temp.debe_pasar('Primera renovación (alumno)',
       $q$INSERT INTO renovaciones (id_prestamo, clave_autoriza) VALUES (1, '100002')$q$);
SELECT pg_temp.debe_pasar('Segunda renovación (alumno)',
       $q$INSERT INTO renovaciones (id_prestamo, clave_autoriza) VALUES (1, '100002')$q$);
SELECT pg_temp.debe_fallar('Tercera renovación (alumno, máximo 2)',
       $q$INSERT INTO renovaciones (id_prestamo, clave_autoriza) VALUES (1, '100002')$q$);
SELECT 'Historial de vencimientos del préstamo 1' AS prueba, vencimiento_anterior, vencimiento_nuevo
  FROM renovaciones WHERE id_prestamo = 1 ORDER BY id_renovacion;
SELECT pg_temp.debe_pasar('Renovar préstamo vencido (genera multa de atraso)',
       $q$INSERT INTO renovaciones (id_prestamo, clave_autoriza) VALUES (2, '100002')$q$);
SELECT 'Multa por renovación tardía' AS prueba, tipo, dias_retraso, monto, estatus FROM multas WHERE id_prestamo = 2;

\echo
\echo '=== 6. Devoluciones, multas, pagos y lista de espera ================='
SELECT pg_temp.debe_pasar('Devolución tardía del profesor (4 días de atraso)',
       $q$INSERT INTO devoluciones (id_prestamo, fecha_devolucion, condicion_recibida, clave_bibliotecario)
          SELECT 4, fecha_vencimiento + 4, 'Regular', '100002' FROM prestamos WHERE id_prestamo = 4$q$);
SELECT 'Multa Regla 3: 4 días × 10 pesos' AS prueba, tipo, dias_retraso, tarifa_diaria_aplicada, monto
  FROM multas WHERE id_prestamo = 4;
SELECT 'Ejemplar liberado con su nueva condición' AS prueba, estatus, condicion FROM ejemplares WHERE id_ejemplar = 'L000128-02';
SELECT 'Sofía notificada en la lista de espera' AS prueba, estatus FROM lista_espera WHERE clave_usuario = '800456';
SELECT pg_temp.debe_fallar('Devolver dos veces el mismo préstamo',
       $q$INSERT INTO devoluciones (id_prestamo, condicion_recibida, clave_bibliotecario) VALUES (4, 'Bueno', '100002')$q$);
SELECT pg_temp.debe_fallar('Préstamo a profesor con multa pendiente',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('700123', 'L000128-02', '100002')$q$);
SELECT pg_temp.debe_pasar('Profesor reporta el pago hecho en Tesorería',
       $q$INSERT INTO pagos_multa (id_multa, folio_tesoreria, clave_bibliotecario)
          SELECT id_multa, 'TES-2026-01022', '100002' FROM multas WHERE id_prestamo = 4$q$);
SELECT pg_temp.debe_pasar('Ya sin adeudo, el profesor puede volver a pedir',
       $q$INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario) VALUES ('700123', 'L000128-02', '100002')$q$);
SELECT pg_temp.debe_fallar('Pagar dos veces la misma multa',
       $q$INSERT INTO pagos_multa (id_multa, folio_tesoreria, clave_bibliotecario)
          SELECT id_multa, 'TES-X', '100002' FROM multas WHERE id_prestamo = 4$q$);

\echo
\echo '=== 7. Libro perdido (Regla 4) y lista de suspendidos ================'
SELECT 'Elías pierde "Cálculo" · multa de reposición' AS prueba, reportar_perdida(2, 18.50, '100002') AS id_multa;
SELECT 'Reposición = 110.00 USD × 18.50' AS prueba, tipo, precio_usd_aplicado, tipo_cambio, monto
  FROM multas WHERE id_prestamo = 2 AND tipo = 'Reposición';
SELECT 'Avisos generados' AS prueba, area_destino, tipo FROM avisos ORDER BY id_aviso;
SELECT 'Notificación de adeudo a Tesorería' AS prueba, id_multa, estatus FROM notificaciones_tesoreria;
SELECT 'Época de exámenes · avisos de suspensión' AS prueba, generar_avisos_suspension('100002') AS avisos;
SELECT 'Lista de deudores' AS prueba, clave_usuario, nombre, libros_vencidos, adeudo_mxn FROM v_deudores;

\echo
\echo '=== 8. Pedidos a Tesorería y presupuesto ============================'
SELECT pg_temp.debe_fallar('Línea que rebasa el presupuesto del mes',
       $q$INSERT INTO detalle_pedido (id_pedido, numero_linea, titulo_solicitado, cantidad, costo_unitario_mxn)
          VALUES (1, 3, 'Colección completa', 40, 1000)$q$);
SELECT pg_temp.debe_fallar('Pedido enviado sin líneas',
       $q$INSERT INTO pedidos_tesoreria (id_presupuesto, clave_solicitante) VALUES (1, '100002');
          SET CONSTRAINTS ALL IMMEDIATE$q$);
SELECT 'Saldo del presupuesto' AS prueba, periodo, monto_autorizado, comprometido, saldo FROM v_presupuesto_saldo;

\echo
\echo '=== 9. Búsqueda, chatbot y bitácora ================================'
SELECT 'Búsqueda por autor "silber"' AS prueba, id_libro, titulo, disponibles_prestamo
  FROM v_catalogo WHERE autores ILIKE '%silber%';
SELECT 'Chatbot' AS prueba, pregunta, fuentes FROM v_chatbot WHERE pregunta LIKE '%dura%';
SELECT 'Bitácora (últimos 5)' AS prueba, clave_usuario, accion, detalle FROM bitacora ORDER BY id_bitacora DESC LIMIT 5;

ROLLBACK;
\echo
\echo 'Pruebas terminadas · ROLLBACK: los datos quedaron como estaban.'

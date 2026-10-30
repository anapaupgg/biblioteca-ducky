/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Consultas SQL de solicitudes y préstamos.        */
/******************************************************************/

/******************************************************************/
/* Listing Contents: mis_solicitudes, mis_prestamos, pendientes,  */
/* bloquear_solicitud, autorizar, detalle.                         */
/* Reuse Instructions: clave e ID proceden del controlador. Las   */
/* operaciones de autorización reciben el client transaccional;  */
/* no hacen COMMIT. El trigger de BD valida las reglas del       */
/* préstamo y actualiza el estado de solicitud y ejemplar.       */
/******************************************************************/

const { pool } = require('../db');

const mis_solicitudes = async (clave_usuario) =>
{
    const resultado = await pool.query(
        `SELECT s.id_solicitud_prestamo AS folio, s.fecha_solicitud, s.estatus,
                s.id_libro, l.titulo
           FROM solicitudes_prestamo s JOIN libros l ON l.id_libro = s.id_libro
          WHERE s.clave_usuario = $1 ORDER BY s.fecha_solicitud DESC, s.id_solicitud_prestamo DESC`,
        [clave_usuario]);
    return resultado.rows;
};

const mis_prestamos = async (clave_usuario) =>
{
    const resultado = await pool.query(
        `SELECT p.id_prestamo, p.id_ejemplar, e.id_libro, l.titulo,
                p.fecha_prestamo, p.fecha_vencimiento, p.estatus,
                p.id_solicitud_prestamo AS folio
           FROM prestamos p JOIN ejemplares e ON e.id_ejemplar = p.id_ejemplar
                            JOIN libros l ON l.id_libro = e.id_libro
          WHERE p.clave_usuario = $1 AND p.estatus = 'Activo'
          ORDER BY p.fecha_vencimiento, p.id_prestamo`, [clave_usuario]);
    return resultado.rows;
};

const pendientes = async () =>
{
    const resultado = await pool.query(
        `SELECT s.id_solicitud_prestamo AS folio, s.fecha_solicitud, s.id_libro,
                l.titulo, s.clave_usuario, u.nombre AS usuario,
                COALESCE((SELECT json_agg(json_build_object(
                    'id_ejemplar', e.id_ejemplar, 'tipo_uso', e.tipo_uso)
                    ORDER BY e.id_ejemplar)
                    FROM ejemplares e WHERE e.id_libro = s.id_libro
                    AND e.estatus = 'Disponible' AND e.tipo_uso = 'Préstamo externo'), '[]'::json)
                    AS ejemplares
           FROM solicitudes_prestamo s JOIN libros l ON l.id_libro = s.id_libro
                                      JOIN usuarios u ON u.clave_usuario = s.clave_usuario
          WHERE s.estatus = 'Pendiente'
          ORDER BY s.fecha_solicitud, s.id_solicitud_prestamo`, []);
    return resultado.rows;
};

const bloquear_solicitud = async (client, folio) =>
{
    const resultado = await client.query(
        `SELECT id_solicitud_prestamo AS folio, clave_usuario, id_libro, estatus
           FROM solicitudes_prestamo WHERE id_solicitud_prestamo = $1 FOR UPDATE`, [folio]);
    return resultado.rows[0] || null;
};

const autorizar = async (client, solicitud, id_ejemplar, clave_bibliotecario) =>
{
    const resultado = await client.query(
        `INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario,
                               id_solicitud_prestamo, fecha_prestamo, fecha_vencimiento)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, NULL) RETURNING id_prestamo`,
        [solicitud.clave_usuario, id_ejemplar, clave_bibliotecario, solicitud.folio]);
    return resultado.rows[0].id_prestamo;
};

const detalle = async (client, id_prestamo) =>
{
    const resultado = await client.query(
        `SELECT p.id_prestamo, p.id_ejemplar, p.clave_usuario, p.id_solicitud_prestamo AS folio,
                p.fecha_prestamo, p.fecha_vencimiento, p.estatus, l.titulo
           FROM prestamos p JOIN ejemplares e ON e.id_ejemplar = p.id_ejemplar
                            JOIN libros l ON l.id_libro = e.id_libro
          WHERE p.id_prestamo = $1`, [id_prestamo]);
    return resultado.rows[0];
};

module.exports = { mis_solicitudes, mis_prestamos, pendientes, bloquear_solicitud, autorizar, detalle };

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Consultas SQL de solicitudes y préstamos.        */
/******************************************************************/

/******************************************************************/
/* Listing Contents: mis_solicitudes, mis_prestamos, pendientes,  */
/* bloquear_solicitud, autorizar, registrar_directo, detalle,      */
/* activos.                                                         */
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

/* registrar_directo: el trigger valida usuario, ejemplar y límites. */
const registrar_directo = async (client, clave_usuario, id_ejemplar, clave_bibliotecario) =>
{
    const resultado = await client.query(
        `INSERT INTO prestamos (clave_usuario, id_ejemplar, clave_bibliotecario,
                                fecha_prestamo, fecha_vencimiento)
         VALUES ($1, $2, $3, CURRENT_DATE, NULL) RETURNING id_prestamo`,
        [clave_usuario, id_ejemplar, clave_bibliotecario]);
    return resultado.rows[0].id_prestamo;
};

const detalle = async (client, id_prestamo) =>
{
    const resultado = await client.query(
        `SELECT p.id_prestamo, p.id_ejemplar, p.clave_usuario, p.id_solicitud_prestamo AS folio,
                p.fecha_prestamo, p.fecha_vencimiento, p.estatus, l.titulo,
                u.nombre AS solicitante, t.nombre AS tipo_usuario,
                t.dias_prestamo, t.max_ejemplares, e.tipo_uso,
                concat_ws(' / ', ub.estante, ub.fila) AS ubicacion
           FROM prestamos p JOIN ejemplares e ON e.id_ejemplar = p.id_ejemplar
                            JOIN libros l ON l.id_libro = e.id_libro
                            JOIN usuarios u ON u.clave_usuario = p.clave_usuario
                            JOIN tipos_usuario t ON t.id_tipo_usuario = u.id_tipo_usuario
                       LEFT JOIN ubicaciones ub ON ub.id_ubicacion = e.id_ubicacion
          WHERE p.id_prestamo = $1`, [id_prestamo]);
    return resultado.rows[0];
};

const activos = async () =>
{
    const resultado = await pool.query(
        `SELECT p.id_prestamo, p.id_ejemplar, p.clave_usuario, u.nombre AS solicitante,
                l.titulo, p.fecha_prestamo, p.fecha_vencimiento, p.estatus,
                (SELECT count(*) FROM renovaciones r WHERE r.id_prestamo = p.id_prestamo)::int
                    AS renovaciones
           FROM prestamos p JOIN usuarios u ON u.clave_usuario = p.clave_usuario
                            JOIN ejemplares e ON e.id_ejemplar = p.id_ejemplar
                            JOIN libros l ON l.id_libro = e.id_libro
          WHERE p.estatus = 'Activo' ORDER BY p.fecha_vencimiento, p.id_prestamo`);
    return resultado.rows;
};

const espera = async (id_libro) =>
{
    const libro = await pool.query(
        `SELECT l.id_libro, l.titulo, l.estatus,
                count(e.id_ejemplar) FILTER (WHERE e.estatus = 'Disponible'
                    AND e.tipo_uso = 'Préstamo externo')::int AS disponibles,
                count(e.id_ejemplar) FILTER (WHERE e.tipo_uso = 'Préstamo externo')::int AS total
           FROM libros l LEFT JOIN ejemplares e ON e.id_libro = l.id_libro
          WHERE l.id_libro = $1 GROUP BY l.id_libro`, [id_libro]);
    if (!libro.rows[0]) return null;
    const filas = await pool.query(
        `SELECT w.id_espera, w.clave_usuario, u.nombre, w.fecha_registro, w.estatus
           FROM lista_espera w JOIN usuarios u ON u.clave_usuario = w.clave_usuario
          WHERE w.id_libro = $1 AND w.estatus IN ('En espera', 'Notificado')
          ORDER BY w.fecha_registro, w.id_espera`, [id_libro]);
    return { libro: libro.rows[0], solicitudes: filas.rows };
};

const registrar_espera = async (client, clave_usuario, id_libro) =>
{
    const resultado = await client.query(
        `INSERT INTO lista_espera (clave_usuario, id_libro)
         VALUES ($1, $2) RETURNING id_espera, fecha_registro, estatus`,
        [clave_usuario, id_libro]);
    return resultado.rows[0];
};

const contexto_espera = async (client, clave_usuario, id_libro) =>
{
    const usuario = await client.query(
        'SELECT estatus FROM usuarios WHERE clave_usuario = $1', [clave_usuario]);
    const libro = await client.query(
        'SELECT estatus FROM libros WHERE id_libro = $1 FOR UPDATE', [id_libro]);
    const disponibles = await client.query(
        `SELECT count(*)::int AS total FROM ejemplares
          WHERE id_libro = $1 AND estatus = 'Disponible' AND tipo_uso = 'Préstamo externo'`,
        [id_libro]);
    return { usuario: usuario.rows[0], libro: libro.rows[0],
        disponibles: disponibles.rows[0].total };
};

module.exports = { mis_solicitudes, mis_prestamos, pendientes, bloquear_solicitud,
    autorizar, registrar_directo, detalle, activos, espera, registrar_espera, contexto_espera };

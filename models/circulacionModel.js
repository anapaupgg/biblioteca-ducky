/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: SQL para renovación y devolución de préstamos.   */
/******************************************************************/

/******************************************************************/
/* Listing Contents: buscar_activo, renovar, devolver.            */
/* Reuse Instructions: las mutaciones reciben client transaccional; */
/* los triggers calculan vencimientos, multas y avisos.            */
/******************************************************************/

const { pool } = require('../db');

const DETALLE_ACTIVO =
    `SELECT p.id_prestamo, p.clave_usuario, u.nombre AS solicitante,
            p.id_ejemplar, l.titulo, p.fecha_prestamo, p.fecha_vencimiento,
            p.estatus, t.nombre AS tipo_usuario, t.max_renovaciones,
            (SELECT count(*) FROM renovaciones r WHERE r.id_prestamo = p.id_prestamo)::int
                AS renovaciones,
            (SELECT count(*) FROM lista_espera w WHERE w.id_libro = e.id_libro
                AND w.estatus IN ('En espera', 'Notificado'))::int AS en_espera
       FROM prestamos p JOIN usuarios u ON u.clave_usuario = p.clave_usuario
                        JOIN ejemplares e ON e.id_ejemplar = p.id_ejemplar
                        JOIN libros l ON l.id_libro = e.id_libro
                        JOIN tipos_usuario t ON t.id_tipo_usuario = u.id_tipo_usuario
      WHERE p.id_ejemplar = $1 AND p.estatus = 'Activo'`;

const buscar_activo = async (id_ejemplar) =>
{
    const resultado = await pool.query(DETALLE_ACTIVO, [id_ejemplar]);
    return resultado.rows[0] || null;
};

const renovar = async (client, id_prestamo, clave_autoriza) =>
{
    const resultado = await client.query(
        `INSERT INTO renovaciones (id_prestamo, fecha_renovacion,
                                  vencimiento_anterior, vencimiento_nuevo, clave_autoriza)
         VALUES ($1, CURRENT_DATE, CURRENT_DATE, NULL, $2)
         RETURNING id_renovacion, vencimiento_anterior, vencimiento_nuevo`,
        [id_prestamo, clave_autoriza]);
    return resultado.rows[0];
};

const devolver = async (client, id_prestamo, condicion, clave_bibliotecario) =>
{
    const anterior = await client.query(
        'SELECT coalesce(max(id_multa), 0) AS id FROM multas WHERE id_prestamo = $1',
        [id_prestamo]);
    const resultado = await client.query(
        `INSERT INTO devoluciones (id_prestamo, fecha_devolucion, condicion_recibida,
                                  clave_bibliotecario)
         VALUES ($1, CURRENT_DATE, $2, $3)
         RETURNING id_devolucion, fecha_devolucion, condicion_recibida`,
        [id_prestamo, condicion, clave_bibliotecario]);
    const multa = await client.query(
        `SELECT id_multa, tipo, monto, estatus FROM multas
          WHERE id_prestamo = $1 AND id_multa > $2 ORDER BY id_multa DESC LIMIT 1`,
        [id_prestamo, anterior.rows[0].id]);
    return { ...resultado.rows[0], multa: multa.rows[0] || null };
};

module.exports = { buscar_activo, renovar, devolver };

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
            l.precio_ultima_compra_usd,
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

const reportar_perdida = async (client, id_prestamo, tipo_cambio, clave_bibliotecario) =>
{
    const resultado = await client.query(
        'SELECT reportar_perdida($1, $2, $3) AS id_multa',
        [id_prestamo, tipo_cambio, clave_bibliotecario]);
    const multa = await client.query(
        'SELECT id_multa, monto, precio_usd_aplicado, tipo_cambio FROM multas WHERE id_multa = $1',
        [resultado.rows[0].id_multa]);
    return multa.rows[0];
};

const multas = async () =>
{
    const resultado = await pool.query(
        `SELECT m.id_multa, m.tipo, m.dias_retraso, m.monto, m.estatus,
                u.clave_usuario, u.nombre AS usuario, n.estatus AS tesoreria,
                n.fecha_envio, pg.folio_tesoreria
           FROM multas m JOIN prestamos p ON p.id_prestamo = m.id_prestamo
                         JOIN usuarios u ON u.clave_usuario = p.clave_usuario
                    LEFT JOIN notificaciones_tesoreria n ON n.id_multa = m.id_multa
                    LEFT JOIN pagos_multa pg ON pg.id_multa = m.id_multa
          ORDER BY m.id_multa DESC`);
    return resultado.rows;
};

const registrar_pago = async (client, id_multa, folio_tesoreria, clave_bibliotecario) =>
{
    const resultado = await client.query(
        `INSERT INTO pagos_multa (id_multa, folio_tesoreria, clave_bibliotecario)
         VALUES ($1, $2, $3) RETURNING id_pago, id_multa, folio_tesoreria, fecha_pago`,
        [id_multa, folio_tesoreria, clave_bibliotecario]);
    return resultado.rows[0];
};

const avisar_adeudos = async (client, clave_bibliotecario) =>
{
    const resultado = await client.query(
        'SELECT generar_avisos_suspension($1) AS total', [clave_bibliotecario]);
    return resultado.rows[0];
};

module.exports = { buscar_activo, renovar, devolver, reportar_perdida,
    multas, registrar_pago, avisar_adeudos };

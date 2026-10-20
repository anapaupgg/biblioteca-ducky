/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Model for purchases: PRESUPUESTOS_MENSUALES,      */
/*              PEDIDOS_TESORERIA, DETALLE_PEDIDO and             */
/*              DETALLE_PEDIDO_AUTOR. The budget limit and "at    */
/*              least one line" are enforced by the database.     */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   presupuestos()                   - Budgets with balance      */
/*   presupuesto_del_mes(periodo)     - Budget of a month         */
/*   listar()                         - Orders with totals        */
/*   buscar(id)                       - Order with its lines      */
/*   crear(client, d)                 - INSERT pedido + lines     */
/*   cambiar_estatus(client, id, e)   - Autorizado / Rechazado... */
/******************************************************************/

const { pool } = require('../db');
const libro_model = require('./libroModel');

const presupuestos = () => pool.query('SELECT * FROM v_presupuesto_saldo ORDER BY periodo DESC');

const presupuesto_del_mes = async (periodo) =>
{
    const r = await pool.query('SELECT * FROM v_presupuesto_saldo WHERE periodo = $1', [periodo]);
    return r.rows[0] || null;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* listar()                                                       */
/* Purpose: Orders with folio OCT-2026-014 style, total and lines */
/******************************************************************/
const listar = () =>
    pool.query(
        `SELECT p.id_pedido,
                upper(to_char(p.fecha_envio, 'TMMon')) || '-' || to_char(p.fecha_envio, 'YYYY') || '-' || lpad(p.id_pedido::text, 3, '0') AS folio,
                p.fecha_envio, p.estatus, p.fecha_recepcion, pm.periodo, s.nombre AS solicitante,
                count(d.numero_linea)::int AS lineas, coalesce(sum(d.cantidad), 0)::int AS ejemplares,
                coalesce(sum(d.cantidad * d.costo_unitario_mxn), 0) AS total
           FROM pedidos_tesoreria p
           JOIN presupuestos_mensuales pm USING (id_presupuesto)
           JOIN usuarios s ON s.clave_usuario = p.clave_solicitante
           LEFT JOIN detalle_pedido d USING (id_pedido)
          GROUP BY p.id_pedido, pm.periodo, s.nombre
          ORDER BY p.fecha_envio DESC`);

/******************************************************************/
/* Reuse Instructions                                             */
/* buscar(id)                                                     */
/* Returns: { pedido, lineas[] } or null                          */
/******************************************************************/
const buscar = async (id) =>
{
    const pedido = (await listar()).rows.find((p) => p.id_pedido === Number(id));
    if (!pedido) return null;
    const lineas = await pool.query(
        `SELECT d.numero_linea, d.id_libro, d.isbn_solicitado, d.titulo_solicitado, e.nombre AS editorial,
                d.cantidad, d.costo_unitario_mxn, d.cantidad * d.costo_unitario_mxn AS subtotal,
                d.clave_peticionario, u.nombre AS peticionario,
                (SELECT string_agg(a.nombre, ', ') FROM detalle_pedido_autor dpa JOIN autores a USING (id_autor)
                  WHERE dpa.id_pedido = d.id_pedido AND dpa.numero_linea = d.numero_linea) AS autores
           FROM detalle_pedido d
           LEFT JOIN editoriales e ON e.id_editorial = d.id_editorial_solicitada
           LEFT JOIN usuarios u ON u.clave_usuario = d.clave_peticionario
          WHERE d.id_pedido = $1 ORDER BY d.numero_linea`, [id]);
    return { pedido, lineas: lineas.rows };
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(client, { id_presupuesto, clave, lineas[] })             */
/* Purpose: Insert the order and its lines in ONE transaction.    */
/*          Each line: { id_libro?, isbn, titulo, editorial?,     */
/*          autores[], cantidad, costo_unitario, peticionario? }  */
/* Returns: id_pedido                                             */
/******************************************************************/
const crear = async (client, d) =>
{
    const r = await client.query(
        'INSERT INTO pedidos_tesoreria (id_presupuesto, clave_solicitante) VALUES ($1, $2) RETURNING id_pedido',
        [d.id_presupuesto, d.clave]);
    const id_pedido = r.rows[0].id_pedido;

    for (const [indice, linea] of d.lineas.entries())
    {
        const numero = indice + 1;
        const id_editorial = linea.editorial ? await libro_model.id_por_nombre(client, 'editoriales', linea.editorial) : null;
        await client.query(
            `INSERT INTO detalle_pedido (id_pedido, numero_linea, id_libro, isbn_solicitado, titulo_solicitado,
                                         id_editorial_solicitada, cantidad, costo_unitario_mxn, clave_peticionario)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id_pedido, numero, linea.id_libro || null, linea.isbn || null, linea.titulo, id_editorial,
             linea.cantidad, linea.costo_unitario, linea.peticionario || null]);
        for (const autor of linea.autores || [])
        {
            const id_autor = await libro_model.id_por_nombre(client, 'autores', autor);
            await client.query(
                'INSERT INTO detalle_pedido_autor (id_pedido, numero_linea, id_autor) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [id_pedido, numero, id_autor]);
        }
    }
    return id_pedido;
};

const cambiar_estatus = (client, id, estatus) =>
    client.query(
        `UPDATE pedidos_tesoreria SET estatus = $2::varchar,
                fecha_recepcion = CASE WHEN $2::varchar = 'Recibido' THEN CURRENT_DATE ELSE NULL END
          WHERE id_pedido = $1`, [id, estatus]);

module.exports = { presupuestos, presupuesto_del_mes, listar, buscar, crear, cambiar_estatus };

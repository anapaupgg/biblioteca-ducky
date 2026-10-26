/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo PostgreSQL: consultas y persistencia parametrizadas. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   presupuestos() */
/*   presupuesto_del_mes(periodo) */
/*   listar(client = pool, id = null) */
/*   buscar(id, client = pool) */
/*   crear(client, datos) */
/*   bloquear_pedido(client, id, esperado) */
/*   cambiar_estatus(client, id, estatus) */
/*   recibir(client, id, id_ubicacion) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Entradas validadas por controlador; devuelve Promise de datos SQL. */
/* client: conexión pg de la transacción cuando la firma la requiere. */
/* No liberar ni confirmar un client recibido; propagar errores SQL. */
/******************************************************************/

const
{
    pool
} = require('../db');
const libro_model = require('./libroModel');
const
{
    error_negocio
} = require('../utils/errores');

const presupuestos = () => pool.query('SELECT * FROM v_presupuesto_saldo ORDER BY periodo DESC');

const presupuesto_del_mes = async (periodo) =>
{
    const resultado = await pool.query('SELECT * FROM v_presupuesto_saldo WHERE periodo = $1', [
        periodo
    ]);
    return resultado.rows[0] || null;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* listar()                                                       */
/* Purpose: Orders with folio OCT-2026-014 style, total and lines */
/******************************************************************/
const listar = (client = pool, id = null) =>
    client.query(
        `SELECT p.id_pedido,
                upper(to_char(p.fecha_envio, 'TMMon')) || '-' || to_char(p.fecha_envio, 'YYYY') || '-' || lpad(p.id_pedido::text, 3, '0') AS folio,
                p.fecha_envio, p.estatus, p.fecha_recepcion, pm.periodo, s.nombre AS solicitante,
                count(d.numero_linea)::int AS lineas, coalesce(sum(d.cantidad), 0)::int AS ejemplares,
                coalesce(sum(d.cantidad * d.costo_unitario_mxn), 0) AS total
           FROM pedidos_tesoreria p
           JOIN presupuestos_mensuales pm USING (id_presupuesto)
           JOIN usuarios s ON s.clave_usuario = p.clave_solicitante
           LEFT JOIN detalle_pedido d USING (id_pedido)
          WHERE ($1::integer IS NULL OR p.id_pedido = $1)
          GROUP BY p.id_pedido, pm.periodo, s.nombre
          ORDER BY p.fecha_envio DESC`, [id]);

/******************************************************************/
/* Reuse Instructions                                             */
/* buscar(id)                                                     */
/* Returns: { pedido, lineas[] } or null                          */
/******************************************************************/
const buscar = async (id, client = pool) =>
{
    const pedido = (await listar(client, id)).rows[0];
    if (!pedido) return null;
    const lineas = await client.query(
        `SELECT d.numero_linea, d.id_libro, d.isbn_solicitado, d.titulo_solicitado, e.nombre AS editorial,
                d.cantidad, d.costo_unitario_mxn, d.cantidad * d.costo_unitario_mxn AS subtotal,
                d.clave_peticionario, u.nombre AS peticionario,
                (SELECT string_agg(a.nombre, ', ') FROM detalle_pedido_autor dpa JOIN autores a USING (id_autor)
                  WHERE dpa.id_pedido = d.id_pedido AND dpa.numero_linea = d.numero_linea) AS autores
           FROM detalle_pedido d
           LEFT JOIN editoriales e ON e.id_editorial = d.id_editorial_solicitada
           LEFT JOIN usuarios u ON u.clave_usuario = d.clave_peticionario
          WHERE d.id_pedido = $1 ORDER BY d.numero_linea`, [id]);
    return (
    {
        pedido,
        lineas: lineas.rows
    });
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(client, { id_presupuesto, clave, lineas[] })             */
/* Purpose: Insert the order and its lines in ONE transaction.    */
/*          Each line: { id_libro?, isbn, titulo, editorial?,     */
/*          autores[], cantidad, costo_unitario, peticionario? }  */
/* Returns: id_pedido                                             */
/******************************************************************/
const crear = async (client, datos) =>
{
    // Separate statement: after waiting, subsequent queries see committed lines.
    const presupuesto = await client.query(
        'SELECT id_presupuesto FROM presupuestos_mensuales WHERE id_presupuesto = $1 FOR UPDATE',
        [datos.id_presupuesto]);
    if (!presupuesto.rowCount) throw new error_negocio(422, 'Presupuesto no disponible');
    const resultado_2 = await client.query(
        'INSERT INTO pedidos_tesoreria (id_presupuesto, clave_solicitante) VALUES ($1, $2) RETURNING id_pedido',
        [datos.id_presupuesto, datos.clave]);
    const id_pedido = resultado_2.rows[0].id_pedido;

    for (const [indice, linea] of datos.lineas.entries())
    {
        const numero = indice + 1;
        const id_editorial = linea.editorial ? await libro_model.id_por_nombre(client, 'editoriales',
            linea.editorial) : null;
        await client.query(
            `INSERT INTO detalle_pedido (id_pedido, numero_linea, id_libro, isbn_solicitado, titulo_solicitado,
                                         id_editorial_solicitada, cantidad, costo_unitario_mxn, clave_peticionario)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id_pedido, numero, linea.id_libro || null, linea.isbn || null, linea.titulo,
                id_editorial,
                linea.cantidad, linea.costo_unitario, linea.peticionario || null
            ]);
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

const bloquear_pedido = async (client, id, esperado) =>
{
    const resultado_3 = await client.query(
        'SELECT estatus FROM pedidos_tesoreria WHERE id_pedido = $1 FOR UPDATE', [id]);
    if (!resultado_3.rowCount) throw new error_negocio(404, 'Solicitud no encontrada');
    if (resultado_3.rows[0].estatus !== esperado)
        throw new error_negocio(409, 'La solicitud ya cambió de estado. Actualiza la lista.');
};

const cambiar_estatus = async (client, id, estatus) =>
{
    const esperado = estatus === 'Recibido' ? 'Autorizado' : 'Enviado';
    if (!['Recibido', 'Autorizado', 'Rechazado'].includes(estatus))
        throw new error_negocio(400, 'Estatus no válido');
    await bloquear_pedido(client, id, esperado);
    await client.query(
        `UPDATE pedidos_tesoreria SET estatus = $2::varchar,
                fecha_recepcion = CASE WHEN $2::varchar = 'Recibido' THEN CURRENT_DATE ELSE NULL END
          WHERE id_pedido = $1`, [id, estatus]);
};

// Caller owns the transaction: a failed copy insert rolls back the whole receipt.
const recibir = async (client, id, id_ubicacion) =>
{
    await bloquear_pedido(client, id, 'Autorizado');
    const actual = await buscar(id, client);
    const con_ficha = actual.lineas.filter(linea_2 => linea_2.id_libro);
    // Consistent book lock order prevents deadlocks between different orders.
    const libros = [...new Set(con_ficha.map(linea_3 => linea_3.id_libro))].sort();
    const formatos = new Map();
    for (const libro of libros)
    {
        const resultado_4 = await client.query(
            'SELECT formato FROM libros WHERE id_libro = $1 FOR UPDATE', [libro]);
        if (!resultado_4.rowCount) throw new error_negocio(422,
            'La ficha del libro ya no está disponible');
        formatos.set(libro, resultado_4.rows[0].formato);
    }
    if ([...formatos.values()].some(formato => formato !== 'Digital') && !id_ubicacion)
        throw new error_negocio(400, 'Elige la ubicación de los ejemplares físicos', ['id_ubicacion']);
    const nuevos = [];
    for (const linea of con_ficha)
    {
        const digital = formatos.get(linea.id_libro) === 'Digital';
        nuevos.push(...await libro_model.agregar_ejemplares(client,
        {
            id_libro: linea.id_libro,
            cantidad: linea.cantidad,
            id_ubicacion: Number(id_ubicacion),
            digital,
            tipo_uso: digital ? 'Préstamo digital' : 'Préstamo externo'
        }));
    }
    await cambiar_estatus(client, id, 'Recibido');
    await client.query("SELECT registrar_bitacora('Recepción de pedido', $1)",
        ['Pedido ' + id + ' · ' + nuevos.length + ' ejemplares']);
    return (
    {
        ejemplares: nuevos,
        sin_ficha: actual.lineas.filter(linea_4 => !linea_4.id_libro)
    });
};

module.exports =
{
    presupuestos,
    presupuesto_del_mes,
    listar,
    buscar,
    crear,
    cambiar_estatus,
    recibir
};

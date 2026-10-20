/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller for "Solicitudes a Tesorería" and      */
/*              "Recepción de libros adquiridos". The library     */
/*              does not buy: it consolidates users' petitions    */
/*              into an order within the monthly budget, records  */
/*              Tesorería's answer and the catalog receives the   */
/*              copies.                                           */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   presupuestos(req, res)       - GET  /api/pedidos/presupuestos*/
/*   listar(req, res)             - GET  /api/pedidos             */
/*   detalle(req, res)            - GET  /api/pedidos/:id         */
/*   crear(req, res)              - POST /api/pedidos             */
/*   estatus(req, res)            - PUT  /api/pedidos/:id/estatus */
/*   recibir(req, res)            - POST /api/pedidos/:id/recepcion*/
/******************************************************************/

const { con_usuario } = require('../db');
const pedido_model    = require('../models/pedidoModel');
const libro_model     = require('../models/libroModel');
const { responder_error, ErrorNegocio } = require('../utils/errores');
const { es_isbn, entero_positivo }      = require('../utils/validators');

const periodo_actual = () => new Date().toISOString().slice(0, 7);

const presupuestos = async (req, res) =>
{
    try { res.status(200).json((await pedido_model.presupuestos()).rows); }
    catch (error) { responder_error(res, error, 'pedidos.presupuestos'); }
};

const listar = async (req, res) =>
{
    try { res.status(200).json((await pedido_model.listar()).rows); }
    catch (error) { responder_error(res, error, 'pedidos.listar'); }
};

const detalle = async (req, res) =>
{
    try
    {
        const pedido = await pedido_model.buscar(Number(req.params.id));
        if (!pedido) throw new ErrorNegocio(404, 'Solicitud no encontrada');
        res.status(200).json(pedido);
    }
    catch (error) { responder_error(res, error, 'pedidos.detalle'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Send an order to Tesorería with its lines. Uses the   */
/*          budget of the current month unless one is given.      */
/* Returns: 201 { id_pedido }   400 "Agrega al menos un libro"    */
/*          422 "Presupuesto insuficiente..." (database)          */
/******************************************************************/
const crear = async (req, res) =>
{
    try
    {
        const entrada = Array.isArray(req.body.lineas) ? req.body.lineas : [];
        if (entrada.length === 0) throw new ErrorNegocio(400, 'Agrega al menos un libro');

        const lineas = entrada.map((l, i) =>
        {
            const linea =
            {
                id_libro: String(l.id_libro || '').trim().toUpperCase() || null,
                isbn: String(l.isbn || '').replace(/[-\s]/g, '') || null,
                titulo: String(l.titulo || '').trim(),
                editorial: String(l.editorial || '').trim() || null,
                autores: (Array.isArray(l.autores) ? l.autores : String(l.autores || '').split(',')).map((a) => a.trim()).filter(Boolean),
                cantidad: Number(l.cantidad),
                costo_unitario: Number(l.costo_unitario),
                peticionario: String(l.peticionario || '').trim() || null
            };
            if (!linea.titulo) throw new ErrorNegocio(400, 'Línea ' + (i + 1) + ': escribe el título');
            if (linea.isbn && !es_isbn(linea.isbn)) throw new ErrorNegocio(400, 'Línea ' + (i + 1) + ': el ISBN debe tener 10 o 13 dígitos');
            if (!entero_positivo(linea.cantidad)) throw new ErrorNegocio(400, 'Línea ' + (i + 1) + ': la cantidad debe ser mayor a cero');
            if (!(linea.costo_unitario >= 0)) throw new ErrorNegocio(400, 'Línea ' + (i + 1) + ': captura el costo estimado');
            return linea;
        });

        let id_presupuesto = Number(req.body.id_presupuesto) || null;
        if (!id_presupuesto)
        {
            const presupuesto = await pedido_model.presupuesto_del_mes(periodo_actual());
            if (!presupuesto) throw new ErrorNegocio(422, 'No hay presupuesto autorizado para ' + periodo_actual() + '. Regístralo primero.');
            id_presupuesto = presupuesto.id_presupuesto;
        }

        const id_pedido = await con_usuario(req.usuario.clave,
            (client) => pedido_model.crear(client, { id_presupuesto, clave: req.usuario.clave, lineas }));
        res.status(201).json({ mensaje: 'Solicitud enviada a Tesorería', ...(await pedido_model.buscar(id_pedido)) });
    }
    catch (error) { responder_error(res, error, 'pedidos.crear'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* estatus(req, res)                                              */
/* Purpose: Record Tesorería's answer: Autorizado or Rechazado.   */
/*          A rejected order frees the budget (v_presupuesto_saldo*/
/*          ignores rejected orders).                             */
/******************************************************************/
const estatus = async (req, res) =>
{
    try
    {
        const nuevo = req.body.estatus;
        if (!['Autorizado', 'Rechazado'].includes(nuevo)) throw new ErrorNegocio(400, 'Estatus no válido');
        const actual = await pedido_model.buscar(Number(req.params.id));
        if (!actual) throw new ErrorNegocio(404, 'Solicitud no encontrada');
        if (actual.pedido.estatus !== 'Enviado') throw new ErrorNegocio(422, 'Solo se puede responder una solicitud en estatus Enviado');

        await con_usuario(req.usuario.clave, (client) => pedido_model.cambiar_estatus(client, actual.pedido.id_pedido, nuevo));
        res.status(200).json({ mensaje: 'Solicitud ' + (nuevo === 'Autorizado' ? 'autorizada' : 'rechazada') + ' por Tesorería' });
    }
    catch (error) { responder_error(res, error, 'pedidos.estatus'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* recibir(req, res)                                              */
/* Purpose: "Confirmar recepción" (Administrador del catálogo).   */
/*          Lines linked to an existing book get their copies     */
/*          labeled at { id_ubicacion }; lines of new titles are  */
/*          returned so a ficha can be created for them.          */
/******************************************************************/
const recibir = async (req, res) =>
{
    try
    {
        const actual = await pedido_model.buscar(Number(req.params.id));
        if (!actual) throw new ErrorNegocio(404, 'Solicitud no encontrada');
        if (actual.pedido.estatus !== 'Autorizado') throw new ErrorNegocio(422, 'Solo se reciben solicitudes autorizadas por Tesorería');

        const con_ficha = actual.lineas.filter((l) => l.id_libro);
        if (con_ficha.length > 0 && !req.body.id_ubicacion) throw new ErrorNegocio(400, 'Elige la ubicación de los ejemplares', ['id_ubicacion']);

        const etiquetados = await con_usuario(req.usuario.clave, async (client) =>
        {
            const nuevos = [];
            for (const linea of con_ficha)
            {
                const ficha = await libro_model.buscar(linea.id_libro);
                const ids = await libro_model.agregar_ejemplares(client,
                {
                    id_libro: linea.id_libro, cantidad: linea.cantidad, id_ubicacion: Number(req.body.id_ubicacion),
                    digital: ficha.libro.formato === 'Digital',
                    tipo_uso: ficha.libro.formato === 'Digital' ? 'Préstamo digital' : 'Préstamo externo'
                });
                nuevos.push(...ids);
            }
            await pedido_model.cambiar_estatus(client, actual.pedido.id_pedido, 'Recibido');
            await client.query("SELECT registrar_bitacora('Recepción de pedido', $1)",
                ['Pedido ' + actual.pedido.id_pedido + ' · ' + nuevos.length + ' ejemplares']);
            return nuevos;
        });

        res.status(200).json(
        {
            mensaje: 'Recepción confirmada',
            ejemplares: etiquetados,
            sin_ficha: actual.lineas.filter((l) => !l.id_libro)
        });
    }
    catch (error) { responder_error(res, error, 'pedidos.recibir'); }
};

module.exports = { presupuestos, listar, detalle, crear, estatus, recibir };

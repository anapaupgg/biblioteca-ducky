/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   periodo_actual() */
/*   presupuestos(solicitud, respuesta) */
/*   crear_presupuesto(solicitud, respuesta) */
/*   listar(solicitud_2, respuesta_2) */
/*   detalle(solicitud_3, respuesta_3) */
/*   crear(solicitud_4, respuesta_4) */
/*   estatus(solicitud_5, respuesta_5) */
/*   recibir(solicitud_6, respuesta_6) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Funciones HTTP(solicitud, respuesta): Request/Response de Express. */
/* Rutas protegidas requieren usuario y funciones cargados por middleware. */
/* Datos inválidos producen 4xx; fallos internos se gestionan sin secretos. */
/******************************************************************/

const
{
    con_usuario
} = require('../db');
const pedido_model = require('../models/pedidoModel');
const
{
    responder_error,
    error_negocio
} = require('../utils/errores');
const
{
    es_isbn,
    entero_positivo
} = require('../utils/validators');

const formato_periodo = new Intl.DateTimeFormat('sv-SE',
    { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit' });
const periodo_actual = () => formato_periodo.format(new Date());

const presupuestos = async (solicitud, respuesta) =>
{
    try
    {
        respuesta.status(200).json((await pedido_model.presupuestos()).rows);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'pedidos.presupuestos');
    }
};

/* Registra una sola asignación para el mes actual; nunca reemplaza el saldo. */
const crear_presupuesto = async (solicitud, respuesta) =>
{
    try
    {
        const entrada = String(solicitud.body?.monto_autorizado ?? '').trim();
        if (!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(entrada) ||
            Number(entrada) <= 0)
        {
            throw new error_negocio(400,
                'Captura un monto mayor a cero con máximo dos decimales', ['monto_autorizado']);
        }
        const periodo = periodo_actual();
        const presupuesto = await con_usuario(solicitud.usuario.clave, (client) =>
            pedido_model.crear_presupuesto(client, periodo, Number(entrada),
                solicitud.usuario.clave));
        respuesta.status(201).json(presupuesto);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'pedidos.crear_presupuesto');
    }
};

const listar = async (solicitud_2, respuesta_2) =>
{
    try
    {
        respuesta_2.status(200).json((await pedido_model.listar()).rows);
    }
    catch (error)
    {
        responder_error(respuesta_2, error, 'pedidos.listar');
    }
};

const detalle = async (solicitud_3, respuesta_3) =>
{
    try
    {
        const pedido = await pedido_model.buscar(Number(solicitud_3.params.id));
        if (!pedido) throw new error_negocio(404, 'Solicitud no encontrada');
        respuesta_3.status(200).json(pedido);
    }
    catch (error)
    {
        responder_error(respuesta_3, error, 'pedidos.detalle');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Send an order to Tesorería with its lines. Uses the   */
/*          budget of the current month unless one is given.      */
/* Returns: 201 { id_pedido }   400 "Agrega al menos un libro"    */
/*          422 "Presupuesto insuficiente..." (database)          */
/******************************************************************/
const crear = async (solicitud_4, respuesta_4) =>
{
    try
    {
        const entrada = Array.isArray(solicitud_4.body.lineas) ? solicitud_4.body.lineas : [];
        if (entrada.length === 0) throw new error_negocio(400, 'Agrega al menos un libro');

        const lineas = entrada.map((linea_2, indice) =>
        {
            if (!linea_2 || typeof linea_2 !== 'object' || Array.isArray(linea_2))
                throw new error_negocio(400, 'Línea ' + (indice + 1) + ': datos inválidos');
            const linea =
            {
                id_libro: String(linea_2.id_libro || '').trim().toUpperCase() || null,
                isbn: String(linea_2.isbn || '').replace(/[-\s]/g, '').toUpperCase() || null,
                titulo: String(linea_2.titulo || '').trim(),
                editorial: String(linea_2.editorial || '').trim() || null,
                autores: (Array.isArray(linea_2.autores) ? linea_2.autores : String(
                    linea_2.autores || '').split(',')).map((primero) => String(primero || '')
                    .trim()).filter(Boolean),
                cantidad: Number(linea_2.cantidad),
                costo_unitario: Number(linea_2.costo_unitario),
                peticionario: String(linea_2.peticionario || '').trim() || null
            };
            if (!linea.titulo) throw new error_negocio(400, 'Línea ' + (indice + 1) +
                ': escribe el título');
            if (linea.titulo.length > 150) throw new error_negocio(400, 'Línea ' + (indice + 1) +
                ': el título admite hasta 150 caracteres');
            if ((linea.editorial && linea.editorial.length > 100) ||
                linea.autores.some((autor) => autor.length > 100))
                throw new error_negocio(400, 'Línea ' + (indice + 1) +
                    ': cada autor y la editorial admiten hasta 100 caracteres');
            if (linea.isbn && !es_isbn(linea.isbn)) throw new error_negocio(400, 'Línea ' + (
                indice + 1) + ': el ISBN debe tener 10 o 13 dígitos');
            if (!entero_positivo(linea.cantidad) || linea.cantidad > 2147483647)
                throw new error_negocio(400, 'Línea ' + (indice + 1) + ': cantidad fuera de rango');
            if (linea_2.costo_unitario === null || linea_2.costo_unitario === undefined ||
                String(linea_2.costo_unitario).trim() === '' ||
                !Number.isFinite(linea.costo_unitario) || linea.costo_unitario < 0 ||
                linea.costo_unitario > 9999999999.99 ||
                Number(linea.costo_unitario.toFixed(2)) !== linea.costo_unitario)
                throw new error_negocio(400, 'Línea ' + (indice + 1) +
                    ': captura un costo válido con máximo dos decimales');
            return linea;
        });

        let id_presupuesto = Number(solicitud_4.body.id_presupuesto) || null;
        if (!id_presupuesto)
        {
            const periodo = periodo_actual();
            const presupuesto = await pedido_model.presupuesto_del_mes(periodo);
            if (!presupuesto) throw new error_negocio(422, 'No hay presupuesto autorizado para ' +
                periodo + '. Regístralo primero.');
            id_presupuesto = presupuesto.id_presupuesto;
        }

        const id_pedido = await con_usuario(solicitud_4.usuario.clave,
            (client) => pedido_model.crear(client,
            {
                id_presupuesto,
                clave: solicitud_4.usuario.clave,
                lineas
            }));
        respuesta_4.status(201).json(
        {
            mensaje: 'Solicitud enviada a Tesorería',
            ...(await pedido_model.buscar(id_pedido))
        });
    }
    catch (error)
    {
        responder_error(respuesta_4, error, 'pedidos.crear');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* estatus(req, res)                                              */
/* Purpose: Record Tesorería's answer: Autorizado or Rechazado.   */
/*          A rejected order frees the budget (v_presupuesto_saldo*/
/*          ignores rejected orders).                             */
/******************************************************************/
const estatus = async (solicitud_5, respuesta_5) =>
{
    try
    {
        const nuevo = solicitud_5.body.estatus;
        if (!['Autorizado', 'Rechazado'].includes(nuevo)) throw new error_negocio(400,
            'Estatus no válido');
        await con_usuario(solicitud_5.usuario.clave,
            (client) => pedido_model.cambiar_estatus(client, Number(solicitud_5.params.id), nuevo)
        );
        respuesta_5.status(200).json(
        {
            mensaje: 'Solicitud ' + (nuevo === 'Autorizado' ? 'autorizada' : 'rechazada') +
                ' por Tesorería'
        });
    }
    catch (error)
    {
        responder_error(respuesta_5, error, 'pedidos.estatus');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* recibir(req, res)                                              */
/* Purpose: "Confirmar recepción" (Administrador del catálogo).   */
/*          Lines linked to an existing book get their copies     */
/*          labeled at { id_ubicacion }; lines of new titles are  */
/*          returned so a ficha can be created for them.          */
/******************************************************************/
const recibir = async (solicitud_6, respuesta_6) =>
{
    try
    {
        const resultado = await con_usuario(solicitud_6.usuario.clave,
            (client) => pedido_model.recibir(client, Number(solicitud_6.params.id), solicitud_6
                .body.id_ubicacion));
        respuesta_6.status(200).json(
        {
            mensaje: 'Recepción confirmada',
            ...resultado
        });
    }
    catch (error)
    {
        responder_error(respuesta_6, error, 'pedidos.recibir');
    }
};

module.exports =
{
    presupuestos,
    crear_presupuesto,
    listar,
    detalle,
    crear,
    estatus,
    recibir
};

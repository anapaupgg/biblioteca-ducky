/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Coordina la consulta y autorización de préstamos.*/
/******************************************************************/

/******************************************************************/
/* Listing Contents: mios, solicitudes, autorizar.                */
/* Reuse Instructions: rutas protegidas por sesión/permisos.      */
/* mios usa exclusivamente la clave de sesión, nunca la entrada   */
/* del cliente. autorizar requiere folio e ID de ejemplar válido; */
/* responde 409 si la solicitud dejó de estar pendiente.         */
/******************************************************************/

const { con_usuario } = require('../db');
const prestamo_model = require('../models/prestamoModel');
const { responder_error, error_negocio } = require('../utils/errores');

const mios = async (solicitud, respuesta) =>
{
    try
    {
        const clave_usuario = solicitud.usuario.clave;
        const [solicitudes, prestamos] = await Promise.all([
            prestamo_model.mis_solicitudes(clave_usuario),
            prestamo_model.mis_prestamos(clave_usuario)
        ]);
        respuesta.status(200).json({ solicitudes, prestamos });
    }
    catch (error)
    {
        responder_error(respuesta, error, 'prestamos.mios');
    }
};

const solicitudes = async (solicitud, respuesta) =>
{
    try
    {
        respuesta.status(200).json(await prestamo_model.pendientes());
    }
    catch (error)
    {
        responder_error(respuesta, error, 'prestamos.solicitudes');
    }
};

const autorizar = async (solicitud, respuesta) =>
{
    try
    {
        const folio = Number(solicitud.params.id);
        const id_ejemplar = solicitud.body && solicitud.body.id_ejemplar;
        if (!Number.isSafeInteger(folio) || folio < 1 ||
            typeof id_ejemplar !== 'string' || !/^[A-Za-z0-9-]{1,10}$/.test(id_ejemplar))
        {
            throw new error_negocio(400, 'Folio o ejemplar inválido', ['id_ejemplar']);
        }
        const prestamo = await con_usuario(solicitud.usuario.clave, async (client) =>
        {
            const pendiente = await prestamo_model.bloquear_solicitud(client, folio);
            if (!pendiente) throw new error_negocio(404, 'La solicitud no existe');
            if (pendiente.estatus !== 'Pendiente')
            {
                throw new error_negocio(409, 'La solicitud ya fue atendida o cancelada');
            }
            const id_prestamo = await prestamo_model.autorizar(client, pendiente,
                id_ejemplar, solicitud.usuario.clave);
            return prestamo_model.detalle(client, id_prestamo);
        });
        respuesta.status(201).json(prestamo);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'prestamos.autorizar');
    }
};

module.exports = { mios, solicitudes, autorizar };

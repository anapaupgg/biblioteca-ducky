/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Coordina la consulta y autorización de préstamos.*/
/******************************************************************/

/******************************************************************/
/* Listing Contents: mios, solicitudes, autorizar, activos,       */
/* validar_directo y registrar_directo.                           */
/* Reuse Instructions: rutas protegidas por sesión/permisos.      */
/* mios usa exclusivamente la clave de sesión, nunca la entrada   */
/* del cliente. autorizar requiere folio e ID de ejemplar válido; */
/* responde 409 si la solicitud dejó de estar pendiente.         */
/******************************************************************/

const { con_usuario, simular } = require('../db');
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

const activos = async (solicitud, respuesta) =>
{
    try
    {
        respuesta.status(200).json(await prestamo_model.activos());
    }
    catch (error)
    {
        responder_error(respuesta, error, 'prestamos.activos');
    }
};

const datos_directos = (solicitud) =>
{
    const clave_usuario = String(solicitud.body?.clave_usuario || '').trim();
    const id_ejemplar = String(solicitud.body?.id_ejemplar || '').trim().toUpperCase();
    if (!/^[A-Za-z0-9]{6}$/.test(clave_usuario) || !/^[A-Z0-9-]{1,10}$/.test(id_ejemplar))
    {
        throw new error_negocio(400, 'Matrícula, nómina o clave del ejemplar inválida',
            ['clave_usuario', 'id_ejemplar']);
    }
    return { clave_usuario, id_ejemplar };
};

const ejecutar_directo = async (solicitud, respuesta, confirmar) =>
{
    try
    {
        const datos = datos_directos(solicitud);
        const operacion = confirmar ? con_usuario : simular;
        const prestamo = await operacion(solicitud.usuario.clave, async (client) =>
        {
            const id_prestamo = await prestamo_model.registrar_directo(client,
                datos.clave_usuario, datos.id_ejemplar, solicitud.usuario.clave);
            return prestamo_model.detalle(client, id_prestamo);
        });
        respuesta.status(confirmar ? 201 : 200).json(prestamo);
    }
    catch (error)
    {
        responder_error(respuesta, error, confirmar ? 'prestamos.registrar' : 'prestamos.validar');
    }
};

const validar_directo = (solicitud, respuesta) => ejecutar_directo(solicitud, respuesta, false);
const registrar_directo = (solicitud, respuesta) => ejecutar_directo(solicitud, respuesta, true);

const libro_valido = (valor) =>
{
    const id_libro = String(valor || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{7}$/.test(id_libro))
    {
        throw new error_negocio(400, 'Clave del libro inválida', ['id_libro']);
    }
    return id_libro;
};

const espera = async (solicitud, respuesta) =>
{
    try
    {
        const datos = await prestamo_model.espera(libro_valido(solicitud.params.libro));
        if (!datos) throw new error_negocio(404, 'El libro no existe');
        respuesta.status(200).json(datos);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'prestamos.espera');
    }
};

const registrar_espera = async (solicitud, respuesta) =>
{
    try
    {
        const id_libro = libro_valido(solicitud.body?.id_libro);
        const clave_usuario = String(solicitud.body?.clave_usuario || '').trim();
        if (!/^[A-Za-z0-9]{6}$/.test(clave_usuario))
        {
            throw new error_negocio(400, 'Matrícula o nómina inválida', ['clave_usuario']);
        }
        const registro = await con_usuario(solicitud.usuario.clave, async (client) =>
        {
            const contexto = await prestamo_model.contexto_espera(client, clave_usuario, id_libro);
            if (!contexto.usuario || contexto.usuario.estatus !== 'Activo')
            {
                throw new error_negocio(422, 'El usuario no está activo o no existe');
            }
            if (!contexto.libro || contexto.libro.estatus !== 'Activo en catálogo')
            {
                throw new error_negocio(422, 'El libro no está activo en el catálogo');
            }
            if (contexto.disponibles > 0)
            {
                throw new error_negocio(422, 'Hay ejemplares disponibles; registra un préstamo en vez de la lista de espera');
            }
            return prestamo_model.registrar_espera(client, clave_usuario, id_libro);
        });
        respuesta.status(201).json(registro);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'prestamos.registrar_espera');
    }
};

module.exports = { mios, solicitudes, autorizar, activos, validar_directo,
    registrar_directo, espera, registrar_espera };

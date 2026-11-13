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
const boleta_service = require('../services/boletaService');
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

const boleta_confirmada = async (solicitud) =>
{
    const id_prestamo = Number(solicitud.params.id);
    if (!Number.isSafeInteger(id_prestamo) || id_prestamo < 1)
    {
        throw new error_negocio(400, 'Folio de préstamo inválido');
    }
    const prestamo = await prestamo_model.detalle_registrado(id_prestamo);
    if (!prestamo || prestamo.estatus !== 'Activo')
    {
        throw new error_negocio(404, 'El préstamo activo no existe');
    }
    return prestamo;
};

const descargar_boleta = async (solicitud, respuesta) =>
{
    try
    {
        const prestamo = await boleta_confirmada(solicitud);
        const pdf = await boleta_service.crear_pdf(prestamo);
        respuesta.set('Content-Type', 'application/pdf');
        respuesta.set('Content-Disposition', 'attachment; filename="Boleta-' +
            prestamo.folio_prestamo + '.pdf"');
        respuesta.set('Cache-Control', 'no-store');
        respuesta.status(200).send(pdf);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'prestamos.descargar_boleta');
    }
};

const enviar_boleta = async (solicitud, respuesta) =>
{
    try
    {
        const prestamo = await boleta_confirmada(solicitud);
        if (!prestamo.correo)
        {
            throw new error_negocio(422, 'El solicitante no tiene correo registrado');
        }
        const configuracion = boleta_service.configuracion_correo();
        if (!configuracion)
        {
            throw new error_negocio(503, 'El envío de correo no está configurado');
        }
        const pdf = await boleta_service.crear_pdf(prestamo);
        await boleta_service.enviar(configuracion, prestamo, pdf);
        respuesta.status(200).json({ folio_prestamo: prestamo.folio_prestamo,
            solicitante: prestamo.solicitante, correo: prestamo.correo, estado: 'Enviado' });
    }
    catch (error)
    {
        if (error.message === 'ENVIO_BOLETA_FALLIDO')
        {
            responder_error(respuesta, new error_negocio(502,
                'Resend rechazó el envío. Revisa el remitente y el dominio verificado.'),
            'prestamos.enviar_boleta');
            return;
        }
        responder_error(respuesta, error, 'prestamos.enviar_boleta');
    }
};

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
    registrar_directo, descargar_boleta, enviar_boleta, espera, registrar_espera };

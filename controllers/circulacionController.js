/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: Coordina renovación y devolución.                */
/******************************************************************/

/******************************************************************/
/* Listing Contents: buscar, validar_renovacion, renovar,         */
/* validar_devolucion, devolver, perdida, multas, aviso_multa,     */
/* pago, avisos.                                                   */
/* Reuse Instructions: exige sesión con permiso Préstamos;         */
/* simular revierte siempre, confirmar guarda una sola vez.       */
/******************************************************************/

const { con_usuario, simular } = require('../db');
const circulacion_model = require('../models/circulacionModel');
const { responder_error, error_negocio } = require('../utils/errores');

const ejemplar_valido = (valor) =>
{
    const id = String(valor || '').trim().toUpperCase();
    if (!/^[A-Z0-9-]{1,10}$/.test(id))
    {
        throw new error_negocio(400, 'Clave del ejemplar inválida', ['id_ejemplar']);
    }
    return id;
};

const buscar = async (solicitud, respuesta) =>
{
    try
    {
        const prestamo = await circulacion_model.buscar_activo(
            ejemplar_valido(solicitud.params.ejemplar));
        if (!prestamo) throw new error_negocio(404, 'No hay préstamo activo para ese ejemplar');
        respuesta.status(200).json(prestamo);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'circulacion.buscar');
    }
};

const ejecutar = async (solicitud, respuesta, operacion, confirmar) =>
{
    try
    {
        const id_ejemplar = ejemplar_valido(solicitud.body?.id_ejemplar);
        const prestamo = await circulacion_model.buscar_activo(id_ejemplar);
        if (!prestamo) throw new error_negocio(404, 'No hay préstamo activo para ese ejemplar');
        const condicion = solicitud.body?.condicion || 'Bueno';
        if (operacion === 'devolver' && !['Bueno', 'Dañado'].includes(condicion))
        {
            throw new error_negocio(400, 'Condición de recepción inválida', ['condicion']);
        }
        const transaccion = confirmar ? con_usuario : simular;
        const resultado = await transaccion(solicitud.usuario.clave, async (client) =>
            operacion === 'renovar' ? circulacion_model.renovar(client, prestamo.id_prestamo,
                solicitud.usuario.clave) : circulacion_model.devolver(client, prestamo.id_prestamo,
                condicion, solicitud.usuario.clave));
        respuesta.status(confirmar ? 201 : 200).json({ prestamo, resultado });
    }
    catch (error)
    {
        responder_error(respuesta, error, 'circulacion.' + operacion);
    }
};

const validar_renovacion = (solicitud, respuesta) => ejecutar(solicitud, respuesta, 'renovar', false);
const renovar = (solicitud, respuesta) => ejecutar(solicitud, respuesta, 'renovar', true);
const validar_devolucion = (solicitud, respuesta) => ejecutar(solicitud, respuesta, 'devolver', false);
const devolver = (solicitud, respuesta) => ejecutar(solicitud, respuesta, 'devolver', true);

const ejecutar_perdida = async (solicitud, respuesta, confirmar) =>
{
    try
    {
        const id_ejemplar = ejemplar_valido(solicitud.body?.id_ejemplar);
        const tipo_cambio = Number(solicitud.body?.tipo_cambio);
        if (!Number.isFinite(tipo_cambio) || tipo_cambio <= 0 || tipo_cambio > 1000)
        {
            throw new error_negocio(400, 'Indica el tipo de cambio confirmado por Tesorería',
                ['tipo_cambio']);
        }
        const prestamo = await circulacion_model.buscar_activo(id_ejemplar);
        if (!prestamo) throw new error_negocio(404, 'No hay préstamo activo para ese ejemplar');
        const transaccion = confirmar ? con_usuario : simular;
        const multa = await transaccion(solicitud.usuario.clave, (client) =>
            circulacion_model.reportar_perdida(client, prestamo.id_prestamo,
                tipo_cambio, solicitud.usuario.clave));
        respuesta.status(confirmar ? 201 : 200).json({ prestamo, multa });
    }
    catch (error)
    {
        responder_error(respuesta, error, 'circulacion.perdida');
    }
};

const validar_perdida = (solicitud, respuesta) => ejecutar_perdida(solicitud, respuesta, false);
const confirmar_perdida = (solicitud, respuesta) => ejecutar_perdida(solicitud, respuesta, true);

const multas = async (solicitud, respuesta) =>
{
    try
    {
        respuesta.status(200).json(await circulacion_model.multas());
    }
    catch (error)
    {
        responder_error(respuesta, error, 'circulacion.multas');
    }
};

const aviso_multa = async (solicitud, respuesta) =>
{
    try
    {
        const id_multa = Number(solicitud.params.id);
        if (!Number.isSafeInteger(id_multa) || id_multa < 1)
            throw new error_negocio(400, 'Folio de multa inválido');
        const aviso = await con_usuario(solicitud.usuario.clave, (client) =>
            circulacion_model.aviso_multa(client, id_multa, solicitud.usuario.clave));
        if (!aviso) throw new error_negocio(404, 'No se encontró una multa por atraso');
        respuesta.set('Cache-Control', 'no-store');
        respuesta.status(201).json(aviso);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'circulacion.aviso_multa');
    }
};

const pago = async (solicitud, respuesta) =>
{
    try
    {
        const folio = String(solicitud.body?.folio_multa || '').trim();
        const coincidencia = /^(?:MUL-)?0*([1-9][0-9]*)$/i.exec(folio);
        const id_multa = coincidencia ? Number(coincidencia[1]) : NaN;
        const folio_tesoreria = String(solicitud.body?.folio_tesoreria || '').trim().toUpperCase();
        if (!Number.isSafeInteger(id_multa) || id_multa < 1 ||
            !/^[A-Z0-9-]{3,30}$/.test(folio_tesoreria))
        {
            throw new error_negocio(400, 'Folio de multa o Tesorería inválido',
                ['folio_multa', 'folio_tesoreria']);
        }
        const registro = await con_usuario(solicitud.usuario.clave, (client) =>
            circulacion_model.registrar_pago(client, id_multa, folio_tesoreria,
                solicitud.usuario.clave));
        respuesta.status(201).json(registro);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'circulacion.pago');
    }
};

const avisos = async (solicitud, respuesta) =>
{
    try
    {
        const resultado = await con_usuario(solicitud.usuario.clave, (client) =>
            circulacion_model.avisar_adeudos(client, solicitud.usuario.clave));
        respuesta.status(200).json(resultado);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'circulacion.avisos');
    }
};

module.exports = { buscar, validar_renovacion, renovar, validar_devolucion, devolver,
    validar_perdida, confirmar_perdida, multas, aviso_multa, pago, avisos };

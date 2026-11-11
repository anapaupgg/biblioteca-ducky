/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: Coordina renovación y devolución.                */
/******************************************************************/

/******************************************************************/
/* Listing Contents: buscar, validar_renovacion, renovar,         */
/* validar_devolucion, devolver.                                   */
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

module.exports = { buscar, validar_renovacion, renovar, validar_devolucion, devolver };

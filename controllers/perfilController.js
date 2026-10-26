/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   ids_funciones(lista) */
/*   listar(solicitud, respuesta) */
/*   funciones(solicitud_2, respuesta_2) */
/*   crear(solicitud_3, respuesta_3) */
/*   actualizar(solicitud_4, respuesta_4) */
/*   dar_baja(solicitud_5, respuesta_5) */
/*   reactivar(solicitud_6, respuesta_6) */
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
const perfil_model = require('../models/perfilModel');
const
{
    responder_error,
    error_negocio
} = require('../utils/errores');

/* Base profile that can never be deactivated                     */
const PERFIL_ADMIN_SISTEMA = 1;

/* Normalize the list of function ids sent by the form            */
const ids_funciones = (lista) => [...new Set((Array.isArray(lista) ? lista : []).map(Number).filter((
    cantidad) => Number.isInteger(cantidad) && cantidad > 0))];

const listar = async (solicitud, respuesta) =>
{
    try
    {
        respuesta.status(200).json((await perfil_model.listar()).rows);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'perfiles.listar');
    }
};

const funciones = async (solicitud_2, respuesta_2) =>
{
    try
    {
        respuesta_2.status(200).json((await perfil_model.funciones()).rows);
    }
    catch (error)
    {
        responder_error(respuesta_2, error, 'perfiles.funciones');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Create { nombre, descripcion, funciones:[ids] }       */
/* Returns: 201 with the new profile                              */
/******************************************************************/
const crear = async (solicitud_3, respuesta_3) =>
{
    try
    {
        const nombre = String(solicitud_3.body.nombre || '').trim();
        const lista = ids_funciones(solicitud_3.body.funciones);
        const campos = [];
        if (!nombre) campos.push('nombre');
        if (lista.length === 0) campos.push('funciones');
        if (!nombre) throw new error_negocio(400, 'El nombre del perfil es obligatorio', campos);
        if (lista.length === 0) throw new error_negocio(400, 'Selecciona al menos una función',
            campos);

        const id = await con_usuario(solicitud_3.usuario.clave, (client) => perfil_model.crear(client,
        {
            nombre,
            descripcion: String(solicitud_3.body.descripcion || '').trim(),
            funciones: lista,
            admin: solicitud_3.usuario.clave
        }));

        respuesta_3.status(201).json(
        {
            mensaje: 'Perfil ' + nombre + ' registrado exitosamente',
            perfil: (await perfil_model.buscar(id)).rows[0]
        });
    }
    catch (error)
    {
        if (error.constraint === 'perfiles_nombre_key') error = new error_negocio(409,
            'Nombre de perfil duplicado', ['nombre']);
        responder_error(respuesta_3, error, 'perfiles.crear');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar(req, res)                                           */
/* Purpose: Change description and functions of a profile         */
/******************************************************************/
const actualizar = async (solicitud_4, respuesta_4) =>
{
    try
    {
        const id = Number(solicitud_4.params.id);
        const lista = ids_funciones(solicitud_4.body.funciones);
        if (lista.length === 0) throw new error_negocio(400, 'Selecciona al menos una función', [
            'funciones'
        ]);
        if (id === PERFIL_ADMIN_SISTEMA) throw new error_negocio(403,
            'El perfil Administrador del sistema no se puede modificar');

        const actual = await perfil_model.buscar(id);
        if (actual.rows.length === 0) throw new error_negocio(404, 'Perfil no encontrado');

        await con_usuario(solicitud_4.usuario.clave, (client) => perfil_model.actualizar(client, id,
        {
            descripcion: String(solicitud_4.body.descripcion || '').trim(),
            funciones: lista
        }));

        respuesta_4.status(200).json(
        {
            mensaje: 'Perfil actualizado',
            perfil: (await perfil_model.buscar(id)).rows[0]
        });
    }
    catch (error)
    {
        responder_error(respuesta_4, error, 'perfiles.actualizar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* dar_baja(req, res)                                             */
/* Purpose: Deactivate a profile. Refused when it has users.      */
/******************************************************************/
const dar_baja = async (solicitud_5, respuesta_5) =>
{
    try
    {
        const id = Number(solicitud_5.params.id);
        if (id === PERFIL_ADMIN_SISTEMA) throw new error_negocio(403,
            'El perfil Administrador del sistema no se puede eliminar');

        const actual = (await perfil_model.buscar(id)).rows[0];
        if (!actual) throw new error_negocio(404, 'Perfil no encontrado');
        if (actual.estatus === 'Inactivo') throw new error_negocio(422, 'El perfil ya está inactivo');
        if (actual.usuarios > 0)
        {
            throw new error_negocio(422, 'No puede eliminarse un perfil con usuarios asignados (' +
                actual.usuarios + ')');
        }

        await con_usuario(solicitud_5.usuario.clave, (client) => perfil_model.dar_baja(client, id,
            solicitud_5.usuario.clave));
        respuesta_5.status(200).json(
        {
            mensaje: 'Perfil eliminado exitosamente'
        });
    }
    catch (error)
    {
        responder_error(respuesta_5, error, 'perfiles.dar_baja');
    }
};

const reactivar = async (solicitud_6, respuesta_6) =>
{
    try
    {
        await con_usuario(solicitud_6.usuario.clave, (client) => perfil_model.reactivar(client,
            Number(solicitud_6.params.id)));
        respuesta_6.status(200).json(
        {
            mensaje: 'Perfil reactivado'
        });
    }
    catch (error)
    {
        responder_error(respuesta_6, error, 'perfiles.reactivar');
    }
};

module.exports =
{
    listar,
    funciones,
    crear,
    actualizar,
    dar_baja,
    reactivar
};

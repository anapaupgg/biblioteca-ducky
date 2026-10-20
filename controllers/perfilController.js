/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Perfiles y sus funciones.                         */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   listar(req, res)      - GET  /api/perfiles                   */
/*   funciones(req, res)   - GET  /api/perfiles/funciones         */
/*   crear(req, res)       - POST /api/perfiles                   */
/*   actualizar(req, res)  - PUT  /api/perfiles/:id               */
/*   dar_baja(req, res)    - POST /api/perfiles/:id/baja          */
/*   reactivar(req, res)   - POST /api/perfiles/:id/reactivar     */
/******************************************************************/

const { con_usuario } = require('../db');
const perfil_model    = require('../models/perfilModel');
const { responder_error, ErrorNegocio } = require('../utils/errores');

/* Base profile that can never be deactivated                     */
const PERFIL_ADMIN_SISTEMA = 1;

/* Normalize the list of function ids sent by the form            */
const ids_funciones = (lista) =>
    [...new Set((Array.isArray(lista) ? lista : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];

const listar = async (req, res) =>
{
    try { res.status(200).json((await perfil_model.listar()).rows); }
    catch (error) { responder_error(res, error, 'perfiles.listar'); }
};

const funciones = async (req, res) =>
{
    try { res.status(200).json((await perfil_model.funciones()).rows); }
    catch (error) { responder_error(res, error, 'perfiles.funciones'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Create { nombre, descripcion, funciones:[ids] }       */
/* Returns: 201 with the new profile                              */
/******************************************************************/
const crear = async (req, res) =>
{
    try
    {
        const nombre = String(req.body.nombre || '').trim();
        const lista  = ids_funciones(req.body.funciones);
        const campos = [];
        if (!nombre)            campos.push('nombre');
        if (lista.length === 0) campos.push('funciones');
        if (!nombre)            throw new ErrorNegocio(400, 'El nombre del perfil es obligatorio', campos);
        if (lista.length === 0) throw new ErrorNegocio(400, 'Selecciona al menos una función', campos);

        const id = await con_usuario(req.usuario.clave, (client) => perfil_model.crear(client,
            { nombre, descripcion: String(req.body.descripcion || '').trim(), funciones: lista, admin: req.usuario.clave }));

        res.status(201).json({ mensaje: 'Perfil ' + nombre + ' registrado exitosamente', perfil: (await perfil_model.buscar(id)).rows[0] });
    }
    catch (error)
    {
        if (error.constraint === 'perfiles_nombre_key') error = new ErrorNegocio(409, 'Nombre de perfil duplicado', ['nombre']);
        responder_error(res, error, 'perfiles.crear');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar(req, res)                                           */
/* Purpose: Change description and functions of a profile         */
/******************************************************************/
const actualizar = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        const lista = ids_funciones(req.body.funciones);
        if (lista.length === 0) throw new ErrorNegocio(400, 'Selecciona al menos una función', ['funciones']);
        if (id === PERFIL_ADMIN_SISTEMA) throw new ErrorNegocio(403, 'El perfil Administrador del sistema no se puede modificar');

        const actual = await perfil_model.buscar(id);
        if (actual.rows.length === 0) throw new ErrorNegocio(404, 'Perfil no encontrado');

        await con_usuario(req.usuario.clave, (client) => perfil_model.actualizar(client, id,
            { descripcion: String(req.body.descripcion || '').trim(), funciones: lista }));

        res.status(200).json({ mensaje: 'Perfil actualizado', perfil: (await perfil_model.buscar(id)).rows[0] });
    }
    catch (error) { responder_error(res, error, 'perfiles.actualizar'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* dar_baja(req, res)                                             */
/* Purpose: Deactivate a profile. Refused when it has users.      */
/******************************************************************/
const dar_baja = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (id === PERFIL_ADMIN_SISTEMA) throw new ErrorNegocio(403, 'El perfil Administrador del sistema no se puede eliminar');

        const actual = (await perfil_model.buscar(id)).rows[0];
        if (!actual) throw new ErrorNegocio(404, 'Perfil no encontrado');
        if (actual.estatus === 'Inactivo') throw new ErrorNegocio(422, 'El perfil ya está inactivo');
        if (actual.usuarios > 0)
        {
            throw new ErrorNegocio(422, 'No puede eliminarse un perfil con usuarios asignados (' + actual.usuarios + ')');
        }

        await con_usuario(req.usuario.clave, (client) => perfil_model.dar_baja(client, id, req.usuario.clave));
        res.status(200).json({ mensaje: 'Perfil eliminado exitosamente' });
    }
    catch (error) { responder_error(res, error, 'perfiles.dar_baja'); }
};

const reactivar = async (req, res) =>
{
    try
    {
        await con_usuario(req.usuario.clave, (client) => perfil_model.reactivar(client, Number(req.params.id)));
        res.status(200).json({ mensaje: 'Perfil reactivado' });
    }
    catch (error) { responder_error(res, error, 'perfiles.reactivar'); }
};

module.exports = { listar, funciones, crear, actualizar, dar_baja, reactivar };

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Registro, baja y reactivación de usuarios.        */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   listar(req, res)          - GET  /api/usuarios               */
/*   detalle(req, res)         - GET  /api/usuarios/:clave        */
/*   institucion(req, res)     - GET  /api/usuarios/institucion/:c*/
/*   crear(req, res)           - POST /api/usuarios               */
/*   cambiar_perfil(req, res)  - PUT  /api/usuarios/:clave/perfil */
/*   dar_baja(req, res)        - POST /api/usuarios/:clave/baja   */
/*   reactivar(req, res)       - POST /api/usuarios/:clave/reactivar*/
/*   catalogos(req, res)       - GET  /api/usuarios/catalogos     */
/******************************************************************/

const crypto         = require('crypto');
const { con_usuario } = require('../db');
const usuario_model  = require('../models/usuarioModel');
const perfil_model   = require('../models/perfilModel');
const institucion    = require('../utils/institucion');
const { responder_error, ErrorNegocio } = require('../utils/errores');
const { requerir, es_clave_usuario }    = require('../utils/validators');

/* Types that can only receive reader profiles                    */
const TIPOS_SOLO_LECTOR = ['Alumno', 'Profesor'];

/******************************************************************/
/* Internal helpers                                               */
/******************************************************************/

/* Load a user or answer 404 "Usuario no encontrado"              */
const obtener_usuario = async (clave) =>
{
    const r = await usuario_model.buscar(clave);
    if (r.rows.length === 0) throw new ErrorNegocio(404, 'Usuario no encontrado');
    return r.rows[0];
};

/* Load an ACTIVE profile or answer 422 "perfil no disponible"    */
const obtener_perfil_activo = async (id_perfil) =>
{
    const r = await perfil_model.buscar(Number(id_perfil));
    const perfil = r.rows[0];
    if (!perfil || perfil.estatus !== 'Activo')
    {
        throw new ErrorNegocio(422, 'El perfil seleccionado no está disponible', ['id_perfil']);
    }
    return perfil;
};

/* Hierarchy: the operator cannot assign or touch a higher level  */
const validar_jerarquia = (operador, funciones_destino, mensaje) =>
{
    if (perfil_model.nivel(funciones_destino) > perfil_model.nivel(operador.funciones))
    {
        throw new ErrorNegocio(403, mensaje);
    }
};

/* Students and professors only get reader profiles               */
const validar_tipo = (tipo, perfil) =>
{
    if (TIPOS_SOLO_LECTOR.includes(tipo) && perfil_model.nivel(perfil.funciones) > 1)
    {
        throw new ErrorNegocio(422, 'El perfil no corresponde al tipo de usuario (' + tipo + ')', ['id_perfil']);
    }
};

/* Temporary password: fixed length, cryptographically random      */
const contrasena_temporal = () =>
    'Dk-' + crypto.randomBytes(12).toString('base64url');

/******************************************************************/
/* Reuse Instructions                                             */
/* listar(req, res)                                               */
/* Purpose: Users filtered by ?q= (clave or name) and ?estatus=   */
/******************************************************************/
const listar = async (req, res) =>
{
    try
    {
        const r = await usuario_model.listar({ q: req.query.q, estatus: req.query.estatus });
        res.status(200).json(r.rows);
    }
    catch (error) { responder_error(res, error, 'usuarios.listar'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* detalle(req, res)                                              */
/* Purpose: One user with its open baja and current debts         */
/******************************************************************/
const detalle = async (req, res) =>
{
    try
    {
        const usuario = await obtener_usuario(req.params.clave);
        usuario.adeudos = await usuario_model.adeudos(usuario.clave);
        res.status(200).json(usuario);
    }
    catch (error) { responder_error(res, error, 'usuarios.detalle'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* institucion(req, res)                                          */
/* Purpose: Preview of the institutional data of a clave before   */
/*          registering it ("Información institucional - solo     */
/*          lectura" in the register screen).                     */
/******************************************************************/
const institucion_consulta = async (req, res) =>
{
    try
    {
        const clave = String(req.params.clave || '').trim();
        if (!es_clave_usuario(clave)) throw new ErrorNegocio(400, 'Verifica la Clave capturada (6 caracteres)', ['clave']);

        const persona = await institucion.consultar(clave);
        if (!persona) throw new ErrorNegocio(404, 'La Clave no existe en la base institucional', ['clave']);

        const registrado = await usuario_model.buscar(clave);
        res.status(200).json(
        {
            ...persona,
            registrado: registrado.rows.length > 0,
            estatus_biblioteca: registrado.rows[0] ? registrado.rows[0].estatus : null
        });
    }
    catch (error) { responder_error(res, error, 'usuarios.institucion'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Register { clave, id_perfil }. Name, e-mail and type  */
/*          come from the institution. A temporary password is    */
/*          generated (in production it is e-mailed).             */
/* Returns: 201 { usuario, contrasena_temporal }                  */
/******************************************************************/
const crear = async (req, res) =>
{
    try
    {
        requerir(req.body, ['clave', 'id_perfil'], 'Usuario no registrado: verifica los campos marcados');
        const clave = String(req.body.clave).trim();
        if (!es_clave_usuario(clave))
        {
            throw new ErrorNegocio(400, 'Usuario no registrado: la Clave debe tener 6 caracteres', ['clave']);
        }

        const existente = await usuario_model.buscar(clave);
        if (existente.rows.length > 0)
        {
            const inactivo = existente.rows[0].estatus === 'Inactivo';
            throw new ErrorNegocio(409, inactivo
                ? 'La Clave ya existe y está Inactiva: usa Reactivar usuario'
                : 'Usuario no registrado: la Clave ya existe en el sistema', ['clave']);
        }

        const persona = await institucion.consultar(clave);
        if (!persona || !persona.vigente)
        {
            throw new ErrorNegocio(422, 'Usuario no registrado: la Clave no está vigente en la institución', ['clave']);
        }
        if (!persona.correo)
        {
            throw new ErrorNegocio(422, 'Usuario no registrado: la Clave no tiene correo institucional', ['clave']);
        }

        const perfil = await obtener_perfil_activo(req.body.id_perfil);
        validar_jerarquia(req.usuario, perfil.funciones, 'Usuario no registrado: no puede asignar un perfil superior al suyo');
        validar_tipo(persona.tipo, perfil);

        const tipos = await usuario_model.tipos();
        const tipo = tipos.rows.find((t) => t.nombre === persona.tipo);
        const temporal = contrasena_temporal();

        await con_usuario(req.usuario.clave, (client) => usuario_model.crear(client,
        {
            clave, nombre: persona.nombre, correo: persona.correo, id_tipo: tipo.id,
            id_perfil: perfil.id, admin: req.usuario.clave, contrasena: temporal
        }));

        res.set('Cache-Control', 'no-store');
        res.status(201).json({ usuario: await obtener_usuario(clave), contrasena_temporal: temporal });
    }
    catch (error) { responder_error(res, error, 'usuarios.crear'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* cambiar_perfil(req, res)                                       */
/* Purpose: Modify the assigned profile { id_perfil }. When the   */
/*          change removes functions from a user with an open     */
/*          session, the session is closed.                       */
/******************************************************************/
const cambiar_perfil = async (req, res) =>
{
    try
    {
        requerir(req.body, ['id_perfil'], 'Elige un perfil');
        const usuario = await obtener_usuario(req.params.clave);

        if (usuario.clave === req.usuario.clave) throw new ErrorNegocio(403, 'No puede modificar su propio perfil');
        if (usuario.estatus !== 'Activo')         throw new ErrorNegocio(422, 'El usuario está inactivo: primero reactívalo');
        if (Number(req.body.id_perfil) === usuario.id_perfil) throw new ErrorNegocio(422, 'No se detectaron cambios');

        const perfil = await obtener_perfil_activo(req.body.id_perfil);
        validar_jerarquia(req.usuario, usuario.funciones, 'No puede modificar a un usuario con un perfil superior');
        validar_jerarquia(req.usuario, perfil.funciones, 'No puede modificar ni asignar un perfil superior');
        validar_tipo(usuario.tipo, perfil);

        const retira = (usuario.funciones || []).some((f) => !perfil.funciones.includes(f));
        await con_usuario(req.usuario.clave, async (client) =>
        {
            await usuario_model.cambiar_perfil(client, usuario.clave, perfil.id);
            if (retira)
            {
                await client.query('UPDATE sesiones SET fecha_fin = now() WHERE clave_usuario = $1 AND fecha_fin IS NULL', [usuario.clave]);
            }
        });

        res.status(200).json(
        {
            mensaje: retira ? 'Perfil actualizado y sesión del usuario cerrada' : 'Usuario modificado exitosamente',
            usuario: await obtener_usuario(usuario.clave)
        });
    }
    catch (error) { responder_error(res, error, 'usuarios.cambiar_perfil'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* dar_baja(req, res)                                             */
/* Purpose: Give baja { id_motivo, comentario }. Blocked for the  */
/*          operator himself, higher profiles, the last system    */
/*          administrator, pending loans (trigger) and debts.     */
/******************************************************************/
const dar_baja = async (req, res) =>
{
    try
    {
        requerir(req.body, ['id_motivo'], 'Selecciona el motivo de baja');
        const usuario = await obtener_usuario(req.params.clave);

        if (usuario.clave === req.usuario.clave) throw new ErrorNegocio(403, 'No puede darse de baja a sí mismo');
        if (usuario.estatus === 'Inactivo')      throw new ErrorNegocio(422, 'El usuario ya está inactivo');
        validar_jerarquia(req.usuario, usuario.funciones, 'No puede dar de baja a un usuario con más privilegios');

        if (perfil_model.nivel(usuario.funciones) === 3 && await usuario_model.administradores_activos() <= 1)
        {
            throw new ErrorNegocio(422, 'No puede dar de baja al último Administrador del sistema');
        }

        const adeudos = await usuario_model.adeudos(usuario.clave);
        if (adeudos.prestamos_activos > 0)
        {
            throw new ErrorNegocio(422, 'Baja bloqueada: existen ' + adeudos.prestamos_activos + ' libro(s) pendientes de devolver');
        }
        if (adeudos.multas_pendientes > 0)
        {
            throw new ErrorNegocio(422, 'Baja bloqueada: existe deuda con Tesorería por $' + Number(adeudos.monto).toFixed(2) + ' MXN');
        }

        await con_usuario(req.usuario.clave, (client) => usuario_model.dar_baja(client,
        {
            clave: usuario.clave, id_motivo: Number(req.body.id_motivo),
            comentario: req.body.comentario, admin: req.usuario.clave
        }));

        res.status(200).json({ mensaje: 'Usuario dado de baja exitosamente', usuario: await obtener_usuario(usuario.clave) });
    }
    catch (error) { responder_error(res, error, 'usuarios.dar_baja'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* reactivar(req, res)                                            */
/* Purpose: Reactivate an inactive user. The clave must still be  */
/*          current in the institution. Optionally { id_perfil }. */
/******************************************************************/
const reactivar = async (req, res) =>
{
    try
    {
        const usuario = await obtener_usuario(req.params.clave);
        if (usuario.estatus === 'Activo') throw new ErrorNegocio(422, 'El usuario ya está activo');

        const persona = await institucion.consultar(usuario.clave);
        if (!persona || !persona.vigente)
        {
            throw new ErrorNegocio(422, 'No fue posible reactivar: la Clave no está vigente en la institución');
        }

        if (usuario.clave === req.usuario.clave) throw new ErrorNegocio(403, 'No puede reactivarse a sí mismo');
        validar_jerarquia(req.usuario, usuario.funciones, 'No puede reactivar a un usuario con un perfil superior');
        const perfil = await obtener_perfil_activo(req.body.id_perfil || usuario.id_perfil);
        validar_jerarquia(req.usuario, perfil.funciones, 'No puede asignar un perfil superior al suyo');
        validar_tipo(persona.tipo, perfil);
        const temporal = contrasena_temporal();

        await con_usuario(req.usuario.clave, (client) => usuario_model.reactivar(client,
        {
            clave: usuario.clave, admin: req.usuario.clave,
            id_perfil: perfil.id, contrasena: temporal
        }));

        res.set('Cache-Control', 'no-store');
        res.status(200).json({ mensaje: 'Usuario reactivado exitosamente',
            usuario: await obtener_usuario(usuario.clave), contrasena_temporal: temporal });
    }
    catch (error) { responder_error(res, error, 'usuarios.reactivar'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* catalogos(req, res)                                            */
/* Purpose: Active profiles the operator may assign, user types   */
/*          and baja reasons, for the forms.                      */
/******************************************************************/
const catalogos = async (req, res) =>
{
    try
    {
        const [perfiles, tipos, motivos] = await Promise.all(
            [perfil_model.listar(), usuario_model.tipos(), usuario_model.motivos('Usuario')]);
        const mi_nivel = perfil_model.nivel(req.usuario.funciones);
        res.status(200).json(
        {
            perfiles: perfiles.rows
                .filter((p) => p.estatus === 'Activo')
                .map((p) => ({ ...p, asignable: perfil_model.nivel(p.funciones) <= mi_nivel, nivel: perfil_model.nivel(p.funciones) })),
            tipos: tipos.rows,
            motivos: motivos.rows
        });
    }
    catch (error) { responder_error(res, error, 'usuarios.catalogos'); }
};

module.exports =
{
    listar, detalle, institucion: institucion_consulta, crear, cambiar_perfil, dar_baja, reactivar, catalogos
};

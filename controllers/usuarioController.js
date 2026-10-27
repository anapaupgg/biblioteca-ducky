/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   obtener_usuario(clave) */
/*   obtener_perfil_activo(id_perfil) */
/*   validar_jerarquia(operador, funciones_destino, mensaje) */
/*   validar_tipo(tipo, perfil) */
/*   contrasena_temporal() */
/*   listar(solicitud, respuesta) */
/*   detalle(solicitud_2, respuesta_2) */
/*   institucion_consulta(solicitud_3, respuesta_3) */
/*   crear(solicitud_4, respuesta_4) */
/*   cambiar_perfil(solicitud_5, respuesta_5) */
/*   dar_baja(solicitud_6, respuesta_6) */
/*   reactivar(solicitud_7, respuesta_7) */
/*   catalogos(solicitud_8, respuesta_8) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Funciones HTTP(solicitud, respuesta): Request/Response de Express. */
/* Rutas protegidas requieren usuario y funciones cargados por middleware. */
/* Datos inválidos producen 4xx; fallos internos se gestionan sin secretos. */
/******************************************************************/

const crypto = require('crypto');
const
{
    con_usuario
} = require('../db');
const usuario_model = require('../models/usuarioModel');
const perfil_model = require('../models/perfilModel');
const institucion = require('../utils/institucion');
const
{
    responder_error,
    error_negocio
} = require('../utils/errores');
const
{
    requerir,
    es_clave_usuario
} = require('../utils/validators');

/* Types that can only receive reader profiles                    */
const TIPOS_SOLO_LECTOR = ['Alumno', 'Profesor'];

/******************************************************************/
/* Internal helpers                                               */
/******************************************************************/

/* Load a user or answer 404 "Usuario no encontrado"              */
const obtener_usuario = async (clave) =>
{
    const resultado = await usuario_model.buscar(clave);
    if (resultado.rows.length === 0) throw new error_negocio(404, 'Usuario no encontrado');
    return resultado.rows[0];
};

/* Load an ACTIVE profile or answer 422 "perfil no disponible"    */
const obtener_perfil_activo = async (id_perfil) =>
{
    const resultado_2 = await perfil_model.buscar(Number(id_perfil));
    const perfil = resultado_2.rows[0];
    if (!perfil || perfil.estatus !== 'Activo')
    {
        throw new error_negocio(422, 'El perfil seleccionado no está disponible', ['id_perfil']);
    }
    return perfil;
};

/* Hierarchy: the operator cannot assign or touch a higher level  */
const validar_jerarquia = (operador, funciones_destino, mensaje) =>
{
    if (perfil_model.nivel(funciones_destino) > perfil_model.nivel(operador.funciones))
    {
        throw new error_negocio(403, mensaje);
    }
};

/* Students and professors only get reader profiles               */
const validar_tipo = (tipo, perfil) =>
{
    if (TIPOS_SOLO_LECTOR.includes(tipo) && perfil_model.nivel(perfil.funciones) > 1)
    {
        throw new error_negocio(422, 'El perfil no corresponde al tipo de usuario (' + tipo + ')', [
            'id_perfil'
        ]);
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
const listar = async (solicitud, respuesta) =>
{
    try
    {
        const resultado_3 = await usuario_model.listar(
        {
            consulta: solicitud.query.q,
            estatus: solicitud.query.estatus
        });
        respuesta.status(200).json(resultado_3.rows);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'usuarios.listar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* detalle(req, res)                                              */
/* Purpose: One user with its open baja and current debts         */
/******************************************************************/
const detalle = async (solicitud_2, respuesta_2) =>
{
    try
    {
        const usuario = await obtener_usuario(solicitud_2.params.clave);
        usuario.adeudos = await usuario_model.adeudos(usuario.clave);
        respuesta_2.status(200).json(usuario);
    }
    catch (error)
    {
        responder_error(respuesta_2, error, 'usuarios.detalle');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* institucion(req, res)                                          */
/* Purpose: Preview of the institutional data of a clave before   */
/*          registering it ("Información institucional - solo     */
/*          lectura" in the register screen).                     */
/******************************************************************/
const institucion_consulta = async (solicitud_3, respuesta_3) =>
{
    try
    {
        const clave = String(solicitud_3.params.clave || '').trim();
        if (!es_clave_usuario(clave)) throw new error_negocio(400,
            'Verifica la Clave capturada (6 caracteres)', ['clave']);

        const persona = await institucion.consultar(clave);
        if (!persona) throw new error_negocio(404, 'La Clave no existe en la base institucional', [
            'clave'
        ]);

        const registrado = await usuario_model.buscar(clave);
        respuesta_3.status(200).json(
        {
            ...persona,
            registrado: registrado.rows.length > 0,
            estatus_biblioteca: registrado.rows[0] ? registrado.rows[0].estatus : null
        });
    }
    catch (error)
    {
        responder_error(respuesta_3, error, 'usuarios.institucion');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Register { clave, id_perfil }. Name, e-mail and type  */
/*          come from the institution. A temporary password is    */
/*          generated (in production it is e-mailed).             */
/* Returns: 201 { usuario, contrasena_temporal }                  */
/******************************************************************/
const crear = async (solicitud_4, respuesta_4) =>
{
    try
    {
        requerir(solicitud_4.body, ['clave', 'id_perfil'],
            'Usuario no registrado: verifica los campos marcados');
        const clave = String(solicitud_4.body.clave).trim();
        if (!es_clave_usuario(clave))
        {
            throw new error_negocio(400, 'Usuario no registrado: la Clave debe tener 6 caracteres', [
                'clave'
            ]);
        }

        const existente = await usuario_model.buscar(clave);
        if (existente.rows.length > 0)
        {
            const inactivo = existente.rows[0].estatus === 'Inactivo';
            throw new error_negocio(409, inactivo ?
                'La Clave ya existe y está Inactiva: usa Reactivar usuario' :
                'Usuario no registrado: la Clave ya existe en el sistema', ['clave']);
        }

        const persona = await institucion.consultar(clave);
        if (!persona || !persona.vigente)
        {
            throw new error_negocio(422,
                'Usuario no registrado: la Clave no está vigente en la institución', ['clave']);
        }
        if (!persona.correo)
        {
            throw new error_negocio(422,
                'Usuario no registrado: la Clave no tiene correo institucional', ['clave']);
        }

        const perfil = await obtener_perfil_activo(solicitud_4.body.id_perfil);
        validar_jerarquia(solicitud_4.usuario, perfil.funciones,
            'Usuario no registrado: no puede asignar un perfil superior al suyo');
        validar_tipo(persona.tipo, perfil);

        const tipos = await usuario_model.tipos();
        const tipo = tipos.rows.find((elemento) => elemento.nombre === persona.tipo);
        const temporal = contrasena_temporal();

        await con_usuario(solicitud_4.usuario.clave, (client) => usuario_model.crear(client,
        {
            clave,
            nombre: persona.nombre,
            correo: persona.correo,
            id_tipo: tipo.id,
            id_perfil: perfil.id,
            admin: solicitud_4.usuario.clave,
            contrasena: temporal
        }));

        respuesta_4.set('Cache-Control', 'no-store');
        respuesta_4.status(201).json(
        {
            usuario: await obtener_usuario(clave),
            contrasena_temporal: temporal
        });
    }
    catch (error)
    {
        responder_error(respuesta_4, error, 'usuarios.crear');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* cambiar_perfil(req, res)                                       */
/* Purpose: Modify the assigned profile { id_perfil }. When the   */
/*          change removes functions from a user with an open     */
/*          session, the session is closed.                       */
/******************************************************************/
const cambiar_perfil = async (solicitud_5, respuesta_5) =>
{
    try
    {
        requerir(solicitud_5.body, ['id_perfil'], 'Elige un perfil');
        const usuario = await obtener_usuario(solicitud_5.params.clave);

        if (usuario.clave === solicitud_5.usuario.clave) throw new error_negocio(403,
            'No puede modificar su propio perfil');
        if (usuario.estatus !== 'Activo') throw new error_negocio(422,
            'El usuario está inactivo: primero reactívalo');
        if (Number(solicitud_5.body.id_perfil) === usuario.id_perfil) throw new error_negocio(422,
            'No se detectaron cambios');

        const perfil = await obtener_perfil_activo(solicitud_5.body.id_perfil);
        validar_jerarquia(solicitud_5.usuario, usuario.funciones,
            'No puede modificar a un usuario con un perfil superior');
        validar_jerarquia(solicitud_5.usuario, perfil.funciones,
            'No puede modificar ni asignar un perfil superior');
        validar_tipo(usuario.tipo, perfil);

        const retira = (usuario.funciones || []).some((filtro) => !perfil.funciones.includes(filtro));
        await con_usuario(solicitud_5.usuario.clave, async (client) =>
        {
            await usuario_model.cambiar_perfil(client, usuario.clave, perfil.id);
            if (retira)
            {
                await usuario_model.cerrar_sesiones(client, usuario.clave);
            }
        });

        respuesta_5.status(200).json(
        {
            mensaje: retira ? 'Perfil actualizado y sesión del usuario cerrada' :
                'Usuario modificado exitosamente',
            usuario: await obtener_usuario(usuario.clave)
        });
    }
    catch (error)
    {
        responder_error(respuesta_5, error, 'usuarios.cambiar_perfil');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* dar_baja(req, res)                                             */
/* Purpose: Give baja { id_motivo, comentario }. Blocked for the  */
/*          operator himself, higher profiles, the last system    */
/*          administrator, pending loans (trigger) and debts.     */
/******************************************************************/
const dar_baja = async (solicitud_6, respuesta_6) =>
{
    try
    {
        requerir(solicitud_6.body, ['id_motivo'], 'Selecciona el motivo de baja');
        const usuario = await obtener_usuario(solicitud_6.params.clave);

        if (usuario.clave === solicitud_6.usuario.clave) throw new error_negocio(403,
            'No puede darse de baja a sí mismo');
        if (usuario.estatus === 'Inactivo') throw new error_negocio(422,
            'El usuario ya está inactivo');
        validar_jerarquia(solicitud_6.usuario, usuario.funciones,
            'No puede dar de baja a un usuario con más privilegios');

        if (perfil_model.nivel(usuario.funciones) === 3 && await usuario_model
            .administradores_activos() <= 1)
        {
            throw new error_negocio(422, 'No puede dar de baja al último Administrador del sistema');
        }

        const adeudos = await usuario_model.adeudos(usuario.clave);
        if (adeudos.prestamos_activos > 0)
        {
            throw new error_negocio(422, 'Baja bloqueada: existen ' + adeudos.prestamos_activos +
                ' libro(s) pendientes de devolver');
        }
        if (adeudos.multas_pendientes > 0)
        {
            throw new error_negocio(422, 'Baja bloqueada: existe deuda con Tesorería por $' + Number(
                adeudos.monto).toFixed(2) + ' MXN');
        }

        await con_usuario(solicitud_6.usuario.clave, (client) => usuario_model.dar_baja(client,
        {
            clave: usuario.clave,
            id_motivo: Number(solicitud_6.body.id_motivo),
            comentario: solicitud_6.body.comentario,
            admin: solicitud_6.usuario.clave
        }));

        respuesta_6.status(200).json(
        {
            mensaje: 'Usuario dado de baja exitosamente',
            usuario: await obtener_usuario(usuario.clave)
        });
    }
    catch (error)
    {
        responder_error(respuesta_6, error, 'usuarios.dar_baja');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* reactivar(req, res)                                            */
/* Purpose: Reactivate an inactive user. The clave must still be  */
/*          current in the institution. Optionally { id_perfil }. */
/******************************************************************/
const reactivar = async (solicitud_7, respuesta_7) =>
{
    try
    {
        const usuario = await obtener_usuario(solicitud_7.params.clave);
        if (usuario.estatus === 'Activo') throw new error_negocio(422, 'El usuario ya está activo');

        const persona = await institucion.consultar(usuario.clave);
        if (!persona || !persona.vigente)
        {
            throw new error_negocio(422,
                'No fue posible reactivar: la Clave no está vigente en la institución');
        }

        if (usuario.clave === solicitud_7.usuario.clave) throw new error_negocio(403,
            'No puede reactivarse a sí mismo');
        validar_jerarquia(solicitud_7.usuario, usuario.funciones,
            'No puede reactivar a un usuario con un perfil superior');
        const perfil = await obtener_perfil_activo(solicitud_7.body.id_perfil || usuario.id_perfil);
        validar_jerarquia(solicitud_7.usuario, perfil.funciones,
            'No puede asignar un perfil superior al suyo');
        validar_tipo(persona.tipo, perfil);
        const temporal = contrasena_temporal();

        await con_usuario(solicitud_7.usuario.clave, (client) => usuario_model.reactivar(client,
        {
            clave: usuario.clave,
            admin: solicitud_7.usuario.clave,
            id_perfil: perfil.id,
            contrasena: temporal
        }));

        respuesta_7.set('Cache-Control', 'no-store');
        respuesta_7.status(200).json(
        {
            mensaje: 'Usuario reactivado exitosamente',
            usuario: await obtener_usuario(usuario.clave),
            contrasena_temporal: temporal
        });
    }
    catch (error)
    {
        responder_error(respuesta_7, error, 'usuarios.reactivar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* catalogos(req, res)                                            */
/* Purpose: Active profiles the operator may assign, user types   */
/*          and baja reasons, for the forms.                      */
/******************************************************************/
const catalogos = async (solicitud_8, respuesta_8) =>
{
    try
    {
        const [perfiles, tipos, motivos] = await Promise.all(
            [perfil_model.listar(), usuario_model.tipos(), usuario_model.motivos('Usuario')]);
        const mi_nivel = perfil_model.nivel(solicitud_8.usuario.funciones);
        respuesta_8.status(200).json(
        {
            perfiles: perfiles.rows
                .filter((elemento_2) => elemento_2.estatus === 'Activo')
                .map((elemento_3) => (
                {
                    ...elemento_3,
                    asignable: perfil_model.nivel(elemento_3.funciones) <= mi_nivel,
                    nivel: perfil_model.nivel(elemento_3.funciones)
                })),
            tipos: tipos.rows,
            motivos: motivos.rows
        });
    }
    catch (error)
    {
        responder_error(respuesta_8, error, 'usuarios.catalogos');
    }
};

module.exports =
{
    listar,
    detalle,
    institucion: institucion_consulta,
    crear,
    cambiar_perfil,
    dar_baja,
    reactivar,
    catalogos
};

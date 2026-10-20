/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Inicio y cierre de sesión, recuperación.           */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   login(req, res)              - POST /api/auth/login          */
/*   sesion(req, res)             - GET  /api/auth/sesion         */
/*   logout(req, res)             - POST /api/auth/logout         */
/*   recuperar(req, res)          - POST /api/auth/recuperar      */
/*   restablecer(req, res)        - POST /api/auth/restablecer    */
/*   cambiar_contrasena(req, res) - POST /api/auth/contrasena     */
/******************************************************************/

const sesion_model = require('../models/sesionModel');
const { firmar_token } = require('../middleware/auth');
const { responder_error, ErrorNegocio } = require('../utils/errores');
const { faltantes, es_clave_usuario } = require('../utils/validators');

/* Password policy for new passwords                              */
const MIN_CONTRASENA = 8;

/******************************************************************/
/* Reuse Instructions                                             */
/* login(req, res)                                                */
/* Purpose: Authenticate { clave, contrasena }.                   */
/* Returns:                                                       */
/*   200 { token, usuario, cambiar_contrasena }                   */
/*   400 Ingresa tu Usuario y contraseña / Usuario no válido      */
/*   401 Usuario o contraseña incorrecta                          */
/*   403 Cuenta no vigente / perfil sin funciones                 */
/*   423 Cuenta bloqueada temporalmente                           */
/******************************************************************/
const login = async (req, res) =>
{
    try
    {
        const vacios = faltantes(req.body, ['clave', 'contrasena']);
        if (vacios.length > 0)
        {
            throw new ErrorNegocio(400, 'Ingresa tu Usuario y contraseña', vacios);
        }

        const clave = String(req.body.clave).trim();
        if (!es_clave_usuario(clave))
        {
            throw new ErrorNegocio(400, 'Ingresa un Usuario válido (matrícula o nómina de 6 caracteres)', ['clave']);
        }

        const resultado = await sesion_model.iniciar_sesion(clave, req.body.contrasena, describir_dispositivo(req.headers['user-agent']));

        if (resultado.resultado === 'Usuario inactivo')
        {
            throw new ErrorNegocio(403, 'Acceso no permitido: tu cuenta no está vigente.');
        }
        if (resultado.resultado.startsWith('Cuenta bloqueada'))
        {
            throw new ErrorNegocio(423, 'Cuenta bloqueada temporalmente por intentos fallidos. ' +
                                        resultado.resultado.replace('Cuenta bloqueada', 'Intenta de nuevo'));
        }
        if (resultado.resultado !== 'OK')
        {
            throw new ErrorNegocio(401, 'Usuario o contraseña incorrecta', ['clave', 'contrasena']);
        }

        const sesion = await sesion_model.obtener_activa(resultado.id_sesion, 8);
        if (!sesion || sesion.funciones.length === 0)
        {
            await sesion_model.cerrar(resultado.id_sesion);
            throw new ErrorNegocio(403, 'Tu perfil no tiene funciones asignadas. Contacta al administrador.');
        }

        res.status(200).json(
        {
            token: firmar_token(resultado.id_sesion),
            usuario: sesion,
            cambiar_contrasena: resultado.cambiar_contrasena
        });
    }
    catch (error)
    {
        responder_error(res, error, 'login');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* sesion(req, res)                                               */
/* Purpose: Return the current user (used by every page to build  */
/*          the sidebar menu according to the profile).           */
/******************************************************************/
const sesion = (req, res) => res.status(200).json({ usuario: req.usuario });

/******************************************************************/
/* Reuse Instructions                                             */
/* logout(req, res)                                               */
/* Purpose: Close the current session                             */
/******************************************************************/
const logout = async (req, res) =>
{
    try
    {
        await sesion_model.cerrar(req.usuario.id_sesion);
        res.status(200).json({ mensaje: 'Sesión cerrada' });
    }
    catch (error)
    {
        responder_error(res, error, 'logout');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* recuperar(req, res)                                            */
/* Purpose: Start password recovery with a clave or e-mail. The   */
/*          answer is the same whether the user exists or not.    */
/*          PROTOTYPE: since there is no mail server, the link    */
/*          that would be e-mailed is returned in "enlace_demo".  */
/******************************************************************/
const recuperar = async (req, res) =>
{
    try
    {
        const dato = String(req.body.clave_o_correo || '').trim();
        if (!dato)
        {
            throw new ErrorNegocio(400, 'Escribe tu matrícula, nómina o correo institucional', ['clave_o_correo']);
        }

        const solicitud = await sesion_model.solicitar_recuperacion(dato);
        const respuesta =
        {
            mensaje: 'Si los datos corresponden a una cuenta activa, enviamos un enlace a tu correo institucional. El enlace vence en 30 minutos.'
        };

        if (solicitud)
        {
            respuesta.enlace_demo = '/login.html?token=' + solicitud.token;
            respuesta.correo_demo = solicitud.correo;
        }
        res.status(200).json(respuesta);
    }
    catch (error)
    {
        responder_error(res, error, 'recuperar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* restablecer(req, res)                                          */
/* Purpose: Set a new password with a recovery token              */
/******************************************************************/
const restablecer = async (req, res) =>
{
    try
    {
        const { token, nueva, confirmacion } = req.body;
        validar_nueva(nueva, confirmacion);

        const ok = await sesion_model.restablecer(String(token || ''), nueva);
        if (!ok)
        {
            throw new ErrorNegocio(410, 'El enlace no es válido, ya se usó o venció. Solicita uno nuevo.');
        }
        res.status(200).json({ mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    }
    catch (error)
    {
        responder_error(res, error, 'restablecer');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* cambiar_contrasena(req, res)                                   */
/* Purpose: Change the password of the logged user. Required      */
/*          after logging in with a temporary password.           */
/******************************************************************/
const cambiar_contrasena = async (req, res) =>
{
    try
    {
        const { actual, nueva, confirmacion } = req.body;
        if (!actual) throw new ErrorNegocio(400, 'Escribe tu contraseña actual', ['actual']);
        validar_nueva(nueva, confirmacion);

        const correcta = await sesion_model.verificar_contrasena(req.usuario.clave, actual);
        if (!correcta) throw new ErrorNegocio(401, 'La contraseña actual no es correcta', ['actual']);
        if (actual === nueva) throw new ErrorNegocio(422, 'La nueva contraseña debe ser distinta a la actual', ['nueva']);

        await sesion_model.cambiar_contrasena(req.usuario.clave, nueva);
        res.status(200).json({ mensaje: 'Contraseña actualizada' });
    }
    catch (error)
    {
        responder_error(res, error, 'cambiar_contrasena');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* describir_dispositivo(user_agent)                              */
/* Purpose: Short "Navegador · Sistema" text for SESIONES.        */
/*          Dispositivo (VARCHAR 100).                            */
/******************************************************************/
const describir_dispositivo = (user_agent) =>
{
    const ua = String(user_agent || '');
    const navegador = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox'
                    : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
    const sistema = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS'
                  : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Otro';
    return (navegador + ' · ' + sistema).slice(0, 100);
};

/* Shared rule for new passwords                                  */
const validar_nueva = (nueva, confirmacion) =>
{
    if (!nueva || String(nueva).length < MIN_CONTRASENA)
    {
        throw new ErrorNegocio(400, 'La contraseña debe tener al menos ' + MIN_CONTRASENA + ' caracteres', ['nueva']);
    }
    if (nueva !== confirmacion)
    {
        throw new ErrorNegocio(400, 'Las contraseñas no coinciden', ['nueva', 'confirmacion']);
    }
};

module.exports = { login, sesion, logout, recuperar, restablecer, cambiar_contrasena };

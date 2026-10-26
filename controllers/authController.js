/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   login(solicitud, respuesta) */
/*   sesion(solicitud_2, respuesta_2) */
/*   logout(solicitud_3, respuesta_3) */
/*   no_disponible(respuesta_4) */
/*   recuperar(solicitud_4, respuesta_5) */
/*   restablecer(solicitud_5, respuesta_6) */
/*   cambiar_contrasena(solicitud_6, respuesta_7) */
/*   describir_dispositivo(user_agent) */
/*   validar_nueva(nueva, confirmacion) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Funciones HTTP(solicitud, respuesta): Request/Response de Express. */
/* Rutas protegidas requieren usuario y funciones cargados por middleware. */
/* Datos inválidos producen 4xx; fallos internos se gestionan sin secretos. */
/******************************************************************/

const sesion_model = require('../models/sesionModel');
const
{
    firmar_token
} = require('../middleware/auth');
const
{
    responder_error,
    error_negocio
} = require('../utils/errores');
const
{
    faltantes,
    es_clave_usuario
} = require('../utils/validators');

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
const login = async (solicitud, respuesta) =>
{
    try
    {
        const vacios = faltantes(solicitud.body, ['clave', 'contrasena']);
        if (vacios.length > 0)
        {
            throw new error_negocio(400, 'Ingresa tu Usuario y contraseña', vacios);
        }

        const clave = String(solicitud.body.clave).trim();
        if (!es_clave_usuario(clave))
        {
            throw new error_negocio(400,
                'Ingresa un Usuario válido (matrícula o nómina de 6 caracteres)', ['clave']);
        }

        const resultado = await sesion_model.iniciar_sesion(clave, solicitud.body.contrasena,
            describir_dispositivo(solicitud.headers['user-agent']));

        if (resultado.resultado === 'Usuario inactivo')
        {
            throw new error_negocio(403, 'Acceso no permitido: tu cuenta no está vigente.');
        }
        if (resultado.resultado.startsWith('Cuenta bloqueada'))
        {
            throw new error_negocio(423, 'Cuenta bloqueada temporalmente por intentos fallidos. ' +
                resultado.resultado.replace('Cuenta bloqueada', 'Intenta de nuevo'));
        }
        if (resultado.resultado !== 'OK')
        {
            throw new error_negocio(401, 'Usuario o contraseña incorrecta', ['clave', 'contrasena']);
        }

        const sesion = await sesion_model.obtener_activa(resultado.id_sesion, 8);
        if (!sesion || sesion.funciones.length === 0)
        {
            await sesion_model.cerrar(resultado.id_sesion);
            throw new error_negocio(403,
                'Tu perfil no tiene funciones asignadas. Contacta al administrador.');
        }

        respuesta.status(200).json(
        {
            token: firmar_token(resultado.id_sesion),
            usuario: sesion,
            cambiar_contrasena: resultado.cambiar_contrasena
        });
    }
    catch (error)
    {
        responder_error(respuesta, error, 'login');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* sesion(req, res)                                               */
/* Purpose: Return the current user (used by every page to build  */
/*          the sidebar menu according to the profile).           */
/******************************************************************/
const sesion = (solicitud_2, respuesta_2) => respuesta_2.status(200).json(
{
    usuario: solicitud_2.usuario
});

/******************************************************************/
/* Reuse Instructions                                             */
/* logout(req, res)                                               */
/* Purpose: Close the current session                             */
/******************************************************************/
const logout = async (solicitud_3, respuesta_3) =>
{
    try
    {
        await sesion_model.cerrar(solicitud_3.usuario.id_sesion);
        respuesta_3.status(200).json(
        {
            mensaje: 'Sesión cerrada'
        });
    }
    catch (error)
    {
        responder_error(respuesta_3, error, 'logout');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* recuperar(req, res)                                            */
/* Recovery requires configured mail delivery. Tokens are sent   */
/* only to the registered mailbox, never through the public API. */
/******************************************************************/
const correo_service = require('../services/correoService');
const recuperacion_model = require('../models/recuperacionModel');
const no_disponible = respuesta_4 => respuesta_4.status(503).json(
{
    codigo: 'RECUPERACION_NO_DISPONIBLE',
    error: 'La recuperación por correo no está configurada. Contacta al administrador.'
});
const recuperar = async (solicitud_4, respuesta_5) =>
{
    const config = correo_service.configuracion();
    if (!config) return no_disponible(respuesta_5);
    const entrada = solicitud_4.body?.clave_o_correo;
    if (typeof entrada !== 'string' || !entrada.trim() || entrada.length > 254)
        return respuesta_5.status(400).json(
        {
            error: 'Ingresa tu matrícula, nómina o correo registrado.'
        });
    try
    {
        const token = correo_service.crear_token(config);
        const correo = await recuperacion_model.emitir(entrada.trim(), token);
        if (correo)
        {
            try
            {
                await correo_service.enviar(config, correo, token);
            }
            catch
            {
                await recuperacion_model.invalidar(token);
                console.error('Recuperación: envío fallido; token invalidado.');
            }
        }
    }
    catch
    {
        console.error('Recuperación: operación no completada.');
    }
    // Misma respuesta para cuenta ausente, inactiva, limitada o fallo de envío.
    return respuesta_5.status(200).json(
    {
        mensaje: 'Si la cuenta está activa, recibirás un enlace en su correo registrado. Revisa también correo no deseado.'
    });
};
const restablecer = async (solicitud_5, respuesta_6) =>
{
    const config = correo_service.configuracion();
    if (!config) return no_disponible(respuesta_6);
    try
    {
        const
        {
            token,
            nueva,
            confirmacion
        } = solicitud_5.body ||
        {
        };
        if (!correo_service.token_valido(token, config)) throw new error_negocio(400,
            'Enlace inválido o vencido. Solicita uno nuevo.');
        validar_nueva(nueva, confirmacion);
        if (typeof nueva !== 'string' || Buffer.byteLength(nueva, 'utf8') > 72)
            throw new error_negocio(400, 'La contraseña admite hasta 72 bytes.');
        if (!await recuperacion_model.consumir(token, nueva)) throw new error_negocio(400,
            'Enlace inválido o vencido. Solicita uno nuevo.');
        return respuesta_6.status(200).json(
        {
            mensaje: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.'
        });
    }
    catch (error)
    {
        responder_error(respuesta_6, error, 'restablecer');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* cambiar_contrasena(req, res)                                   */
/* Purpose: Change the password of the logged user. Required      */
/*          after logging in with a temporary password.           */
/******************************************************************/
const cambiar_contrasena = async (solicitud_6, respuesta_7) =>
{
    try
    {
        const
        {
            actual,
            nueva,
            confirmacion
        } = solicitud_6.body;
        if (!actual) throw new error_negocio(400, 'Escribe tu contraseña actual', ['actual']);
        validar_nueva(nueva, confirmacion);

        const correcta = await sesion_model.verificar_contrasena(solicitud_6.usuario.clave, actual);
        if (!correcta) throw new error_negocio(401, 'La contraseña actual no es correcta', [
            'actual'
        ]);
        if (actual === nueva) throw new error_negocio(422,
            'La nueva contraseña debe ser distinta a la actual', ['nueva']);

        await sesion_model.cambiar_contrasena(solicitud_6.usuario.clave, nueva);
        respuesta_7.status(200).json(
        {
            mensaje: 'Contraseña actualizada'
        });
    }
    catch (error)
    {
        responder_error(respuesta_7, error, 'cambiar_contrasena');
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
    const navegador = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ?
        'Firefox' :
        /Safari\//.test(ua) ? 'Safari' : 'Navegador';
    const sistema = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(
            ua) ? 'macOS' :
        /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Otro';
    return (navegador + ' · ' + sistema).slice(0, 100);
};

/* Shared rule for new passwords                                  */
const validar_nueva = (nueva, confirmacion) =>
{
    if (!nueva || String(nueva).length < MIN_CONTRASENA)
    {
        throw new error_negocio(400, 'La contraseña debe tener al menos ' + MIN_CONTRASENA +
            ' caracteres', ['nueva']);
    }
    if (nueva !== confirmacion)
    {
        throw new error_negocio(400, 'Las contraseñas no coinciden', ['nueva', 'confirmacion']);
    }
};

module.exports =
{
    login,
    sesion,
    logout,
    recuperar,
    restablecer,
    cambiar_contrasena
};

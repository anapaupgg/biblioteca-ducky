/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Valida la sesión y los permisos del perfil. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   firmar(texto) */
/*   firmar_token(id_sesion) */
/*   requiere_sesion(solicitud, respuesta, next) */
/*   requiere_funcion(...nombres) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

const crypto = require('crypto');
const sesion_model = require('../models/sesionModel');

const SECRETO = process.env.SESSION_SECRET;
const HORAS_INACTIVIDAD = 8;

/******************************************************************/
/* Reuse Instructions                                             */
/* firmar_token(id_sesion)                                        */
/* Purpose: Produce "<id_sesion>.<hmac>" so the client cannot     */
/*          forge another session id.                             */
/******************************************************************/
const firmar = (texto) => crypto.createHmac('sha256', SECRETO).update(String(texto)).digest('hex').slice(0,
    32);
const firmar_token = (id_sesion) => id_sesion + '.' + firmar(id_sesion);

/******************************************************************/
/* Reuse Instructions                                             */
/* requiere_sesion(req, res, next)                                */
/* Purpose: Accept the request only with a valid, open session.   */
/*          Loads req.usuario = { clave, nombre, perfil, tipo,    */
/*          funciones[], id_sesion }.                             */
/* Returns: 401 "Sesión expirada" when the token is missing,      */
/*          forged, closed or inactive for more than 8 hours.     */
/******************************************************************/
const requiere_sesion = async (solicitud, respuesta, next) =>
{
    try
    {
        const encabezado = solicitud.headers.authorization || '';
        const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : '';
        const [id_sesion, firma, extra] = token.split('.');

        if (!/^[1-9][0-9]*$/.test(id_sesion || '') || !Number.isSafeInteger(Number(id_sesion)) ||
            !/^[a-f0-9]{32}$/.test(firma || '') || extra !== undefined ||
            !crypto.timingSafeEqual(Buffer.from(firmar(id_sesion)), Buffer.from(firma)))
        {
            return respuesta.status(401).json(
            {
                codigo: 'SESION_EXPIRADA',
                error: 'Sesión expirada: inicia sesión nuevamente'
            });
        }

        const sesion = await sesion_model.obtener_activa(Number(id_sesion), HORAS_INACTIVIDAD);
        if (!sesion)
        {
            return respuesta.status(401).json(
            {
                codigo: 'SESION_EXPIRADA',
                error: 'Sesión expirada: inicia sesión nuevamente'
            });
        }

        solicitud.usuario = sesion;
        next();
    }
    catch (error)
    {
        console.error('requiere_sesion:', error);
        respuesta.status(500).json(
        {
            error: 'No fue posible validar tu sesión'
        });
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* requiere_funcion(...nombres)                                   */
/* Purpose: Allow the request when the profile has AT LEAST ONE   */
/*          of the given functions (e.g. 'Préstamos').            */
/* Returns: 403 "Acceso denegado" otherwise                       */
/******************************************************************/
const requiere_funcion = (...nombres) => (solicitud_2, respuesta_2, next) =>
{
    if (solicitud_2.usuario.es_temporal)
    {
        return respuesta_2.status(403).json(
        {
            codigo: 'CAMBIO_CONTRASENA_REQUERIDO',
            error: 'Debes cambiar tu contraseña temporal antes de continuar.'
        });
    }
    const permitido = nombres.some((nombre) => solicitud_2.usuario.funciones.includes(nombre));
    if (!permitido)
    {
        return respuesta_2.status(403).json(
        {
            error: 'Acceso denegado: su perfil no tiene permiso para esta función'
        });
    }
    next();
};

module.exports =
{
    firmar_token,
    requiere_sesion,
    requiere_funcion
};

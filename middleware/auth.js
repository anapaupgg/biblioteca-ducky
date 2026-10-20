/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Valida la sesión y los permisos del perfil.       */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   firmar_token(id_sesion)        - Build a signed token        */
/*   requiere_sesion(req,res,next)  - Validate token + session    */
/*   requiere_funcion(...nombres)   - Require one of the functions*/
/******************************************************************/

const crypto        = require('crypto');
const sesion_model  = require('../models/sesionModel');

const SECRETO          = process.env.SESSION_SECRET || 'biblioteca-ducky-dev';
const HORAS_INACTIVIDAD = 8;

/******************************************************************/
/* Reuse Instructions                                             */
/* firmar_token(id_sesion)                                        */
/* Purpose: Produce "<id_sesion>.<hmac>" so the client cannot     */
/*          forge another session id.                             */
/******************************************************************/
const firmar = (texto) => crypto.createHmac('sha256', SECRETO).update(String(texto)).digest('hex').slice(0, 32);
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
const requiere_sesion = async (req, res, next) =>
{
    try
    {
        const encabezado = req.headers.authorization || '';
        const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : '';
        const [id_sesion, firma] = token.split('.');

        if (!id_sesion || !firma || firmar(id_sesion) !== firma)
        {
            return res.status(401).json({ error: 'Sesión expirada: inicia sesión nuevamente' });
        }

        const sesion = await sesion_model.obtener_activa(Number(id_sesion), HORAS_INACTIVIDAD);
        if (!sesion)
        {
            return res.status(401).json({ error: 'Sesión expirada: inicia sesión nuevamente' });
        }

        req.usuario = sesion;
        next();
    }
    catch (error)
    {
        console.error('requiere_sesion:', error);
        res.status(500).json({ error: 'No fue posible validar tu sesión' });
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* requiere_funcion(...nombres)                                   */
/* Purpose: Allow the request when the profile has AT LEAST ONE   */
/*          of the given functions (e.g. 'Préstamos').            */
/* Returns: 403 "Acceso denegado" otherwise                       */
/******************************************************************/
const requiere_funcion = (...nombres) => (req, res, next) =>
{
    const permitido = nombres.some((nombre) => req.usuario.funciones.includes(nombre));
    if (!permitido)
    {
        return res.status(403).json({ error: 'Acceso denegado: su perfil no tiene permiso para esta función' });
    }
    next();
};

module.exports = { firmar_token, requiere_sesion, requiere_funcion };

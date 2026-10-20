/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Consultas de sesiones y contraseñas.              */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   iniciar_sesion(clave, contrasena, dispositivo)               */
/*   obtener_activa(id_sesion, horas)                             */
/*   cerrar(id_sesion)                                            */
/*   solicitar_recuperacion(clave_o_correo)                       */
/*   restablecer(token, nueva)                                    */
/*   verificar_contrasena(clave, contrasena)                      */
/*   cambiar_contrasena(clave, nueva)                             */
/******************************************************************/

const { pool } = require('../db');

/******************************************************************/
/* Reuse Instructions                                             */
/* iniciar_sesion(clave, contrasena, dispositivo)                 */
/* Purpose: Call iniciar_sesion() in the database. It verifies    */
/*          the bcrypt hash, counts failed attempts, locks the    */
/*          account 15 minutes after 3 failures and opens the     */
/*          session row.                                          */
/* Returns: { resultado, id_sesion, perfil, cambiar_contrasena }  */
/******************************************************************/
const iniciar_sesion = async (clave, contrasena, dispositivo) =>
{
    const r = await pool.query('SELECT * FROM iniciar_sesion($1, $2, $3)', [clave, contrasena, dispositivo]);
    return r.rows[0];
};

/******************************************************************/
/* Reuse Instructions                                             */
/* obtener_activa(id_sesion, horas)                               */
/* Purpose: Return the user of an open session (and its active    */
/*          profile functions) or null when the session is closed */
/*          or older than the inactivity window, which closes it. */
/******************************************************************/
const obtener_activa = async (id_sesion, horas) =>
{
    const r = await pool.query(
        `SELECT s.id_sesion, s.fecha_inicio, u.clave_usuario AS clave, u.nombre, u.correo, u.estatus,
                p.id_perfil, p.nombre AS perfil, t.nombre AS tipo,
                coalesce(array_agg(f.nombre ORDER BY f.id_funcion) FILTER (WHERE f.nombre IS NOT NULL), '{}') AS funciones,
                c.es_temporal
           FROM sesiones s
           JOIN usuarios u        ON u.clave_usuario = s.clave_usuario
           JOIN perfiles p        ON p.id_perfil = u.id_perfil
           JOIN tipos_usuario t   ON t.id_tipo_usuario = u.id_tipo_usuario
           JOIN credenciales c    ON c.clave_usuario = u.clave_usuario
           LEFT JOIN perfil_funcion pf ON pf.id_perfil = p.id_perfil AND p.estatus = 'Activo'
           LEFT JOIN funciones f  ON f.id_funcion = pf.id_funcion
          WHERE s.id_sesion = $1 AND s.fecha_fin IS NULL
          GROUP BY s.id_sesion, u.clave_usuario, p.id_perfil, t.nombre, c.es_temporal`,
        [id_sesion]);

    const sesion = r.rows[0];
    if (!sesion) return null;

    const vencida = (Date.now() - new Date(sesion.fecha_inicio).getTime()) > horas * 3600 * 1000;
    if (vencida || sesion.estatus !== 'Activo')
    {
        await cerrar(id_sesion);
        return null;
    }
    return sesion;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* cerrar(id_sesion)                                              */
/* Purpose: Close the session (Fecha_Fin = now)                   */
/******************************************************************/
const cerrar = (id_sesion) => pool.query('SELECT cerrar_sesion($1)', [id_sesion]);

/******************************************************************/
/* Reuse Instructions                                             */
/* funciones_de(clave)                                            */
/* Purpose: Names of the functions authorized to a user's profile */
/******************************************************************/
const funciones_de = async (clave) =>
{
    const r = await pool.query('SELECT funcion FROM v_menu_usuario WHERE clave_usuario = $1', [clave]);
    return r.rows.map((fila) => fila.funcion);
};

/******************************************************************/
/* Reuse Instructions                                             */
/* solicitar_recuperacion(clave_o_correo)                         */
/* Purpose: Create a one-time token valid for 30 minutes. Only    */
/*          its SHA-256 hash is stored; the plain token returns   */
/*          to the controller so it can be e-mailed.              */
/* Returns: { token, correo } or null when the user is unknown    */
/******************************************************************/
const solicitar_recuperacion = async (clave_o_correo) =>
{
    const r = await pool.query('SELECT solicitar_recuperacion($1) AS token', [clave_o_correo]);
    if (!r.rows[0].token) return null;
    const u = await pool.query(
        'SELECT correo FROM usuarios WHERE clave_usuario = $1 OR lower(correo) = lower($1)', [clave_o_correo]);
    return { token: r.rows[0].token, correo: u.rows[0].correo };
};

/******************************************************************/
/* Reuse Instructions                                             */
/* restablecer(token, nueva)                                      */
/* Returns: true when the token was valid, unused and not expired */
/******************************************************************/
const restablecer = async (token, nueva) =>
{
    const r = await pool.query('SELECT restablecer_contrasena($1, $2) AS ok', [token, nueva]);
    return r.rows[0].ok;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* verificar_contrasena(clave, contrasena) / cambiar_contrasena   */
/* Purpose: Check the current password and store a new one as a   */
/*          bcrypt hash (no longer temporary).                    */
/******************************************************************/
const verificar_contrasena = async (clave, contrasena) =>
{
    const r = await pool.query(
        'SELECT contrasena_hash = crypt($2, contrasena_hash) AS ok FROM credenciales WHERE clave_usuario = $1',
        [clave, contrasena]);
    return r.rows.length > 0 && r.rows[0].ok;
};

const cambiar_contrasena = (clave, nueva) =>
    pool.query('SELECT asignar_contrasena($1, $2, FALSE)', [clave, nueva]);

module.exports =
{
    iniciar_sesion, obtener_activa, cerrar, funciones_de,
    solicitar_recuperacion, restablecer, verificar_contrasena, cambiar_contrasena
};

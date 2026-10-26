/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo PostgreSQL: consultas y persistencia parametrizadas. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   bloquear_estado(client, clave, esperado) */
/*   revocar_acceso(client, clave) */
/*   listar({
        consulta,
        estatus
    } = {}) */
/*   buscar(clave) */
/*   crear(client, datos) */
/*   cambiar_perfil(client, clave, id_perfil) */
/*   dar_baja(client, datos) */
/*   reactivar(client, datos) */
/*   adeudos(clave) */
/*   tipos() */
/*   motivos(ambito) */
/*   administradores_activos() */
/*   cerrar_sesiones(client, clave) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Entradas validadas por controlador; devuelve Promise de datos SQL. */
/* client: conexión pg de la transacción cuando la firma la requiere. */
/* No liberar ni confirmar un client recibido; propagar errores SQL. */
/******************************************************************/

const
{
    pool
} = require('../db');
const
{
    error_negocio
} = require('../utils/errores');

const bloquear_estado = async (client, clave, esperado) =>
{
    const resultado = await client.query(
        'SELECT estatus FROM usuarios WHERE clave_usuario = $1 FOR UPDATE', [clave]);
    if (!resultado.rows[0] || resultado.rows[0].estatus !== esperado)
        throw new error_negocio(409, 'El estado del usuario cambió. Actualiza la consulta.');
};

const revocar_acceso = async (client, clave) =>
{
    await client.query(
        'UPDATE sesiones SET fecha_fin = now() WHERE clave_usuario = $1 AND fecha_fin IS NULL', [
            clave
        ]);
    await client.query(
        'UPDATE recuperaciones_acceso SET usado = TRUE WHERE clave_usuario = $1 AND NOT usado', [
            clave
        ]);
};

/* Columns returned for every user                                */
const SELECT_USUARIO =
    `SELECT u.clave_usuario AS clave, u.nombre, u.correo, u.estatus, u.fecha_alta,
            t.id_tipo_usuario, t.nombre AS tipo, p.id_perfil, p.nombre AS perfil,
            u.clave_admin_alta, a.nombre AS admin_alta
       FROM usuarios u
       JOIN tipos_usuario t ON t.id_tipo_usuario = u.id_tipo_usuario
       JOIN perfiles p      ON p.id_perfil = u.id_perfil
       LEFT JOIN usuarios a ON a.clave_usuario = u.clave_admin_alta`;

/******************************************************************/
/* Reuse Instructions                                             */
/* listar({ q, estatus })                                         */
/* Purpose: List users filtered by clave/name text and status     */
/******************************************************************/
const listar = (
    {
        consulta,
        estatus
    } =
    {
    }) =>
    pool.query(
        SELECT_USUARIO +
        ` WHERE ($1::text IS NULL OR u.clave_usuario ILIKE '%' || $1 || '%' OR u.nombre ILIKE '%' || $1 || '%')
            AND ($2::text IS NULL OR u.estatus = $2)
          ORDER BY u.estatus, u.nombre`,
        [consulta || null, estatus || null]);

/******************************************************************/
/* Reuse Instructions                                             */
/* buscar(clave)                                                  */
/* Returns: Promise - rows[0] is the user or undefined; includes  */
/*          the open baja (if any) and the profile's functions    */
/******************************************************************/
const buscar = (clave) =>
    pool.query(
        `SELECT x.*,
                (SELECT row_to_json(b) FROM (
                    SELECT bu.id_baja_usuario, bu.fecha_baja, m.descripcion AS motivo, bu.comentario
                      FROM bajas_usuario bu JOIN motivos_baja m USING (id_motivo)
                     WHERE bu.clave_usuario = x.clave AND bu.fecha_reactivacion IS NULL
                     ORDER BY bu.id_baja_usuario DESC LIMIT 1) b) AS baja,
                (SELECT array_agg(f.nombre ORDER BY f.id_funcion) FROM perfil_funcion pf
                   JOIN funciones f USING (id_funcion) WHERE pf.id_perfil = x.id_perfil) AS funciones
           FROM (` + SELECT_USUARIO + ` WHERE u.clave_usuario = $1) x`,
        [clave]);

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(client, { clave, nombre, correo, id_tipo, id_perfil,     */
/*                 admin, contrasena })                           */
/* Purpose: Register the user and its temporary password (bcrypt  */
/*          hash generated inside PostgreSQL).                    */
/******************************************************************/
const crear = async (client, datos) =>
{
    await client.query(
        `INSERT INTO usuarios (clave_usuario, nombre, correo, id_tipo_usuario, id_perfil, clave_admin_alta)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [datos.clave, datos.nombre, datos.correo, datos.id_tipo, datos.id_perfil, datos.admin]);
    await client.query('SELECT asignar_contrasena($1, $2, TRUE)', [datos.clave, datos.contrasena]);
};

/******************************************************************/
/* Reuse Instructions                                             */
/* cambiar_perfil(client, clave, id_perfil)                       */
/* Purpose: Assign another profile (trigger checks it is active)  */
/******************************************************************/
const cambiar_perfil = (client, clave, id_perfil) =>
    client.query('UPDATE usuarios SET id_perfil = $2 WHERE clave_usuario = $1', [clave, id_perfil]);

/******************************************************************/
/* Reuse Instructions                                             */
/* dar_baja(client, { clave, id_motivo, comentario, admin })      */
/* Purpose: Insert the baja. The trigger validates the reason,    */
/*          refuses users with active loans and sets the user to  */
/*          Inactivo. Revoke sessions/tokens and delete credentials. */
/******************************************************************/
const dar_baja = async (client, datos) =>
{
    await bloquear_estado(client, datos.clave, 'Activo');
    await client.query(
        `INSERT INTO bajas_usuario (clave_usuario, id_motivo, comentario, clave_administrador)
         VALUES ($1, $2, nullif(btrim($3), ''), $4)`,
        [datos.clave, datos.id_motivo, datos.comentario || '', datos.admin]);
    await revocar_acceso(client, datos.clave);
    await client.query('DELETE FROM credenciales WHERE clave_usuario = $1', [datos.clave]);
    await client.query("SELECT registrar_bitacora('Baja de usuario', $1)",
        ['Usuario ' + datos.clave + ' · motivo ' + datos.id_motivo]);
};

/******************************************************************/
/* Reuse Instructions                                             */
/* reactivar(client, { clave, admin, id_perfil, contrasena })      */
/* Purpose: Fill Fecha_Reactivacion of the open baja; the trigger */
/*          sets Activo; replace credentials in the same transaction. */
/* Returns: 1; rejects missing/duplicate baja or stale status.     */
/******************************************************************/
const reactivar = async (client, datos) =>
{
    await bloquear_estado(client, datos.clave, 'Inactivo');
    if (!datos.contrasena || datos.contrasena.length < 8)
        throw new error_negocio(400, 'Se requiere una nueva contraseña temporal');
    if (datos.id_perfil) await cambiar_perfil(client, datos.clave, datos.id_perfil);
    const resultado_2 = await client.query(
        `UPDATE bajas_usuario SET fecha_reactivacion = CURRENT_DATE, clave_admin_reactivacion = $2
          WHERE clave_usuario = $1 AND fecha_reactivacion IS NULL`,
        [datos.clave, datos.admin]);
    if (resultado_2.rowCount !== 1) throw new error_negocio(409,
        'No existe una única baja pendiente para reactivar');
    await revocar_acceso(client, datos.clave);
    await client.query('SELECT asignar_contrasena($1, $2, TRUE)', [datos.clave, datos.contrasena]);
    await client.query("SELECT registrar_bitacora('Reactivación de usuario', $1)",
        ['Usuario ' + datos.clave + ' · nueva credencial temporal']);
    return resultado_2.rowCount;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* adeudos(clave)                                                 */
/* Returns: { prestamos_activos, multas_pendientes, monto }       */
/******************************************************************/
const adeudos = async (clave) =>
{
    const resultado_3 = await pool.query(
        `SELECT (SELECT count(*) FROM prestamos WHERE clave_usuario = $1 AND estatus = 'Activo')::int AS prestamos_activos,
                (SELECT count(*) FROM v_multas_pendientes WHERE clave_usuario = $1)::int AS multas_pendientes,
                (SELECT coalesce(sum(monto), 0) FROM v_multas_pendientes WHERE clave_usuario = $1) AS monto`,
        [clave]);
    return resultado_3.rows[0];
};

const tipos = () => pool.query(
    'SELECT id_tipo_usuario AS id, nombre, dias_prestamo, max_renovaciones, max_ejemplares, multa_diaria FROM tipos_usuario ORDER BY id_tipo_usuario'
    );

const motivos = (ambito) =>
    pool.query('SELECT id_motivo AS id, descripcion FROM motivos_baja WHERE aplica_a = $1 ORDER BY id_motivo',
        [ambito]);

const administradores_activos = async () =>
{
    const resultado_4 = await pool.query(
        `SELECT count(DISTINCT clave_usuario)::int AS total FROM v_menu_usuario WHERE funcion = 'Gestionar perfiles'`
        );
    return resultado_4.rows[0].total;
};

/* cerrar_sesiones(client, clave): conexión de la transacción y clave validada.
 * No confirma ni libera la conexión; propaga errores al controlador. */
const cerrar_sesiones = (client, clave) => client.query(
    'UPDATE sesiones SET fecha_fin = now() WHERE clave_usuario = $1 AND fecha_fin IS NULL', [clave]);

module.exports =
{
    cerrar_sesiones,
    listar,
    buscar,
    crear,
    cambiar_perfil,
    dar_baja,
    reactivar,
    adeudos,
    tipos,
    motivos,
    administradores_activos
};

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo PostgreSQL: consultas y persistencia parametrizadas. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   hash(token) */
/*   emitir(entrada, token) */
/*   invalidar(token) */
/*   consumir(token, nueva) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Entradas validadas por controlador; devuelve Promise de datos SQL. */
/* client: conexión pg de la transacción cuando la firma la requiere. */
/* No liberar ni confirmar un client recibido; propagar errores SQL. */
/******************************************************************/

const crypto = require('node:crypto');
const
{
    pool,
    con_usuario
} = require('../db');
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
async function emitir(entrada, token)
{
    return con_usuario(null, async campo =>
    {
        const usuario_2 = await campo.query(
            "SELECT clave_usuario, correo FROM usuarios WHERE (clave_usuario=$1 OR lower(correo)=lower($1)) AND estatus='Activo' FOR UPDATE",
            [entrada]);
        if (usuario_2.rowCount !== 1) return null;
        const usuario = usuario_2.rows[0];
        const reciente = await campo.query(
            "SELECT 1 FROM recuperaciones_acceso WHERE clave_usuario=$1 AND fecha_solicitud > now()-interval '2 minutes' LIMIT 1",
            [usuario.clave_usuario]);
        if (reciente.rowCount) return null;
        await campo.query(
            'UPDATE recuperaciones_acceso SET usado=TRUE WHERE clave_usuario=$1 AND NOT usado',
            [usuario.clave_usuario]);
        await campo.query(
            "INSERT INTO recuperaciones_acceso(clave_usuario,token_hash,fecha_solicitud,fecha_expiracion) VALUES($1,$2,now(),now()+interval '30 minutes')",
            [usuario.clave_usuario, hash(token)]);
        return usuario.correo;
    });
}
const invalidar = token => pool.query('UPDATE recuperaciones_acceso SET usado=TRUE WHERE token_hash=$1', [
    hash(token)
]);
async function consumir(token, nueva)
{
    return con_usuario(null, async campo_2 =>
    {
        const resultado = await campo_2.query(
            'SELECT clave_usuario FROM recuperaciones_acceso WHERE token_hash=$1', [hash(
                token)]);
        if (!resultado.rowCount) return false;
        const clave = resultado.rows[0].clave_usuario;
        // Mismo orden de bloqueo que baja/reactivación: primero usuario.
        const usuario_3 = await campo_2.query(
            "SELECT 1 FROM usuarios WHERE clave_usuario=$1 AND estatus='Activo' FOR UPDATE",
            [clave]);
        if (!usuario_3.rowCount) return false;
        const valido = await campo_2.query(
            'SELECT 1 FROM recuperaciones_acceso WHERE token_hash=$1 AND NOT usado AND fecha_expiracion > now() FOR UPDATE',
            [hash(token)]);
        if (!valido.rowCount) return false;
        await campo_2.query('SELECT asignar_contrasena($1,$2,FALSE)', [clave, nueva]);
        await campo_2.query(
            'UPDATE recuperaciones_acceso SET usado=TRUE WHERE clave_usuario=$1 AND NOT usado',
            [clave]);
        await campo_2.query(
            'UPDATE sesiones SET fecha_fin=now() WHERE clave_usuario=$1 AND fecha_fin IS NULL',
            [clave]);
        await campo_2.query(
            "INSERT INTO bitacora(clave_usuario,accion,detalle) VALUES($1,'Restablecer contraseña','Enlace de correo de un solo uso')",
            [clave]);
        return true;
    });
}
module.exports =
{
    emitir,
    invalidar,
    consumir
};

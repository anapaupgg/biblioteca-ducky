const crypto = require('node:crypto');
const { pool, con_usuario } = require('../db');
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
async function emitir(entrada, token) {
    return con_usuario(null, async c => {
        const u = await c.query("SELECT clave_usuario, correo FROM usuarios WHERE (clave_usuario=$1 OR lower(correo)=lower($1)) AND estatus='Activo' FOR UPDATE", [entrada]);
        if (u.rowCount !== 1) return null;
        const usuario = u.rows[0];
        const reciente = await c.query("SELECT 1 FROM recuperaciones_acceso WHERE clave_usuario=$1 AND fecha_solicitud > now()-interval '2 minutes' LIMIT 1", [usuario.clave_usuario]);
        if (reciente.rowCount) return null;
        await c.query('UPDATE recuperaciones_acceso SET usado=TRUE WHERE clave_usuario=$1 AND NOT usado', [usuario.clave_usuario]);
        await c.query("INSERT INTO recuperaciones_acceso(clave_usuario,token_hash,fecha_solicitud,fecha_expiracion) VALUES($1,$2,now(),now()+interval '30 minutes')", [usuario.clave_usuario, hash(token)]);
        return usuario.correo;
    });
}
const invalidar = token => pool.query('UPDATE recuperaciones_acceso SET usado=TRUE WHERE token_hash=$1', [hash(token)]);
async function consumir(token, nueva) {
    return con_usuario(null, async c => {
        const r = await c.query('SELECT clave_usuario FROM recuperaciones_acceso WHERE token_hash=$1', [hash(token)]);
        if (!r.rowCount) return false;
        const clave = r.rows[0].clave_usuario;
        // Mismo orden de bloqueo que baja/reactivación: primero usuario.
        const u = await c.query("SELECT 1 FROM usuarios WHERE clave_usuario=$1 AND estatus='Activo' FOR UPDATE", [clave]);
        if (!u.rowCount) return false;
        const valido = await c.query('SELECT 1 FROM recuperaciones_acceso WHERE token_hash=$1 AND NOT usado AND fecha_expiracion > now() FOR UPDATE', [hash(token)]);
        if (!valido.rowCount) return false;
        await c.query('SELECT asignar_contrasena($1,$2,FALSE)', [clave,nueva]);
        await c.query('UPDATE recuperaciones_acceso SET usado=TRUE WHERE clave_usuario=$1 AND NOT usado', [clave]);
        await c.query('UPDATE sesiones SET fecha_fin=now() WHERE clave_usuario=$1 AND fecha_fin IS NULL', [clave]);
        await c.query("INSERT INTO bitacora(clave_usuario,accion,detalle) VALUES($1,'Restablecer contraseña','Enlace de correo de un solo uso')", [clave]);
        return true;
    });
}
module.exports = { emitir, invalidar, consumir };

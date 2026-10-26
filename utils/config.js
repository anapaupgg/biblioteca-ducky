/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Infraestructura compartida del sistema Biblioteca Ducky. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   validar_base(env = process.env) */
/*   validar_servidor(env = process.env) */
/*   diagnostico_base(error) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

// Validaciones sin imprimir credenciales ni cadenas de conexión.
function validar_base(env = process.env)
{
    if (!env.DATABASE_URL || !env.DATABASE_URL.trim())
        throw new Error('Falta DATABASE_URL. Crea .env a partir de .env.example y configura PostgreSQL.');
    let url;
    try
    {
        url = new URL(env.DATABASE_URL);
    }
    catch
    {
        throw new Error('DATABASE_URL no es una URL válida de PostgreSQL.');
    }
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2)
        throw new Error('DATABASE_URL debe indicar un servidor y una base PostgreSQL.');
}

function validar_servidor(env = process.env)
{
    validar_base(env);
    const secreto = env.SESSION_SECRET || '';
    if (secreto.length < 32 || ['biblioteca-ducky-dev', 'cambia-esta-llave-por-una-propia'].includes(secreto))
        throw new Error('Configura SESSION_SECRET en .env con una clave propia de al menos 32 caracteres.');
}

function diagnostico_base(error)
{
    if (['28P01', '28000'].includes(error.code) || /SASL|no password supplied/.test(error.message || ''))
        return 'PostgreSQL rechazó las credenciales. Revisa el usuario y la contraseña en DATABASE_URL.';
    if (error.code === '3D000')
    return 'La base indicada no existe. Créala en PostgreSQL y verifica DATABASE_URL.';
    if (['42P01', '42883'].includes(error.code))
        return 'Faltan tablas o funciones de Biblioteca Ducky. Revisa la instalación del esquema antes de usar db:init, que borra los datos.';
    if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code))
        return 'No se pudo contactar PostgreSQL. Revisa que esté encendido y que el host y puerto sean correctos.';
    return 'No se pudo verificar PostgreSQL. Revisa la conexión, SSL y los permisos de la base.';
}

module.exports =
{
    validar_base,
    validar_servidor,
    diagnostico_base
};

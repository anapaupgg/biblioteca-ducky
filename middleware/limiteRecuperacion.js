/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Infraestructura compartida del sistema Biblioteca Ducky. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   Dependencias, configuración y montaje del módulo. */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

// Límite por IP para una instancia. Despliegues múltiples requieren almacén compartido.
const intentos = new Map();
module.exports = (solicitud, respuesta, next) =>
{
    const ahora = Date.now();
    for (const [ip, dato] of intentos)
        if (dato.hasta <= ahora) intentos.delete(ip);
    const ip = solicitud.ip;
    const dato = intentos.get(ip) ||
    {
        cuenta: 0,
        hasta: ahora + 15 * 60 * 1000
    };
    if (dato.cuenta >= 10 || (!intentos.has(ip) && intentos.size >= 10000))
        return respuesta.status(429).json(
        {
            error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.'
        });
    dato.cuenta++;
    intentos.set(ip, dato);
    respuesta.set('Cache-Control', 'no-store');
    next();
};

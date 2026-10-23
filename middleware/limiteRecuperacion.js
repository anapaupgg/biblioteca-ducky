// Límite por IP para una instancia. Despliegues múltiples requieren almacén compartido.
const intentos = new Map();
module.exports = (req, res, next) => {
    const ahora = Date.now();
    for (const [ip, dato] of intentos) if (dato.hasta <= ahora) intentos.delete(ip);
    const ip = req.ip;
    const dato = intentos.get(ip) || { cuenta: 0, hasta: ahora + 15 * 60 * 1000 };
    if (dato.cuenta >= 10 || (!intentos.has(ip) && intentos.size >= 10000))
        return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
    dato.cuenta++;
    intentos.set(ip, dato);
    res.set('Cache-Control', 'no-store');
    next();
};

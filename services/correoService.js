// El proveedor recibe únicamente destinatario y enlace; nunca contraseñas.
const crypto = require('node:crypto');
function configuracion() {
    const { RESEND_API_KEY: key, RECOVERY_FROM: from, APP_PUBLIC_URL: base, RECOVERY_SECRET: secret } = process.env;
    if (!key || !from || !base || !secret || secret.length < 32) return null;
    try {
        const url = new URL(base);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
        return { key, from, base: url.origin, secret };
    } catch { return null; }
}
function crear_token(config) {
    const random = crypto.randomBytes(32).toString('hex');
    return random + '.' + crypto.createHmac('sha256', config.secret).update(random).digest('hex');
}
function token_valido(token, config) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(token)) return false;
    const [random, firma] = token.split('.');
    return crypto.timingSafeEqual(Buffer.from(firma, 'hex'), crypto.createHmac('sha256', config.secret).update(random).digest());
}
async function enviar(config, correo, token) {
    const enlace = config.base + '/login.html#token=' + encodeURIComponent(token);
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: 'Bearer ' + config.key, 'Content-Type': 'application/json',
            'Idempotency-Key': 'recovery/' + crypto.createHash('sha256').update(token).digest('hex') },
        body: JSON.stringify({ from: config.from, to: [correo], subject: 'Recupera tu acceso a Biblioteca Ducky',
            text: 'Para elegir una nueva contraseña, abre este enlace. Vence en 30 minutos y solo puede usarse una vez.\n\n' + enlace + '\n\nSi no lo solicitaste, ignora este correo.' })
    });
    if (!response.ok) throw new Error('ENVIO_RECUPERACION_FALLIDO');
}
module.exports = { configuracion, crear_token, token_valido, enviar };

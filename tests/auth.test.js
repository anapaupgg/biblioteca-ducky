const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters';
const modelo = require('../models/sesionModel');
const { firmar_token, requiere_sesion, requiere_funcion } = require('../middleware/auth');
function respuesta() {
    return { status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
}
test('rechaza tokens alterados, incompletos o con segmentos extra sin consultar la BD', async () => {
    const original = modelo.obtener_activa;
    modelo.obtener_activa = () => { throw new Error('No debe consultar la BD'); };
    try {
        for (const token of ['', 'abc.def', firmar_token(1) + '.extra', '1.' + '0'.repeat(32), firmar_token(-1)]) {
            const res = respuesta();
            await requiere_sesion({ headers: { authorization: 'Bearer ' + token } }, res, () => assert.fail('Token inválido aceptado'));
            assert.equal(res.statusCode, 401);
            assert.equal(res.body.codigo, 'SESION_EXPIRADA');
        }
    } finally { modelo.obtener_activa = original; }
});
test('sesión válida pasa; sesión cerrada devuelve código de expiración', async () => {
    const original = modelo.obtener_activa;
    try {
        const usuario = { clave: '100001', funciones: ['Gestionar libros'] };
        modelo.obtener_activa = async () => usuario;
        const req = { headers: { authorization: 'Bearer ' + firmar_token(1) } };
        let paso = false;
        await requiere_sesion(req, respuesta(), () => { paso = true; });
        assert.equal(paso, true);
        assert.equal(req.usuario, usuario);
        modelo.obtener_activa = async () => null;
        const res = respuesta();
        await requiere_sesion(req, res, () => assert.fail());
        assert.equal(res.body.codigo, 'SESION_EXPIRADA');
    } finally { modelo.obtener_activa = original; }
});
test('contraseña temporal bloquea operaciones aun teniendo permiso', () => {
    const res = respuesta();
    requiere_funcion('Gestionar libros')({ usuario: { es_temporal: true, funciones: ['Gestionar libros'] } }, res, () => assert.fail());
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.codigo, 'CAMBIO_CONTRASENA_REQUERIDO');
});
test('contraseña definitiva respeta los permisos del perfil', () => {
    let paso = false;
    const autorizar = requiere_funcion('Gestionar libros');
    autorizar({ usuario: { es_temporal: false, funciones: ['Gestionar libros'] } }, respuesta(), () => { paso = true; });
    assert.equal(paso, true);
    const res = respuesta();
    autorizar({ usuario: { es_temporal: false, funciones: [] } }, res, () => assert.fail());
    assert.equal(res.statusCode, 403);
});

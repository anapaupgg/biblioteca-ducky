const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function controlador() {
    const contexto = vm.createContext({
        module: { exports: {} },
        require: (nombre) => {
            if (nombre.includes('sesionModel')) return new Proxy({}, {
                get() { throw new Error('La recuperación deshabilitada no debe consultar ni modificar la BD'); }
            });
            return {};
        }
    });
    vm.runInContext(fs.readFileSync(require.resolve('../controllers/authController'), 'utf8'), contexto);
    return contexto.module.exports;
}

function ejecutar(fn, body) {
    const respuesta = { status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    fn({ body }, respuesta);
    return JSON.parse(JSON.stringify({ status: respuesta.code, body: respuesta.data }));
}

test('recuperación no revela cuentas ni genera tokens para ninguna entrada', () => {
    const { recuperar } = controlador();
    const respuestas = [{ clave_o_correo: '621234' }, { clave_o_correo: 'inexistente@example.com' }, {}, null]
        .map(body => ejecutar(recuperar, body));
    for (const r of respuestas) {
        assert.deepEqual(r, respuestas[0]);
        assert.equal(r.status, 503);
        assert.deepEqual(Object.keys(r.body).sort(), ['codigo', 'error']);
        assert.equal(r.body.codigo, 'RECUPERACION_NO_DISPONIBLE');
    }
});

test('tokens de demostración previos no pueden modificar contraseñas', () => {
    const r = ejecutar(controlador().restablecer, { token: 'token-previamente-expuesto', nueva: 'OtraClave123', confirmacion: 'OtraClave123' });
    assert.equal(r.status, 503);
    assert.equal(r.body.codigo, 'RECUPERACION_NO_DISPONIBLE');
});

test('la interfaz informa indisponibilidad sin pedir datos ni mostrar enlaces', async () => {
    let dialogo;
    const contexto = vm.createContext({ Ui: { dialogo: async opciones => { dialogo = opciones; } } });
    vm.runInContext(fs.readFileSync(require.resolve('../frontend/js/views/LoginView.js'), 'utf8'), contexto);
    await vm.runInContext('LoginView.pedir_recuperacion()', contexto);
    assert.equal(dialogo.titulo, 'Recuperación no disponible');
    assert.equal(dialogo.cuerpo, undefined);
    assert.equal(dialogo.al_confirmar, undefined);
    assert.match(dialogo.texto, /aún no está disponible/);
});

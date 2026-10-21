const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../frontend/js/utils/layout.js'), 'utf8');
function preparar() {
    let resolver, rechazar;
    const consulta = new Promise((resolve, reject) => { resolver = resolve; rechazar = reject; });
    const dibujos = [];
    const usuario = { nombre: 'Prueba', funciones: ['Buscar libros'] };
    const contexto = vm.createContext({
        Session: { token: () => 'token', get: () => usuario, actualizar_usuario() {} },
        Api: { get: () => consulta },
        Ui: { toast() {} },
        window: { location: { pathname: '/buscar.html' } },
        dibujos
    });
    vm.runInContext(source + '\nLayout.dibujar = (usuario) => dibujos.push(usuario);', contexto);
    return { contexto, resolver, rechazar, dibujos, usuario };
}
test('muestra el menú antes de terminar la consulta y no lo reconstruye si no cambia', async () => {
    const c = preparar();
    const pendiente = vm.runInContext("Layout.montar({ activo: 'buscar' })", c.contexto);
    assert.equal(c.dibujos.length, 1);
    c.resolver({ usuario: c.usuario });
    await pendiente;
    assert.equal(c.dibujos.length, 1);
});
test('actualiza el menú si cambia el usuario validado por el servidor', async () => {
    const c = preparar();
    const pendiente = vm.runInContext('Layout.montar({})', c.contexto);
    c.resolver({ usuario: { nombre: 'Actualizado', funciones: [] } });
    await pendiente;
    assert.equal(c.dibujos.length, 2);
    assert.equal(c.dibujos[1].nombre, 'Actualizado');
});
test('no inicia el controlador de la página si la sesión expiró', async () => {
    const c = preparar();
    const pendiente = vm.runInContext('Layout.montar({})', c.contexto);
    c.rechazar({ status: 401 });
    assert.equal(await pendiente, null);
});

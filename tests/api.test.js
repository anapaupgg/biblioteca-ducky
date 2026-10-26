/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Pruebas de regresión y contratos del sistema. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   simular(body) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Ejecutar con npm test; DUCKY_TEST_DB=1 habilita integración local. */
/* Las pruebas de datos revierten cambios o usan esquema aislado. */
/******************************************************************/

const
{
    test
} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
async function simular(body)
{
    let borrada = false;
    const contexto = vm.createContext(
    {
        session:
        {
            token: () => 'token',
            clear: () =>
            {
                borrada = true;
            }
        },
        window:
        {
            location:
            {
                href: ''
            }
        },
        fetch: async () => (
        {
            status: 401,
            ok: false,
            text: async () => JSON.stringify(body)
        })
    });
    vm.runInContext(fs.readFileSync(require.resolve('../frontend/js/utils/api.js'), 'utf8'), contexto);
    await assert.rejects(vm.runInContext("api.post('/auth/contrasena', {})", contexto));
    return (
    {
        borrada,
        href: contexto.window.location.href
    });
}
test('contraseña actual incorrecta mantiene la sesión; sesión expirada sí redirige', async () =>
{
    assert.deepEqual(await simular(
    {
        error: 'La contraseña actual no es correcta'
    }),
    {
        borrada: false,
        href: ''
    });
    assert.deepEqual(await simular(
    {
        codigo: 'SESION_EXPIRADA',
        error: 'Sesión expirada'
    }),
    {
        borrada: true,
        href: 'login.html?expirada=1'
    });
});

test('respuesta HTML inesperada no se muestra ni se acepta como datos de API', async () =>
{
    for (const status of [200, 404, 502])
    {
        const contexto = vm.createContext(
        {
            session:
            {
                token: () => null
            },
            fetch: async () => (
            {
                status,
                ok: status === 200,
                text: async () => '<html>contenido ajeno</html>'
            })
        });
        vm.runInContext(fs.readFileSync(require.resolve('../frontend/js/utils/api.js'), 'utf8'),
            contexto);
        await assert.rejects(vm.runInContext("api.post('/auth/login', {})", contexto), error =>
        {
            assert.match(error.message, /respuesta inesperada/);
            assert.equal(error.message.includes('<html>'), false);
            return true;
        });
    }
});

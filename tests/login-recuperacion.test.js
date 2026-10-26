/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Pruebas de regresión y contratos del sistema. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   preparar(falla = false) */
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

function preparar(falla = false)
{
    const estado =
    {
        borrada: false,
        panel: false,
        peticiones: []
    };
    const window =
    {
        location:
        {
            hash: '#token=token-del-correo',
            href: 'login.html#token=token-del-correo'
        },
        history:
        {
            replaceState: (_, __, url) =>
            {
                estado.url = url;
            }
        }
    };
    const ctx = vm.createContext(
    {
        window,
        URLSearchParams,
        document:
        {
            getElementById: () => (
            {
                addEventListener()
                {},
                focus()
                {}
            })
        },
        session:
        {
            token: () => 'sesion-anterior',
            clear: () =>
            {
                estado.borrada = true;
            }
        },
        ui:
        {
            param: () => null,
            marcar()
            {}
        },
        login_view:
        {
            enlazar()
            {},
            enfocar()
            {},
            mostrar_restablecer: () =>
            {
                estado.panel = true;
            },
            mensaje()
            {},
            nueva_contrasena: () => (
            {
                nueva: 'Prueba1234',
                confirmacion: 'Prueba1234'
            }),
            mensaje_restablecer: tipo =>
            {
                estado.mensaje = tipo;
            }
        },
        auth_model:
        {
            restablecer: async (...args) =>
            {
                estado.peticiones.push(args);
                if (falla) throw Error('Enlace vencido');
                return (
                {
                    mensaje: 'Actualizada'
                });
            }
        },
        setTimeout: fn =>
        {
            estado.redirigir = fn;
        }
    });
    vm.runInContext(fs.readFileSync(require.resolve('../frontend/js/controllers/LoginController.js'),
        'utf8'), ctx);
    return (
    {
        estado,
        window,
        ctx
    });
}
test('enlace abre formulario pese a sesión previa y borra URL; éxito limpia sesión antes de redirigir',
async () =>
    {
        const
        {
            estado,
            window,
            ctx
        } = preparar();
        vm.runInContext('login_controller.iniciar()', ctx);
        assert.equal(estado.panel, true);
        assert.equal(estado.url, 'login.html');
        assert.notEqual(window.location.href, 'inicio.html');
        await vm.runInContext('login_controller.restablecer()', ctx);
        assert.equal(estado.peticiones[0][0], 'token-del-correo');
        assert.equal(estado.borrada, true);
        assert.equal(vm.runInContext('login_controller.token', ctx), null);
        estado.redirigir();
        assert.equal(window.location.href, 'login.html');
    });
test('fallo de recuperación conserva sesión y no redirige ni anuncia éxito', async () =>
{
    const
    {
        estado,
        ctx
    } = preparar(true);
    vm.runInContext('login_controller.iniciar()', ctx);
    await vm.runInContext('login_controller.restablecer()', ctx);
    assert.equal(estado.borrada, false);
    assert.equal(estado.mensaje, 'error');
    assert.equal(estado.redirigir, undefined);
});

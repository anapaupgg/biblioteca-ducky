/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Permisos independientes y cancelación de compras. */
/* Listing Contents: cargar; casos de autorización y cancelación. */
/* Reuse Instructions: npm test; modelos simulados sin escrituras. */
/******************************************************************/
const
{
    test
} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function cargar(contexto)
{
    vm.createContext(contexto);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../frontend/js/controllers/PedidosController.js'), 'utf8'), contexto);
    return vm.runInContext('pedidos_controller', contexto);
}
test('compras: solo autorización abre historial y no formulario de solicitud', async () =>
{
    const ocultas = [];
    const controlador = cargar(
    {
        layout:
        {
            montar: async () => (
            {
                funciones: ['Autorizar compras']
            })
        },
        window:
        {
            location:
            {
                hash: '#recepcion'
            }
        },
        ui: { param: () => null },
        pedidos_view:
        {
            ocultar_tabs: tabs => ocultas.push(...tabs),
            enlazar: () =>
            {}
        }
    });
    let inicial;
    controlador.mostrar = tab =>
    {
        inicial = tab;
    };
    await controlador.iniciar();
    assert.equal(inicial, 'historial');
    assert.equal(controlador.puede_autorizar, true);
    assert.equal(controlador.puede_solicitar, false);
    assert.equal(controlador.puede_recibir, false);
    assert.deepEqual(ocultas, ['nueva']);
});
test('compras: solicitar por sí solo no habilita autorización en historial', async () =>
{
    let autorizacion;
    const controlador = cargar(
    {
        pedido_model:
        {
            listar: async () => []
        },
        pedidos_view:
        {
            activar: () =>
            {},
            historial: (_lista, permiso) =>
            {
                autorizacion = permiso;
            }
        }
    });
    controlador.cargar_presupuesto = async () => [];
    controlador.puede_solicitar = true;
    await controlador.mostrar('historial');
    assert.equal(autorizacion, false);
    controlador.puede_autorizar = true;
    await controlador.mostrar('historial');
    assert.equal(autorizacion, true);
});
test('compras: abrir revisión y cancelar respuesta conserva borrador sin escrituras', async () =>
{
    let escrituras = 0;
    const controlador = cargar(
    {
        ui:
        {
            dialogo: async () => false,
            dinero: String
        },
        pedido_model:
        {
            crear: () =>
            {
                escrituras++;
            },
            estatus: () =>
            {
                escrituras++;
            }
        },
        pedidos_view:
        {
            revision: () => {}
        }
    });
    controlador.lineas = [
    {
        cantidad: 2,
        costo_unitario: 100
    }];
    await controlador.enviar();
    await controlador.responder(1, 'Autorizado');
    assert.equal(escrituras, 0);
    assert.equal(controlador.lineas.length, 1);
});

test('compras: solo la confirmación de revisión crea la solicitud una vez', async () =>
{
    let confirmar;
    let resolver;
    let escrituras = 0;
    const destino = { href: '' };
    const controlador = cargar({
        window: { location: destino },
        pedidos_view: {
            revision: (_lineas, _presupuesto, acciones) => { confirmar = acciones.confirmar; },
            mensaje: () => {}
        },
        pedido_model: {
            crear: () =>
            {
                escrituras++;
                return new Promise((finalizar) => { resolver = finalizar; });
            }
        },
        encodeURIComponent
    });
    controlador.lineas = [{ titulo: 'Libro', cantidad: 1, costo_unitario: 100 }];
    controlador.presupuesto = { saldo: 500 };
    await controlador.enviar();
    assert.equal(escrituras, 0);
    const primero = confirmar();
    const segundo = confirmar();
    assert.equal(escrituras, 1);
    resolver({ pedido: { id_pedido: 9 } });
    await Promise.all([primero, segundo]);
    assert.equal(controlador.lineas.length, 0);
    assert.match(destino.href, /modo=enviada&id=9$/);
});

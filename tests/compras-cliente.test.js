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
test('compras: presupuesto requiere permiso, monto válido y confirmación', async () =>
{
    let registrar, capturado = '8000.00', confirmacion = false;
    let escrituras = 0;
    const controlador = cargar({
        ui: {
            hoy: () => '2026-11-17',
            dinero: valor => '$' + valor,
            dialogo: async () => confirmacion
        },
        pedidos_view: {
            presupuesto_formulario: (_periodo, acciones) => { registrar = acciones.guardar; },
            monto_presupuesto: () => capturado,
            bloquear_presupuesto: () => {},
            mensaje: () => {}
        },
        pedido_model: {
            crear_presupuesto: async () => { escrituras++; }
        }
    });
    controlador.abrir_presupuesto();
    assert.equal(registrar, undefined);
    controlador.puede_autorizar = true;
    controlador.abrir_presupuesto();
    capturado = '0';
    await registrar();
    capturado = '8000.00';
    await registrar();
    assert.equal(escrituras, 0);
    confirmacion = true;
    controlador.mostrar = async () => {};
    await registrar();
    assert.equal(escrituras, 1);
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
            borrador_parcial: () => ({}),
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

test('compras: el saldo exacto $0.30 permite enviar dos líneas una sola vez', async () =>
{
    let confirmar;
    let total;
    let resolver;
    let escrituras = 0;
    const destino = { href: '' };
    const controlador = cargar({
        window: { location: destino },
        pedidos_view: {
            borrador_parcial: () => ({ cantidad: '1', costo_unitario: '' }),
            revision: (_lineas, _presupuesto, acciones, centavos) =>
            {
                confirmar = acciones.confirmar;
                total = centavos;
            },
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
    controlador.lineas = [
        { titulo: 'Primero', cantidad: 1, costo_unitario: 0.10 },
        { titulo: 'Segundo', cantidad: 1, costo_unitario: 0.20 }
    ];
    controlador.presupuesto = { saldo: 0.30 };
    await controlador.enviar();
    assert.equal(total, 30);
    assert.equal(escrituras, 0);
    const primero = confirmar();
    const segundo = confirmar();
    assert.equal(escrituras, 1);
    resolver({ pedido: { id_pedido: 9 } });
    await Promise.all([primero, segundo]);
    assert.equal(controlador.lineas.length, 0);
    assert.match(destino.href, /modo=enviada&id=9$/);
});

test('compras: solicitud vacía conserva campos y vuelve al formulario sin crear orden', async () =>
{
    let acciones;
    let escrituras = 0;
    let parcial_restaurado;
    let abierto = false;
    const controlador = cargar({
        pedidos_view: {
            borrador_parcial: () => (
                { titulo: 'Álgebra lineal', peticionario: '700123', cantidad: '3', costo_unitario: '12.50' }),
            vacia: (_presupuesto, _parcial, callbacks) => { acciones = callbacks; },
            activar: () => {},
            nueva: () => {},
            llenar_linea: (datos) => { parcial_restaurado = datos; },
            abrir_formulario: () => { abierto = true; }
        },
        pedido_model: { crear: () => { escrituras++; } }
    });
    await controlador.enviar();
    assert.equal(escrituras, 0);
    assert.equal(controlador.parcial.titulo, 'Álgebra lineal');
    acciones.anadir();
    assert.equal(parcial_restaurado.peticionario, '700123');
    assert.equal(parcial_restaurado.cantidad, '3');
    assert.equal(parcial_restaurado.costo_unitario, '12.50');
    assert.equal(abierto, true);
});

test('compras: quitar otro libro conserva la captura y revisar avisa que falta agregarla', async () =>
{
    const captura = { id_libro: 'L000131', titulo: 'Clean Code', cantidad: '2', costo_unitario: '950' };
    let acciones, restaurada, aviso, revisiones = 0;
    const controlador = cargar({
        pedidos_view: {
            nueva: (_catalogo, _lineas, _presupuesto, _permiso, callbacks) => { acciones = callbacks; },
            borrador_parcial: () => captura,
            llenar_linea: datos => { restaurada = datos; },
            abrir_formulario: () => {},
            mensaje: (_tipo, texto) => { aviso = texto; },
            revision: () => { revisiones++; }
        }
    });
    controlador.lineas = [
        { titulo: 'Libro A', cantidad: 1, costo_unitario: 10 },
        { titulo: 'Libro B', cantidad: 1, costo_unitario: 20 }
    ];
    controlador.dibujar_nueva();
    acciones.quitar(0);
    assert.equal(controlador.lineas[0].titulo, 'Libro B');
    assert.deepEqual(restaurada, captura);
    await controlador.enviar();
    assert.equal(revisiones, 0);
    assert.match(aviso, /sin agregar/);
});

test('compras: un historial tardío no cubre el formulario de una solicitud nueva', async () =>
{
    let resolver_historial;
    const pantallas = [];
    let historial_iniciado;
    const inicio = new Promise(resolve => { historial_iniciado = resolve; });
    const controlador = cargar({
        ui: { hoy: () => '2026-11-19' },
        pedido_model: {
            presupuestos: async () => [],
            listar: () => new Promise(resolve =>
            {
                resolver_historial = resolve;
                historial_iniciado();
            })
        },
        pedidos_view: {
            activar: () => {},
            estadisticas: () => {},
            historial: () => pantallas.push('historial'),
            nueva: () => pantallas.push('nueva')
        }
    });
    const historial = controlador.mostrar('historial');
    await inicio;
    await controlador.mostrar('nueva');
    resolver_historial([]);
    await historial;
    assert.deepEqual(pantallas, ['nueva']);
});

test('compras: recepción consulta la orden y registra una sola vez el resultado', async () =>
{
    const llamadas = [];
    let finalizar_recepcion;
    let recibido;
    const detalle = { pedido: { folio: 'OCT-2026-013' }, lineas: [{ cantidad: 2 }] };
    const resultado = { ejemplares: ['E000001'], sin_ficha: [] };
    const controlador = cargar({
        pedido_model: {
            detalle: async id => { llamadas.push('detalle:' + id); return detalle; },
            recibir: (id, ubicacion) => {
                llamadas.push('recibir:' + id + ':' + ubicacion);
                return new Promise(resolve => { finalizar_recepcion = resolve; });
            }
        },
        pedidos_view: {
            bloquear_recepcion: (_id, estado) => llamadas.push('bloquear:' + estado),
            recibido: (datos, orden) => { recibido = { datos, orden }; }
        }
    });
    const primera = controlador.recibir(13, '2');
    const segunda = controlador.recibir(13, '2');
    await segunda;
    await Promise.resolve();
    assert.deepEqual(llamadas, ['bloquear:true', 'detalle:13', 'recibir:13:2']);
    finalizar_recepcion(resultado);
    await primera;
    assert.equal(recibido.datos, resultado);
    assert.equal(recibido.orden, detalle);
    assert.equal(controlador.procesando_recepcion, false);
});

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Casos de error del primer avance. */
/* Listing Contents: cargar; búsqueda; compra inválida. */
/* Reuse Instructions: npm test; vistas/modelos simulados sin BD. */
/******************************************************************/
const
{
    test
} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function cargar(archivo, nombre, contexto)
{
    vm.createContext(contexto);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../frontend/js/controllers/', archivo), 'utf8'), contexto);
    return vm.runInContext(nombre, contexto);
}
test('búsqueda: error y filtros vacíos retiran resultados anteriores', async () =>
{
    let resultados = ['Anterior'];
    let filtros = {
        titulo: 'Bases'
    };
    let errores = 0;
    const controlador = cargar('BuscarController.js', 'buscar_controller',
    {
        buscar_view:
        {
            filtros: () => filtros,
            vaciar: () =>
            {
                resultados = [];
            },
            mensaje: () =>
            {}
        },
        ui:
        {
            limpiar: () =>
            {},
            mostrar_error: () =>
            {
                errores++;
            }
        },
        busqueda_model:
        {
            buscar: async () =>
            {
                throw new Error('Sin conexión');
            }
        }
    });
    await controlador.buscar();
    assert.equal(resultados.length, 0);
    assert.equal(errores, 1);
    resultados = ['Anterior'];
    filtros = {
        titulo: ''
    };
    await controlador.buscar();
    assert.equal(resultados.length, 0);
});
test('compras: cantidad fraccionaria y costo infinito no entran al borrador', () =>
{
    let linea = {
        titulo: 'Libro',
        cantidad: 1.5,
        costo_unitario: 100
    };
    let marcados = [];
    const controlador = cargar('PedidosController.js', 'pedidos_controller',
    {
        pedidos_view:
        {
            linea: () => linea,
            mensaje: () =>
            {}
        },
        ui:
        {
            limpiar: () =>
            {},
            marcar: campos =>
            {
                marcados = campos;
            }
        }
    });
    controlador.agregar();
    assert.ok(marcados.includes('cantidad'));
    assert.equal(controlador.lineas.length, 0);
    linea = {
        titulo: 'Libro',
        cantidad: 1,
        costo_unitario: Infinity
    };
    controlador.agregar();
    assert.ok(marcados.includes('costo_unitario'));
    assert.equal(controlador.lineas.length, 0);
});
test('compras HTTP: líneas inválidas y costos vacíos/no finitos responden 400 antes de consultar BD', async () =>
{
    const controlador = require('../controllers/pedidoController');
    for (const linea of [null, [],
        {
            titulo: 'Libro',
            cantidad: 1,
            costo_unitario: ''
        },
        {
            titulo: 'Libro',
            cantidad: 1,
            costo_unitario: null
        },
        {
            titulo: 'Libro',
            cantidad: 1,
            costo_unitario: 'Infinity'
        }])
    {
        let estado;
        const respuesta = {
            status: valor =>
            {
                estado = valor;
                return respuesta;
            },
            json: () =>
            {}
        };
        await controlador.crear(
        {
            body:
            {
                lineas: [linea]
            },
            usuario:
            {
                clave: '100001'
            }
        }, respuesta);
        assert.equal(estado, 400);
    }
});

test('usuarios: fallos de catálogos no abren diálogos incompletos y permiten reintentar', async () =>
{
    let llamadas = 0;
    let dialogos = 0;
    const controlador = cargar('UsuariosController.js', 'usuarios_controller',
    {
        usuario_model:
        {
            catalogos: async () =>
            {
                llamadas++;
                if (llamadas === 1) throw new Error('Sin conexión');
                return {
                    motivos: [],
                    perfiles: []
                };
            }
        },
        usuarios_view:
        {
            mensaje: () =>
            {},
            dialogo_baja: async () =>
            {
                dialogos++;
                return false;
            }
        }
    });
    await controlador.baja(
    {
        clave: '810077'
    });
    assert.equal(dialogos, 0);
    await controlador.baja(
    {
        clave: '810077'
    });
    assert.equal(dialogos, 1);
    assert.equal(llamadas, 2);
});

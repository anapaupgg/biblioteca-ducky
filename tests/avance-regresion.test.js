/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
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
    let invalidos = 0;
    let estado_movil;
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
            {},
            invalidos: () =>
            {
                invalidos++;
            },
            estado_movil: (tipo) =>
            {
                estado_movil = tipo;
            }
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
    assert.equal(estado_movil, 'invalid');
    assert.equal(invalidos, 1);
});
test('búsqueda: solo confirma exclusión si la ficha está retirada y ya no aparece activa', async () =>
{
    let estado = 'Retirado';
    let activos = [];
    let mostrado = 0;
    const controlador = cargar('BuscarController.js', 'buscar_controller',
    {
        libro_model:
        {
            detalle: async () => ({ libro: { estatus: estado } })
        },
        busqueda_model:
        {
            buscar: async () => activos
        },
        buscar_view:
        {
            retirado: () =>
            {
                mostrado++;
            }
        }
    });
    assert.equal(await controlador.comprobar_retirado('L000134'), true);
    estado = 'Activo en catálogo';
    assert.equal(await controlador.comprobar_retirado('L000129'), false);
    estado = 'Retirado';
    activos = [{ id_libro: 'L000134' }];
    assert.equal(await controlador.comprobar_retirado('L000134'), false);
    assert.equal(mostrado, 1);
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

test('usuarios: la prevalidación bloqueada o cancelada no ejecuta la baja', async () =>
{
    let estado = 'prestamos';
    let confirmar = false;
    let escrituras = 0;
    let resultados = 0;
    let exitos = 0;
    const controlador = cargar('UsuarioBajaController.js', 'usuario_baja_controller',
    {
        usuario_model:
        {
            validar_baja: async () => ({ estado, usuario: { clave: '810077', nombre: 'Prueba' } }),
            dar_baja: async () =>
            {
                escrituras++;
                return { usuario: { clave: '810077', nombre: 'Prueba' } };
            }
        },
        usuario_baja_view:
        {
            mensaje: () =>
            {},
            datos: () => ({ clave: '810077', id_motivo: '1', comentario: '' }),
            usuario: () =>
            {},
            resultado: () =>
            {
                resultados++;
            },
            confirmar: async (_usuario, accion) =>
            {
                if (!confirmar) return false;
                await accion();
                return true;
            },
            exito: () =>
            {
                exitos++;
            }
        },
        ui:
        {
            limpiar: () =>
            {},
            marcar: () =>
            {}
        }
    });
    controlador.motivos = [{ id: 1, descripcion: 'Solicitud' }];
    controlador.administrador = { clave: '100001' };
    await controlador.validar();
    assert.equal(resultados, 1);
    assert.equal(escrituras, 0);
    estado = 'listo';
    await controlador.validar();
    assert.equal(escrituras, 0);
    confirmar = true;
    await controlador.validar();
    assert.equal(escrituras, 1);
    assert.equal(exitos, 1);
});

test('usuarios: cambio que retira funciones solo se guarda tras confirmar', async () =>
{
    let confirmar = false;
    let escrituras = 0;
    let exitos = 0;
    const controlador = cargar('UsuarioEditarController.js', 'usuario_editar_controller',
    {
        usuario_model:
        {
            cambiar_perfil: async () =>
            {
                escrituras++;
                return { usuario: { clave: '100002', nombre: 'Pamela', perfil: 'Lector' } };
            }
        },
        usuario_editar_view:
        {
            perfil_elegido: () => 4,
            mensaje: () =>
            {},
            exito: (datos) =>
            {
                exitos++;
                assert.equal(datos.perfil_anterior, 'Administrador de biblioteca');
                assert.equal(datos.retira, true);
            }
        },
        ui:
        {
            dialogo: async () => confirmar
        }
    });
    controlador.usuario = { clave: '100002', nombre: 'Pamela', estatus: 'Activo',
        id_perfil: 2, perfil: 'Administrador de biblioteca',
        funciones: ['Gestionar usuarios'] };
    controlador.perfiles = [{ id: 4, nombre: 'Lector', asignable: true, funciones: [] }];
    controlador.administrador = { clave: '100001' };
    await controlador.guardar();
    assert.equal(escrituras, 0);
    confirmar = true;
    await controlador.guardar();
    assert.equal(escrituras, 1);
    assert.equal(exitos, 1);
});

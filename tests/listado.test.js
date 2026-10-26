/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Pruebas de regresión y contratos del sistema. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   Dependencias, configuración y montaje del módulo. */
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

test('actualización fallida elimina datos anteriores y no anuncia éxito ni permite imprimir', async () =>
{
    const elementos = Object.fromEntries(['btn-imprimir', 'btn-actualizar', 'tabla', 'generado']
        .map(id => [id,
        {
            textContent: 'datos anteriores',
            disabled: false,
            addEventListener(evento, fn)
            {
                this[evento] = fn;
            }
        }]));
    const mensajes = [];
    let fallar = false;
    const contexto = vm.createContext(
    {
        document:
        {
            getElementById: id => elementos[id]
        },
        window:
        {
            print()
            {}
        },
        layout:
        {
            montar: async () => (
            {
            })
        },
        busqueda_model:
        {
            listado: async () =>
            {
                if (fallar) throw new Error('Sin conexión');
                return [];
            }
        },
        lista_libros_view:
        {
            tabla()
            {},
            mensaje: (...args) => mensajes.push(args)
        }
    });
    vm.runInContext(fs.readFileSync(require.resolve('../frontend/js/views/ListaLibrosView.js'),
            'utf8') +
        '\nlista_libros_view.tabla = () => {}; lista_libros_view.mensaje = (...args) => mensajes.push(args);',
        Object.assign(contexto,
        {
            mensajes
        }));
    vm.runInContext(fs.readFileSync(require.resolve(
        '../frontend/js/controllers/ListaLibrosController.js'), 'utf8'), contexto);
    await vm.runInContext('lista_libros_controller.iniciar()', contexto);
    await vm.runInContext('lista_libros_controller.cargar()', contexto);
    assert.equal(elementos['btn-imprimir'].disabled, false);
    fallar = true;
    await elementos['btn-actualizar'].click();
    assert.equal(elementos.tabla.textContent, '');
    assert.equal(elementos.generado.textContent, '');
    assert.equal(elementos['btn-imprimir'].disabled, true);
    assert.equal(elementos['btn-actualizar'].disabled, false);
    assert.equal(mensajes.at(-1)[0], 'error');
    assert.equal(mensajes.some(m => m[0] === 'ok'), false);
    fallar = false;
    await elementos['btn-actualizar'].click();
    assert.equal(elementos['btn-imprimir'].disabled, false);
    assert.equal(mensajes.at(-1)[0], 'ok');
});

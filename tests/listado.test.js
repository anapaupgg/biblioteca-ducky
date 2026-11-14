/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-14 */
/* Description: Regresión del listado y su PDF descargable. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: fallo de carga y generación del PDF. */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Ejecutar con npm test, sin modificar BD. */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { crear_pdf } = require('../services/listadoPdfService');

test('una carga fallida vacía el catálogo y bloquea PDF e impresión', async () =>
{
    let fallar = false;
    const eventos = [];
    const vista =
    {
        enlazar: () => {},
        bloquear: (valor) => eventos.push(['bloquear', valor]),
        vaciar: () => eventos.push(['vaciar']),
        mostrar: (modo) => eventos.push(['mostrar', modo]),
        tabla: (libros) => eventos.push(['tabla', libros.length]),
        mensaje: (tipo) => eventos.push(['mensaje', tipo])
    };
    const contexto = vm.createContext(
    {
        layout: { montar: async () => ({}) },
        busqueda_model:
        {
            listado: async () =>
            {
                if (fallar) throw new Error('Sin conexión');
                return [{ titulo: 'Libro' }];
            }
        },
        lista_libros_view: vista
    });
    vm.runInContext(fs.readFileSync(require.resolve(
        '../frontend/js/controllers/ListaLibrosController.js'), 'utf8'), contexto);
    await vm.runInContext('lista_libros_controller.iniciar()', contexto);
    assert.equal(vm.runInContext('lista_libros_controller.disponible', contexto), true);
    fallar = true;
    eventos.length = 0;
    await vm.runInContext('lista_libros_controller.cargar()', contexto);
    assert.deepEqual(eventos, [
        ['bloquear', true], ['vaciar'], ['mostrar', 'listado'],
        ['mensaje', 'error'], ['bloquear', true]
    ]);
    assert.equal(vm.runInContext('lista_libros_controller.disponible', contexto), false);
    vm.runInContext('lista_libros_controller.vista_pdf(); lista_libros_controller.impresion()',
        contexto);
    assert.equal(eventos.filter(evento => evento[0] === 'mostrar').length, 1);
});

test('el PDF del listado es válido y cabe en una página A4 con un libro', async () =>
{
    const archivo = await crear_pdf([
        { titulo: 'Álgebra lineal', autores: 'Ana Gómez', tema: 'Matemáticas',
            id_libro: 'L000001', isbn: '9781234567890', editorial: 'Ducky',
            condicion: 'Bueno' }
    ], new Date('2026-11-14T12:00:00Z'));
    const texto = archivo.toString('latin1');
    assert.equal(archivo.subarray(0, 5).toString(), '%PDF-');
    assert.equal((texto.match(/\/Type\s*\/Page\b/g) || []).length, 1);
    assert.ok(archivo.length > 1000);
});

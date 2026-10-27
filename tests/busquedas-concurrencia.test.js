/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-27 */
/* Description: Respuestas fuera de orden y limpieza durante consultas. */
/* Listing Contents: preparar; consultas concurrentes; limpiar e invalidar. */
/* Reuse Instructions: npm test; promesas controladas, sin red ni BD. */
/******************************************************************/
const
{
    test
} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function preparar(nombre)
{
    const pendientes = [];
    const tablas = [];
    const errores = [];
    let limpiezas = 0;
    const consultar = () => new Promise((resolver, rechazar) =>
    {
        pendientes.push(
        {
            resolver,
            rechazar
        });
    });
    const vista = {
        filtros: () => (
        {
            titulo: 'Libro',
            q: 'Libro'
        }),
        vaciar: () =>
        {
            tablas.length = 0;
        },
        mensaje: tipo =>
        {
            if (tipo === 'error') errores.push(tipo);
        },
        limpiar_filtros: () =>
        {
            tablas.length = 0;
            limpiezas++;
        },
        resultados: datos => tablas.push(datos),
        tabla: datos => tablas.push(datos),
        estadisticas: () =>
        {}
    };
    const contexto = vm.createContext(
    {
        buscar_view: vista,
        usuarios_view: vista,
        libros_view: vista,
        busqueda_model:
        {
            buscar: consultar
        },
        usuario_model:
        {
            listar: consultar
        },
        libro_model:
        {
            listar: consultar
        },
        ui:
        {
            limpiar: () =>
            {},
            marcar: () =>
            {},
            mostrar_error: error => errores.push(error.message),
            toast: (_tipo, mensaje) => errores.push(mensaje)
        }
    });
    const objetos = {
        Buscar: 'buscar',
        Usuarios: 'usuarios',
        Libros: 'libros'
    };
    vm.runInContext(fs.readFileSync(path.join(__dirname,
        '../frontend/js/controllers/' + nombre + 'Controller.js'), 'utf8'), contexto);
    const controlador = vm.runInContext(objetos[nombre] + '_controller', contexto);
    const ejecutar = () => nombre === 'Buscar' ? controlador.buscar() : controlador.cargar();
    return {
        pendientes,
        tablas,
        errores,
        controlador,
        ejecutar,
        limpiezas: () => limpiezas
    };
}

for (const nombre of ['Buscar', 'Usuarios', 'Libros'])
{
    test(nombre + ': respuesta antigua no sustituye el filtro reciente', async () =>
    {
        const prueba = preparar(nombre);
        const antigua = prueba.ejecutar();
        const reciente = prueba.ejecutar();
        prueba.pendientes[1].resolver(['Reciente']);
        await reciente;
        prueba.pendientes[0].resolver(['Antigua']);
        await antigua;
        assert.deepEqual(prueba.tablas, [
            ['Reciente']
        ]);
    });

    test(nombre + ': error antiguo se ignora; error vigente sí se presenta', async () =>
    {
        const prueba = preparar(nombre);
        const antigua = prueba.ejecutar();
        const reciente = prueba.ejecutar();
        prueba.pendientes[1].resolver(['Reciente']);
        await reciente;
        prueba.pendientes[0].rechazar(new Error('Error anterior'));
        await antigua;
        assert.equal(prueba.errores.length, 0);
        const vigente = prueba.ejecutar();
        prueba.pendientes[2].rechazar(new Error('Error vigente'));
        await vigente;
        assert.equal(prueba.errores.length, 1);
    });
}

for (const falla of [false, true])
{
    test('Limpiar búsqueda invalida la petición pendiente: ' + (falla ? 'error' : 'éxito'), async () =>
    {
        const prueba = preparar('Buscar');
        const pendiente = prueba.ejecutar();
        prueba.controlador.limpiar();
        if (falla) prueba.pendientes[0].rechazar(new Error('Consulta cancelada'));
        else prueba.pendientes[0].resolver(['No debe reaparecer']);
        await pendiente;
        assert.equal(prueba.limpiezas(), 1);
        assert.equal(prueba.tablas.length, 0);
        assert.equal(prueba.errores.length, 0);
    });
}

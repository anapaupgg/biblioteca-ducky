/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-13 */
/* Description: Recorrido de alta de catálogo después de crear ficha. */
/* Listing Contents: preparación; revisión antes de confirmar; reintento. */
/* Reuse Instructions: npm test; modelos simulados, sin cambios en BD. */
/******************************************************************/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function preparar(activar)
{
    const eventos = [];
    const datos = {
        titulo: 'Libro de prueba',
        isbn: '9781234567890',
        autores: 'Autora',
        editorial: 'Editorial',
        tema: 'Tema',
        formato: 'Físico',
        copias: 1,
        id_ubicacion: 1
    };
    const resultado = { id_libro: 'L999999', ejemplares: ['L999999-01'] };
    const ficha = {
        libro: { id_libro: 'L999999', titulo: datos.titulo },
        ejemplares: [{ id_ejemplar: 'L999999-01', estatus: 'Disponible' }]
    };
    const vista = {
        datos: () => datos,
        creado: (_resultado, _datos, preparar_alta) =>
        {
            eventos.push('creado');
            vista.preparar_alta = preparar_alta;
        },
        confirmar_alta: (_ficha, confirmar_alta, cancelar) =>
        {
            eventos.push('revision');
            vista.confirmar_alta_accion = confirmar_alta;
            vista.cancelar = cancelar;
        },
        bloquear_alta: (estado) => eventos.push('bloqueo:' + estado),
        alta_completada: () => eventos.push('alta_completada'),
        error_alta: (mensaje) => eventos.push('error:' + mensaje),
        mensaje: () => {}
    };
    const modelo = {
        crear: async () =>
        {
            eventos.push('crear');
            return resultado;
        },
        detalle: async () =>
        {
            eventos.push('detalle');
            return ficha;
        },
        activar: () =>
        {
            eventos.push('activar');
            return activar();
        }
    };
    const contexto = vm.createContext({
        libro_form_view: vista,
        libro_model: modelo,
        ui: {
            limpiar: () => {},
            marcar: () => {},
            mostrar_error: (error) => { throw error; }
        }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname,
        '../frontend/js/controllers/LibroFormController.js'), 'utf8'), contexto);
    return {
        controlador: vm.runInContext('libro_form_controller', contexto),
        vista,
        eventos,
        ficha
    };
}

test('crear ficha no activa catálogo hasta confirmar la revisión de Figma', async () =>
{
    let resolver;
    const prueba = preparar(() => new Promise((finalizar) => { resolver = finalizar; }));
    await prueba.controlador.guardar();
    assert.deepEqual(prueba.eventos, ['crear', 'creado']);

    await prueba.vista.preparar_alta();
    assert.deepEqual(prueba.eventos, ['crear', 'creado', 'detalle', 'revision']);
    prueba.vista.cancelar();
    assert.equal(prueba.eventos.at(-1), 'creado');

    await prueba.vista.preparar_alta();
    const primera = prueba.vista.confirmar_alta_accion();
    const segunda = prueba.vista.confirmar_alta_accion();
    assert.equal(prueba.eventos.filter((evento) => evento === 'activar').length, 1);
    resolver(prueba.ficha);
    await Promise.all([primera, segunda]);
    assert.equal(prueba.eventos.at(-1), 'alta_completada');
});

test('si falla el alta, conserva revisión y permite reintentar', async () =>
{
    let intentos = 0;
    const prueba = preparar(async () =>
    {
        intentos++;
        if (intentos === 1) throw new Error('No disponible');
        return prueba.ficha;
    });
    await prueba.controlador.guardar();
    await prueba.vista.preparar_alta();
    await prueba.vista.confirmar_alta_accion();
    assert.ok(prueba.eventos.includes('error:No disponible'));
    assert.equal(prueba.eventos.at(-1), 'bloqueo:false');
    await prueba.vista.confirmar_alta_accion();
    assert.equal(intentos, 2);
    assert.equal(prueba.eventos.at(-1), 'alta_completada');
});

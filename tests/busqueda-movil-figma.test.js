/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-16                                               */
/* Description: Navegación de búsqueda hasta solicitud.           */
/******************************************************************/

/******************************************************************/
/* Listing Contents: ficha y solicitud móviles.                   */
/* Reuse Instructions: npm test; modelos/vistas simulados sin BD. */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('la ficha móvil usa datos de la API y la solicitud conserva su confirmación', async () =>
{
    const eventos = [];
    const datos = { libro: { id_libro: 'L000128', titulo: 'Libro' }, ejemplares: [] };
    const contexto =
    {
        buscar_movil_view:
        {
            activo: () => true,
            ficha: (valor) => eventos.push(['ficha', valor]),
            solicitud: (resultado, valor) => eventos.push(['solicitud', resultado, valor])
        },
        buscar_view:
        {
            ficha: () => assert.fail('La ficha móvil no debe abrir el diálogo de escritorio'),
            solicitud: () => assert.fail('La solicitud móvil no debe abrir el diálogo de escritorio')
        },
        busqueda_model:
        {
            ficha: async (id) =>
            {
                assert.equal(id, 'L000128');
                return datos;
            },
            solicitar: async (id) =>
            {
                assert.equal(id, 'L000128');
                return { folio: 25 };
            }
        },
        ui: { toast: () => assert.fail('No debe anunciar error') }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../frontend/js/controllers/BuscarController.js'),
        'utf8') + '\nthis.controlador = buscar_controller;', contexto);
    await contexto.controlador.ficha({ id_libro: 'L000128' });
    await contexto.controlador.solicitar(datos.libro);
    assert.equal(eventos.length, 2);
    assert.equal(eventos[0][0], 'ficha');
    assert.equal(eventos[0][1], datos);
    assert.equal(eventos[1][0], 'solicitud');
    assert.equal(eventos[1][1].folio, 25);
    assert.equal(eventos[1][2], datos);
});

test('dos toques rápidos crean una sola solicitud', async () =>
{
    let completar;
    let llamadas = 0;
    const pendiente = new Promise((resolver) => { completar = resolver; });
    const datos = { libro: { id_libro: 'L000128' } };
    const contexto =
    {
        buscar_movil_view:
        {
            activo: () => true,
            solicitud: () => {}
        },
        busqueda_model:
        {
            solicitar: () =>
            {
                llamadas++;
                return pendiente;
            }
        },
        ui: { toast: () => assert.fail('No debe anunciar error') }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../frontend/js/controllers/BuscarController.js'),
        'utf8') + '\nthis.controlador = buscar_controller;', contexto);
    contexto.controlador.ficha_actual = datos;
    const primera = contexto.controlador.solicitar(datos.libro);
    await contexto.controlador.solicitar(datos.libro);
    assert.equal(llamadas, 1);
    completar({ folio: 25 });
    await primera;
    assert.equal(contexto.controlador.solicitud_en_curso, false);
});

test('escritorio revisa datos vigentes antes de registrar una sola solicitud', async () =>
{
    let acciones;
    let envios = 0;
    let recibos = 0;
    let resolver;
    const pendiente = new Promise((completar) => { resolver = completar; });
    const libro = { id_libro: 'L000129', disponibles_prestamo: 1 };
    const ficha = { libro, ejemplares: [{ ubicacion: 'E-01 / F-02' }] };
    const contexto =
    {
        buscar_movil_view: { activo: () => false },
        buscar_view:
        {
            revisar_solicitud: (datos, usuario, botones) =>
            {
                assert.equal(datos, ficha);
                assert.equal(usuario.clave, '100001');
                acciones = botones;
            },
            solicitud: () => { recibos++; }
        },
        busqueda_model:
        {
            ficha: async () => ficha,
            solicitar: () =>
            {
                envios++;
                return pendiente;
            }
        },
        ui: { toast: () => assert.fail('No debe anunciar error') }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../frontend/js/controllers/BuscarController.js'),
        'utf8') + '\nthis.controlador = buscar_controller;', contexto);
    contexto.controlador.usuario_actual = { clave: '100001' };
    await contexto.controlador.solicitar(libro);
    assert.equal(envios, 0);
    const primero = acciones.confirmar();
    await acciones.confirmar();
    assert.equal(envios, 1);
    resolver({ folio: 901 });
    await primero;
    assert.equal(recibos, 1);
});

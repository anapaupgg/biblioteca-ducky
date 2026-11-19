/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: Ciclo de circulación sin alterar datos reales.   */
/******************************************************************/

/******************************************************************/
/* Listing Contents: préstamo, renovación, devolución dañada y    */
/* aviso interno con rollback.                                    */
/* Reuse Instructions: DUCKY_TEST_DB=1 habilita PostgreSQL local. */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { pool, simular } = require('../db');
const prestamo_model = require('../models/prestamoModel');
const circulacion_model = require('../models/circulacionModel');

test('autorización muestra recibo y conserva sus datos al abrir la boleta', async () =>
{
    const prestamo = { id_prestamo: 71, folio_prestamo: 'PRE-2026-0071' };
    const pasos = [];
    const contexto =
    {
        prestamo_model: { autorizar: async () => prestamo },
        prestamos_view:
        {
            mostrar: (modo) => pasos.push('mostrar:' + modo),
            recibo: (datos) => pasos.push('recibo:' + datos.folio_prestamo),
            boleta: (datos) => pasos.push('boleta:' + datos.folio_prestamo)
        }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../frontend/js/controllers/PrestamosController.js'),
        'utf8') + '\nthis.controlador = prestamos_controller;', contexto);
    await contexto.controlador.autorizar(3, 'L000128-01');
    contexto.controlador.abrir_boleta();
    contexto.controlador.volver_recibo();
    assert.deepEqual(pasos, ['mostrar:recibo', 'recibo:PRE-2026-0071', 'mostrar:boleta',
        'boleta:PRE-2026-0071', 'mostrar:recibo', 'recibo:PRE-2026-0071']);
});

test('el recibo abre la lista de espera del libro indicado sin omitir permisos', async () =>
{
    const pasos = [];
    const datos = { libro: { titulo: 'Prueba' }, solicitudes: [] };
    const contexto =
    {
        layout: { montar: async () => ({ funciones: ['Préstamos'] }) },
        prestamos_view:
        {
            configurar: () => {}, enlazar: () => {},
            entrada_espera: () => 'L000128',
            mostrar: (modo) => pasos.push('mostrar:' + modo),
            prellenar_espera: (id) => pasos.push('clave:' + id),
            lista_espera: (respuesta) => pasos.push('lista:' + respuesta.libro.titulo),
            pendientes: () => {}, aviso_solicitud: () => {}, activos: () => {}
        },
        prestamo_model:
        {
            pendientes: async () => [], activos: async () => [],
            espera: async (id) =>
            {
                assert.equal(id, 'L000128');
                return datos;
            }
        }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve(
        '../frontend/js/controllers/PrestamosController.js'), 'utf8') +
        '\nthis.controlador = prestamos_controller;', contexto);
    await contexto.controlador.iniciar();
    assert.deepEqual(pasos, ['mostrar:espera', 'clave:L000128', 'lista:Prueba']);
    await contexto.controlador.abrir_espera();
    assert.deepEqual(pasos.slice(3), ['mostrar:espera', 'clave:L000128', 'lista:Prueba']);

    const vista = { window: { location: { search: '?espera=L000128' } }, URLSearchParams };
    vm.runInNewContext(fs.readFileSync(require.resolve('../frontend/js/views/PrestamosView.js'),
        'utf8') + '\nthis.vista = prestamos_view;', vista);
    assert.equal(vista.vista.entrada_espera(), 'L000128');
    vista.window.location.search = '?espera=../../otro';
    assert.equal(vista.vista.entrada_espera(), null);
});

test('el alta de espera presenta la posición real y evita doble envío', async () =>
{
    const pasos = [];
    let resolver;
    let envios = 0;
    const contexto =
    {
        prestamos_view:
        {
            espera_ocupada: (valor) => pasos.push('ocupada:' + valor),
            mostrar: (modo) => pasos.push('mostrar:' + modo),
            lista_espera: () => pasos.push('lista'),
            espera_registrada: (registro, listado) =>
                pasos.push('posicion:' + (listado.solicitudes.findIndex((x) =>
                    x.id_espera === registro.id_espera) + 1))
        },
        prestamo_model:
        {
            registrar_espera: () =>
            {
                envios += 1;
                return new Promise((resolve) => { resolver = resolve; });
            },
            espera: async () => ({ libro: { titulo: 'Prueba' },
                solicitudes: [{ id_espera: 8 }, { id_espera: 9 }] })
        }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve(
        '../frontend/js/controllers/PrestamosController.js'), 'utf8') +
        '\nthis.controlador = prestamos_controller;', contexto);
    const primero = contexto.controlador.registrar_espera(
        { clave_usuario: '800456', id_libro: 'L000128' });
    await contexto.controlador.registrar_espera(
        { clave_usuario: '800456', id_libro: 'L000128' });
    assert.equal(envios, 1);
    resolver({ id_espera: 9 });
    await primero;
    assert.deepEqual(pasos, ['ocupada:true', 'mostrar:espera', 'lista',
        'posicion:2', 'ocupada:false']);
});

test('si falla la recarga, el alta confirmada sigue marcada como registrada', async () =>
{
    const pasos = [];
    const contexto =
    {
        prestamos_view:
        {
            espera_ocupada: () => {}, mostrar: () => {},
            espera_registrada: (registro, listado) =>
                pasos.push('registrada:' + registro.id_espera + ':' + listado),
            mensaje: () => pasos.push('error')
        },
        prestamo_model:
        {
            registrar_espera: async () => ({ id_espera: 7 }),
            espera: async () => { throw new Error('Sin conexión'); }
        }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve(
        '../frontend/js/controllers/PrestamosController.js'), 'utf8') +
        '\nthis.controlador = prestamos_controller;', contexto);
    await contexto.controlador.registrar_espera(
        { clave_usuario: '800456', id_libro: 'L000128' });
    assert.deepEqual(pasos, ['registrada:7:null']);
});

test('PostgreSQL: registro, renovación y devolución revierten todo en la prueba',
    { skip: process.env.DUCKY_TEST_DB !== '1' }, async () =>
{
    const ejemplar = await pool.query(
        `SELECT e.id_ejemplar FROM ejemplares e JOIN libros l ON l.id_libro = e.id_libro
          WHERE e.estatus = 'Disponible' AND e.tipo_uso = 'Préstamo externo'
            AND l.estatus = 'Activo en catálogo' LIMIT 1`);
    assert.ok(ejemplar.rows[0], 'Se necesita un ejemplar disponible de prueba');
    const id_ejemplar = ejemplar.rows[0].id_ejemplar;
    const clave = 'T' + String(Date.now() % 100000).padStart(5, '0');
    let id_prestamo;
    await simular('100001', async (client) =>
    {
        await client.query(
            `INSERT INTO usuarios (clave_usuario, nombre, correo, id_tipo_usuario, id_perfil)
             SELECT $1, 'Prueba reversible', $2, id_tipo_usuario, id_perfil
               FROM usuarios WHERE clave_usuario = '100002'`,
            [clave, 'reversible-' + clave.toLowerCase() + '@example.invalid']);
        id_prestamo = await prestamo_model.registrar_directo(client, clave, id_ejemplar, '100001');
        const prestamo = await prestamo_model.detalle(client, id_prestamo);
        assert.equal(prestamo.clave_usuario, clave);
        assert.equal(prestamo.id_ejemplar, id_ejemplar);
        assert.ok(prestamo.fecha_vencimiento > prestamo.fecha_prestamo);
        assert.match(prestamo.folio_prestamo, /^PRE-\d{4}-\d{4,}$/);
        assert.ok(prestamo.ejemplares_total >= 1);
        assert.ok(prestamo.ejemplares_disponibles < prestamo.ejemplares_total);
        assert.ok(prestamo.multa_diaria >= 0);
        const renovacion = await circulacion_model.renovar(client, id_prestamo, '100001');
        assert.ok(renovacion.vencimiento_nuevo > renovacion.vencimiento_anterior);
        const devolucion = await circulacion_model.devolver(client, id_prestamo, 'Bueno', '100001');
        assert.ok(devolucion.id_devolucion);
        const estado = await client.query(
            'SELECT estatus FROM prestamos WHERE id_prestamo = $1', [id_prestamo]);
        assert.equal(estado.rows[0].estatus, 'Devuelto');
    });
    const [prestamos, usuarios, copias] = await Promise.all([
        pool.query('SELECT count(*)::int AS total FROM prestamos WHERE id_prestamo = $1', [id_prestamo]),
        pool.query('SELECT count(*)::int AS total FROM usuarios WHERE clave_usuario = $1', [clave]),
        pool.query('SELECT estatus FROM ejemplares WHERE id_ejemplar = $1', [id_ejemplar])
    ]);
    assert.equal(prestamos.rows[0].total, 0);
    assert.equal(usuarios.rows[0].total, 0);
    assert.equal(copias.rows[0].estatus, 'Disponible');
});

test('PostgreSQL: pérdida genera multa y pago la liquida sin persistir datos de prueba',
    { skip: process.env.DUCKY_TEST_DB !== '1' }, async () =>
{
    const ejemplar = await pool.query(
        `SELECT e.id_ejemplar, e.id_libro FROM ejemplares e
            JOIN libros l ON l.id_libro = e.id_libro
          WHERE e.estatus = 'Disponible' AND e.tipo_uso = 'Préstamo externo'
            AND l.estatus = 'Activo en catálogo' LIMIT 1`);
    assert.ok(ejemplar.rows[0]);
    const { id_ejemplar, id_libro } = ejemplar.rows[0];
    const clave = 'T' + String((Date.now() + 1) % 100000).padStart(5, '0');
    let id_prestamo;
    await simular('100001', async (client) =>
    {
        await client.query(
            `INSERT INTO usuarios (clave_usuario, nombre, correo, id_tipo_usuario, id_perfil)
             SELECT $1, 'Prueba reversible', $2, id_tipo_usuario, id_perfil
               FROM usuarios WHERE clave_usuario = '100002'`,
            [clave, 'reversible-' + clave.toLowerCase() + '@example.invalid']);
        await client.query('UPDATE libros SET precio_ultima_compra_usd = 92 WHERE id_libro = $1',
            [id_libro]);
        id_prestamo = await prestamo_model.registrar_directo(client, clave, id_ejemplar, '100001');
        const multa = await circulacion_model.reportar_perdida(client, id_prestamo, 18.2, '100001');
        assert.equal(multa.monto, 1674.4);
        const pago = await circulacion_model.registrar_pago(client, multa.id_multa,
            'TES-PRUEBA', '100001');
        assert.equal(pago.folio_tesoreria, 'TES-PRUEBA');
        const estado = await client.query('SELECT estatus FROM multas WHERE id_multa = $1',
            [multa.id_multa]);
        assert.equal(estado.rows[0].estatus, 'Pagada');
    });
    const [prestamos, copias] = await Promise.all([
        pool.query('SELECT count(*)::int AS total FROM prestamos WHERE id_prestamo = $1', [id_prestamo]),
        pool.query('SELECT estatus FROM ejemplares WHERE id_ejemplar = $1', [id_ejemplar])
    ]);
    assert.equal(prestamos.rows[0].total, 0);
    assert.equal(copias.rows[0].estatus, 'Disponible');
});

test('PostgreSQL: daño bloquea préstamo y espera; reparación lo libera, todo con rollback',
    { skip: process.env.DUCKY_TEST_DB !== '1' }, async (t) =>
{
    const activo = await pool.query(
        `SELECT p.id_prestamo, p.id_ejemplar, e.id_libro
           FROM prestamos p JOIN ejemplares e USING (id_ejemplar)
          WHERE p.estatus = 'Activo' AND EXISTS
            (SELECT 1 FROM lista_espera w WHERE w.id_libro = e.id_libro
             AND w.estatus = 'En espera')
          ORDER BY p.id_prestamo LIMIT 1`);
    if (!activo.rows[0]) return t.skip('No hay préstamo activo con lista de espera');
    const prestamo = activo.rows[0];
    await simular('100001', async (client) =>
    {
        const danado = await circulacion_model.devolver(client, prestamo.id_prestamo,
            'Dañado', '100001');
        assert.equal(danado.estatus_ejemplar, 'En revisión');
        assert.equal(danado.espera, null);
        const espera = await client.query(
            `SELECT estatus FROM lista_espera WHERE id_libro=$1
             AND estatus='En espera' LIMIT 1`, [prestamo.id_libro]);
        assert.equal(espera.rows[0].estatus, 'En espera');
        await client.query("UPDATE ejemplares SET condicion='Bueno' WHERE id_ejemplar=$1",
            [prestamo.id_ejemplar]);
        const reparado = await client.query('SELECT estatus FROM ejemplares WHERE id_ejemplar=$1',
            [prestamo.id_ejemplar]);
        assert.equal(reparado.rows[0].estatus, 'Disponible');
    });
    const estado = await pool.query('SELECT estatus, condicion FROM ejemplares WHERE id_ejemplar=$1',
        [prestamo.id_ejemplar]);
    assert.equal(estado.rows[0].estatus, 'Prestado');
});

test('PostgreSQL: devolución avanza la espera y aviso de multa es único y pendiente',
    { skip: process.env.DUCKY_TEST_DB !== '1' }, async (t) =>
{
    const activo = await pool.query(
        `SELECT p.id_prestamo, e.id_libro FROM prestamos p
           JOIN ejemplares e USING (id_ejemplar)
          WHERE p.estatus='Activo' AND EXISTS
            (SELECT 1 FROM lista_espera w WHERE w.id_libro=e.id_libro
             AND w.estatus='En espera')
          ORDER BY p.id_prestamo LIMIT 1`);
    if (!activo.rows[0]) return t.skip('No hay préstamo activo con lista de espera');
    const prestamo = activo.rows[0];
    await simular('100001', async (client) =>
    {
        await client.query(`UPDATE prestamos SET fecha_prestamo=LEAST(fecha_prestamo, CURRENT_DATE-3),
            fecha_vencimiento=CURRENT_DATE-2 WHERE id_prestamo=$1`,
            [prestamo.id_prestamo]);
        const devuelto = await circulacion_model.devolver(client, prestamo.id_prestamo,
            'Bueno', '100001');
        assert.equal(devuelto.estatus_ejemplar, 'Disponible');
        assert.ok(devuelto.espera?.id_espera);
        assert.ok(devuelto.multa?.id_multa);
        const primero = await circulacion_model.aviso_multa(client, devuelto.multa.id_multa,
            '100001');
        const segundo = await circulacion_model.aviso_multa(client, devuelto.multa.id_multa,
            '100001');
        assert.equal(primero.id_notificacion, segundo.id_notificacion);
        assert.equal(primero.estatus, 'Pendiente');
    });
});

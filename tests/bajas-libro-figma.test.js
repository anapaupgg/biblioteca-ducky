/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-13 */
/* Description: Baja de libro con confirmación y motivo conservado. */
/* Listing Contents: confirmación cliente; persistencia reversible. */
/* Reuse Instructions: DUCKY_TEST_DB=1 npm test; SQL se revierte. */
/******************************************************************/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('la baja de libro espera la confirmación y envía el motivo', async () =>
{
    const llamadas = [];
    let confirmar;
    const contexto = vm.createContext({
        libro_detalle_view: {
            confirmar_baja: (_ficha, _datos, accion) =>
            {
                confirmar = accion;
                return new Promise((resolver) => { contexto.resolver = resolver; });
            }
        },
        libro_model: {
            retirar: async (id, datos) => llamadas.push({ id, datos })
        },
        window: { location: { href: '' } },
        encodeURIComponent
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname,
        '../frontend/js/controllers/LibroDetalleController.js'), 'utf8'), contexto);
    const controlador = vm.runInContext('libro_detalle_controller', contexto);
    controlador.id = 'L000129';
    controlador.ficha = { libro: { id_libro: 'L000129', titulo: 'Prueba' } };
    const datos = { motivo: 'Dañado', descripcion: 'Cubierta rota' };
    const espera = controlador.confirmar_baja(datos);
    assert.equal(llamadas.length, 0);
    await confirmar();
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].id, 'L000129');
    assert.equal(llamadas[0].datos.motivo, 'Dañado');
    contexto.resolver(true);
    await espera;
    assert.match(contexto.window.location.href, /modo=retirado$/);
});

test('el motivo y el retiro se guardan juntos y el ensayo se revierte',
    { skip: process.env.DUCKY_TEST_DB !== '1' }, async () =>
{
    const { pool } = require('../db');
    const libro_model = require('../models/libroModel');
    const client = await pool.connect();
    const id = 'L' + String(900000 + Math.floor(Math.random() * 99999));
    const isbn = '978' + String(Date.now() % 10000000000).padStart(10, '0');
    try
    {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.usuario', '100001', true)");
        await libro_model.crear(client, {
            id_libro: id, titulo: 'Baja temporal', isbn,
            editorial: 'Prueba de transacción', tema: 'Prueba de transacción',
            autores: ['Prueba de transacción'], formato: 'Físico',
            edicion: null, anio_publicacion: null, paginas: null,
            sinopsis: null, enlace_digital: null, precio_ultima_compra_usd: null
        });
        await libro_model.cambiar_estatus(client, id, 'Activo en catálogo');
        assert.equal(await libro_model.registrar_baja(client, id,
            { motivo: 'Dañado', descripcion: 'Ensayo reversible' }, '100001'), true);
        const resultado = await client.query(
            `SELECT l.estatus, b.motivo, b.descripcion, b.clave_administrador
               FROM libros l JOIN bajas_libro b USING (id_libro) WHERE l.id_libro = $1`, [id]);
        assert.deepEqual(resultado.rows[0], {
            estatus: 'Retirado', motivo: 'Dañado',
            descripcion: 'Ensayo reversible', clave_administrador: '100001'
        });
        assert.equal(await libro_model.registrar_baja(client, id,
            { motivo: 'Robado', descripcion: null }, '100001'), false);
    }
    finally
    {
        await client.query('ROLLBACK');
        client.release();
    }
    assert.equal((await pool.query('SELECT 1 FROM libros WHERE id_libro = $1', [id])).rowCount, 0);
});

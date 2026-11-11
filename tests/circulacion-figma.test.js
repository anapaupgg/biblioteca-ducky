/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: Ciclo de circulación sin alterar datos reales.   */
/******************************************************************/

/******************************************************************/
/* Listing Contents: préstamo, renovación y devolución con rollback. */
/* Reuse Instructions: DUCKY_TEST_DB=1 habilita PostgreSQL local. */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pool, simular } = require('../db');
const prestamo_model = require('../models/prestamoModel');
const circulacion_model = require('../models/circulacionModel');

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

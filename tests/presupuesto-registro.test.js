/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-17 */
/* Description: Alta mensual de presupuesto sin alterar datos reales. */
/* Listing Contents: registro, duplicado y bitácora en rollback. */
/* Reuse Instructions: DUCKY_TEST_DB=1 npm test; usa simular(). */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('PostgreSQL: presupuesto único con saldo y bitácora; rollback al terminar',
{
    skip: process.env.DUCKY_TEST_DB !== '1'
}, async () =>
{
    const { simular, pool } = require('../db');
    const pedido_model = require('../models/pedidoModel');
    const periodo = '2098-12';
    const antes = await pool.query('SELECT count(*) AS total FROM presupuestos_mensuales WHERE periodo=$1',
        [periodo]);
    assert.equal(antes.rows[0].total, 0, 'El periodo de prueba debe estar libre');
    await simular('100002', async (client) =>
    {
        const registro = await pedido_model.crear_presupuesto(client, periodo, 8000, '100002');
        assert.equal(registro.periodo, periodo);
        assert.equal(registro.monto_autorizado, 8000);
        assert.equal(registro.saldo, 8000);
        const bitacora = await client.query(
            "SELECT count(*) AS total FROM bitacora WHERE accion='Presupuesto mensual' AND detalle LIKE $1",
            [periodo + '%']);
        assert.equal(bitacora.rows[0].total, 1);
        await assert.rejects(
            pedido_model.crear_presupuesto(client, periodo, 9000, '100002'),
            (error) => error.estado === 409 || error.status === 409);
    });
    const despues = await pool.query('SELECT count(*) AS total FROM presupuestos_mensuales WHERE periodo=$1',
        [periodo]);
    assert.equal(despues.rows[0].total, 0);
});

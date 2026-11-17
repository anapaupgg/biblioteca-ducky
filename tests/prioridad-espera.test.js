/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-17                                               */
/* Description: Prioridad transaccional de la lista de espera.   */
/******************************************************************/

/******************************************************************/
/* Listing Contents: devolución, apartado y préstamo prioritario. */
/* Reuse Instructions: DUCKY_TEST_DB=1; simular revierte todo.    */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pool, simular } = require('../db');
const prestamo_model = require('../models/prestamoModel');
const circulacion_model = require('../models/circulacionModel');

test('PostgreSQL: la devolución aparta la última copia para el primero en espera',
    { skip: process.env.DUCKY_TEST_DB !== '1' }, async (t) =>
{
    const seleccion = await pool.query(
        `SELECT e.id_libro, min(e.id_ejemplar) FILTER (
            WHERE e.tipo_uso = 'Préstamo externo') AS id_ejemplar
           FROM ejemplares e JOIN libros l USING (id_libro)
          WHERE l.estatus = 'Activo en catálogo'
          GROUP BY e.id_libro
         HAVING count(*) FILTER (WHERE e.tipo_uso = 'Préstamo externo') = 1
            AND count(*) FILTER (WHERE e.tipo_uso = 'Préstamo externo'
                AND e.estatus = 'Disponible') = 1
            AND NOT EXISTS (SELECT 1 FROM lista_espera w WHERE w.id_libro = e.id_libro
                AND w.estatus IN ('En espera', 'Notificado'))
          LIMIT 1`);
    if (!seleccion.rows[0]) return t.skip('No hay libro con una copia libre para probar');
    const { id_libro, id_ejemplar } = seleccion.rows[0];
    const semilla = Date.now() % 99990;
    const claves = [0, 1, 2].map((n) => 'T' + String(semilla + n).padStart(5, '0'));

    await simular('100001', async (client) =>
    {
        for (const clave of claves)
        {
            await client.query(
                `INSERT INTO usuarios (clave_usuario, nombre, correo,
                    id_tipo_usuario, id_perfil)
                 SELECT $1, 'Prueba reversible', $2, id_tipo_usuario, id_perfil
                   FROM usuarios WHERE clave_usuario = '100002'`,
                [clave, 'reversible-' + clave.toLowerCase() + '@example.invalid']);
        }
        const prestamo = await prestamo_model.registrar_directo(client,
            claves[0], id_ejemplar, '100001');
        await prestamo_model.registrar_espera(client, claves[1], id_libro);
        const devolucion = await circulacion_model.devolver(client, prestamo,
            'Bueno', '100001');
        assert.equal(devolucion.espera.clave_usuario, claves[1]);

        const catalogo = await client.query(
            'SELECT disponibles_prestamo FROM v_catalogo WHERE id_libro = $1', [id_libro]);
        assert.equal(Number(catalogo.rows[0].disponibles_prestamo), 0);
        const espera = await client.query(
            `SELECT estatus FROM lista_espera WHERE id_libro = $1 AND clave_usuario = $2`,
            [id_libro, claves[1]]);
        assert.equal(espera.rows[0].estatus, 'Notificado');

        await client.query('SAVEPOINT intento_fuera_de_turno');
        await assert.rejects(() => prestamo_model.registrar_directo(client,
            claves[2], id_ejemplar, '100001'), /apartados para la lista de espera/);
        await client.query('ROLLBACK TO SAVEPOINT intento_fuera_de_turno');

        await prestamo_model.registrar_directo(client, claves[1],
            id_ejemplar, '100001');
        const atendida = await client.query(
            `SELECT estatus FROM lista_espera WHERE id_libro = $1 AND clave_usuario = $2`,
            [id_libro, claves[1]]);
        assert.equal(atendida.rows[0].estatus, 'Atendido');
    });
    const despues = await pool.query('SELECT estatus FROM ejemplares WHERE id_ejemplar = $1',
        [id_ejemplar]);
    assert.equal(despues.rows[0].estatus, 'Disponible');
});

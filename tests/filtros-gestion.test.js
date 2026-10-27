/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Filtros HTTP q de usuarios y libros llegan al modelo. */
/* Listing Contents: integración de controladores y modelos reales. */
/* Reuse Instructions: DUCKY_TEST_DB=1 npm test; solo lectura de BD. */
/******************************************************************/
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('PostgreSQL: filtros q de gestión devuelven coincidencias y no toda la lista',
{ skip: process.env.DUCKY_TEST_DB !== '1' }, async () =>
{
    const { pool } = require('../db');
    try
    {
        for (const [archivo, consulta, campo, esperado] of [
            ['usuarioController', '100001', 'clave', '100001'],
            ['libroController', 'Clean Code', 'titulo', 'Clean Code']
        ])
        {
            const controlador = require('../controllers/' + archivo);
            let estado;
            let datos;
            const respuesta = {
                status: valor => { estado = valor; return respuesta; },
                json: valor => { datos = valor; }
            };
            await controlador.listar({query:{q:consulta}}, respuesta);
            assert.equal(estado, 200);
            assert.ok(datos.length > 0);
            assert.ok(datos.every(fila => fila[campo] === esperado), archivo);
            await controlador.listar({query:{q:'SIN_COINCIDENCIAS_DEBUG_93817'}}, respuesta);
            assert.equal(estado, 200);
            assert.equal(datos.length, 0, archivo);
        }
    }
    finally
    {
        await pool.end();
    }
});

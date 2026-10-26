/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Pruebas de regresión y contratos del sistema. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   Dependencias, configuración y montaje del módulo. */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Ejecutar con npm test; DUCKY_TEST_DB=1 habilita integración local. */
/* Las pruebas de datos revierten cambios o usan esquema aislado. */
/******************************************************************/

const
{
    test
} = require('node:test');
const assert = require('node:assert/strict');
const
{
    validar_base,
    validar_servidor,
    diagnostico_base
} = require('../utils/config');
test('configuración incompleta falla con una explicación sin revelar secretos', () =>
{
    assert.throws(() => validar_base(
    {
    }), /Falta DATABASE_URL/);
    assert.throws(() => validar_base(
    {
        DATABASE_URL: 'no-es-url'
    }), /URL válida/);
    assert.throws(() => validar_base(
    {
        DATABASE_URL: 'https://localhost/ducky'
    }), /PostgreSQL/);
    assert.throws(() => validar_servidor(
    {
        DATABASE_URL: 'postgresql://localhost/ducky'
    }), /SESSION_SECRET/);
    assert.doesNotThrow(() => validar_servidor(
    {
        DATABASE_URL: 'postgresql://localhost/ducky',
        SESSION_SECRET: 'a'.repeat(64)
    }));
    assert.equal(diagnostico_base(
    {
        code: '28P01',
        message: 'secreto'
    }).includes('secreto'), false);
});

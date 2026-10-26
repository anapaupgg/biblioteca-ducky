/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Migración aditiva de permisos de compras. */
/* Listing Contents: migrar. */
/* Reuse Instructions: DATABASE_URL, node scripts/migrar-compras.js. */
/* Una transacción con registro; repetir no reasigna permisos retirados. */
/******************************************************************/
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const
{
    Client
} = require('pg');
const assert = require('node:assert/strict');
if (process.argv.includes('--copia'))
{
    const carpeta = fs.readFileSync('.local-validation/actual.txt', 'utf8');
    const configuracion = JSON.parse(fs.readFileSync(path.join(carpeta, 'config.json')));
    const url = new URL(configuracion.database_url);
    assert.match(configuracion.database_name, /^ducky_validacion_[0-9]+_[a-f0-9]+$/);
    assert.equal(url.pathname, '/' + configuracion.database_name);
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
    process.env.DATABASE_URL = configuracion.database_url;
}

async function migrar()
{
    const cliente = new Client(
    {
        connectionString: process.env.DATABASE_URL
    });
    await cliente.connect();
    try
    {
        await cliente.query('BEGIN');
        await cliente.query('SET LOCAL search_path TO biblioteca, public');
        await cliente.query("SELECT pg_advisory_xact_lock(82626001)");
        await cliente.query(`CREATE TABLE IF NOT EXISTS migraciones_aplicadas
            (nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())`);
        const existe = await cliente.query('SELECT 1 FROM migraciones_aplicadas WHERE nombre=$1', ['001_permisos_compras']);
        if (!existe.rowCount)
        {
            await cliente.query("SELECT set_config('app.usuario', '100001', true)");
            await cliente.query(fs.readFileSync(path.join(__dirname, '../database/migrations/001_permisos_compras.sql'), 'utf8'));
            await cliente.query('INSERT INTO migraciones_aplicadas(nombre) VALUES($1)', ['001_permisos_compras']);
        }
        await cliente.query('COMMIT');
        console.log(existe.rowCount ? 'Migración ya aplicada.' : 'Permisos de compras migrados.');
    }
    catch (error)
    {
        await cliente.query('ROLLBACK');
        throw error;
    }
    finally
    {
        await cliente.end();
    }
}

migrar().catch(error =>
{
    console.error(error.message);
    process.exitCode = 1;
});

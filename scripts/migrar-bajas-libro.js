/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-13 */
/* Description: Migración aditiva de motivos de baja de libro. */
/* Listing Contents: migrar. */
/* Reuse Instructions: DATABASE_URL, node scripts/migrar-bajas-libro.js. */
/* No reinicia datos. Registra aplicación dentro de una transacción. */
/******************************************************************/
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

async function migrar()
{
    const cliente = new Client({ connectionString: process.env.DATABASE_URL });
    await cliente.connect();
    try
    {
        await cliente.query('BEGIN');
        await cliente.query('SET LOCAL search_path TO biblioteca, public');
        await cliente.query('SELECT pg_advisory_xact_lock(82626002)');
        await cliente.query(`CREATE TABLE IF NOT EXISTS migraciones_aplicadas
            (nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())`);
        const existe = await cliente.query('SELECT 1 FROM migraciones_aplicadas WHERE nombre=$1',
            ['002_bajas_libro']);
        if (!existe.rowCount)
        {
            await cliente.query(fs.readFileSync(path.join(__dirname,
                '../database/migrations/002_bajas_libro.sql'), 'utf8'));
            await cliente.query('INSERT INTO migraciones_aplicadas(nombre) VALUES($1)',
                ['002_bajas_libro']);
        }
        await cliente.query('COMMIT');
        console.log(existe.rowCount ? 'Migración de bajas ya aplicada.' :
            'Registro de bajas de libro migrado.');
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

migrar().catch((error) =>
{
    console.error(error.message);
    process.exitCode = 1;
});

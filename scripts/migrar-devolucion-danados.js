/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: Migra de forma aditiva la revisión de dañados.    */
/******************************************************************/

/******************************************************************/
/* Listing Contents: migrar.                                      */
/* Reuse Instructions: DATABASE_URL y node scripts/migrar-        */
/* devolucion-danados.js. Transacción; no ejecuta db:init.        */
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
        await cliente.query('SELECT pg_advisory_xact_lock(82626003)');
        await cliente.query(`CREATE TABLE IF NOT EXISTS migraciones_aplicadas
            (nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())`);
        const existe = await cliente.query('SELECT 1 FROM migraciones_aplicadas WHERE nombre=$1',
            ['003_devolucion_danados']);
        if (!existe.rowCount)
        {
            await cliente.query(fs.readFileSync(path.join(__dirname,
                '../database/migrations/003_devolucion_danados.sql'), 'utf8'));
            await cliente.query('INSERT INTO migraciones_aplicadas(nombre) VALUES($1)',
                ['003_devolucion_danados']);
        }
        await cliente.query('COMMIT');
        console.log(existe.rowCount ? 'Migración de dañados ya aplicada.' :
            'Revisión de ejemplares dañados migrada.');
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

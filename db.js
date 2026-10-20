/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Conexión a PostgreSQL.                            */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   pool                          - Shared PostgreSQL pool       */
/*   con_usuario(clave, trabajo)   - Run work inside a transaction*/
/*                                   as a given user              */
/******************************************************************/

require('dotenv').config();
const { Pool, types } = require('pg');

/* DATE columns are returned as 'YYYY-MM-DD' text (no time zone shifts) */
types.setTypeParser(1082, (valor) => valor);
/* COUNT(*) (bigint) and NUMERIC (money) columns are returned as numbers */
types.setTypeParser(20, (valor) => (valor === null ? null : Number(valor)));
types.setTypeParser(1700, (valor) => (valor === null ? null : Number(valor)));

/******************************************************************/
/* A single pool is shared across all models. The search_path     */
/* points to the "biblioteca" schema created by 01_esquema.sql.   */
/******************************************************************/
const pool = new Pool(
{
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    options: '-c search_path=biblioteca,public'
});

/******************************************************************/
/* Reuse Instructions                                             */
/* con_usuario(clave, trabajo)                                    */
/* Purpose: Open a transaction, register the operating user in    */
/*          the session variable app.usuario (read by the         */
/*          database triggers), run the work function and commit. */
/*          Any error rolls the whole transaction back.           */
/* Parameters:                                                    */
/*   clave   - string   - Clave_Usuario of the operating user     */
/*   trabajo - function - async (client) => result                */
/* Returns: Promise resolving to the value returned by trabajo    */
/******************************************************************/
const con_usuario = async (clave, trabajo) =>
{
    const client = await pool.connect();
    try
    {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.usuario', $1, true)", [clave || '']);
        const resultado = await trabajo(client);
        await client.query('COMMIT');
        return resultado;
    }
    catch (error)
    {
        await client.query('ROLLBACK');
        throw error;
    }
    finally
    {
        client.release();
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* simular(clave, trabajo)                                        */
/* Purpose: Same as con_usuario but ALWAYS rolls back. Used to    */
/*          validate an operation against the business rules of   */
/*          the database (triggers) without saving anything,      */
/*          e.g. "Validar solicitud" before confirming a loan.    */
/******************************************************************/
const simular = async (clave, trabajo) =>
{
    const client = await pool.connect();
    try
    {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.usuario', $1, true)", [clave || '']);
        return await trabajo(client);
    }
    finally
    {
        await client.query('ROLLBACK');
        client.release();
    }
};

module.exports = { pool, con_usuario, simular };

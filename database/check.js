require('dotenv').config();
const { validar_base, diagnostico_base } = require('../utils/config');

async function comprobar()
{
    try { validar_base(); }
    catch (error) { console.error(error.message); process.exitCode = 1; return; }
    const { pool } = require('../db');
    try
    {
        await pool.query('SELECT 1 FROM usuarios LIMIT 1');
        const resultado = await pool.query("SELECT to_regprocedure('biblioteca.iniciar_sesion(character varying,character varying,character varying)') IS NOT NULL AS login_disponible");
        if (!resultado.rows[0].login_disponible)
        {
            console.error('La conexión funciona, pero falta la función iniciar_sesion del esquema.');
            process.exitCode = 1;
            return;
        }
        console.log('PostgreSQL conectado: tabla de usuarios y función de login disponibles. No se modificaron datos.');
    }
    catch (error) { console.error(diagnostico_base(error)); process.exitCode = 1; }
    finally { await pool.end(); }
}
comprobar();

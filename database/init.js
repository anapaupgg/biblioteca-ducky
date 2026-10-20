/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Crea la base de datos con los scripts SQL.        */
/******************************************************************/

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Client } = require('pg');

const SCRIPTS = ['01_esquema.sql', '02_reglas.sql', '03_datos.sql'];

(async () =>
{
    const client = new Client(
    {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    client.on('notice', () => {});

    for (const script of SCRIPTS)
    {
        process.stdout.write('Ejecutando ' + script + '... ');
        const sql = fs.readFileSync(path.join(__dirname, script), 'utf8');
        await client.query(sql);
        console.log('listo');
    }

    await client.end();
    console.log('\nBase de datos instalada. Ya puedes correr: npm start');
})().catch((error) =>
{
    console.error('\nNo se pudo instalar la base de datos:', error.message);
    process.exit(1);
});

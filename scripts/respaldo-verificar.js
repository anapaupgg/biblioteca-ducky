/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Respaldo consistente y restauración en BD nueva. */
/* Listing Contents: entorno_pg, ejecutar, huellas, verificar. */
/* Reuse Instructions: node scripts/respaldo-verificar.js */
/* Requiere pg_dump/pg_restore y permiso CREATEDB. Nunca db:init. */
/* DATABASE_URL: origen; salida privada .local-validation/. */
/* Mantiene copia aislada para aceptación; no sobrescribe bases. */
/******************************************************************/

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const
{
    spawnSync
} = require('node:child_process');
const
{
    Client
} = require('pg');

function entorno_pg(url)
{
    return {
        ...process.env,
        PGHOST: url.hostname,
        PGPORT: url.port || '5432',
        PGUSER: decodeURIComponent(url.username),
        PGPASSWORD: decodeURIComponent(url.password),
        PGDATABASE: decodeURIComponent(url.pathname.slice(1))
    };
}

function ejecutar(programa, argumentos, url)
{
    const resultado = spawnSync(programa, argumentos,
    {
        env: entorno_pg(url),
        encoding: 'utf8',
        timeout: 120000
    });
    if (resultado.error || resultado.status !== 0)
    {
        throw new Error(programa + ' falló; código ' + resultado.status);
    }
}

async function huellas(cliente)
{
    const tablas = await cliente.query(`SELECT schemaname, tablename FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY schemaname, tablename`);
    const resultados = {};
    for (const tabla of tablas.rows)
    {
        const identificador = [tabla.schemaname, tabla.tablename]
            .map(nombre => '"' + nombre.replace(/"/g, '""') + '"').join('.');
        const resultado = await cliente.query(`SELECT count(*)::int AS filas,
            md5(coalesce(string_agg(firma, '' ORDER BY firma), '')) AS huella
            FROM (SELECT md5(row_to_json(fila.*)::text) AS firma FROM ${identificador} fila) datos`);
        resultados[identificador] = resultado.rows[0];
    }
    return resultados;
}

async function verificar()
{
    const origen = new URL(process.env.DATABASE_URL);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(origen.hostname))
    {
        throw new Error('Este verificador solo opera en PostgreSQL local.');
    }
    const nombre = 'ducky_validacion_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const destino = new URL(origen);
    destino.pathname = '/' + nombre;
    const carpeta = path.resolve('.local-validation', nombre);
    fs.mkdirSync(carpeta,
    {
        recursive: true,
        mode: 0o700
    });
    fs.chmodSync(path.dirname(carpeta), 0o700);
    const respaldo = path.join(carpeta, 'biblioteca.dump');
    const cliente = new Client(
    {
        connectionString: origen.toString()
    });
    let copia;
    await cliente.connect();
    try
    {
        await cliente.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const snapshot = (await cliente.query('SELECT pg_export_snapshot() AS snapshot')).rows[0].snapshot;
        const antes = await huellas(cliente);
        ejecutar('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--snapshot=' + snapshot,
            '--file=' + respaldo
        ], origen);
        fs.chmodSync(respaldo, 0o600);
        await cliente.query('COMMIT');
        await cliente.query('CREATE DATABASE "' + nombre + '" TEMPLATE template0');
        ejecutar('pg_restore', ['--no-owner', '--no-acl', '--exit-on-error', '--dbname=' + nombre, respaldo], destino);
        copia = new Client(
        {
            connectionString: destino.toString()
        });
        await copia.connect();
        const despues = await huellas(copia);
        if (JSON.stringify(antes) !== JSON.stringify(despues)) throw new Error('La restauración no coincide con el respaldo.');
        const configuracion = {
            database_url: destino.toString(),
            database_name: nombre,
            session_secret: crypto.randomBytes(48).toString('hex'),
            carpeta
        };
        fs.writeFileSync(path.join(carpeta, 'config.json'), JSON.stringify(configuracion),
        {
            mode: 0o600
        });
        const reporte = {
            fecha: new Date().toISOString(),
            base_prueba: nombre,
            tablas: Object.keys(antes).length,
            filas: Object.values(antes).reduce((total, tabla) => total + tabla.filas, 0),
            igualdad: true,
            sha256_respaldo: crypto.createHash('sha256').update(fs.readFileSync(respaldo)).digest('hex')
        };
        fs.writeFileSync(path.join(carpeta, 'respaldo.json'), JSON.stringify(reporte, null, 4),
        {
            mode: 0o600
        });
        fs.writeFileSync(path.resolve('.local-validation', 'actual.txt'), carpeta,
        {
            mode: 0o600
        });
        console.log(JSON.stringify(reporte));
    }
    finally
    {
        await cliente.query('ROLLBACK').catch(() =>
        {});
        await copia?.end();
        await cliente.end();
    }
}

verificar().catch(error =>
{
    console.error(error.message);
    process.exitCode = 1;
});

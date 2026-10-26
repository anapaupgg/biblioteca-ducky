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
const fs = require('node:fs');
const path = require('node:path');

test('PostgreSQL: presupuesto concurrente, recepción única y rollback íntegro',
{
    skip: process.env.DUCKY_TEST_DB !== '1',
    timeout: 30000
}, async () =>
{
    const
    {
        pool
    } = require('../db');
    const pedidos = require('../models/pedidoModel');
    const schema = 'ducky_test_' + require('node:crypto').randomBytes(8).toString('hex');
    const admin = await pool.connect();
    let creado = false;
    const tx = async trabajo =>
    {
        const c = await pool.connect();
        try
        {
            await c.query('BEGIN');
            await c.query(`SET LOCAL search_path TO ${schema}, public`);
            await c.query("SET LOCAL lock_timeout = '5s'");
            await c.query("SELECT set_config('app.usuario', '100002', true)");
            const r = await trabajo(c);
            await c.query('COMMIT');
            return r;
        }
        catch (e)
        {
            await c.query('ROLLBACK');
            throw e;
        }
        finally
        {
            c.release();
        }
    };
    // Hold the first transaction open and prove the second really waits on it.
    const competir = async (primera, segunda) =>
    {
        let liberar, listo;
        const puerta = new Promise(r =>
        {
            liberar = r;
        });
        const preparada = new Promise(r =>
        {
            listo = r;
        });
        const a = tx(async c =>
        {
            const pid = (await c.query('SELECT pg_backend_pid() AS pid'))
                .rows[0].pid;
            try
            {
                const valor = await primera(c);
                listo(pid);
                await puerta;
                return valor;
            }
            catch (e)
            {
                listo(null);
                throw e;
            }
        });
        const pid = await preparada;
        const b = tx(segunda);
        const resultados = Promise.allSettled([a, b]);
        try
        {
            assert.ok(pid);
            let bloqueada = false;
            for (let i = 0; i < 100; i++)
            {
                const r = await admin.query(
                    'SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE $1::int = ANY(pg_blocking_pids(pid))) AS esperando',
                    [pid]);
                if (r.rows[0].esperando)
                {
                    bloqueada = true;
                    break;
                }
                await new Promise(r => setTimeout(r, 10));
            }
            assert.ok(bloqueada,
                'La segunda operación debe esperar el bloqueo de la primera');
        }
        finally
        {
            liberar();
        }
        return resultados;
    };
    try
    {
        // Create a new isolated schema; never execute db:init or alter DB defaults.
        await admin.query(`CREATE SCHEMA ${schema}`);
        creado = true;
        const extension = (await admin.query(
            "SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto'"
            )).rows[0].nspname;
        const extensionSQL = '"' + extension.replaceAll('"', '""') + '"';
        for (const nombre of ['01_esquema.sql', '02_reglas.sql', '03_datos.sql'])
        {
            let sql = fs.readFileSync(path.join(__dirname, '../database', nombre), 'utf8');
            if (nombre === '01_esquema.sql')
            {
                sql = sql.replace('DROP SCHEMA IF EXISTS biblioteca CASCADE;', '')
                    .replace('CREATE SCHEMA biblioteca;', '')
                    .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;[^\n]*/, '')
                    .replace(/DO \$\$ BEGIN[\s\S]*?END \$\$;/, '');
            }
            sql = sql.replace(/\bbiblioteca\b/g, schema);
            sql = sql.replace(/\b(gen_salt|crypt|digest|gen_random_bytes)\s*\(/g, (_, fn) =>
                extensionSQL + '.' + fn + '(');
            assert.ok(!/ALTER DATABASE|DROP SCHEMA|CREATE EXTENSION/i.test(sql));
            await admin.query(sql);
        }
        const presupuesto = (await admin.query(
            "INSERT INTO presupuestos_mensuales(periodo,monto_autorizado,clave_responsable) VALUES ('2099-01',100,'100002') RETURNING id_presupuesto"
            )).rows[0].id_presupuesto;
        const crear = (c, costo, extra =
        {
        }) => pedidos.crear(c,
        {
            id_presupuesto: presupuesto,
            clave: '100002',
            lineas: [
            {
                titulo: 'Prueba',
                cantidad: 1,
                costo_unitario: costo,
                ...extra
            }]
        });
        const r = await competir(c => crear(c, 80), c => crear(c, 80));
        assert.equal(r[0].status, 'fulfilled');
        assert.equal(r[1].status, 'rejected');
        assert.match(r[1].reason.message, /Presupuesto insuficiente/);
        assert.equal((await admin.query(
            'SELECT count(*) AS n FROM pedidos_tesoreria WHERE id_presupuesto=$1', [
                presupuesto
            ])).rows[0].n, 1);
        assert.equal((await admin.query(
            'SELECT saldo FROM v_presupuesto_saldo WHERE id_presupuesto=$1', [
                presupuesto
            ])).rows[0].saldo, 20);

        const libro = (await admin.query(
            "SELECT id_libro FROM libros WHERE formato='Físico' ORDER BY id_libro LIMIT 1"
            )).rows[0].id_libro;
        const ubicacion = (await admin.query('SELECT id_ubicacion FROM ubicaciones LIMIT 1'))
            .rows[0].id_ubicacion;
        const id = await tx(c => crear(c, 10,
        {
            id_libro: libro
        }));
        await tx(c => pedidos.cambiar_estatus(c, id, 'Autorizado'));
        const contar = async () => (await admin.query(
            'SELECT count(*) AS n FROM ejemplares WHERE id_libro=$1', [libro])).rows[0].n;
        const antes = await contar();
        const recepciones = await competir(c => pedidos.recibir(c, id, ubicacion), c => pedidos
            .recibir(c, id, ubicacion));
        assert.equal(recepciones[0].status, 'fulfilled');
        assert.equal(recepciones[1].status, 'rejected');
        assert.equal(recepciones[1].reason.status, 409);
        assert.equal(await contar(), antes + 1);

        const fallido = await tx(c => crear(c, 10,
        {
            id_libro: libro
        }));
        await tx(c => pedidos.cambiar_estatus(c, fallido, 'Autorizado'));
        await assert.rejects(tx(async c =>
        {
            await pedidos.recibir(c, fallido, ubicacion);
            throw new Error('fallo posterior a insertar ejemplares');
        }), /fallo posterior/);
        assert.equal(await contar(), antes + 1);
        assert.equal((await pedidos.buscar(fallido, admin)).pedido.estatus, 'Autorizado');
        await tx(c => pedidos.recibir(c, fallido, ubicacion));
        assert.equal(await contar(), antes + 2);
        const digital = (await admin.query(
            "SELECT id_libro FROM libros WHERE formato='Digital' LIMIT 1")).rows[0].id_libro;
        const pedido_digital = await tx(c => crear(c, 0, { id_libro: digital }));
        await tx(c => pedidos.cambiar_estatus(c, pedido_digital, 'Autorizado'));
        const recibido_digital = await tx(c => pedidos.recibir(c, pedido_digital, null));
        assert.equal(recibido_digital.ejemplares.length, 1);
        const ejemplar_digital = (await admin.query(
            'SELECT id_ubicacion, tipo_uso FROM ejemplares WHERE id_ejemplar=$1',
            [recibido_digital.ejemplares[0]])).rows[0];
        assert.equal(ejemplar_digital.id_ubicacion, null);
        assert.equal(ejemplar_digital.tipo_uso, 'Préstamo digital');
        const pedido_fisico = await tx(c => crear(c, 0, { id_libro: libro }));
        await tx(c => pedidos.cambiar_estatus(c, pedido_fisico, 'Autorizado'));
        await assert.rejects(tx(c => pedidos.recibir(c, pedido_fisico, null)),
            error => error.status === 400);
        assert.equal((await pedidos.buscar(pedido_fisico, admin)).pedido.estatus, 'Autorizado');
        const estado = await tx(c => crear(c, 0));
        const cambios = await competir(c => pedidos.cambiar_estatus(c, estado, 'Autorizado'),
            c => pedidos.cambiar_estatus(c, estado, 'Rechazado'));
        assert.equal(cambios[0].status, 'fulfilled');
        assert.equal(cambios[1].status, 'rejected');
        assert.equal(cambios[1].reason.status, 409);
        assert.equal((await pedidos.buscar(estado, admin)).pedido.estatus, 'Autorizado');
    }
    finally
    {
        await admin.query('ROLLBACK');
        if (creado) await admin.query(`DROP SCHEMA ${schema} CASCADE`);
        admin.release();
        await pool.end();
    }
});

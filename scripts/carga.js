/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Carga HTTP local y catálogo extenso en copia aislada. */
/* Listing Contents: preparar, medir, principal. */
/* Reuse Instructions: tras respaldo y aceptación; crea fixtures solo */
/* en ducky_validacion_*. Reporte privado sin claves ni tokens. */
/******************************************************************/
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const carpeta = fs.readFileSync('.local-validation/actual.txt', 'utf8');
const configuracion = JSON.parse(fs.readFileSync(carpeta + '/config.json'));
assert.match(configuracion.database_name, /^ducky_validacion_[0-9]+_[a-f0-9]+$/);
assert.equal(new URL(configuracion.database_url).pathname, '/' + configuracion.database_name);
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(configuracion.database_url).hostname));
process.env.DATABASE_URL = configuracion.database_url;
process.env.SESSION_SECRET = configuracion.session_secret;
process.env.RESEND_API_KEY = '';
const
{
    pool,
    con_usuario
} = require('../db');
const libro_model = require('../models/libroModel');
const express = require('express');
const app = express();
app.use(express.json());
for (const [prefijo, archivo] of Object.entries(
    {
        auth: 'auth',
        busqueda: 'busqueda',
        chatbot: 'chatbot'
    }))
{
    app.use('/api/' + prefijo, require('../routes/' + archivo + 'Routes'));
}
async function preparar(contrasena)
{
    await con_usuario('100001', async cliente =>
    {
        for (let indice = 0; indice < 100; indice++)
        {
            const clave = String(900000 + indice);
            const correo = 'carga' + indice + '@example.invalid';
            const existente = await cliente.query('SELECT correo FROM usuarios WHERE clave_usuario=$1', [clave]);
            assert.ok(!existente.rowCount || existente.rows[0].correo === correo, 'Colisión de fixture');
            await cliente.query(`INSERT INTO usuarios(clave_usuario,nombre,correo,id_tipo_usuario,id_perfil,clave_admin_alta)
                VALUES($1,$2,$3,1,4,'100001') ON CONFLICT(clave_usuario) DO NOTHING`, [clave, 'Carga ' + indice, correo]);
            await cliente.query('SELECT asignar_contrasena($1,$2,false)', [clave, contrasena]);
        }
        const ubicacion = (await cliente.query('SELECT id_ubicacion FROM ubicaciones LIMIT 1')).rows[0].id_ubicacion;
        for (let indice = 0; indice < 250; indice++)
        {
            const id_libro = 'L' + (800000 + indice);
            const titulo = 'Prueba de paginación y búsqueda: volumen ' + String(indice).padStart(3, '0');
            const existente = await cliente.query('SELECT titulo FROM libros WHERE id_libro=$1', [id_libro]);
            if (existente.rowCount)
            {
                assert.equal(existente.rows[0].titulo, titulo);
                continue;
            }
            await libro_model.crear(cliente,
            {
                id_libro,
                titulo,
                isbn: '979' + String(indice).padStart(10, '0'),
                editorial: 'Editorial validación',
                tema: 'Pruebas',
                autores: ['Autor de pruebas'],
                formato: 'Físico'
            });
            await libro_model.agregar_ejemplares(cliente,
            {
                id_libro,
                cantidad: 1,
                id_ubicacion: ubicacion,
                tipo_uso: 'Préstamo externo'
            });
            await libro_model.cambiar_estatus(cliente, id_libro, 'Activo en catálogo');
        }
    });
}
async function medir(base, tokens)
{
    const rutas = ['/auth/sesion', '/busqueda?titulo=Prueba', '/busqueda/listado', '/chatbot?q=que%20libros%20hay', '/busqueda?titulo=inexistente'];
    const tiempos = [];
    let errores = 0;
    const inicio = performance.now();
    await Promise.all(tokens.map(async token =>
    {
        for (const ruta of rutas)
        {
            const inicio_peticion = performance.now();
            try
            {
                const respuesta = await fetch(base + '/api' + ruta,
                {
                    headers:
                    {
                        Authorization: 'Bearer ' + token
                    }
                });
                const datos = await respuesta.json();
                if (respuesta.status !== 200 || !datos) errores++;
            }
            catch
            {
                errores++;
            }
            tiempos.push(performance.now() - inicio_peticion);
        }
    }));
    tiempos.sort((a, b) => a - b);
    return {
        usuarios: tokens.length,
        peticiones: tiempos.length,
        errores,
        p50_ms: Math.round(tiempos[Math.ceil(tiempos.length * .5) - 1]),
        p95_ms: Math.round(tiempos[Math.ceil(tiempos.length * .95) - 1]),
        max_ms: Math.round(tiempos.at(-1)),
        duracion_ms: Math.round(performance.now() - inicio)
    };
}
async function principal()
{
    let servidor;
    try
    {
        assert.equal((await pool.query('SELECT current_database() AS nombre')).rows[0].nombre, configuracion.database_name);
        const contrasena = crypto.randomBytes(24).toString('hex');
        await preparar(contrasena);
        servidor = app.listen(0, '127.0.0.1');
        await new Promise(resolve => servidor.once('listening', resolve));
        const base = 'http://127.0.0.1:' + servidor.address().port;
        const tokens = [];
        for (let indice = 0; indice < 100; indice++)
        {
            const respuesta = await fetch(base + '/api/auth/login',
            {
                method: 'POST',
                headers:
                {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                {
                    clave: String(900000 + indice),
                    contrasena
                })
            });
            assert.equal(respuesta.status, 200);
            tokens.push((await respuesta.json()).token);
        }
        await medir(base, tokens.slice(0, 5));
        const resultados = [await medir(base, tokens.slice(0, 55)), await medir(base, tokens)];
        const reporte = {
            fecha: new Date().toISOString(),
            nota: '100 usuarios distintos, login secuencial fuera de medición; 5 lecturas por usuario, concurrencia cerrada, HTTP+JSON localhost. No mide navegador ni producción.',
            resultados
        };
        fs.writeFileSync(carpeta + '/carga.json', JSON.stringify(reporte, null, 4),
        {
            mode: 0o600
        });
        console.log(JSON.stringify(reporte, null, 2));
        assert.ok(resultados.every(resultado => resultado.errores === 0 && resultado.max_ms < 3000), 'No cumple umbral local de 3 segundos');
    }
    finally
    {
        if (servidor)
        {
            servidor.closeAllConnections();
            await new Promise(resolve => servidor.close(resolve));
        }
        await pool.end();
    }
}
principal().catch(error =>
{
    console.error(error.message);
    process.exitCode = 1;
});

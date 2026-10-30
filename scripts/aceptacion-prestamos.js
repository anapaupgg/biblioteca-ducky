/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Aceptación HTTP del ciclo de préstamo en copia.  */
/******************************************************************/

/******************************************************************/
/* Listing Contents: llamar, principal.                           */
/* Reuse Instructions: ejecutar tras respaldo-verificar.js. Solo  */
/* usa ducky_validacion_*; nunca escribir en la BD original.      */
/******************************************************************/

const assert = require('node:assert/strict');
const fs = require('node:fs');
const express = require('express');
const carpeta = fs.readFileSync('.local-validation/actual.txt', 'utf8');
const configuracion = JSON.parse(fs.readFileSync(carpeta + '/config.json'));
assert.match(configuracion.database_name, /^ducky_validacion_[0-9]+_[a-f0-9]+$/);
assert.equal(new URL(configuracion.database_url).pathname, '/' + configuracion.database_name);
process.env.DATABASE_URL = configuracion.database_url;
process.env.SESSION_SECRET = configuracion.session_secret;

const { pool } = require('../db');
const sesion_model = require('../models/sesionModel');
const { firmar_token } = require('../middleware/auth');
const app = express();
app.use(express.json());
app.use('/api/busqueda', require('../routes/busquedaRoutes'));
app.use('/api/prestamos', require('../routes/prestamoRoutes'));

const token = firmar_token(1);
let usuario_actual;
sesion_model.obtener_activa = async () => usuario_actual;

async function llamar(base, metodo, ruta, usuario, datos, esperado)
{
    usuario_actual = usuario;
    const respuesta = await fetch(base + ruta, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: datos === undefined ? undefined : JSON.stringify(datos)
    });
    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, esperado, metodo + ' ' + ruta + ': ' + JSON.stringify(cuerpo));
    return cuerpo;
}

async function principal()
{
    const nombre = (await pool.query('SELECT current_database() AS nombre')).rows[0].nombre;
    assert.equal(nombre, configuracion.database_name);
    const candidato = (await pool.query(
        `SELECT e.id_libro, e.id_ejemplar FROM ejemplares e JOIN libros l ON l.id_libro = e.id_libro
          WHERE e.estatus = 'Disponible' AND e.tipo_uso = 'Préstamo externo'
            AND l.estatus = 'Activo en catálogo'
            AND NOT EXISTS (SELECT 1 FROM solicitudes_prestamo s WHERE s.clave_usuario = '800456'
                            AND s.id_libro = e.id_libro AND s.estatus = 'Pendiente')
          ORDER BY e.id_ejemplar LIMIT 1`)).rows[0];
    assert.ok(candidato, 'Se necesita un ejemplar disponible para la prueba');
    const ejemplar_ajeno = (await pool.query(
        `SELECT id_ejemplar FROM ejemplares WHERE id_libro <> $1
          AND estatus = 'Disponible' AND tipo_uso = 'Préstamo externo'
          ORDER BY id_ejemplar LIMIT 1`, [candidato.id_libro])).rows[0];
    assert.ok(ejemplar_ajeno, 'Se necesita un ejemplar de otro libro para validar el rechazo');
    const lector = { clave: '800456', es_temporal: false, funciones: ['Buscar libros'] };
    const bibliotecario = { clave: '100002', es_temporal: false, funciones: ['Préstamos'] };
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        servidor.once('listening', resolve);
        servidor.once('error', reject);
    });
    const base = 'http://127.0.0.1:' + servidor.address().port + '/api';
    try
    {
        const solicitud = await llamar(base, 'POST', '/busqueda/' + candidato.id_libro +
            '/solicitud', lector, {}, 201);
        const mios_antes = await llamar(base, 'GET', '/prestamos/mios', lector, undefined, 200);
        assert.ok(mios_antes.solicitudes.some((registro) => registro.folio === solicitud.folio &&
            registro.estatus === 'Pendiente'));
        assert.ok(mios_antes.prestamos.every((registro) => registro.id_ejemplar !== 'L000128-01'),
            'Un lector no debe ver el préstamo de otro usuario');
        const cola = await llamar(base, 'GET', '/prestamos/solicitudes', bibliotecario, undefined, 200);
        assert.ok(cola.some((registro) => registro.folio === solicitud.folio &&
            registro.ejemplares.some((ejemplar) => ejemplar.id_ejemplar === candidato.id_ejemplar)));
        await llamar(base, 'GET', '/prestamos/solicitudes', lector, undefined, 403);
        await llamar(base, 'POST', '/prestamos/solicitudes/' + solicitud.folio + '/autorizar',
            lector, { id_ejemplar: candidato.id_ejemplar }, 403);
        await llamar(base, 'POST', '/prestamos/solicitudes/' + solicitud.folio + '/autorizar',
            bibliotecario, { id_ejemplar: ejemplar_ajeno.id_ejemplar }, 422);
        assert.equal((await pool.query(
            'SELECT estatus FROM solicitudes_prestamo WHERE id_solicitud_prestamo = $1',
            [solicitud.folio])).rows[0].estatus, 'Pendiente');
        const prestamo = await llamar(base, 'POST', '/prestamos/solicitudes/' + solicitud.folio +
            '/autorizar', bibliotecario, { id_ejemplar: candidato.id_ejemplar }, 201);
        assert.equal(prestamo.clave_usuario, lector.clave);
        assert.equal(prestamo.id_ejemplar, candidato.id_ejemplar);
        assert.ok(prestamo.fecha_vencimiento > prestamo.fecha_prestamo);
        await llamar(base, 'POST', '/prestamos/solicitudes/' + solicitud.folio +
            '/autorizar', bibliotecario, { id_ejemplar: candidato.id_ejemplar }, 409);
        const mios_despues = await llamar(base, 'GET', '/prestamos/mios', lector, undefined, 200);
        assert.ok(mios_despues.prestamos.some((registro) => registro.id_prestamo === prestamo.id_prestamo));
        assert.ok(mios_despues.solicitudes.some((registro) => registro.folio === solicitud.folio &&
            registro.estatus === 'Atendida'));
        const estados = (await pool.query(
            `SELECT s.estatus AS solicitud, e.estatus AS ejemplar
               FROM solicitudes_prestamo s JOIN prestamos p USING (id_solicitud_prestamo)
               JOIN ejemplares e USING (id_ejemplar) WHERE s.id_solicitud_prestamo = $1`,
            [solicitud.folio])).rows[0];
        assert.deepEqual(estados, { solicitud: 'Atendida', ejemplar: 'Prestado' });
        console.log('Ciclo de préstamo HTTP correcto en ' + nombre +
            ': solicitud, privacidad, permisos, rollback, autorización y segunda autorización bloqueada.');
    }
    finally
    {
        await new Promise((resolve) => servidor.close(resolve));
        await pool.end();
    }
}

principal().catch((error) => { console.error(error); process.exitCode = 1; });

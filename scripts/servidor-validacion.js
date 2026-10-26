/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Servidor visual sobre la copia restaurada, puerto 3002. */
/* Listing Contents: configuración y arranque. */
/* Reuse Instructions: ejecutar desde raíz tras respaldo y migración. */
/* No usa la base original ni permite envío de correo. Ctrl+C detiene. */
/******************************************************************/
const fs = require('node:fs');
const assert = require('node:assert/strict');
const carpeta = fs.readFileSync('.local-validation/actual.txt', 'utf8');
const configuracion = JSON.parse(fs.readFileSync(carpeta + '/config.json'));
const url = new URL(configuracion.database_url);
assert.match(configuracion.database_name, /^ducky_validacion_[0-9]+_[a-f0-9]+$/);
assert.equal(url.pathname, '/' + configuracion.database_name);
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
process.env.DATABASE_URL = configuracion.database_url;
process.env.SESSION_SECRET = configuracion.session_secret;
process.env.RESEND_API_KEY = '';
process.env.PORT = '3002';
require('../server');

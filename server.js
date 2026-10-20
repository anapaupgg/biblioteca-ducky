/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Servidor principal.                               */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   Middleware setup  - json body parser, static frontend        */
/*   Route mounting    - /api/auth, /api/usuarios,                */
/*                       /api/perfiles, /api/libros,              */
/*                       /api/pedidos, /api/busqueda              */
/*   Error handlers    - 404 for unknown API routes, 500 generic  */
/*   Server startup    - listen on PORT + DB health check         */
/******************************************************************/

require('dotenv').config();
const path    = require('path');
const express = require('express');
const { pool } = require('./db');

const auth_routes        = require('./routes/authRoutes');
const usuario_routes     = require('./routes/usuarioRoutes');
const perfil_routes      = require('./routes/perfilRoutes');
const libro_routes       = require('./routes/libroRoutes');
const busqueda_routes    = require('./routes/busquedaRoutes');
const pedido_routes      = require('./routes/pedidoRoutes');

/******************************************************************/
/* Express application setup                                      */
/******************************************************************/
const PORT_NUMBER = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend'), { extensions: ['html'] }));
app.get('/', (req, res) => res.redirect('/login.html'));

/******************************************************************/
/* Route mounting                                                 */
/******************************************************************/
app.use('/api/auth',        auth_routes);
app.use('/api/usuarios',    usuario_routes);
app.use('/api/perfiles',    perfil_routes);
app.use('/api/libros',      libro_routes);
app.use('/api/busqueda',    busqueda_routes);
app.use('/api/pedidos',     pedido_routes);

/******************************************************************/
/* Error handlers                                                 */
/******************************************************************/
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, req, res, next) =>
{
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
    console.error('Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

/******************************************************************/
/* Server startup and database connectivity verification          */
/******************************************************************/
app.listen(PORT_NUMBER, () => console.log('Biblioteca Ducky en http://localhost:' + PORT_NUMBER));

pool.query("SELECT count(*) AS usuarios FROM usuarios", (db_error, db_result) =>
{
    if (db_error) console.log('Error al conectar a la BD (¿corriste npm run db:init?):', db_error.message);
    else          console.log('Conectado a la BD · usuarios registrados:', db_result.rows[0].usuarios);
});

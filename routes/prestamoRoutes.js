/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Rutas de consulta y autorización de préstamos.   */
/******************************************************************/

/******************************************************************/
/* Listing Contents: rutas /mios, /solicitudes y /autorizar.      */
/* Reuse Instructions: montar bajo /api/prestamos; middleware      */
/* verifica sesión y función antes del controlador.               */
/******************************************************************/

const express = require('express');
const router = express.Router();
const prestamo_controller = require('../controllers/prestamoController');
const { requiere_sesion, requiere_funcion } = require('../middleware/auth');

router.get('/mios', requiere_sesion, requiere_funcion('Buscar libros'), prestamo_controller.mios);
router.get('/solicitudes', requiere_sesion, requiere_funcion('Préstamos'), prestamo_controller.solicitudes);
router.post('/solicitudes/:id/autorizar', requiere_sesion, requiere_funcion('Préstamos'),
    prestamo_controller.autorizar);

module.exports = router;

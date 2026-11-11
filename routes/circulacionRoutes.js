/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: Rutas protegidas de circulación.                  */
/******************************************************************/

/******************************************************************/
/* Listing Contents: préstamo por ejemplar, renovar, devolver.    */
/* Reuse Instructions: montar bajo /api/circulacion.               */
/******************************************************************/

const express = require('express');
const router = express.Router();
const controller = require('../controllers/circulacionController');
const { requiere_sesion, requiere_funcion } = require('../middleware/auth');

router.use(requiere_sesion);
router.get('/ejemplar/:ejemplar', requiere_funcion('Devoluciones'), controller.buscar);
router.post('/renovaciones/validar', requiere_funcion('Préstamos'), controller.validar_renovacion);
router.post('/renovaciones', requiere_funcion('Préstamos'), controller.renovar);
router.post('/devoluciones/validar', requiere_funcion('Devoluciones'), controller.validar_devolucion);
router.post('/devoluciones', requiere_funcion('Devoluciones'), controller.devolver);
router.post('/perdidas/validar', requiere_funcion('Devoluciones'), controller.validar_perdida);
router.post('/perdidas', requiere_funcion('Devoluciones'), controller.confirmar_perdida);
router.get('/multas', requiere_funcion('Devoluciones'), controller.multas);
router.post('/multas/pagos', requiere_funcion('Devoluciones'), controller.pago);
router.post('/multas/avisos', requiere_funcion('Devoluciones'), controller.avisos);

module.exports = router;

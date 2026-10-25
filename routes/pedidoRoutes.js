/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Rutas de /api/pedidos.                            */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   GET /presupuestos -> presupuestos                            */
/*   GET / -> listar                                              */
/*   GET /:id -> detalle                                          */
/*   POST / -> crear                                              */
/*   PUT /:id/estatus -> estatus                                  */
/*   POST /:id/recepcion -> recibir                               */
/******************************************************************/

const express = require('express');
const router  = express.Router();
const pedido_controller = require('../controllers/pedidoController');
const { requiere_sesion, requiere_funcion } = require('../middleware/auth');

router.get('/presupuestos', requiere_sesion, requiere_funcion('Préstamos', 'Gestionar libros'), pedido_controller.presupuestos);
router.get('/', requiere_sesion, requiere_funcion('Préstamos', 'Gestionar libros'), pedido_controller.listar);
router.get('/:id', requiere_sesion, requiere_funcion('Préstamos', 'Gestionar libros'), pedido_controller.detalle);
router.post('/', requiere_sesion, requiere_funcion('Préstamos'), pedido_controller.crear);
router.put('/:id/estatus', requiere_sesion, requiere_funcion('Préstamos'), pedido_controller.estatus);
router.post('/:id/recepcion', requiere_sesion, requiere_funcion('Gestionar libros'), pedido_controller.recibir);

module.exports = router;

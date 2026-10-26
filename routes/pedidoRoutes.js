/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Rutas HTTP: asocia autorización y acciones del controlador. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   Dependencias, configuración y montaje del módulo. */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Montar el router en server.js bajo su prefijo /api. */
/* Sin consultas SQL ni lógica de negocio: delegar al controlador. */
/******************************************************************/

const express = require('express');
const router = express.Router();
const pedido_controller = require('../controllers/pedidoController');
const
{
    requiere_sesion,
    requiere_funcion
} = require('../middleware/auth');

router.get('/presupuestos', requiere_sesion, requiere_funcion('Solicitar compras', 'Autorizar compras', 'Gestionar libros'),
    pedido_controller.presupuestos);
router.get('/', requiere_sesion, requiere_funcion('Solicitar compras', 'Autorizar compras', 'Gestionar libros'), pedido_controller.listar);
router.get('/:id', requiere_sesion, requiere_funcion('Solicitar compras', 'Autorizar compras', 'Gestionar libros'), pedido_controller
    .detalle);
router.post('/', requiere_sesion, requiere_funcion('Solicitar compras'), pedido_controller.crear);
router.put('/:id/estatus', requiere_sesion, requiere_funcion('Autorizar compras'), pedido_controller.estatus);
router.post('/:id/recepcion', requiere_sesion, requiere_funcion('Gestionar libros'), pedido_controller
    .recibir);

module.exports = router;

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
const libro_controller = require('../controllers/libroController');
const
{
    requiere_sesion,
    requiere_funcion
} = require('../middleware/auth');

router.get('/catalogos', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller.catalogos);
router.post('/ubicaciones', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller
    .crear_ubicacion);
router.get('/', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller.listar);
router.get('/:id', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller.detalle);
router.post('/', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller.crear);
router.put('/:id', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller.actualizar);
router.post('/:id/alta', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller.activar);
router.post('/:id/retirar', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller.retirar);
router.post('/:id/ejemplares', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller
    .agregar_ejemplares);
router.put('/ejemplares/:id', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller
    .actualizar_ejemplar);
router.post('/ejemplares/:id/baja', requiere_sesion, requiere_funcion('Gestionar libros'), libro_controller
    .baja_ejemplar);

module.exports = router;

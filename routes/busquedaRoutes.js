/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Rutas de /api/busqueda.                           */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   GET /listado -> listado                                      */
/*   GET / -> buscar                                              */
/*   GET /:id -> ficha                                            */
/*   POST /:id/solicitud -> solicitar                             */
/******************************************************************/

const express = require('express');
const router  = express.Router();
const busqueda_controller = require('../controllers/busquedaController');
const { requiere_sesion, requiere_funcion } = require('../middleware/auth');

router.get('/listado', requiere_sesion, requiere_funcion('Buscar libros'), busqueda_controller.listado);
router.get('/', requiere_sesion, requiere_funcion('Buscar libros'), busqueda_controller.buscar);
router.get('/:id', requiere_sesion, requiere_funcion('Buscar libros'), busqueda_controller.ficha);
router.post('/:id/solicitud', requiere_sesion, requiere_funcion('Buscar libros'), busqueda_controller.solicitar);

module.exports = router;

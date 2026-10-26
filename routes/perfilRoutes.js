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
const perfil_controller = require('../controllers/perfilController');
const
{
    requiere_sesion,
    requiere_funcion
} = require('../middleware/auth');

router.get('/funciones', requiere_sesion, requiere_funcion('Gestionar perfiles'), perfil_controller
.funciones);
router.get('/', requiere_sesion, requiere_funcion('Gestionar perfiles'), perfil_controller.listar);
router.post('/', requiere_sesion, requiere_funcion('Gestionar perfiles'), perfil_controller.crear);
router.put('/:id', requiere_sesion, requiere_funcion('Gestionar perfiles'), perfil_controller.actualizar);
router.post('/:id/baja', requiere_sesion, requiere_funcion('Gestionar perfiles'), perfil_controller.dar_baja);
router.post('/:id/reactivar', requiere_sesion, requiere_funcion('Gestionar perfiles'), perfil_controller
    .reactivar);

module.exports = router;

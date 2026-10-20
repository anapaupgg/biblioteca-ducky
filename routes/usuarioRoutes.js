/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Routes of /api/usuarios (Gestión de usuarios)     */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   GET /catalogos -> catalogos                                  */
/*   GET /institucion/:clave -> institucion                       */
/*   GET / -> listar                                              */
/*   GET /:clave -> detalle                                       */
/*   POST / -> crear                                              */
/*   PUT /:clave/perfil -> cambiar_perfil                         */
/*   POST /:clave/baja -> dar_baja                                */
/*   POST /:clave/reactivar -> reactivar                          */
/******************************************************************/

const express = require('express');
const router  = express.Router();
const usuario_controller = require('../controllers/usuarioController');
const { requiere_sesion, requiere_funcion } = require('../middleware/auth');

router.get('/catalogos', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.catalogos);
router.get('/institucion/:clave', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.institucion);
router.get('/', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.listar);
router.get('/:clave', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.detalle);
router.post('/', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.crear);
router.put('/:clave/perfil', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.cambiar_perfil);
router.post('/:clave/baja', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.dar_baja);
router.post('/:clave/reactivar', requiere_sesion, requiere_funcion('Gestionar usuarios'), usuario_controller.reactivar);

module.exports = router;

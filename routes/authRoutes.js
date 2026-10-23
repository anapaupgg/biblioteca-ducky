/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Rutas de /api/auth.                               */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   POST /login -> login                                         */
/*   POST /recuperar -> recuperar                                 */
/*   POST /restablecer -> restablecer                             */
/*   GET /sesion -> sesion                                        */
/*   POST /logout -> logout                                       */
/*   POST /contrasena -> cambiar_contrasena                       */
/******************************************************************/

const express = require('express');
const router  = express.Router();
const auth_controller = require('../controllers/authController');
const { requiere_sesion, requiere_funcion } = require('../middleware/auth');

router.post('/login', auth_controller.login);
const limite_recuperacion = require('../middleware/limiteRecuperacion');

router.post('/recuperar', limite_recuperacion, auth_controller.recuperar);
router.post('/restablecer', limite_recuperacion, auth_controller.restablecer);
router.get('/sesion', requiere_sesion, auth_controller.sesion);
router.post('/logout', requiere_sesion, auth_controller.logout);
router.post('/contrasena', requiere_sesion, auth_controller.cambiar_contrasena);

module.exports = router;

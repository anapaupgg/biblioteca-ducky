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

const router = require('express').Router();
const
{
    requiere_sesion,
    requiere_funcion
} = require('../middleware/auth');
router.get('/', requiere_sesion, requiere_funcion('Chatbot'), require('../controllers/chatbotController')
    .consultar);
module.exports = router;

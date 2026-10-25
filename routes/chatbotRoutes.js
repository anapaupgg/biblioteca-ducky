const router = require('express').Router();
const { requiere_sesion, requiere_funcion } = require('../middleware/auth');
router.get('/', requiere_sesion, requiere_funcion('Chatbot'), require('../controllers/chatbotController').consultar);
module.exports = router;

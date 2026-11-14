/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   consultar(solicitud, respuesta) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Funciones HTTP(solicitud, respuesta): Request/Response de Express. */
/* Rutas protegidas requieren usuario y funciones cargados por middleware. */
/* Datos inválidos producen 4xx; fallos internos se gestionan sin secretos. */
/******************************************************************/

const modelo = require('../models/chatbotModel');
const
{
    responder_error,
    error_negocio
} = require('../utils/errores');
const chatbot_servicio = require('../services/chatbotService');
async function consultar(solicitud, respuesta)
{
    respuesta.set('Cache-Control', 'no-store');
    try
    {
        const texto = solicitud.query.q;
        if (texto !== undefined && (typeof texto !== 'string' || texto.trim().length < 3 || texto.length >
                300))
            throw new error_negocio(400, 'Escribe una pregunta de 3 a 300 caracteres.');
        if (texto !== undefined)
        {
            const sistema = chatbot_servicio.responder_sistema(texto, solicitud.usuario);
            if (sistema) return respuesta.json({ resultados: [sistema], mensaje: 'Respuesta del sistema:' });
            const intent = chatbot_servicio.intencion(texto);
            if (intent.tipo === 'personal') return respuesta.json(
            {
                resultados: [],
                mensaje: 'Todavía no puedo consultar tus préstamos personales. Consulta al personal de la biblioteca; para explorar el catálogo escribe «¿Qué libros hay?».'
            });
            if (intent.tipo === 'catalogo')
            {
                if (!solicitud.usuario?.funciones?.includes('Buscar libros')) throw new error_negocio(403,
                    'Tu perfil no tiene permiso para buscar libros.');
                const filas = await modelo.buscar_libros(intent.terminos, intent.disponibles);
                return respuesta.json(
                {
                    resultados: [],
                    libros: filas.slice(0, 5),
                    mensaje: filas.length ?
                        (filas.length > 5 ?
                            'Te muestro los primeros 5 resultados. Escribe un título, autor o tema para precisar la búsqueda.' :
                            'Estos son los resultados del catálogo:') +
                        ' La disponibilidad puede cambiar; no se ha reservado ningún ejemplar.' :
                        'No encontré libros con esos términos. Prueba con un título, autor o tema en Buscar libros.'
                });
            }
        }
        const lista = await modelo.listar();
        if (texto === undefined) return respuesta.json(
        {
            sugerencias: [
                ...chatbot_servicio.sugerencias_sistema().filter((sugerencia) =>
                    sugerencia.grupo === 'Sobre el sistema'),
                ...lista.map((
            {
                id_pregunta,
                pregunta
            }) => (
            {
                id_pregunta,
                pregunta,
                grupo: 'Uso de la biblioteca'
            })),
                ...chatbot_servicio.sugerencias_sistema().filter((sugerencia) =>
                    sugerencia.grupo === 'Uso de la biblioteca')]
        });
        const resultados = chatbot_servicio.buscar_faq(lista, texto);
        return respuesta.json(
        {
            resultados,
            mensaje: resultados.length ? 'Estas preguntas frecuentes podrían ayudarte:' :
                'No encontré una respuesta para eso. Puedo explicarte el objetivo, el alcance y las plataformas del sistema, o ayudarte con préstamos, multas, renovaciones y búsqueda. Elige una de las preguntas frecuentes.'
        });
    }
    catch (error)
    {
        responder_error(respuesta, error, 'chatbot.consultar');
    }
}
module.exports =
{
    consultar
};

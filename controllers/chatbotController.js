/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   consultar(solicitud, respuesta) */
/*   prestamos_personales(usuario) */
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
const claude_servicio = require('../services/claudeService');
const { responder_temas } = require('../services/chatbotContexto');
const prestamo_model = require('../models/prestamoModel');

async function prestamos_personales(usuario)
{
    if (!usuario?.funciones?.includes('Buscar libros') || !usuario.clave)
        throw new error_negocio(403, 'Tu perfil no tiene permiso para consultar tus préstamos.');

    const prestamos = await prestamo_model.mis_prestamos(usuario.clave);
    if (!prestamos.length) return { resultados: [], mensaje: 'No tienes préstamos activos.' };
    return {
        resultados: prestamos.map(({ titulo, id_ejemplar, fecha_vencimiento }) =>
        ({
            respuesta: titulo + ' · ' + id_ejemplar + ' · Fecha de devolución: ' + fecha_vencimiento,
            fuentes: ['Mis préstamos · Biblioteca Ducky']
        }))
    };
}

async function consultar(solicitud, respuesta)
{
    respuesta.set('Cache-Control', 'no-store');
    try
    {
        const es_pregunta = solicitud.method === 'POST';
        const texto = es_pregunta ? solicitud.body?.q : solicitud.query.q;
        if (es_pregunta && texto === undefined)
            throw new error_negocio(400, 'Escribe una pregunta de 3 a 300 caracteres.');
        if (texto !== undefined && (typeof texto !== 'string' || texto.trim().length < 3 || texto.length >
                300))
            throw new error_negocio(400, 'Escribe una pregunta de 3 a 300 caracteres.');
        if (texto !== undefined)
        {
            const sistema = chatbot_servicio.responder_sistema(texto, solicitud.usuario);
            if (sistema) return respuesta.json({ resultados: [sistema], mensaje: 'Respuesta del sistema:' });
            const intent = chatbot_servicio.intencion(texto);
            if (intent.tipo === 'personal')
                return respuesta.json(await prestamos_personales(solicitud.usuario));
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
        const consulta = chatbot_servicio.normalizar(texto);
        const temas = responder_temas(consulta);
        const predefinida = [...lista, ...temas].find(({ pregunta }) =>
            chatbot_servicio.normalizar(pregunta) === consulta);
        if (predefinida) return respuesta.json({ resultados: [predefinida] });
        const respuesta_claude = await claude_servicio.responder(texto, lista);
        if (respuesta_claude) return respuesta.json({ resultados: [{ respuesta: respuesta_claude }] });
        const frecuentes = chatbot_servicio.buscar_faq(lista, texto);
        const pregunta_regla = /\b(cuant[oa]s?|cuesta|limite|maximo|vigencia|duracion)\b|^renovaciones?$/.test(consulta);
        const resultados = temas.length && !(pregunta_regla && frecuentes.length) ? temas : frecuentes;
        return respuesta.json(
        {
            resultados,
            mensaje: resultados.length ? 'Estas respuestas podrían ayudarte:' :
                'No tengo información suficiente para responder. Cuéntame qué quieres hacer o pregunta por un título, tus préstamos, compras, certificación o alguna función de Biblioteca Ducky.'
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

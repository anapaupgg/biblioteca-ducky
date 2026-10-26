const modelo = require('../models/chatbotModel');
const { responder_error, ErrorNegocio } = require('../utils/errores');
const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
const ignorar = new Set('que cuanto cuanta cuantos cuantas como cual cuales el la los las un una de del al por para con en y o es se me mi puedo puede son tengo hola'.split(' '));
const sinonimos = { multas:'atraso', multa:'atraso', retraso:'atraso', costo:'paga', pagar:'paga', precio:'paga', duracion:'dura', dias:'dura', tiempo:'dura', prestamos:'prestamo', renovacion:'renovar', renovaciones:'renovar', renuevo:'renovar' };
const palabras = texto => [...new Set(normalizar(texto).split(/\s+/).filter(p=>p && !ignorar.has(p)).map(p=>sinonimos[p] || p))];
// Reglas explícitas: no inferir datos personales ni tratar cualquier pregunta como catálogo.
function intencion(texto) {
    const q = normalizar(texto).trim().replace(/\s+/g, ' ');
    if (/\b(mis prestamos|mis libros|tengo prestad[oa]s?|debo devolver|tengo que devolver)\b/.test(q) || /\bque libros tengo\b/.test(q)) return {tipo:'personal'};
    if (!/^(que libros|tienen\b|hay libros|busca\b|buscar\b|busco\b|libros\b|catalogo\b)/.test(q)) return {tipo:'faq'};
    const disponibles = /\bdisponibles\b/.test(q);
    const quitar = new Set('que libros libro tienen hay busca buscar busco catalogo disponibles de del sobre por el la los las un una en biblioteca favor'.split(' '));
    const terminos = q.split(' ').filter(t=>t && !quitar.has(t));
    return {tipo:'catalogo', terminos, disponibles};
}
async function consultar(req,res) {
    res.set('Cache-Control','no-store');
    try {
        const texto = req.query.q;
        if (texto !== undefined && (typeof texto !== 'string' || texto.trim().length < 3 || texto.length > 300))
            throw new ErrorNegocio(400,'Escribe una pregunta de 3 a 300 caracteres.');
        if (texto !== undefined) {
            const intent = intencion(texto);
            if (intent.tipo === 'personal') return res.json({resultados:[], mensaje:'Todavía no puedo consultar tus préstamos personales. Consulta al personal de la biblioteca; para explorar el catálogo escribe «¿Qué libros hay?».'});
            if (intent.tipo === 'catalogo') {
                if (!req.usuario?.funciones?.includes('Buscar libros')) throw new ErrorNegocio(403, 'Tu perfil no tiene permiso para buscar libros.');
                const filas = await modelo.buscarLibros(intent.terminos, intent.disponibles);
                return res.json({resultados:[], libros:filas.slice(0,5), mensaje: filas.length ?
                    (filas.length>5 ? 'Te muestro los primeros 5 resultados. Escribe un título, autor o tema para precisar la búsqueda.' : 'Estos son los resultados del catálogo:') + ' La disponibilidad puede cambiar; no se ha reservado ningún ejemplar.' :
                    'No encontré libros con esos términos. Prueba con un título, autor o tema en Buscar libros.'});
            }
        }
        const lista = await modelo.listar();
        if (texto === undefined) return res.json({ sugerencias: lista.map(({id_pregunta,pregunta})=>({id_pregunta,pregunta})) });
        const consulta = palabras(texto);
        // Se presentan coincidencias como FAQ, no como una respuesta generada a cualquier consulta.
        const resultados = lista.map(fila=>({fila,puntos:palabras(fila.pregunta).filter(p=>consulta.includes(p)).length}))
            .filter(r=>r.puntos>0).sort((a,b)=>b.puntos-a.puntos || a.fila.id_pregunta-b.fila.id_pregunta).slice(0,3).map(r=>r.fila);
        return res.json({ resultados, mensaje: resultados.length ? 'Estas preguntas frecuentes podrían ayudarte:' : 'No encontré una respuesta publicada para esa pregunta. Consulta al personal de la biblioteca.' });
    } catch(error) { responder_error(res,error,'chatbot.consultar'); }
}
module.exports = { consultar, normalizar, palabras, intencion };

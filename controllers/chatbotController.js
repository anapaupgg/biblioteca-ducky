const modelo = require('../models/chatbotModel');
const { responder_error, ErrorNegocio } = require('../utils/errores');
const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
const ignorar = new Set('que cuanto cuanta cuantos cuantas como cual cuales el la los las un una de del al por para con en y o es se me mi puedo puede son tengo hola'.split(' '));
const sinonimos = { multas:'atraso', multa:'atraso', retraso:'atraso', costo:'paga', pagar:'paga', precio:'paga', duracion:'dura', dias:'dura', tiempo:'dura', prestamos:'prestamo', renovacion:'renovar', renovaciones:'renovar', renuevo:'renovar' };
const palabras = texto => [...new Set(normalizar(texto).split(/\s+/).filter(p=>p && !ignorar.has(p)).map(p=>sinonimos[p] || p))];
async function consultar(req,res) {
    res.set('Cache-Control','no-store');
    try {
        const texto = req.query.q;
        if (texto !== undefined && (typeof texto !== 'string' || texto.trim().length < 3 || texto.length > 300))
            throw new ErrorNegocio(400,'Escribe una pregunta de 3 a 300 caracteres.');
        const lista = await modelo.listar();
        if (texto === undefined) return res.json({ sugerencias: lista.map(({id_pregunta,pregunta})=>({id_pregunta,pregunta})) });
        const consulta = palabras(texto);
        // Se presentan coincidencias como FAQ, no como una respuesta generada a cualquier consulta.
        const resultados = lista.map(fila=>({fila,puntos:palabras(fila.pregunta).filter(p=>consulta.includes(p)).length}))
            .filter(r=>r.puntos>0).sort((a,b)=>b.puntos-a.puntos || a.fila.id_pregunta-b.fila.id_pregunta).slice(0,3).map(r=>r.fila);
        return res.json({ resultados, mensaje: resultados.length ? 'Estas preguntas frecuentes podrían ayudarte:' : 'No encontré una respuesta publicada para esa pregunta. Consulta al personal de la biblioteca.' });
    } catch(error) { responder_error(res,error,'chatbot.consultar'); }
}
module.exports = { consultar, normalizar, palabras };

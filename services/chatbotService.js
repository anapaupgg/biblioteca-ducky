/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Reglas de consulta del asistente, independientes de HTTP y DOM. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   normalizar(texto) */
/*   palabras(texto) */
/*   intencion(texto) */
/*   buscar_faq(lista, texto) */
/*   sugerencias_sistema() */
/*   responder_sistema(texto, usuario) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* texto: string de 3 a 300 caracteres ya validado por controlador. */
/* lista: FAQ activas con fuentes; buscar_faq devuelve hasta 3 registros. */
/* intencion devuelve tipo y términos; el controlador consulta datos. */
/******************************************************************/

const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(
    /[^a-z0-9\s]/g, ' ');
const PALABRAS_IGNORADAS = new Set(
    'que cuanto cuanta cuantos cuantas como cual cuales el la los las un una de del al por para con en y o es se me mi puedo puede son tengo hola'
    .split(' '));
const PALABRAS_CATALOGO = new Set(
    ('que cual cuales cuanto cuantos cuantas libro libros ejemplar ejemplares tienen tiene hay ' +
    'alguno algun algunos alguna alguna busca buscar busco buscas catalogo acervo recomienda recomiendas recomendar recomendarias ' +
    'muestra muestrame dime sugieres sugerir encuentras encontrar podria puedo pueda disponible disponibles ' +
    'disponibilidad prestado prestados prestamo prestar prestan pedir sacar ' +
    'quiero necesito me mi por favor de del sobre para con el la los las un una ' +
    'en biblioteca hoy esta estan sean y o relacionado relacionados tema autor titulos titulo ' +
    'principiante principiantes empezar iniciarme introduccion cosas temas algo realmente')
    .split(' '));
const SINONIMOS =
{
    multas: 'atraso',
    multa: 'atraso',
    retraso: 'atraso',
    costo: 'paga',
    pagar: 'paga',
    precio: 'paga',
    duracion: 'dura',
    dias: 'dura',
    tiempo: 'dura',
    prestamos: 'prestamo',
    renovacion: 'renovar',
    renovaciones: 'renovar',
    renuevo: 'renovar'
};
const palabras = texto => [...new Set(normalizar(texto).split(/\s+/).filter(elemento => elemento && !
    PALABRAS_IGNORADAS.has(elemento)).map(elemento_2 => SINONIMOS[elemento_2] || elemento_2))];
// Reglas explícitas: no inferir datos personales ni tratar cualquier pregunta como catálogo.
function intencion(texto)
{
    const consulta_2 = normalizar(texto).trim().replace(/\s+/g, ' ');
    if (/\b(mis prestamos|mis libros|tengo prestad[oa]s?|debo devolver|tengo que devolver|me toca devolver|que\s+he\s+pedido\s+prestado|vence mi prestamo|vencimiento de mi prestamo)\b/.test(
        consulta_2) || /\bque libros tengo\b/.test(consulta_2)) return (
        {
        tipo: 'personal'
    });
    if (/\b(venta|ventas|venden|vender|certificacion|iso\s*9001|cuanto dura|cuantas veces|como encuentro|lista de espera|tramitar|registrar)\b/.test(consulta_2) ||
        !(/^(que libros|tienen\b|hay (?:un |una |algun |alguna )?(?:libros?|ejemplares?)|busca\b|buscar\b|busco\b|libros\b|catalogo\b)/.test(consulta_2) ||
        /\b(recomiendas|recomendarias|recomienda|sugieres|muestrame|quiero|necesito|hay|puedo (?:pedir|sacar)|disponibles?)\b/.test(consulta_2) &&
        /\b(libros?|titulos?|ejemplar(?:es)?|catalogo|acervo)\b/.test(consulta_2)))
        return (
        {
            tipo: 'faq'
        });
    const disponibles = /\b(disponibles?|prestados?|pedir|prestan)\b/.test(consulta_2);
    const terminos = consulta_2.split(' ').filter((palabra) => !PALABRAS_CATALOGO.has(palabra))
        .map((palabra) => ({ digitales: 'digital', fisicos: 'fisico', fisicas: 'fisico' }[palabra] || palabra));
    return (
    {
        tipo: 'catalogo',
        terminos,
        disponibles
    });
}

/* buscar_faq(lista, texto): FAQ publicadas y consulta string de 3–300 caracteres.
 * Retorna hasta tres coincidencias; no genera texto ni accede a cuentas. */
function buscar_faq(lista, texto)
{
    const consulta = palabras(texto);
    return lista.map(fila => (
        {
            fila,
            puntos: palabras(fila.pregunta).filter(palabra => consulta.includes(palabra)).length
        }))
        .filter(resultado => resultado.puntos > 0)
        .sort((primero, segundo) => segundo.puntos - primero.puntos || primero.fila.id_pregunta - segundo.fila
            .id_pregunta)
        .slice(0, 3).map(resultado => resultado.fila);
}
const PREGUNTAS_SISTEMA = [
    '¿Cuál es el objetivo del sistema?',
    '¿Qué incluye el sistema?',
    '¿En qué plataformas funciona?',
    '¿Qué puedo hacer según mi perfil?',
    '¿Cómo encuentro un libro?'
];
const sugerencias_sistema = () => PREGUNTAS_SISTEMA.map((pregunta) => ({
    pregunta,
    grupo: pregunta === '¿Cómo encuentro un libro?' ? 'Uso de la biblioteca' : 'Sobre el sistema'
}));

function responder_sistema(texto, usuario)
{
    const indice = PREGUNTAS_SISTEMA.findIndex((pregunta) => normalizar(pregunta) ===
        normalizar(texto));
    if (indice < 0) return null;
    const respuestas = [
        'Facilitar la consulta y circulación de libros, y administrar usuarios, catálogo y préstamos de la Biblioteca Ducky.',
        'Incluye usuarios y perfiles, fichas y catálogo, búsqueda, solicitudes de compra, préstamos, devoluciones, multas, lista de espera y este asistente.',
        'Es una aplicación web para navegadores de escritorio y móvil. Necesita conexión al servidor de la biblioteca.',
        'Tu perfil tiene estas funciones: ' + (usuario?.funciones?.join(', ') || 'consulta al personal de biblioteca') + '.',
        'Entra a Buscar libros y filtra por título, autor, tema, clave, ISBN o editorial. La ficha muestra el estante, la fila y cuántos ejemplares están disponibles.'
    ];
    return {
        pregunta: PREGUNTAS_SISTEMA[indice],
        respuesta: respuestas[indice],
        fuentes: ['Funciones de Biblioteca Ducky'],
        accion: indice === 4 ? 'buscar' : null
    };
}
module.exports =
{
    normalizar,
    palabras,
    intencion,
    buscar_faq,
    sugerencias_sistema,
    responder_sistema
};

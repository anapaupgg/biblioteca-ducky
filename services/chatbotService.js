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
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* texto: string de 3 a 300 caracteres ya validado por controlador. */
/* lista: FAQ activas con fuentes; buscar_faq devuelve hasta 3 registros. */
/* intencion devuelve tipo y términos; no obtiene préstamos personales. */
/******************************************************************/

const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(
    /[^a-z0-9\s]/g, ' ');
const PALABRAS_IGNORADAS = new Set(
    'que cuanto cuanta cuantos cuantas como cual cuales el la los las un una de del al por para con en y o es se me mi puedo puede son tengo hola'
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
    if (/\b(mis prestamos|mis libros|tengo prestad[oa]s?|debo devolver|tengo que devolver)\b/.test(
        consulta_2) || /\bque libros tengo\b/.test(consulta_2)) return (
        {
        tipo: 'personal'
    });
    if (!/^(que libros|tienen\b|hay libros|busca\b|buscar\b|busco\b|libros\b|catalogo\b)/.test(consulta_2))
        return (
        {
            tipo: 'faq'
        });
    const disponibles = /\bdisponibles\b/.test(consulta_2);
    const quitar = new Set(
        'que libros libro tienen hay busca buscar busco catalogo disponibles de del sobre por el la los las un una en biblioteca favor'
        .split(' '));
    const terminos = consulta_2.split(' ').filter(elemento_3 => elemento_3 && !quitar.has(elemento_3));
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
module.exports =
{
    normalizar,
    palabras,
    intencion,
    buscar_faq
};

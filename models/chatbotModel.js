/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo PostgreSQL: consultas y persistencia parametrizadas. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   listar(client = pool) */
/*   buscar_libros(terminos, disponibles, client = pool) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Entradas validadas por controlador; devuelve Promise de datos SQL. */
/* client: conexión pg de la transacción cuando la firma la requiere. */
/* No liberar ni confirmar un client recibido; propagar errores SQL. */
/******************************************************************/

// Solo preguntas activas con fuentes completas y vigentes.
const
{
    pool
} = require('../db');
async function listar(client = pool)
{
    const resultado = await client.query(`SELECT q.id_pregunta, q.pregunta, q.respuesta,
        array_agg(c.referencia || ' · versión ' || c.version ORDER BY c.id_contenido) AS fuentes
        FROM preguntas_chatbot q
        JOIN pregunta_contenido pc ON pc.id_pregunta=q.id_pregunta
        JOIN contenidos_chatbot c ON c.id_contenido=pc.id_contenido
        WHERE q.estatus='Activa'
        GROUP BY q.id_pregunta
        HAVING bool_and(c.estatus='Activo')
        ORDER BY q.id_pregunta`);
    return resultado.rows;
}
// Reutiliza la vista activa del buscador; parámetros literales, máximo seis filas.
async function buscar_libros(terminos, disponibles, client = pool)
{
    const resultado_2 = await client.query(`SELECT c.id_libro, c.titulo, c.autores, c.formato,
        c.disponibles_prestamo,
        (SELECT string_agg(DISTINCT concat_ws(' · ', u.seccion, u.estante, u.fila), ', ')
         FROM ejemplares x JOIN ubicaciones u USING (id_ubicacion)
         WHERE x.id_libro=c.id_libro AND x.estatus <> 'Baja') AS ubicaciones
        FROM v_catalogo c
        WHERE NOT EXISTS (SELECT 1 FROM unnest($1::text[]) t
          WHERE strpos(unaccent_lower(concat_ws(' ',c.titulo,c.autores,c.tema,c.id_libro,c.isbn,c.editorial)), t)=0)
          AND (NOT $2::boolean OR c.disponibles_prestamo > 0)
        ORDER BY c.titulo, c.id_libro LIMIT 6`, [terminos, disponibles]);
    return resultado_2.rows;
}
module.exports =
{
    listar,
    buscar_libros
};

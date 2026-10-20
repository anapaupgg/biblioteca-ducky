/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Model for "Buscar libros" (all profiles): search  */
/*              on the active catalog (view v_catalogo), public   */
/*              ficha with locations, loan requests, waiting list */
/*              and the reader's own movements.                   */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   buscar(filtros)               - Search active catalog        */
/*   ficha(id)                     - Public ficha + copies        */
/*   listado()                     - Printable list of books      */
/*   crear_solicitud(client, c, l) - INSERT solicitudes_prestamo  */
/*   solicitud_pendiente(c, l)     - Open request of a reader     */
/******************************************************************/

const { pool } = require('../db');

/******************************************************************/
/* Reuse Instructions                                             */
/* buscar({ titulo, autor, tema, clave, isbn, editorial })        */
/* Purpose: Combine one or several filters (AND). Only books      */
/*          "Activo en catálogo" are returned by v_catalogo.      */
/******************************************************************/
const buscar = (f) =>
    pool.query(
        `SELECT c.*, l.sinopsis, l.enlace_digital,
                (SELECT string_agg(DISTINCT coalesce(u.seccion || ' · ', '') || u.estante || ' / ' || u.fila, ', ')
                   FROM ejemplares x JOIN ubicaciones u USING (id_ubicacion)
                  WHERE x.id_libro = c.id_libro AND x.estatus <> 'Baja') AS ubicaciones,
                (SELECT count(*) FROM ejemplares x WHERE x.id_libro = c.id_libro AND x.estatus = 'Prestado')::int AS prestados,
                (SELECT count(*) FROM lista_espera w WHERE w.id_libro = c.id_libro AND w.estatus = 'En espera')::int AS en_espera
           FROM v_catalogo c JOIN libros l USING (id_libro)
          WHERE ($1::text IS NULL OR unaccent_lower(c.titulo) LIKE '%' || unaccent_lower($1) || '%')
            AND ($2::text IS NULL OR unaccent_lower(c.autores) LIKE '%' || unaccent_lower($2) || '%')
            AND ($3::text IS NULL OR unaccent_lower(c.tema) LIKE '%' || unaccent_lower($3) || '%')
            AND ($4::text IS NULL OR c.id_libro ILIKE '%' || $4 || '%')
            AND ($5::text IS NULL OR c.isbn LIKE '%' || $5 || '%')
            AND ($6::text IS NULL OR unaccent_lower(c.editorial) LIKE '%' || unaccent_lower($6) || '%')
          ORDER BY c.titulo`,
        [f.titulo || null, f.autor || null, f.tema || null, f.clave || null, f.isbn || null, f.editorial || null]);

/******************************************************************/
/* Reuse Instructions                                             */
/* ficha(id)                                                      */
/* Returns: { libro, ejemplares[] } of an active book or null     */
/******************************************************************/
const ficha = async (id) =>
{
    const libro = await pool.query(
        `SELECT c.*, l.sinopsis, l.enlace_digital, l.edicion, l.paginas
           FROM v_catalogo c JOIN libros l USING (id_libro) WHERE c.id_libro = $1`, [id]);
    if (libro.rows.length === 0) return null;
    const ejemplares = await pool.query(
        `SELECT x.id_ejemplar, x.tipo_uso, x.condicion, x.estatus,
                coalesce(u.seccion || ' · ', '') || u.estante || ' / ' || u.fila AS ubicacion,
                (SELECT p.fecha_vencimiento FROM prestamos p WHERE p.id_ejemplar = x.id_ejemplar AND p.estatus = 'Activo') AS disponible_desde
           FROM ejemplares x LEFT JOIN ubicaciones u USING (id_ubicacion)
          WHERE x.id_libro = $1 AND x.estatus <> 'Baja' ORDER BY x.id_ejemplar`, [id]);
    return { libro: libro.rows[0], ejemplares: ejemplares.rows };
};

const listado = () =>
    pool.query(
        `SELECT id_libro, titulo, autores, editorial, tema, formato, anio_publicacion, ejemplares, disponibles_total
           FROM v_catalogo ORDER BY titulo`);

const crear_solicitud = async (client, clave, id_libro) =>
{
    const r = await client.query(
        `INSERT INTO solicitudes_prestamo (clave_usuario, id_libro) VALUES ($1, $2)
         RETURNING id_solicitud_prestamo AS folio, fecha_solicitud`, [clave, id_libro]);
    return r.rows[0];
};

const solicitud_pendiente = async (clave, id_libro) =>
{
    const r = await pool.query(
        `SELECT id_solicitud_prestamo AS folio FROM solicitudes_prestamo
          WHERE clave_usuario = $1 AND id_libro = $2 AND estatus = 'Pendiente'`, [clave, id_libro]);
    return r.rows[0] || null;
};

module.exports = { buscar, ficha, listado, crear_solicitud, solicitud_pendiente };

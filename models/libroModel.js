/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Consultas de libros y ejemplares.                 */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   listar(filtros)                  - Management list           */
/*   buscar(id)                       - Ficha + autores + ejemplares*/
/*   existe_isbn(isbn, excepto)       - Duplicate ISBN check      */
/*   siguiente_clave(client)          - Next L000000 key          */
/*   id_por_nombre(client, tabla, n)  - Find-or-create catalogs   */
/*   crear(client, datos)             - INSERT libro + autores    */
/*   actualizar(client, id, datos)    - UPDATE libro + autores    */
/*   cambiar_estatus(client, id, e)   - Ficha creada/Activo/Retirado*/
/*   agregar_ejemplares(client, d)    - INSERT N ejemplares       */
/*   actualizar_ejemplar(client, d)   - Condición/uso/ubicación   */
/*   baja_ejemplar(client, d)         - INSERT bajas_ejemplar     */
/*   catalogos()                      - Lists for the forms       */
/*   crear_ubicacion(client, d)       - INSERT ubicacion          */
/******************************************************************/

const { pool } = require('../db');

/******************************************************************/
/* Reuse Instructions                                             */
/* listar({ q, estatus })                                         */
/* Purpose: Books of the management screen with counts of copies  */
/******************************************************************/
const listar = ({ q, estatus } = {}) =>
    pool.query(
        `SELECT l.id_libro, l.titulo, l.isbn, l.formato, l.estatus, e.nombre AS editorial, t.nombre AS tema,
                (SELECT string_agg(a.nombre, ', ' ORDER BY la.es_principal DESC, a.nombre)
                   FROM libro_autor la JOIN autores a USING (id_autor) WHERE la.id_libro = l.id_libro) AS autores,
                count(x.id_ejemplar) FILTER (WHERE x.estatus <> 'Baja')::int        AS ejemplares,
                count(x.id_ejemplar) FILTER (WHERE x.estatus = 'Disponible')::int   AS disponibles,
                count(x.id_ejemplar) FILTER (WHERE x.estatus = 'Prestado')::int     AS prestados
           FROM libros l
           JOIN editoriales e ON e.id_editorial = l.id_editorial
           JOIN temas t       ON t.id_tema = l.id_tema
           LEFT JOIN ejemplares x ON x.id_libro = l.id_libro
          WHERE ($1::text IS NULL OR l.titulo ILIKE '%' || $1 || '%' OR l.id_libro ILIKE '%' || $1 || '%' OR l.isbn LIKE '%' || $1 || '%')
            AND ($2::text IS NULL OR l.estatus = $2)
          GROUP BY l.id_libro, e.nombre, t.nombre
          ORDER BY l.id_libro`,
        [q || null, estatus || null]);

/******************************************************************/
/* Reuse Instructions                                             */
/* buscar(id)                                                     */
/* Returns: { libro, autores[], ejemplares[] } or null            */
/******************************************************************/
const buscar = async (id) =>
{
    const libro = await pool.query(
        `SELECT l.*, e.nombre AS editorial, t.nombre AS tema
           FROM libros l JOIN editoriales e USING (id_editorial) JOIN temas t USING (id_tema)
          WHERE l.id_libro = $1`, [id]);
    if (libro.rows.length === 0) return null;

    const [autores, ejemplares] = await Promise.all(
    [
        pool.query(
            `SELECT a.id_autor AS id, a.nombre, la.es_principal FROM libro_autor la JOIN autores a USING (id_autor)
              WHERE la.id_libro = $1 ORDER BY la.es_principal DESC, a.nombre`, [id]),
        pool.query(
            `SELECT x.id_ejemplar, x.tipo_uso, x.condicion, x.estatus, x.fecha_ingreso, x.id_ubicacion,
                    u.seccion, u.estante, u.fila,
                    (SELECT p.clave_usuario FROM prestamos p WHERE p.id_ejemplar = x.id_ejemplar AND p.estatus = 'Activo') AS prestado_a,
                    (SELECT p.fecha_vencimiento FROM prestamos p WHERE p.id_ejemplar = x.id_ejemplar AND p.estatus = 'Activo') AS vence
               FROM ejemplares x LEFT JOIN ubicaciones u USING (id_ubicacion)
              WHERE x.id_libro = $1 ORDER BY x.id_ejemplar`, [id])
    ]);

    return { libro: libro.rows[0], autores: autores.rows, ejemplares: ejemplares.rows };
};

const existe_isbn = async (isbn, excepto) =>
{
    const r = await pool.query('SELECT id_libro FROM libros WHERE isbn = $1 AND id_libro <> coalesce($2, \'\')', [isbn, excepto || null]);
    return r.rows[0] ? r.rows[0].id_libro : null;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* siguiente_clave(client)                                        */
/* Purpose: Next book key in the format L000000                   */
/******************************************************************/
const siguiente_clave = async (client) =>
{
    const r = await client.query(
        `SELECT 'L' || lpad((coalesce(max(substr(id_libro, 2)::int), 0) + 1)::text, 6, '0') AS clave FROM libros`);
    return r.rows[0].clave;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* id_por_nombre(client, tabla, nombre)                           */
/* Purpose: Return the id of an editorial / tema / autor by name, */
/*          creating it when it does not exist (catalog tables    */
/*          avoid repeating names in LIBROS - 3FN).               */
/******************************************************************/
const TABLAS_CATALOGO =
{
    editoriales: 'id_editorial',
    temas:       'id_tema',
    autores:     'id_autor'
};
const id_por_nombre = async (client, tabla, nombre) =>
{
    const columna = TABLAS_CATALOGO[tabla];
    const limpio = String(nombre).trim().replace(/\s+/g, ' ');
    const r = await client.query(`SELECT ${columna} AS id FROM ${tabla} WHERE lower(nombre) = lower($1) LIMIT 1`, [limpio]);
    if (r.rows.length > 0) return r.rows[0].id;
    const nuevo = await client.query(`INSERT INTO ${tabla} (nombre) VALUES ($1) RETURNING ${columna} AS id`, [limpio]);
    return nuevo.rows[0].id;
};

/* Replace the authors of a book; the first one is the main one   */
const guardar_autores = async (client, id_libro, autores) =>
{
    await client.query('DELETE FROM libro_autor WHERE id_libro = $1', [id_libro]);
    const vistos = new Set();
    for (const [indice, nombre] of autores.entries())
    {
        const id_autor = await id_por_nombre(client, 'autores', nombre);
        if (vistos.has(id_autor)) continue;
        vistos.add(id_autor);
        await client.query('INSERT INTO libro_autor (id_libro, id_autor, es_principal) VALUES ($1, $2, $3)',
            [id_libro, id_autor, indice === 0]);
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(client, datos)                                           */
/* Purpose: Insert the ficha (estatus "Ficha creada") with its    */
/*          editorial, tema and authors.                          */
/* Returns: the new id_libro                                      */
/******************************************************************/
const crear = async (client, datos) =>
{
    const id_libro = datos.id_libro || await siguiente_clave(client);
    const id_editorial = await id_por_nombre(client, 'editoriales', datos.editorial);
    const id_tema = await id_por_nombre(client, 'temas', datos.tema);

    await client.query(
        `INSERT INTO libros (id_libro, titulo, isbn, id_editorial, id_tema, edicion, anio_publicacion, paginas,
                             sinopsis, formato, enlace_digital, precio_ultima_compra_usd)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [id_libro, datos.titulo, datos.isbn, id_editorial, id_tema, datos.edicion, datos.anio_publicacion,
         datos.paginas, datos.sinopsis, datos.formato, datos.enlace_digital, datos.precio_ultima_compra_usd]);

    await guardar_autores(client, id_libro, datos.autores);
    return id_libro;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar(client, id, datos)                                  */
/* Purpose: Modify the ficha (ISBN and key cannot change)         */
/******************************************************************/
const actualizar = async (client, id, datos) =>
{
    const id_editorial = await id_por_nombre(client, 'editoriales', datos.editorial);
    const id_tema = await id_por_nombre(client, 'temas', datos.tema);
    await client.query(
        `UPDATE libros SET titulo = $2, id_editorial = $3, id_tema = $4, edicion = $5, anio_publicacion = $6,
                paginas = $7, sinopsis = $8, enlace_digital = $9, precio_ultima_compra_usd = $10
          WHERE id_libro = $1`,
        [id, datos.titulo, id_editorial, id_tema, datos.edicion, datos.anio_publicacion, datos.paginas,
         datos.sinopsis, datos.enlace_digital, datos.precio_ultima_compra_usd]);
    await guardar_autores(client, id, datos.autores);
};

/******************************************************************/
/* Reuse Instructions                                             */
/* cambiar_estatus(client, id, estatus)                           */
/* Purpose: "Activo en catálogo" sets the alta date; "Retirado"   */
/*          is a logical baja that keeps the history.             */
/******************************************************************/
const cambiar_estatus = (client, id, estatus) =>
    client.query(
        `UPDATE libros SET estatus = $2::varchar,
                fecha_alta_catalogo = CASE WHEN $2::varchar = 'Activo en catálogo' THEN coalesce(fecha_alta_catalogo, CURRENT_DATE)
                                           ELSE fecha_alta_catalogo END
          WHERE id_libro = $1`, [id, estatus]);

/******************************************************************/
/* Reuse Instructions                                             */
/* agregar_ejemplares(client, { id_libro, cantidad, id_ubicacion, */
/*                              tipo_uso, condicion, digital })   */
/* Purpose: Label N new copies: L000128-03, L000128-04...         */
/*          Digital books get L000132-D2...                       */
/* Returns: array with the new ids                                */
/******************************************************************/
const agregar_ejemplares = async (client, datos) =>
{
    await client.query('SELECT id_libro FROM libros WHERE id_libro = $1 FOR UPDATE', [datos.id_libro]);
    const prefijo = datos.id_libro + (datos.digital ? '-D' : '-');
    const r = await client.query(
        `SELECT coalesce(max(substr(id_ejemplar, $2)::int), 0) AS ultimo FROM ejemplares
          WHERE id_libro = $1 AND id_ejemplar LIKE $3 AND substr(id_ejemplar, $2) ~ '^[0-9]+$'`,
        [datos.id_libro, prefijo.length + 1, prefijo + '%']);
    const nuevos = [];
    for (let i = 1; i <= datos.cantidad; i++)
    {
        const numero = r.rows[0].ultimo + i;
        const id = prefijo + (datos.digital ? String(numero) : String(numero).padStart(2, '0'));
        await client.query(
            `INSERT INTO ejemplares (id_ejemplar, id_libro, id_ubicacion, tipo_uso, condicion)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, datos.id_libro, datos.digital ? null : datos.id_ubicacion, datos.tipo_uso, datos.condicion || 'Bueno']);
        nuevos.push(id);
    }
    return nuevos;
};

const actualizar_ejemplar = (client, datos) =>
    client.query(
        `UPDATE ejemplares SET condicion = coalesce($2, condicion), tipo_uso = coalesce($3, tipo_uso),
                id_ubicacion = coalesce($4, id_ubicacion)
          WHERE id_ejemplar = $1`,
        [datos.id_ejemplar, datos.condicion || null, datos.tipo_uso || null, datos.id_ubicacion || null]);

const baja_ejemplar = (client, datos) =>
    client.query(
        `INSERT INTO bajas_ejemplar (id_ejemplar, id_motivo, descripcion, clave_administrador)
         VALUES ($1, $2, nullif(btrim($3), ''), $4)`,
        [datos.id_ejemplar, datos.id_motivo, datos.descripcion || '', datos.admin]);

const buscar_ejemplar = (id) =>
    pool.query(
        `SELECT x.*, l.titulo, l.formato FROM ejemplares x JOIN libros l USING (id_libro) WHERE x.id_ejemplar = $1`, [id]);

/******************************************************************/
/* Reuse Instructions                                             */
/* catalogos()                                                    */
/* Purpose: editoriales, temas, autores, ubicaciones and copy     */
/*          baja reasons for datalists and selects.               */
/******************************************************************/
const catalogos = async () =>
{
    const [editoriales, temas, autores, ubicaciones, motivos] = await Promise.all(
    [
        pool.query('SELECT id_editorial AS id, nombre FROM editoriales ORDER BY nombre'),
        pool.query('SELECT id_tema AS id, nombre FROM temas ORDER BY nombre'),
        pool.query('SELECT id_autor AS id, nombre FROM autores ORDER BY nombre'),
        pool.query(`SELECT id_ubicacion AS id, seccion, estante, fila,
                           coalesce(seccion || ' · ', '') || estante || ' / ' || fila AS etiqueta
                      FROM ubicaciones ORDER BY seccion, estante, fila`),
        pool.query(`SELECT id_motivo AS id, descripcion FROM motivos_baja WHERE aplica_a = 'Ejemplar' ORDER BY id_motivo`)
    ]);
    return {
        editoriales: editoriales.rows, temas: temas.rows, autores: autores.rows,
        ubicaciones: ubicaciones.rows, motivos: motivos.rows
    };
};

const crear_ubicacion = async (client, datos) =>
{
    const r = await client.query(
        'INSERT INTO ubicaciones (seccion, estante, fila) VALUES (nullif($1, \'\'), $2, $3) RETURNING id_ubicacion AS id',
        [datos.seccion || '', datos.estante, datos.fila]);
    return r.rows[0].id;
};

module.exports =
{
    listar, buscar, existe_isbn, siguiente_clave, id_por_nombre, crear, actualizar, cambiar_estatus,
    agregar_ejemplares, actualizar_ejemplar, baja_ejemplar, buscar_ejemplar, catalogos, crear_ubicacion
};

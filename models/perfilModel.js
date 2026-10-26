/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo PostgreSQL: consultas y persistencia parametrizadas. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   listar() */
/*   buscar(id) */
/*   funciones() */
/*   crear(client, datos) */
/*   actualizar(client, id, datos) */
/*   dar_baja(client, id, admin) */
/*   reactivar(client, id) */
/*   nivel(lista) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Entradas validadas por controlador; devuelve Promise de datos SQL. */
/* client: conexión pg de la transacción cuando la firma la requiere. */
/* No liberar ni confirmar un client recibido; propagar errores SQL. */
/******************************************************************/

const
{
    pool
} = require('../db');

const SELECT_PERFIL =
    `SELECT p.id_perfil AS id, p.nombre, p.descripcion, p.estatus, p.fecha_alta, p.fecha_baja,
            a.nombre AS admin_alta,
            coalesce(array_agg(f.nombre ORDER BY f.id_funcion) FILTER (WHERE f.nombre IS NOT NULL), '{}') AS funciones,
            coalesce(array_agg(f.id_funcion ORDER BY f.id_funcion) FILTER (WHERE f.id_funcion IS NOT NULL), '{}') AS ids_funciones,
            (SELECT count(*) FROM usuarios u WHERE u.id_perfil = p.id_perfil AND u.estatus = 'Activo')::int AS usuarios
       FROM perfiles p
       LEFT JOIN usuarios a        ON a.clave_usuario = p.clave_admin_alta
       LEFT JOIN perfil_funcion pf ON pf.id_perfil = p.id_perfil
       LEFT JOIN funciones f       ON f.id_funcion = pf.id_funcion`;

const listar = () => pool.query(SELECT_PERFIL +
    ' GROUP BY p.id_perfil, a.nombre ORDER BY p.estatus, p.id_perfil');

const buscar = (id) => pool.query(SELECT_PERFIL + ' WHERE p.id_perfil = $1 GROUP BY p.id_perfil, a.nombre', [
    id
]);

const funciones = () => pool.query(
    'SELECT id_funcion AS id, nombre, descripcion FROM funciones ORDER BY id_funcion');

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(client, { nombre, descripcion, funciones[], admin })     */
/* Returns: id of the new profile                                 */
/******************************************************************/
const crear = async (client, datos) =>
{
    const resultado = await client.query(
        `INSERT INTO perfiles (nombre, descripcion, clave_admin_alta) VALUES ($1, nullif($2, ''), $3)
         RETURNING id_perfil`,
        [datos.nombre, datos.descripcion || '', datos.admin]);
    const id = resultado.rows[0].id_perfil;
    await client.query(
        'INSERT INTO perfil_funcion (id_perfil, id_funcion) SELECT $1, unnest($2::int[])',
        [id, datos.funciones]);
    return id;
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar(client, id, { descripcion, funciones[] })           */
/* Purpose: Replace the authorized functions of a profile         */
/******************************************************************/
const actualizar = async (client, id, datos) =>
{
    await client.query('UPDATE perfiles SET descripcion = nullif($2, \'\') WHERE id_perfil = $1', [id,
        datos.descripcion || ''
    ]);
    await client.query('DELETE FROM perfil_funcion WHERE id_perfil = $1', [id]);
    await client.query(
        'INSERT INTO perfil_funcion (id_perfil, id_funcion) SELECT $1, unnest($2::int[])', [id,
            datos.funciones
        ]);
};

/******************************************************************/
/* Reuse Instructions                                             */
/* dar_baja(client, id, admin)                                    */
/* Purpose: Deactivate the profile. The trigger refuses it while  */
/*          it still has active users.                            */
/******************************************************************/
const dar_baja = (client, id, admin) =>
    client.query(
        `UPDATE perfiles SET estatus = 'Inactivo', fecha_baja = CURRENT_DATE, clave_admin_baja = $2
          WHERE id_perfil = $1`, [id, admin]);

const reactivar = (client, id) =>
    client.query(
        `UPDATE perfiles SET estatus = 'Activo', fecha_baja = NULL, clave_admin_baja = NULL WHERE id_perfil = $1`,
        [id]);

/******************************************************************/
/* Reuse Instructions                                             */
/* nivel(funciones)                                               */
/* Purpose: Hierarchy used for "no puede asignar un perfil        */
/*          superior": 3 = system admin (Gestionar perfiles),     */
/*          2 = staff (any management/circulation function),      */
/*          1 = reader.                                           */
/******************************************************************/
const FUNCIONES_PERSONAL = ['Gestionar usuarios', 'Gestionar libros', 'Préstamos', 'Devoluciones'];
const nivel = (lista) =>
{
    const nombres = lista || [];
    if (nombres.includes('Gestionar perfiles')) return 3;
    if (nombres.some((filtro) => FUNCIONES_PERSONAL.includes(filtro))) return 2;
    return 1;
};

module.exports =
{
    listar,
    buscar,
    funciones,
    crear,
    actualizar,
    dar_baja,
    reactivar,
    nivel
};

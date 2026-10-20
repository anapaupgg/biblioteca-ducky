/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller for "Gestionar libros" (Administrador  */
/*              del catálogo). Ficha bibliográfica, labeling of   */
/*              copies, alta en catálogo, modification, change of */
/*              condition/use, baja of copies and retirement of   */
/*              the ficha.                                        */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   listar(req, res)              - GET  /api/libros             */
/*   detalle(req, res)             - GET  /api/libros/:id         */
/*   catalogos(req, res)           - GET  /api/libros/catalogos   */
/*   crear(req, res)               - POST /api/libros             */
/*   actualizar(req, res)          - PUT  /api/libros/:id         */
/*   activar(req, res)             - POST /api/libros/:id/alta    */
/*   retirar(req, res)             - POST /api/libros/:id/retirar */
/*   agregar_ejemplares(req, res)  - POST /api/libros/:id/ejemplares*/
/*   actualizar_ejemplar(req, res) - PUT  /api/ejemplares/:id     */
/*   baja_ejemplar(req, res)       - POST /api/ejemplares/:id/baja*/
/*   crear_ubicacion(req, res)     - POST /api/libros/ubicaciones */
/******************************************************************/

const { con_usuario } = require('../db');
const libro_model     = require('../models/libroModel');
const { responder_error, ErrorNegocio } = require('../utils/errores');
const { faltantes, es_isbn, entero_positivo } = require('../utils/validators');

const CAMPOS_FICHA  = ['titulo', 'isbn', 'editorial', 'tema', 'autores', 'formato'];
const TIPOS_USO     = ['Préstamo externo', 'Préstamo en sala', 'Reservado'];
const CONDICIONES   = ['Bueno', 'Regular', 'Dañado'];

/******************************************************************/
/* Reuse Instructions                                             */
/* leer_ficha(body, modo)                                         */
/* Purpose: Validate and normalize the ficha payload. Authors may */
/*          come as an array or as a comma separated text.        */
/* Throws : ErrorNegocio 400 "Completa los datos obligatorios"    */
/******************************************************************/
const leer_ficha = (body, modo) =>
{
    const autores = (Array.isArray(body.autores) ? body.autores : String(body.autores || '').split(','))
        .map((a) => String(a).trim()).filter(Boolean);
    const datos = { ...body, autores, isbn: String(body.isbn || '').replace(/[-\s]/g, '') };

    const requeridos = modo === 'crear' ? CAMPOS_FICHA : CAMPOS_FICHA.filter((c) => c !== 'isbn' && c !== 'formato');
    const vacios = faltantes(datos, requeridos);
    if (vacios.length > 0) throw new ErrorNegocio(400, 'Completa los datos obligatorios', vacios);
    if (modo === 'crear' && !es_isbn(datos.isbn)) throw new ErrorNegocio(400, 'El ISBN debe tener 10 o 13 dígitos', ['isbn']);
    if (datos.formato === 'Digital' && !String(datos.enlace_digital || '').trim())
    {
        throw new ErrorNegocio(400, 'Un libro digital necesita su enlace de consulta', ['enlace_digital']);
    }

    const numero = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : Number(v));
    return {
        titulo: String(datos.titulo).trim(), isbn: datos.isbn, editorial: datos.editorial, tema: datos.tema,
        autores, formato: datos.formato, edicion: String(datos.edicion || '').trim() || null,
        anio_publicacion: numero(datos.anio_publicacion), paginas: numero(datos.paginas),
        sinopsis: String(datos.sinopsis || '').trim() || null,
        enlace_digital: datos.formato === 'Digital' || datos.enlace_digital ? (String(datos.enlace_digital || '').trim() || null) : null,
        precio_ultima_compra_usd: numero(datos.precio_ultima_compra_usd)
    };
};

/* Load a book or answer 404                                      */
const obtener = async (id) =>
{
    const ficha = await libro_model.buscar(id);
    if (!ficha) throw new ErrorNegocio(404, 'Libro no encontrado');
    return ficha;
};

const listar = async (req, res) =>
{
    try { res.status(200).json((await libro_model.listar({ q: req.query.q, estatus: req.query.estatus })).rows); }
    catch (error) { responder_error(res, error, 'libros.listar'); }
};

const detalle = async (req, res) =>
{
    try { res.status(200).json(await obtener(req.params.id)); }
    catch (error) { responder_error(res, error, 'libros.detalle'); }
};

const catalogos = async (req, res) =>
{
    try { res.status(200).json(await libro_model.catalogos()); }
    catch (error) { responder_error(res, error, 'libros.catalogos'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Register a ficha. Optionally labels { copias } copies */
/*          at { id_ubicacion } in the same transaction.          */
/* Returns: 201 { id_libro, ejemplares[] }  409 La ficha ya existe*/
/******************************************************************/
const crear = async (req, res) =>
{
    try
    {
        const datos = leer_ficha(req.body, 'crear');
        const duplicado = await libro_model.existe_isbn(datos.isbn);
        if (duplicado) throw new ErrorNegocio(409, 'La ficha ya existe: el ISBN pertenece al libro ' + duplicado, ['isbn']);

        const copias = Number(req.body.copias || 0);
        if (copias > 0 && datos.formato === 'Físico' && !req.body.id_ubicacion)
        {
            throw new ErrorNegocio(400, 'Elige la ubicación de los ejemplares', ['id_ubicacion']);
        }

        const resultado = await con_usuario(req.usuario.clave, async (client) =>
        {
            const id_libro = await libro_model.crear(client, datos);
            const ejemplares = copias > 0
                ? await libro_model.agregar_ejemplares(client,
                    {
                        id_libro, cantidad: copias, id_ubicacion: Number(req.body.id_ubicacion) || null,
                        digital: datos.formato === 'Digital',
                        tipo_uso: datos.formato === 'Digital' ? 'Préstamo digital' : (req.body.tipo_uso || 'Préstamo externo')
                    })
                : [];
            return { id_libro, ejemplares };
        });

        res.status(201).json({ mensaje: 'Ficha bibliográfica creada', ...resultado });
    }
    catch (error) { responder_error(res, error, 'libros.crear'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar(req, res)                                           */
/* Purpose: Modify a ficha that is not retired                    */
/******************************************************************/
const actualizar = async (req, res) =>
{
    try
    {
        const ficha = await obtener(req.params.id);
        if (ficha.libro.estatus === 'Retirado') throw new ErrorNegocio(422, 'El libro está retirado y no se puede modificar');
        const datos = leer_ficha({ ...req.body, formato: ficha.libro.formato }, 'actualizar');

        await con_usuario(req.usuario.clave, (client) => libro_model.actualizar(client, ficha.libro.id_libro, datos));
        res.status(200).json({ mensaje: 'Libro modificado exitosamente', ...(await obtener(ficha.libro.id_libro)) });
    }
    catch (error) { responder_error(res, error, 'libros.actualizar'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* activar(req, res)                                              */
/* Purpose: "Dar de alta en catálogo". Requires at least one      */
/*          author and one labeled copy.                          */
/******************************************************************/
const activar = async (req, res) =>
{
    try
    {
        const ficha = await obtener(req.params.id);
        if (ficha.libro.estatus === 'Activo en catálogo') throw new ErrorNegocio(422, 'El libro ya está activo en el catálogo');
        if (ficha.autores.length === 0) throw new ErrorNegocio(422, 'La ficha necesita al menos un autor');
        if (!ficha.ejemplares.some((e) => e.estatus !== 'Baja'))
        {
            throw new ErrorNegocio(422, 'Etiqueta al menos un ejemplar antes de darlo de alta en el catálogo');
        }

        await con_usuario(req.usuario.clave, (client) => libro_model.cambiar_estatus(client, ficha.libro.id_libro, 'Activo en catálogo'));
        res.status(200).json({ mensaje: 'Libro dado de alta en catálogo', ...(await obtener(ficha.libro.id_libro)) });
    }
    catch (error) { responder_error(res, error, 'libros.activar'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* retirar(req, res)                                              */
/* Purpose: "Dar de baja un libro" (logical, keeps history).      */
/*          Refused while a copy is on loan.                      */
/******************************************************************/
const retirar = async (req, res) =>
{
    try
    {
        const ficha = await obtener(req.params.id);
        if (ficha.libro.estatus === 'Retirado') throw new ErrorNegocio(422, 'El libro ya está retirado');
        const prestados = ficha.ejemplares.filter((e) => e.estatus === 'Prestado').length;
        if (prestados > 0) throw new ErrorNegocio(422, 'No se puede retirar: hay ' + prestados + ' ejemplar(es) prestados');

        await con_usuario(req.usuario.clave, (client) => libro_model.cambiar_estatus(client, ficha.libro.id_libro, 'Retirado'));
        res.status(200).json({ mensaje: 'Libro dado de baja del catálogo', ...(await obtener(ficha.libro.id_libro)) });
    }
    catch (error) { responder_error(res, error, 'libros.retirar'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* agregar_ejemplares(req, res)                                   */
/* Purpose: Label { cantidad } new copies { id_ubicacion,         */
/*          tipo_uso, condicion }                                 */
/******************************************************************/
const agregar_ejemplares = async (req, res) =>
{
    try
    {
        const ficha = await obtener(req.params.id);
        const digital = ficha.libro.formato === 'Digital';
        if (!entero_positivo(req.body.cantidad) || Number(req.body.cantidad) > 50)
        {
            throw new ErrorNegocio(400, 'Indica un número de copias entre 1 y 50', ['cantidad']);
        }
        if (!digital && !req.body.id_ubicacion) throw new ErrorNegocio(400, 'Elige la ubicación', ['id_ubicacion']);
        if (!digital && req.body.tipo_uso && !TIPOS_USO.includes(req.body.tipo_uso))
        {
            throw new ErrorNegocio(400, 'Tipo de uso no válido', ['tipo_uso']);
        }

        const nuevos = await con_usuario(req.usuario.clave, (client) => libro_model.agregar_ejemplares(client,
        {
            id_libro: ficha.libro.id_libro, cantidad: Number(req.body.cantidad), digital,
            id_ubicacion: Number(req.body.id_ubicacion) || null,
            tipo_uso: digital ? 'Préstamo digital' : (req.body.tipo_uso || 'Préstamo externo'),
            condicion: req.body.condicion || 'Bueno'
        }));
        res.status(201).json({ mensaje: 'Ejemplares etiquetados: ' + nuevos.join(', '), ejemplares: nuevos });
    }
    catch (error) { responder_error(res, error, 'libros.agregar_ejemplares'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar_ejemplar(req, res)                                  */
/* Purpose: "Cambiar condición del libro": condición, tipo de uso */
/*          (externo / sala / reservado) and location.            */
/******************************************************************/
const actualizar_ejemplar = async (req, res) =>
{
    try
    {
        const r = await libro_model.buscar_ejemplar(req.params.id);
        const ejemplar = r.rows[0];
        if (!ejemplar) throw new ErrorNegocio(404, 'Ejemplar no encontrado');
        if (ejemplar.estatus === 'Baja') throw new ErrorNegocio(422, 'El ejemplar está dado de baja');
        if (req.body.condicion && !CONDICIONES.includes(req.body.condicion)) throw new ErrorNegocio(400, 'Condición no válida', ['condicion']);
        if (req.body.tipo_uso && ejemplar.formato !== 'Digital' && !TIPOS_USO.includes(req.body.tipo_uso))
        {
            throw new ErrorNegocio(400, 'Tipo de uso no válido', ['tipo_uso']);
        }

        await con_usuario(req.usuario.clave, (client) => libro_model.actualizar_ejemplar(client,
            { id_ejemplar: ejemplar.id_ejemplar, condicion: req.body.condicion, tipo_uso: req.body.tipo_uso,
              id_ubicacion: Number(req.body.id_ubicacion) || null }));
        res.status(200).json({ mensaje: 'Condición del libro actualizada exitosamente' });
    }
    catch (error) { responder_error(res, error, 'libros.actualizar_ejemplar'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* baja_ejemplar(req, res)                                        */
/* Purpose: Definitive baja of a copy { id_motivo, descripcion }. */
/*          The trigger checks the reason and that it is not lent.*/
/******************************************************************/
const baja_ejemplar = async (req, res) =>
{
    try
    {
        if (!req.body.id_motivo) throw new ErrorNegocio(400, 'Selecciona el motivo de baja', ['id_motivo']);
        await con_usuario(req.usuario.clave, (client) => libro_model.baja_ejemplar(client,
            { id_ejemplar: req.params.id, id_motivo: Number(req.body.id_motivo), descripcion: req.body.descripcion, admin: req.usuario.clave }));
        res.status(200).json({ mensaje: 'Ejemplar ' + req.params.id + ' dado de baja' });
    }
    catch (error)
    {
        if (error.constraint === 'bajas_ejemplar_id_ejemplar_key') error = new ErrorNegocio(409, 'El ejemplar ya estaba dado de baja');
        responder_error(res, error, 'libros.baja_ejemplar');
    }
};

const crear_ubicacion = async (req, res) =>
{
    try
    {
        if (!req.body.estante || !req.body.fila) throw new ErrorNegocio(400, 'Indica estante y fila', ['estante', 'fila']);
        const id = await con_usuario(req.usuario.clave, (client) => libro_model.crear_ubicacion(client, req.body));
        res.status(201).json({ id, mensaje: 'Ubicación registrada' });
    }
    catch (error) { responder_error(res, error, 'libros.crear_ubicacion'); }
};

module.exports =
{
    listar, detalle, catalogos, crear, actualizar, activar, retirar,
    agregar_ejemplares, actualizar_ejemplar, baja_ejemplar, crear_ubicacion
};

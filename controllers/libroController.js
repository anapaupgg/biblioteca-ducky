/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   leer_ficha(body, modo) */
/*   obtener(id) */
/*   listar(solicitud, respuesta) */
/*   detalle(solicitud_2, respuesta_2) */
/*   catalogos(solicitud_3, respuesta_3) */
/*   crear(solicitud_4, respuesta_4) */
/*   actualizar(solicitud_5, respuesta_5) */
/*   activar(solicitud_6, respuesta_6) */
/*   retirar(solicitud_7, respuesta_7) */
/*   agregar_ejemplares(solicitud_8, respuesta_8) */
/*   actualizar_ejemplar(solicitud_9, respuesta_9) */
/*   baja_ejemplar(solicitud_10, respuesta_10) */
/*   crear_ubicacion(solicitud_11, respuesta_11) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Funciones HTTP(solicitud, respuesta): Request/Response de Express. */
/* Rutas protegidas requieren usuario y funciones cargados por middleware. */
/* Datos inválidos producen 4xx; fallos internos se gestionan sin secretos. */
/******************************************************************/

const
{
    con_usuario
} = require('../db');
const libro_model = require('../models/libroModel');
const
{
    responder_error,
    error_negocio
} = require('../utils/errores');
const
{
    faltantes,
    es_isbn,
    entero_positivo
} = require('../utils/validators');

const CAMPOS_FICHA = ['titulo', 'isbn', 'editorial', 'tema', 'autores', 'formato'];
const TIPOS_USO = ['Préstamo externo', 'Préstamo en sala', 'Reservado'];
const CONDICIONES = ['Bueno', 'Regular', 'Dañado'];

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
        .map((primero) => String(primero).trim()).filter(Boolean);
    const datos =
    {
        ...body,
        autores,
        isbn: String(body.isbn || '').replace(/[-\s]/g, '')
    };

    const requeridos = modo === 'crear' ? CAMPOS_FICHA : CAMPOS_FICHA.filter((campo) => campo !==
        'isbn' && campo !== 'formato');
    const vacios = faltantes(datos, requeridos);
    if (vacios.length > 0) throw new error_negocio(400, 'Completa los datos obligatorios', vacios);
    if (modo === 'crear' && !es_isbn(datos.isbn)) throw new error_negocio(400,
        'El ISBN debe tener 10 o 13 dígitos', ['isbn']);
    if (datos.formato === 'Digital' && !String(datos.enlace_digital || '').trim())
    {
        throw new error_negocio(400, 'Un libro digital necesita su enlace de consulta', [
            'enlace_digital'
        ]);
    }

    const numero = (valor) => (valor === undefined || valor === null || String(valor).trim() === '' ?
        null : Number(valor));
    return (
    {
        titulo: String(datos.titulo).trim(),
        isbn: datos.isbn,
        editorial: datos.editorial,
        tema: datos.tema,
        autores,
        formato: datos.formato,
        edicion: String(datos.edicion || '').trim() || null,
        anio_publicacion: numero(datos.anio_publicacion),
        paginas: numero(datos.paginas),
        sinopsis: String(datos.sinopsis || '').trim() || null,
        enlace_digital: datos.formato === 'Digital' || datos.enlace_digital ? (String(datos
            .enlace_digital || '').trim() || null) : null,
        precio_ultima_compra_usd: numero(datos.precio_ultima_compra_usd)
    });
};

/* Load a book or answer 404                                      */
const obtener = async (id) =>
{
    const ficha = await libro_model.buscar(id);
    if (!ficha) throw new error_negocio(404, 'Libro no encontrado');
    return ficha;
};

const listar = async (solicitud, respuesta) =>
{
    try
    {
        respuesta.status(200).json((await libro_model.listar(
        {
            q: solicitud.query.q,
            estatus: solicitud.query.estatus
        })).rows);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'libros.listar');
    }
};

const detalle = async (solicitud_2, respuesta_2) =>
{
    try
    {
        respuesta_2.status(200).json(await obtener(solicitud_2.params.id));
    }
    catch (error)
    {
        responder_error(respuesta_2, error, 'libros.detalle');
    }
};

const catalogos = async (solicitud_3, respuesta_3) =>
{
    try
    {
        respuesta_3.status(200).json(await libro_model.catalogos());
    }
    catch (error)
    {
        responder_error(respuesta_3, error, 'libros.catalogos');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* crear(req, res)                                                */
/* Purpose: Register a ficha. Optionally labels { copias } copies */
/*          at { id_ubicacion } in the same transaction.          */
/* Returns: 201 { id_libro, ejemplares[] }  409 La ficha ya existe*/
/******************************************************************/
const crear = async (solicitud_4, respuesta_4) =>
{
    try
    {
        const datos = leer_ficha(solicitud_4.body, 'crear');
        const duplicado = await libro_model.existe_isbn(datos.isbn);
        if (duplicado) throw new error_negocio(409,
            'La ficha ya existe: el ISBN pertenece al libro ' + duplicado, ['isbn']);

        const copias = Number(solicitud_4.body.copias || 0);
        if (copias > 0 && datos.formato === 'Físico' && !solicitud_4.body.id_ubicacion)
        {
            throw new error_negocio(400, 'Elige la ubicación de los ejemplares', ['id_ubicacion']);
        }

        const resultado = await con_usuario(solicitud_4.usuario.clave, async (client) =>
        {
            const id_libro = await libro_model.crear(client, datos);
            const ejemplares = copias > 0 ?
                await libro_model.agregar_ejemplares(client,
                {
                    id_libro,
                    cantidad: copias,
                    id_ubicacion: Number(solicitud_4.body.id_ubicacion) || null,
                    digital: datos.formato === 'Digital',
                    tipo_uso: datos.formato === 'Digital' ? 'Préstamo digital' : (
                        solicitud_4.body.tipo_uso || 'Préstamo externo')
                }) : [];
            return (
            {
                id_libro,
                ejemplares
            });
        });

        respuesta_4.status(201).json(
        {
            mensaje: 'Ficha bibliográfica creada',
            ...resultado
        });
    }
    catch (error)
    {
        responder_error(respuesta_4, error, 'libros.crear');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar(req, res)                                           */
/* Purpose: Modify a ficha that is not retired                    */
/******************************************************************/
const actualizar = async (solicitud_5, respuesta_5) =>
{
    try
    {
        const ficha = await obtener(solicitud_5.params.id);
        if (ficha.libro.estatus === 'Retirado') throw new error_negocio(422,
            'El libro está retirado y no se puede modificar');
        const datos = leer_ficha(
        {
            ...solicitud_5.body,
            formato: ficha.libro.formato
        }, 'actualizar');

        await con_usuario(solicitud_5.usuario.clave, (client) => libro_model.actualizar(client, ficha
            .libro.id_libro, datos));
        respuesta_5.status(200).json(
        {
            mensaje: 'Libro modificado exitosamente',
            ...(await obtener(ficha.libro.id_libro))
        });
    }
    catch (error)
    {
        responder_error(respuesta_5, error, 'libros.actualizar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* activar(req, res)                                              */
/* Purpose: "Dar de alta en catálogo". Requires at least one      */
/*          author and one labeled copy.                          */
/******************************************************************/
const activar = async (solicitud_6, respuesta_6) =>
{
    try
    {
        const ficha = await obtener(solicitud_6.params.id);
        if (ficha.libro.estatus === 'Activo en catálogo') throw new error_negocio(422,
            'El libro ya está activo en el catálogo');
        if (ficha.autores.length === 0) throw new error_negocio(422,
            'La ficha necesita al menos un autor');
        if (!ficha.ejemplares.some((elemento) => elemento.estatus !== 'Baja'))
        {
            throw new error_negocio(422,
                'Etiqueta al menos un ejemplar antes de darlo de alta en el catálogo');
        }

        await con_usuario(solicitud_6.usuario.clave, (client) => libro_model.cambiar_estatus(client,
            ficha.libro.id_libro, 'Activo en catálogo'));
        respuesta_6.status(200).json(
        {
            mensaje: 'Libro dado de alta en catálogo',
            ...(await obtener(ficha.libro.id_libro))
        });
    }
    catch (error)
    {
        responder_error(respuesta_6, error, 'libros.activar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* retirar(req, res)                                              */
/* Purpose: "Dar de baja un libro" (logical, keeps history).      */
/*          Refused while a copy is on loan.                      */
/******************************************************************/
const retirar = async (solicitud_7, respuesta_7) =>
{
    try
    {
        const ficha = await obtener(solicitud_7.params.id);
        if (ficha.libro.estatus === 'Retirado') throw new error_negocio(422,
            'El libro ya está retirado');
        const prestados = ficha.ejemplares.filter((elemento_2) => elemento_2.estatus === 'Prestado')
            .length;
        if (prestados > 0) throw new error_negocio(422, 'No se puede retirar: hay ' + prestados +
            ' ejemplar(es) prestados');

        await con_usuario(solicitud_7.usuario.clave, (client) => libro_model.cambiar_estatus(client,
            ficha.libro.id_libro, 'Retirado'));
        respuesta_7.status(200).json(
        {
            mensaje: 'Libro dado de baja del catálogo',
            ...(await obtener(ficha.libro.id_libro))
        });
    }
    catch (error)
    {
        responder_error(respuesta_7, error, 'libros.retirar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* agregar_ejemplares(req, res)                                   */
/* Purpose: Label { cantidad } new copies { id_ubicacion,         */
/*          tipo_uso, condicion }                                 */
/******************************************************************/
const agregar_ejemplares = async (solicitud_8, respuesta_8) =>
{
    try
    {
        const ficha = await obtener(solicitud_8.params.id);
        const digital = ficha.libro.formato === 'Digital';
        if (!entero_positivo(solicitud_8.body.cantidad) || Number(solicitud_8.body.cantidad) > 50)
        {
            throw new error_negocio(400, 'Indica un número de copias entre 1 y 50', ['cantidad']);
        }
        if (!digital && !solicitud_8.body.id_ubicacion) throw new error_negocio(400,
            'Elige la ubicación', ['id_ubicacion']);
        if (!digital && solicitud_8.body.tipo_uso && !TIPOS_USO.includes(solicitud_8.body.tipo_uso))
        {
            throw new error_negocio(400, 'Tipo de uso no válido', ['tipo_uso']);
        }

        const nuevos = await con_usuario(solicitud_8.usuario.clave, (client) => libro_model
            .agregar_ejemplares(client,
            {
                id_libro: ficha.libro.id_libro,
                cantidad: Number(solicitud_8.body.cantidad),
                digital,
                id_ubicacion: Number(solicitud_8.body.id_ubicacion) || null,
                tipo_uso: digital ? 'Préstamo digital' : (solicitud_8.body.tipo_uso ||
                    'Préstamo externo'),
                condicion: solicitud_8.body.condicion || 'Bueno'
            }));
        respuesta_8.status(201).json(
        {
            mensaje: 'Ejemplares etiquetados: ' + nuevos.join(', '),
            ejemplares: nuevos
        });
    }
    catch (error)
    {
        responder_error(respuesta_8, error, 'libros.agregar_ejemplares');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* actualizar_ejemplar(req, res)                                  */
/* Purpose: "Cambiar condición del libro": condición, tipo de uso */
/*          (externo / sala / reservado) and location.            */
/******************************************************************/
const actualizar_ejemplar = async (solicitud_9, respuesta_9) =>
{
    try
    {
        const resultado_2 = await libro_model.buscar_ejemplar(solicitud_9.params.id);
        const ejemplar = resultado_2.rows[0];
        if (!ejemplar) throw new error_negocio(404, 'Ejemplar no encontrado');
        if (ejemplar.estatus === 'Baja') throw new error_negocio(422,
            'El ejemplar está dado de baja');
        if (solicitud_9.body.condicion && !CONDICIONES.includes(solicitud_9.body.condicion))
            throw new error_negocio(400, 'Condición no válida', ['condicion']);
        if (solicitud_9.body.tipo_uso && ejemplar.formato !== 'Digital' && !TIPOS_USO.includes(
                solicitud_9.body.tipo_uso))
        {
            throw new error_negocio(400, 'Tipo de uso no válido', ['tipo_uso']);
        }

        await con_usuario(solicitud_9.usuario.clave, (client) => libro_model.actualizar_ejemplar(
            client,
            {
                id_ejemplar: ejemplar.id_ejemplar,
                condicion: solicitud_9.body.condicion,
                tipo_uso: solicitud_9.body.tipo_uso,
                id_ubicacion: Number(solicitud_9.body.id_ubicacion) || null
            }));
        respuesta_9.status(200).json(
        {
            mensaje: 'Condición del libro actualizada exitosamente'
        });
    }
    catch (error)
    {
        responder_error(respuesta_9, error, 'libros.actualizar_ejemplar');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* baja_ejemplar(req, res)                                        */
/* Purpose: Definitive baja of a copy { id_motivo, descripcion }. */
/*          The trigger checks the reason and that it is not lent.*/
/******************************************************************/
const baja_ejemplar = async (solicitud_10, respuesta_10) =>
{
    try
    {
        if (!solicitud_10.body.id_motivo) throw new error_negocio(400, 'Selecciona el motivo de baja',
            ['id_motivo']);
        await con_usuario(solicitud_10.usuario.clave, (client) => libro_model.baja_ejemplar(client,
        {
            id_ejemplar: solicitud_10.params.id,
            id_motivo: Number(solicitud_10.body.id_motivo),
            descripcion: solicitud_10.body.descripcion,
            admin: solicitud_10.usuario.clave
        }));
        respuesta_10.status(200).json(
        {
            mensaje: 'Ejemplar ' + solicitud_10.params.id + ' dado de baja'
        });
    }
    catch (error)
    {
        if (error.constraint === 'bajas_ejemplar_id_ejemplar_key') error = new error_negocio(409,
            'El ejemplar ya estaba dado de baja');
        responder_error(respuesta_10, error, 'libros.baja_ejemplar');
    }
};

const crear_ubicacion = async (solicitud_11, respuesta_11) =>
{
    try
    {
        if (!solicitud_11.body.estante || !solicitud_11.body.fila) throw new error_negocio(400,
            'Indica estante y fila', ['estante', 'fila']);
        const id = await con_usuario(solicitud_11.usuario.clave, (client) => libro_model
            .crear_ubicacion(client, solicitud_11.body));
        respuesta_11.status(201).json(
        {
            id,
            mensaje: 'Ubicación registrada'
        });
    }
    catch (error)
    {
        responder_error(respuesta_11, error, 'libros.crear_ubicacion');
    }
};

module.exports =
{
    listar,
    detalle,
    catalogos,
    crear,
    actualizar,
    activar,
    retirar,
    agregar_ejemplares,
    actualizar_ejemplar,
    baja_ejemplar,
    crear_ubicacion
};

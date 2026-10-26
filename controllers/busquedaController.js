/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador HTTP: valida entradas y coordina el modelo. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   buscar(solicitud_2, respuesta) */
/*   ficha(solicitud_3, respuesta_2) */
/*   listado(solicitud_4, respuesta_3) */
/*   solicitar(solicitud_5, respuesta_4) */
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
const busqueda_model = require('../models/busquedaModel');
const
{
    responder_error,
    error_negocio
} = require('../utils/errores');
const
{
    texto_busqueda
} = require('../utils/validators');

const FILTROS = ['titulo', 'autor', 'tema', 'clave', 'isbn', 'editorial'];
const FILTROS_TEXTO = ['titulo', 'autor', 'tema', 'editorial'];

/******************************************************************/
/* Reuse Instructions                                             */
/* buscar(req, res)                                               */
/* Purpose: Validate the filters (at least one; texts need 3      */
/*          characters; ISBN only digits) and search.             */
/* Returns: 200 [] (empty means "No se encontraron coincidencias")*/
/*          400 "Verifica los filtros marcados"                   */
/******************************************************************/
const buscar = async (solicitud_2, respuesta) =>
{
    try
    {
        const filtros =
        {
        };
        for (const campo of FILTROS)
        {
            const valor = String(solicitud_2.query[campo] || '').trim();
            if (valor) filtros[campo] = valor;
        }

        if (Object.keys(filtros).length === 0)
        {
            throw new error_negocio(400, 'Escribe al menos un filtro de búsqueda', FILTROS);
        }
        const invalidos = FILTROS_TEXTO.filter((campo_2) => !texto_busqueda(filtros[campo_2]));
        if (filtros.isbn && !/^[0-9X-]+$/.test(filtros.isbn)) invalidos.push('isbn');
        if (invalidos.length > 0)
        {
            throw new error_negocio(400,
                'Verifica los filtros marcados: los textos requieren al menos 3 caracteres',
                invalidos);
        }
        if (filtros.isbn) filtros.isbn = filtros.isbn.replace(/-/g, '');

        const resultado_2 = await busqueda_model.buscar(filtros);
        respuesta.status(200).json(resultado_2.rows);
    }
    catch (error)
    {
        responder_error(respuesta, error, 'busqueda.buscar');
    }
};

const ficha = async (solicitud_3, respuesta_2) =>
{
    try
    {
        const resultado = await busqueda_model.ficha(solicitud_3.params.id);
        if (!resultado) throw new error_negocio(404, 'El libro no está activo en el catálogo');
        respuesta_2.status(200).json(resultado);
    }
    catch (error)
    {
        responder_error(respuesta_2, error, 'busqueda.ficha');
    }
};

const listado = async (solicitud_4, respuesta_3) =>
{
    try
    {
        respuesta_3.status(200).json((await busqueda_model.listado()).rows);
    }
    catch (error)
    {
        responder_error(respuesta_3, error, 'busqueda.listado');
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* solicitar(req, res)                                            */
/* Purpose: "Solicitar préstamo" from the search. The request     */
/*          waits for the librarian, who authorizes it applying   */
/*          the loan at the counter. If no copy can be lent, the  */
/*          answer suggests the waiting list.                     */
/******************************************************************/
const solicitar = async (solicitud_5, respuesta_4) =>
{
    try
    {
        const resultado = await busqueda_model.ficha(solicitud_5.params.id);
        if (!resultado) throw new error_negocio(404, 'El libro no está activo en el catálogo');
        const libro = resultado.libro;

        if (libro.formato === 'Digital')
        {
            return respuesta_4.status(200).json(
            {
                digital: true,
                enlace: libro.enlace_digital,
                mensaje: 'Recurso en línea: consúltalo desde el enlace'
            });
        }
        if (libro.disponibles_prestamo === 0)
        {
            throw new error_negocio(409,
                'Todos los ejemplares de préstamo externo están prestados o reservados.');
        }
        if (await busqueda_model.solicitud_pendiente(solicitud_5.usuario.clave, libro.id_libro))
        {
            throw new error_negocio(409, 'Ya tienes una solicitud pendiente para este libro');
        }

        const solicitud = await con_usuario(solicitud_5.usuario.clave,
            (client) => busqueda_model.crear_solicitud(client, solicitud_5.usuario.clave, libro
                .id_libro));
        respuesta_4.status(201).json(
        {
            mensaje: 'Solicitud registrada. Preséntate en el mostrador con tu credencial para recoger el libro.',
            folio: solicitud.folio,
            fecha: solicitud.fecha_solicitud,
            libro: libro.titulo
        });
    }
    catch (error)
    {
        responder_error(respuesta_4, error, 'busqueda.solicitar');
    }
};

module.exports =
{
    buscar,
    ficha,
    listado,
    solicitar
};

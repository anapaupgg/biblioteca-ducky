/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Búsqueda de libros y solicitud de préstamo.        */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   buscar(req, res)          - GET  /api/busqueda               */
/*   ficha(req, res)           - GET  /api/busqueda/:id           */
/*   listado(req, res)         - GET  /api/busqueda/listado       */
/*   solicitar(req, res)       - POST /api/busqueda/:id/solicitud */
/******************************************************************/

const { con_usuario }  = require('../db');
const busqueda_model   = require('../models/busquedaModel');
const { responder_error, ErrorNegocio } = require('../utils/errores');
const { texto_busqueda } = require('../utils/validators');

const FILTROS       = ['titulo', 'autor', 'tema', 'clave', 'isbn', 'editorial'];
const FILTROS_TEXTO = ['titulo', 'autor', 'tema', 'editorial'];

/******************************************************************/
/* Reuse Instructions                                             */
/* buscar(req, res)                                               */
/* Purpose: Validate the filters (at least one; texts need 3      */
/*          characters; ISBN only digits) and search.             */
/* Returns: 200 [] (empty means "No se encontraron coincidencias")*/
/*          400 "Verifica los filtros marcados"                   */
/******************************************************************/
const buscar = async (req, res) =>
{
    try
    {
        const filtros = {};
        for (const campo of FILTROS)
        {
            const valor = String(req.query[campo] || '').trim();
            if (valor) filtros[campo] = valor;
        }

        if (Object.keys(filtros).length === 0)
        {
            throw new ErrorNegocio(400, 'Escribe al menos un filtro de búsqueda', FILTROS);
        }
        const invalidos = FILTROS_TEXTO.filter((c) => !texto_busqueda(filtros[c]));
        if (filtros.isbn && !/^[0-9X-]+$/.test(filtros.isbn)) invalidos.push('isbn');
        if (invalidos.length > 0)
        {
            throw new ErrorNegocio(400, 'Verifica los filtros marcados: los textos requieren al menos 3 caracteres', invalidos);
        }
        if (filtros.isbn) filtros.isbn = filtros.isbn.replace(/-/g, '');

        const r = await busqueda_model.buscar(filtros);
        res.status(200).json(r.rows);
    }
    catch (error) { responder_error(res, error, 'busqueda.buscar'); }
};

const ficha = async (req, res) =>
{
    try
    {
        const resultado = await busqueda_model.ficha(req.params.id);
        if (!resultado) throw new ErrorNegocio(404, 'El libro no está activo en el catálogo');
        res.status(200).json(resultado);
    }
    catch (error) { responder_error(res, error, 'busqueda.ficha'); }
};

const listado = async (req, res) =>
{
    try { res.status(200).json((await busqueda_model.listado()).rows); }
    catch (error) { responder_error(res, error, 'busqueda.listado'); }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* solicitar(req, res)                                            */
/* Purpose: "Solicitar préstamo" from the search. The request     */
/*          waits for the librarian, who authorizes it applying   */
/*          the loan at the counter. If no copy can be lent, the  */
/*          answer suggests the waiting list.                     */
/******************************************************************/
const solicitar = async (req, res) =>
{
    try
    {
        const resultado = await busqueda_model.ficha(req.params.id);
        if (!resultado) throw new ErrorNegocio(404, 'El libro no está activo en el catálogo');
        const libro = resultado.libro;

        if (libro.formato === 'Digital')
        {
            return res.status(200).json({ digital: true, enlace: libro.enlace_digital, mensaje: 'Recurso en línea: consúltalo desde el enlace' });
        }
        if (libro.disponibles_prestamo === 0)
        {
            throw new ErrorNegocio(409, 'Todos los ejemplares de préstamo externo están prestados o reservados.');
        }
        if (await busqueda_model.solicitud_pendiente(req.usuario.clave, libro.id_libro))
        {
            throw new ErrorNegocio(409, 'Ya tienes una solicitud pendiente para este libro');
        }

        const solicitud = await con_usuario(req.usuario.clave,
            (client) => busqueda_model.crear_solicitud(client, req.usuario.clave, libro.id_libro));
        res.status(201).json(
        {
            mensaje: 'Solicitud registrada. Preséntate en el mostrador con tu credencial para recoger el libro.',
            folio: solicitud.folio, fecha: solicitud.fecha_solicitud, libro: libro.titulo
        });
    }
    catch (error) { responder_error(res, error, 'busqueda.solicitar'); }
};

module.exports = { buscar, ficha, listado, solicitar };

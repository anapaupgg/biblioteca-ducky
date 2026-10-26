/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo cliente: transporte de datos hacia la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   busqueda_model.buscar(filtros) */
/*   busqueda_model.ficha(id) */
/*   busqueda_model.listado() */
/*   busqueda_model.solicitar(id) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de api; recibe datos validados por el controlador. */
/* Devuelve Promise de JSON; rechaza con api_error ante errores HTTP. */
/* Identificadores string/number se codifican en la URL; no manipula DOM. */
/******************************************************************/

const busqueda_model =
{
    /* GET /busqueda?titulo=&autor=&tema=&clave=&isbn=&editorial= */
    buscar: function (filtros)
    {
        return api.get('/busqueda', filtros);
    },

    /* GET public ficha with copies */
    ficha: function (id)
    {
        return api.get('/busqueda/' + encodeURIComponent(id));
    },

    /* GET printable list */
    listado: function ()
    {
        return api.get('/busqueda/listado');
    },

    /* POST loan request */
    solicitar: function (id)
    {
        return api.post('/busqueda/' + encodeURIComponent(id) + '/solicitud');
    }
};

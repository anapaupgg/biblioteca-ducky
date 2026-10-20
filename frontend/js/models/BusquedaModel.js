/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Llamadas a /api/busqueda.                         */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   BusquedaModel.buscar(filtros)                                */
/*   BusquedaModel.ficha(id)                                      */
/*   BusquedaModel.listado()                                      */
/*   BusquedaModel.solicitar(id)                                  */
/******************************************************************/

const BusquedaModel =
{
    /* GET /busqueda?titulo=&autor=&tema=&clave=&isbn=&editorial= */
    buscar: function(filtros)
    {
        return Api.get('/busqueda', filtros);
    },

    /* GET public ficha with copies */
    ficha: function(id)
    {
        return Api.get('/busqueda/' + encodeURIComponent(id));
    },

    /* GET printable list */
    listado: function()
    {
        return Api.get('/busqueda/listado');
    },

    /* POST loan request */
    solicitar: function(id)
    {
        return Api.post('/busqueda/' + encodeURIComponent(id) + '/solicitud');
    }
};

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo cliente: transporte de datos hacia la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   pedido_model.presupuestos() */
/*   pedido_model.listar() */
/*   pedido_model.detalle(id) */
/*   pedido_model.crear(lineas) */
/*   pedido_model.estatus(id, estatus) */
/*   pedido_model.recibir(id, id_ubicacion) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de api; recibe datos validados por el controlador. */
/* Devuelve Promise de JSON; rechaza con api_error ante errores HTTP. */
/* Identificadores string/number se codifican en la URL; no manipula DOM. */
/******************************************************************/

const pedido_model =
{
    /* GET budgets with balance */
    presupuestos: function ()
    {
        return api.get('/pedidos/presupuestos');
    },

    /* GET orders */
    listar: function ()
    {
        return api.get('/pedidos');
    },

    /* GET order with lines */
    detalle: function (id)
    {
        return api.get('/pedidos/' + id);
    },

    /* POST order */
    crear: function (lineas)
    {
        return api.post('/pedidos',
        {
            lineas: lineas
        });
    },

    /* PUT Tesorería answer */
    estatus: function (id, estatus)
    {
        return api.put('/pedidos/' + id + '/estatus',
        {
            estatus: estatus
        });
    },

    /* POST reception */
    recibir: function (id, id_ubicacion)
    {
        return api.post('/pedidos/' + id + '/recepcion',
        {
            id_ubicacion: id_ubicacion
        });
    }
};

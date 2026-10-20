/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Model of "Solicitudes a Tesorería" (/api/pedidos).     */
/*              Budgets, orders and reception of books.           */
/*              Views and controllers never call fetch directly:  */
/*              they go through this object, which uses Api.      */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   PedidoModel.presupuestos()                                   */
/*   PedidoModel.listar()                                         */
/*   PedidoModel.detalle(id)                                      */
/*   PedidoModel.crear(lineas)                                    */
/*   PedidoModel.estatus(id, estatus)                             */
/*   PedidoModel.recibir(id, id_ubicacion)                        */
/******************************************************************/

const PedidoModel =
{
    /* GET budgets with balance */
    presupuestos: function()
    {
        return Api.get('/pedidos/presupuestos');
    },

    /* GET orders */
    listar: function()
    {
        return Api.get('/pedidos');
    },

    /* GET order with lines */
    detalle: function(id)
    {
        return Api.get('/pedidos/' + id);
    },

    /* POST order */
    crear: function(lineas)
    {
        return Api.post('/pedidos', { lineas: lineas });
    },

    /* PUT Tesorería answer */
    estatus: function(id, estatus)
    {
        return Api.put('/pedidos/' + id + '/estatus', { estatus: estatus });
    },

    /* POST reception */
    recibir: function(id, id_ubicacion)
    {
        return Api.post('/pedidos/' + id + '/recepcion', { id_ubicacion: id_ubicacion });
    }
};

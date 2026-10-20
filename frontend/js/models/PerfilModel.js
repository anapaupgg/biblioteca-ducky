/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Llamadas a /api/perfiles.                         */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   PerfilModel.listar()                                         */
/*   PerfilModel.funciones()                                      */
/*   PerfilModel.crear(datos)                                     */
/*   PerfilModel.actualizar(id, datos)                            */
/*   PerfilModel.dar_baja(id)                                     */
/*   PerfilModel.reactivar(id)                                    */
/******************************************************************/

const PerfilModel =
{
    /* GET /perfiles */
    listar: function()
    {
        return Api.get('/perfiles');
    },

    /* GET /perfiles/funciones */
    funciones: function()
    {
        return Api.get('/perfiles/funciones');
    },

    /* POST /perfiles { nombre, descripcion, funciones[] } */
    crear: function(datos)
    {
        return Api.post('/perfiles', datos);
    },

    /* PUT /perfiles/:id { descripcion, funciones[] } */
    actualizar: function(id, datos)
    {
        return Api.put('/perfiles/' + id, datos);
    },

    /* POST /perfiles/:id/baja */
    dar_baja: function(id)
    {
        return Api.post('/perfiles/' + id + '/baja');
    },

    /* POST /perfiles/:id/reactivar */
    reactivar: function(id)
    {
        return Api.post('/perfiles/' + id + '/reactivar');
    }
};

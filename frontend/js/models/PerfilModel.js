/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo cliente: transporte de datos hacia la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   perfil_model.listar() */
/*   perfil_model.funciones() */
/*   perfil_model.crear(datos) */
/*   perfil_model.actualizar(id, datos) */
/*   perfil_model.dar_baja(id) */
/*   perfil_model.reactivar(id) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de api; recibe datos validados por el controlador. */
/* Devuelve Promise de JSON; rechaza con api_error ante errores HTTP. */
/* Identificadores string/number se codifican en la URL; no manipula DOM. */
/******************************************************************/

const perfil_model =
{
    /* GET /perfiles */
    listar: function ()
    {
        return api.get('/perfiles');
    },

    /* GET /perfiles/funciones */
    funciones: function ()
    {
        return api.get('/perfiles/funciones');
    },

    /* POST /perfiles { nombre, descripcion, funciones[] } */
    crear: function (datos)
    {
        return api.post('/perfiles', datos);
    },

    /* PUT /perfiles/:id { descripcion, funciones[] } */
    actualizar: function (id, datos)
    {
        return api.put('/perfiles/' + id, datos);
    },

    /* POST /perfiles/:id/baja */
    dar_baja: function (id)
    {
        return api.post('/perfiles/' + id + '/baja');
    },

    /* POST /perfiles/:id/reactivar */
    reactivar: function (id)
    {
        return api.post('/perfiles/' + id + '/reactivar');
    }
};

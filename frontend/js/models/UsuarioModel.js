/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo cliente: transporte de datos hacia la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_model.listar(filtros) */
/*   usuario_model.detalle(clave) */
/*   usuario_model.catalogos() */
/*   usuario_model.institucion(clave) */
/*   usuario_model.crear(clave, id_perfil) */
/*   usuario_model.cambiar_perfil(clave, id_perfil) */
/*   usuario_model.dar_baja(clave, id_motivo, comentario) */
/*   usuario_model.reactivar(clave, id_perfil) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de api; recibe datos validados por el controlador. */
/* Devuelve Promise de JSON; rechaza con api_error ante errores HTTP. */
/* Identificadores string/number se codifican en la URL; no manipula DOM. */
/******************************************************************/

const usuario_model =
{
    /* GET /usuarios?q=&estatus= */
    listar: function (filtros)
    {
        return api.get('/usuarios', filtros);
    },

    /* GET /usuarios/:clave */
    detalle: function (clave)
    {
        return api.get('/usuarios/' + encodeURIComponent(clave));
    },

    /* GET /usuarios/catalogos -> perfiles, tipos, motivos */
    catalogos: function ()
    {
        return api.get('/usuarios/catalogos');
    },

    /* GET institutional data (read only) */
    institucion: function (clave)
    {
        return api.get('/usuarios/institucion/' + encodeURIComponent(clave));
    },

    /* POST /usuarios -> { usuario, contrasena_temporal } */
    crear: function (clave, id_perfil)
    {
        return api.post('/usuarios',
        {
            clave: clave,
            id_perfil: id_perfil
        });
    },

    /* PUT /usuarios/:clave/perfil */
    cambiar_perfil: function (clave, id_perfil)
    {
        return api.put('/usuarios/' + encodeURIComponent(clave) + '/perfil',
        {
            id_perfil: id_perfil
        });
    },

    /* POST /usuarios/:clave/baja */
    dar_baja: function (clave, id_motivo, comentario)
    {
        return api.post('/usuarios/' + encodeURIComponent(clave) + '/baja',
        {
            id_motivo: id_motivo,
            comentario: comentario
        });
    },

    /* POST /usuarios/:clave/reactivar */
    reactivar: function (clave, id_perfil)
    {
        return api.post('/usuarios/' + encodeURIComponent(clave) + '/reactivar',
        {
            id_perfil: id_perfil
        });
    }
};

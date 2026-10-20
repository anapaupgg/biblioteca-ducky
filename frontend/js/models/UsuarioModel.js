/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Llamadas a /api/usuarios.                         */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   UsuarioModel.listar(filtros)                                 */
/*   UsuarioModel.detalle(clave)                                  */
/*   UsuarioModel.catalogos()                                     */
/*   UsuarioModel.institucion(clave)                              */
/*   UsuarioModel.crear(clave, id_perfil)                         */
/*   UsuarioModel.cambiar_perfil(clave, id_perfil)                */
/*   UsuarioModel.dar_baja(clave, id_motivo, comentario)          */
/*   UsuarioModel.reactivar(clave, id_perfil)                     */
/******************************************************************/

const UsuarioModel =
{
    /* GET /usuarios?q=&estatus= */
    listar: function(filtros)
    {
        return Api.get('/usuarios', filtros);
    },

    /* GET /usuarios/:clave */
    detalle: function(clave)
    {
        return Api.get('/usuarios/' + encodeURIComponent(clave));
    },

    /* GET /usuarios/catalogos -> perfiles, tipos, motivos */
    catalogos: function()
    {
        return Api.get('/usuarios/catalogos');
    },

    /* GET institutional data (read only) */
    institucion: function(clave)
    {
        return Api.get('/usuarios/institucion/' + encodeURIComponent(clave));
    },

    /* POST /usuarios -> { usuario, contrasena_temporal } */
    crear: function(clave, id_perfil)
    {
        return Api.post('/usuarios', { clave: clave, id_perfil: id_perfil });
    },

    /* PUT /usuarios/:clave/perfil */
    cambiar_perfil: function(clave, id_perfil)
    {
        return Api.put('/usuarios/' + encodeURIComponent(clave) + '/perfil', { id_perfil: id_perfil });
    },

    /* POST /usuarios/:clave/baja */
    dar_baja: function(clave, id_motivo, comentario)
    {
        return Api.post('/usuarios/' + encodeURIComponent(clave) + '/baja', { id_motivo: id_motivo, comentario: comentario });
    },

    /* POST /usuarios/:clave/reactivar */
    reactivar: function(clave, id_perfil)
    {
        return Api.post('/usuarios/' + encodeURIComponent(clave) + '/reactivar', { id_perfil: id_perfil });
    }
};

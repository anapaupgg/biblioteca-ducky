/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Llamadas a /api/libros.                           */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   LibroModel.listar(filtros)                                   */
/*   LibroModel.detalle(id)                                       */
/*   LibroModel.catalogos()                                       */
/*   LibroModel.crear(datos)                                      */
/*   LibroModel.actualizar(id, datos)                             */
/*   LibroModel.activar(id)                                       */
/*   LibroModel.retirar(id)                                       */
/*   LibroModel.agregar_ejemplares(id, datos)                     */
/*   LibroModel.actualizar_ejemplar(id, datos)                    */
/*   LibroModel.baja_ejemplar(id, datos)                          */
/*   LibroModel.crear_ubicacion(datos)                            */
/******************************************************************/

const LibroModel =
{
    /* GET /libros?q=&estatus= */
    listar: function(filtros)
    {
        return Api.get('/libros', filtros);
    },

    /* GET /libros/:id -> { libro, autores, ejemplares } */
    detalle: function(id)
    {
        return Api.get('/libros/' + encodeURIComponent(id));
    },

    /* GET editoriales, temas, autores, ubicaciones, motivos */
    catalogos: function()
    {
        return Api.get('/libros/catalogos');
    },

    /* POST /libros (ficha + optional copies) */
    crear: function(datos)
    {
        return Api.post('/libros', datos);
    },

    /* PUT /libros/:id */
    actualizar: function(id, datos)
    {
        return Api.put('/libros/' + encodeURIComponent(id), datos);
    },

    /* POST /libros/:id/alta (Activo en catálogo) */
    activar: function(id)
    {
        return Api.post('/libros/' + encodeURIComponent(id) + '/alta');
    },

    /* POST /libros/:id/retirar */
    retirar: function(id)
    {
        return Api.post('/libros/' + encodeURIComponent(id) + '/retirar');
    },

    /* POST /libros/:id/ejemplares */
    agregar_ejemplares: function(id, datos)
    {
        return Api.post('/libros/' + encodeURIComponent(id) + '/ejemplares', datos);
    },

    /* PUT condition / use / location of a copy */
    actualizar_ejemplar: function(id, datos)
    {
        return Api.put('/libros/ejemplares/' + encodeURIComponent(id), datos);
    },

    /* POST definitive baja of a copy */
    baja_ejemplar: function(id, datos)
    {
        return Api.post('/libros/ejemplares/' + encodeURIComponent(id) + '/baja', datos);
    },

    /* POST /libros/ubicaciones */
    crear_ubicacion: function(datos)
    {
        return Api.post('/libros/ubicaciones', datos);
    }
};

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo cliente: transporte de datos hacia la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libro_model.listar(filtros) */
/*   libro_model.detalle(id) */
/*   libro_model.catalogos() */
/*   libro_model.crear(datos) */
/*   libro_model.actualizar(id, datos) */
/*   libro_model.activar(id) */
/*   libro_model.retirar(id) */
/*   libro_model.agregar_ejemplares(id, datos) */
/*   libro_model.actualizar_ejemplar(id, datos) */
/*   libro_model.baja_ejemplar(id, datos) */
/*   libro_model.crear_ubicacion(datos) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de api; recibe datos validados por el controlador. */
/* Devuelve Promise de JSON; rechaza con api_error ante errores HTTP. */
/* Identificadores string/number se codifican en la URL; no manipula DOM. */
/******************************************************************/

const libro_model =
{
    /* GET /libros?q=&estatus= */
    listar: function (filtros)
    {
        return api.get('/libros', filtros);
    },

    /* GET /libros/:id -> { libro, autores, ejemplares } */
    detalle: function (id)
    {
        return api.get('/libros/' + encodeURIComponent(id));
    },

    /* GET editoriales, temas, autores, ubicaciones, motivos */
    catalogos: function ()
    {
        return api.get('/libros/catalogos');
    },

    /* POST /libros (ficha + optional copies) */
    crear: function (datos)
    {
        return api.post('/libros', datos);
    },

    /* PUT /libros/:id */
    actualizar: function (id, datos)
    {
        return api.put('/libros/' + encodeURIComponent(id), datos);
    },

    /* POST /libros/:id/alta (Activo en catálogo) */
    activar: function (id)
    {
        return api.post('/libros/' + encodeURIComponent(id) + '/alta');
    },

    /* POST /libros/:id/retirar */
    retirar: function (id)
    {
        return api.post('/libros/' + encodeURIComponent(id) + '/retirar');
    },

    /* POST /libros/:id/ejemplares */
    agregar_ejemplares: function (id, datos)
    {
        return api.post('/libros/' + encodeURIComponent(id) + '/ejemplares', datos);
    },

    /* PUT condition / use / location of a copy */
    actualizar_ejemplar: function (id, datos)
    {
        return api.put('/libros/ejemplares/' + encodeURIComponent(id), datos);
    },

    /* POST definitive baja of a copy */
    baja_ejemplar: function (id, datos)
    {
        return api.post('/libros/ejemplares/' + encodeURIComponent(id) + '/baja', datos);
    },

    /* POST /libros/ubicaciones */
    crear_ubicacion: function (datos)
    {
        return api.post('/libros/ubicaciones', datos);
    }
};

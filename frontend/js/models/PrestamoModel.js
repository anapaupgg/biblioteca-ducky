/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Acceso cliente a la API de préstamos.             */
/******************************************************************/

/******************************************************************/
/* Listing Contents: mios(), pendientes(), autorizar(folio, id).  */
/* Reuse Instructions: cargar después de api. Devuelve promesas;  */
/* errores ApiError llegan al controlador. Sin DOM ni permisos.   */
/******************************************************************/

const prestamo_model =
{
    mios: () => api.get('/prestamos/mios'),
    pendientes: () => api.get('/prestamos/solicitudes'),
    autorizar: (folio, id_ejemplar) => api.post('/prestamos/solicitudes/' +
        encodeURIComponent(folio) + '/autorizar', { id_ejemplar })
};

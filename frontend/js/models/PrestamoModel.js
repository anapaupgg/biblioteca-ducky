/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Acceso cliente a la API de préstamos.             */
/******************************************************************/

/******************************************************************/
/* Listing Contents: mios(), pendientes(), activos(),             */
/* validar(datos), registrar(datos), autorizar(folio, id).        */
/* Reuse Instructions: cargar después de api. Devuelve promesas;  */
/* errores ApiError llegan al controlador. Sin DOM ni permisos.   */
/******************************************************************/

const prestamo_model =
{
    mios: () => api.get('/prestamos/mios'),
    pendientes: () => api.get('/prestamos/solicitudes'),
    activos: () => api.get('/prestamos/activos'),
    validar: (datos) => api.post('/prestamos/validar', datos),
    registrar: (datos) => api.post('/prestamos/registrar', datos),
    validar_renovacion: (datos) => api.post('/circulacion/renovaciones/validar', datos),
    renovar: (datos) => api.post('/circulacion/renovaciones', datos),
    espera: (id_libro) => api.get('/prestamos/espera/' + encodeURIComponent(id_libro)),
    registrar_espera: (datos) => api.post('/prestamos/espera', datos),
    autorizar: (folio, id_ejemplar) => api.post('/prestamos/solicitudes/' +
        encodeURIComponent(folio) + '/autorizar', { id_ejemplar })
};

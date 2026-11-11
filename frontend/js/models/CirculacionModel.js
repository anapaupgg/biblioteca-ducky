/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: Acceso cliente a préstamos y devoluciones.        */
/******************************************************************/

/******************************************************************/
/* Listing Contents: activos, buscar, validar_devolucion, devolver. */
/* Reuse Instructions: solo API; no DOM ni decisiones de interfaz. */
/******************************************************************/

const circulacion_model =
{
    activos: () => api.get('/prestamos/activos'),
    buscar: (id) => api.get('/circulacion/ejemplar/' + encodeURIComponent(id)),
    validar_devolucion: (datos) => api.post('/circulacion/devoluciones/validar', datos),
    devolver: (datos) => api.post('/circulacion/devoluciones', datos)
};

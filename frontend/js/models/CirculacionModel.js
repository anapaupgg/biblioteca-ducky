/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: Acceso cliente a préstamos y devoluciones.        */
/******************************************************************/

/******************************************************************/
/* Listing Contents: activos, buscar, devoluciones, pérdidas,      */
/* multas, pagos y avisos.                                         */
/* Reuse Instructions: solo API; no DOM ni decisiones de interfaz. */
/******************************************************************/

const circulacion_model =
{
    activos: () => api.get('/prestamos/activos'),
    buscar: (id) => api.get('/circulacion/ejemplar/' + encodeURIComponent(id)),
    validar_devolucion: (datos) => api.post('/circulacion/devoluciones/validar', datos),
    devolver: (datos) => api.post('/circulacion/devoluciones', datos),
    validar_perdida: (datos) => api.post('/circulacion/perdidas/validar', datos),
    confirmar_perdida: (datos) => api.post('/circulacion/perdidas', datos),
    multas: () => api.get('/circulacion/multas'),
    aviso_multa: (id) => api.post('/circulacion/multas/' + encodeURIComponent(id) + '/aviso', {}),
    registrar_pago: (datos) => api.post('/circulacion/multas/pagos', datos),
    avisar_adeudos: () => api.post('/circulacion/multas/avisos', {})
};

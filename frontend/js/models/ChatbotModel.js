/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo cliente: transporte de datos hacia la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   chatbot_model.sugerencias() */
/*   chatbot_model.preguntar(consulta) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de api; recibe datos validados por el controlador. */
/* Devuelve Promise de JSON; rechaza con api_error ante errores HTTP. */
/* Identificadores string/number se codifican en la URL; no manipula DOM. */
/******************************************************************/

const chatbot_model =
{
    sugerencias: () => api.get('/chatbot'),
    preguntar: consulta => api.get('/chatbot',
    {
        q: consulta
    })
};

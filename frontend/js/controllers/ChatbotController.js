/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   chatbot_controller.iniciar() */
/*   chatbot_controller.cargar() */
/*   chatbot_controller.preguntar(texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const chatbot_controller =
{
    ocupado: false,
    async iniciar()
    {
        if (!await layout.montar(
            {
                activo: 'chatbot',
                migas: 'Asistente',
                funciones: ['Chatbot']
            })) return;
        chatbot_view.enlazar(
        {
            preguntar: texto => this.preguntar(texto),
            cargar: () => this.cargar()
        });
        await this.cargar();
    },
    async cargar()
    {
        chatbot_view.estado('Cargando preguntas…');
        chatbot_view.reintentar(false);
        try
        {
            const resultado = await chatbot_model.sugerencias();
            chatbot_view.sugerencias(resultado.sugerencias, consulta => this.preguntar(consulta));
            chatbot_view.estado(resultado.sugerencias.length ?
                'Elige una pregunta o escribe la tuya.' : 'Todavía no hay respuestas publicadas.');
        }
        catch (error)
        {
            chatbot_view.estado(error.message);
            chatbot_view.reintentar(true);
        }
    },
    async preguntar(texto)
    {
        if (this.ocupado) return;
        const consulta_2 = texto.trim();
        if (consulta_2.length < 3 || consulta_2.length > 300)
        {
            chatbot_view.estado('Escribe una pregunta de 3 a 300 caracteres.');
            return;
        }
        this.ocupado = true;
        chatbot_view.ocupado(true);
        chatbot_view.estado('Consultando…');
        chatbot_view.mensaje(consulta_2, 'usuario');
        try
        {
            const resultado_2 = await chatbot_model.preguntar(consulta_2);
            chatbot_view.respuesta(resultado_2);
            chatbot_view.limpiar();
            chatbot_view.estado('Consulta terminada.');
        }
        catch (error_2)
        {
            chatbot_view.mensaje('No pude completar la consulta. ' + error_2.message, 'bot');
            chatbot_view.estado('Puedes reintentar tu pregunta.');
        }
        finally
        {
            this.ocupado = false;
            chatbot_view.ocupado(false);
            chatbot_view.enfocar();
        }
    }
};

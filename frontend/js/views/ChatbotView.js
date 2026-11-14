/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-14 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   chatbot_view.enlazar(acciones) */
/*   chatbot_view.reintentar(visible) */
/*   chatbot_view.limpiar() */
/*   chatbot_view.enfocar() */
/*   chatbot_view.respuesta(datos) */
/*   chatbot_view.ocupado(si) */
/*   chatbot_view.estado(texto) */
/*   chatbot_view.sugerencias(lista, preguntar) */
/*   chatbot_view.mensaje(texto, tipo, fuentes = []) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const chatbot_view =
{
    /* enlazar(acciones): callbacks preguntar(string) y cargar(), una vez por página. */
    enlazar(acciones)
    {
        document.getElementById('chat-form').addEventListener('submit', evento =>
        {
            evento.preventDefault();
            acciones.preguntar(document.getElementById('chat-pregunta').value);
        });
        document.getElementById('chat-reintentar').onclick = acciones.cargar;
    },
    reintentar(visible)
    {
        document.getElementById('chat-reintentar').classList.toggle('hidden', !visible);
    },
    limpiar()
    {
        document.getElementById('chat-pregunta').value = '';
    },
    enfocar()
    {
        document.getElementById('chat-pregunta').focus();
    },
    /* respuesta(datos): contrato JSON de /api/chatbot; contenido siempre como texto. */
    respuesta(datos)
    {
        document.getElementById('chat-buscar-cta').classList.toggle('hidden',
            !datos.resultados?.some((resultado) => resultado.accion === 'buscar'));
        if (!datos.resultados?.length || datos.libros?.length)
            this.mensaje(datos.mensaje, 'bot');
        datos.resultados.forEach(pregunta => this.mensaje(pregunta.respuesta,
            'bot', pregunta.fuentes));
        (datos.libros || []).forEach(libro => this.mensaje(
            libro.titulo + ' — ' + libro.autores + '\nClave: ' + libro.id_libro + ' · ' + libro
            .formato +
            '\nEjemplares disponibles para préstamo: ' + libro.disponibles_prestamo +
            '\nUbicación: ' + (libro.ubicaciones || 'Consulta la ficha en Buscar libros'), 'bot',
            ['Catálogo actual de la biblioteca']));
    },
    ocupado(si)
    {
        document.getElementById('chat-enviar').disabled = si;
        document.getElementById('chat-enviar').textContent = si ? 'Consultando…' : 'Enviar';
        document.getElementById('chat-sugerencias').querySelectorAll('button').forEach(boton => boton
            .disabled = si);
    },
    estado(texto)
    {
        document.getElementById('chat-estado').textContent = texto;
    },
    sugerencias(lista, preguntar)
    {
        const caja = document.getElementById('chat-sugerencias');
        caja.replaceChildren();
        ['Sobre el sistema', 'Uso de la biblioteca'].forEach((grupo) =>
        {
            const preguntas = lista.filter((filtro) =>
                (filtro.grupo || 'Uso de la biblioteca') === grupo);
            if (!preguntas.length) return;
            const titulo = document.createElement('h2');
            titulo.className = 'faq-grupo-titulo';
            titulo.textContent = grupo;
            caja.appendChild(titulo);
            const fila = document.createElement('div');
            fila.className = 'faq-preguntas';
            preguntas.forEach((filtro) =>
            {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'btn';
                boton.textContent = filtro.pregunta;
                boton.onclick = () => preguntar(filtro.pregunta);
                fila.appendChild(boton);
            });
            caja.appendChild(fila);
        });
    },
    mensaje(texto, tipo, fuentes = [])
    {
        const caja = document.getElementById('chat-mensajes');
        const mensaje = document.createElement('div');
        mensaje.className = 'msg ' + (tipo === 'usuario' ? 'msg-user' : 'msg-bot');
        if (tipo !== 'usuario')
        {
            const autor = document.createElement('strong');
            autor.textContent = 'Asistente Ducky';
            mensaje.appendChild(autor);
        }
        const elemento = document.createElement('p');
        elemento.textContent = texto;
        mensaje.appendChild(elemento);
        if (fuentes.length)
        {
            const registro = document.createElement('small');
            const reglas = fuentes.map((fuente) =>
                /^Requerimientos · (Regla \d+)(?: · versión [\d.]+)?$/.exec(fuente));
            registro.textContent = 'Fuente: ' + (reglas.every(Boolean) ?
                'Requerimientos · ' + reglas.map((regla) => regla[1]).join(' y ') :
                fuentes.join(' · '));
            mensaje.appendChild(registro);
        }
        caja.appendChild(mensaje);
        while (caja.children.length > 40) caja.firstElementChild.remove();
        caja.scrollTop = caja.scrollHeight;
    }
};

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   inicio_view.saludo(usuario) */
/*   inicio_view.servicios(lista) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const inicio_view =
{
    saludo: function (usuario)
    {
        document.getElementById('nombre-usuario').textContent = usuario.nombre;
    },

    servicios: function (lista)
    {
        document.getElementById('servicios').innerHTML = lista.map((registro) =>
            '<div class="service">' + layout.icono(registro.icono) +
            '<div class="service-text"><h2>' + ui.esc(registro.titulo) + '</h2>' +
            '<p>' + ui.esc(registro.texto) + '</p></div>' +
            '<a class="btn btn-primary" href="' + registro.url + '">Abrir</a></div>').join('');
    }
};

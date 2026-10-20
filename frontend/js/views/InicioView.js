/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de inicio.html.                             */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   InicioView.saludo(usuario)           - User name             */
/*   InicioView.servicios(lista)          - Service rows          */
/******************************************************************/

const InicioView =
{
    saludo: function(usuario)
    {
        document.getElementById('nombre-usuario').textContent = usuario.nombre;
    },

    servicios: function(lista)
    {
        document.getElementById('servicios').innerHTML = lista.map((s) =>
            '<div class="service">' + Layout.icono(s.icono) +
            '<div class="service-text"><h2>' + Ui.esc(s.titulo) + '</h2>' +
            '<p>' + Ui.esc(s.texto) + '</p></div>' +
            '<a class="btn btn-primary" href="' + s.url + '">Abrir</a></div>').join('');
    }
};

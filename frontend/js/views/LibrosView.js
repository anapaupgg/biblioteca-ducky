/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libros_view.enlazar(acciones) */
/*   libros_view.filtros() */
/*   libros_view.estadisticas(libros) */
/*   libros_view.tabla(libros, al_abrir) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const libros_view =
{
    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        let espera = null;
        document.getElementById('q').addEventListener('input', () =>
        {
            clearTimeout(espera);
            espera = setTimeout(() => acciones.cargar(), 250);
        });
        document.getElementById('estatus').addEventListener('change', () => acciones.cargar());
    },

    filtros: function ()
    {
        return ui.leer(['q', 'estatus']);
    },

    estadisticas: function (libros)
    {
        const suma = (campo) => libros.reduce((registro, libro) => registro + libro[campo], 0);
        document.getElementById('stats').innerHTML =
            '<div class="stat"><span>Fichas</span><strong>' + libros.length + '</strong></div>' +
            '<div class="stat"><span>Activos en catálogo</span><strong>' + libros.filter((libro_2) =>
                libro_2.estatus === 'Activo en catálogo').length + '</strong></div>' +
            '<div class="stat"><span>Ejemplares</span><strong>' + suma('ejemplares') +
            '</strong></div>' +
            '<div class="stat"><span>Disponibles</span><strong>' + suma('disponibles') +
            '</strong></div>' +
            '<div class="stat"><span>Prestados</span><strong>' + suma('prestados') +
            '</strong></div>';
    },

    tabla: function (libros, al_abrir)
    {
        ui.tabla('tabla',
            [
            {
                titulo: 'Clave',
                valor: (libro_3) => '<strong>' + ui.esc(libro_3.id_libro) + '</strong>'
            },
            {
                titulo: 'Título',
                valor: (libro_4) => ui.esc(libro_4.titulo) + '<div class="small muted">' + ui
                    .esc(libro_4.autores || 'Sin autor') + '</div>'
            },
            {
                titulo: 'ISBN',
                valor: (libro_5) => ui.esc(libro_5.isbn)
            },
            {
                titulo: 'Editorial',
                valor: (libro_6) => ui.esc(libro_6.editorial)
            },
            {
                titulo: 'Formato',
                valor: (libro_7) => ui.esc(libro_7.formato)
            },
            {
                titulo: 'Ejemplares',
                valor: (libro_8) => libro_8.disponibles + ' disp. / ' + libro_8.ejemplares
            },
            {
                titulo: 'Estatus',
                valor: (libro_9) => ui.badge(libro_9.estatus)
            },
            {
                titulo: '',
                valor: (libro_10) => '<a class="btn btn-sm" href="libro_detalle.html?id=' +
                    encodeURIComponent(libro_10.id_libro) + '">Consultar ficha</a>'
            }], libros,
            {
                vacio: 'No hay libros con ese filtro',
                al_click: al_abrir
            });
    }
};

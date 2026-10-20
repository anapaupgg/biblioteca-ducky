/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de libros.html.                             */
/******************************************************************/

const LibrosView =
{
    filtros: function() { return Ui.leer(['q', 'estatus']); },

    estadisticas: function(libros)
    {
        const suma = (campo) => libros.reduce((s, l) => s + l[campo], 0);
        document.getElementById('stats').innerHTML =
            '<div class="stat"><span>Fichas</span><strong>' + libros.length + '</strong></div>' +
            '<div class="stat"><span>Activos en catálogo</span><strong>' + libros.filter((l) => l.estatus === 'Activo en catálogo').length + '</strong></div>' +
            '<div class="stat"><span>Ejemplares</span><strong>' + suma('ejemplares') + '</strong></div>' +
            '<div class="stat"><span>Disponibles</span><strong>' + suma('disponibles') + '</strong></div>' +
            '<div class="stat"><span>Prestados</span><strong>' + suma('prestados') + '</strong></div>';
    },

    tabla: function(libros, al_abrir)
    {
        Ui.tabla('tabla',
        [
            { titulo: 'Clave',     valor: (l) => '<strong>' + Ui.esc(l.id_libro) + '</strong>' },
            { titulo: 'Título',    valor: (l) => Ui.esc(l.titulo) + '<div class="small muted">' + Ui.esc(l.autores || 'Sin autor') + '</div>' },
            { titulo: 'ISBN',      valor: (l) => Ui.esc(l.isbn) },
            { titulo: 'Editorial', valor: (l) => Ui.esc(l.editorial) },
            { titulo: 'Formato',   valor: (l) => Ui.esc(l.formato) },
            { titulo: 'Ejemplares', valor: (l) => l.disponibles + ' disp. / ' + l.ejemplares },
            { titulo: 'Estatus',   valor: (l) => Ui.badge(l.estatus) },
            { titulo: '',          valor: (l) => '<a class="btn btn-sm" href="libro_detalle.html?id=' + encodeURIComponent(l.id_libro) + '">Consultar ficha</a>' }
        ], libros, { vacio: 'No hay libros con ese filtro', al_click: al_abrir });
    }
};

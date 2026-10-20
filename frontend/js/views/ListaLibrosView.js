/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de lista_libros.html.                       */
/******************************************************************/

const ListaLibrosView =
{
    tabla: function(libros)
    {
        document.getElementById('generado').textContent = 'Generada el ' + Ui.fecha_hora(new Date()) + ' · ' + libros.length + ' títulos activos';
        Ui.tabla('tabla',
        [
            { titulo: 'Clave',       valor: (l) => Ui.esc(l.id_libro) },
            { titulo: 'Título',      valor: (l) => '<strong>' + Ui.esc(l.titulo) + '</strong>' },
            { titulo: 'Autor(es)',   valor: (l) => Ui.esc(l.autores || '—') },
            { titulo: 'Editorial',   valor: (l) => Ui.esc(l.editorial) },
            { titulo: 'Tema',        valor: (l) => Ui.esc(l.tema) },
            { titulo: 'Formato',     valor: (l) => Ui.esc(l.formato) },
            { titulo: 'Disponibles', valor: (l) => l.disponibles_total + ' / ' + l.ejemplares }
        ], libros, { vacio: 'No hay libros activos en el catálogo' });
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); }
};

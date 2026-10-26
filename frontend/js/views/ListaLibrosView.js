/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   lista_libros_view.enlazar(actualizar) */
/*   lista_libros_view.bloquear(imprimir, actualizar) */
/*   lista_libros_view.vaciar() */
/*   lista_libros_view.tabla(libros) */
/*   lista_libros_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const lista_libros_view =
{
    enlazar: function (actualizar)
    {
        document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
        document.getElementById('btn-actualizar').addEventListener('click', actualizar);
    },
    bloquear: function (imprimir, actualizar)
    {
        document.getElementById('btn-imprimir').disabled = imprimir;
        document.getElementById('btn-actualizar').disabled = actualizar;
    },
    vaciar: function ()
    {
        document.getElementById('tabla').textContent = '';
        document.getElementById('generado').textContent = '';
    },

    tabla: function (libros)
    {
        document.getElementById('generado').textContent = 'Generada el ' + ui.fecha_hora(new Date()) +
            ' · ' + libros.length + ' títulos activos';
        ui.tabla('tabla',
            [
            {
                titulo: 'Clave',
                valor: (libro) => ui.esc(libro.id_libro)
            },
            {
                titulo: 'ISBN',
                valor: (libro_2) => ui.esc(libro_2.isbn || '—')
            },
            {
                titulo: 'Título',
                valor: (libro_3) => '<strong>' + ui.esc(libro_3.titulo) + '</strong>'
            },
            {
                titulo: 'Autor(es)',
                valor: (libro_4) => ui.esc(libro_4.autores || '—')
            },
            {
                titulo: 'Editorial',
                valor: (libro_5) => ui.esc(libro_5.editorial)
            },
            {
                titulo: 'Tema',
                valor: (libro_6) => ui.esc(libro_6.tema)
            },
            {
                titulo: 'Formato',
                valor: (libro_7) => ui.esc(libro_7.formato)
            },
            {
                titulo: 'Disponibles',
                valor: (libro_8) => libro_8.disponibles_total + ' / ' + libro_8.ejemplares
            }], libros,
            {
                vacio: 'No hay libros activos en el catálogo'
            });
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

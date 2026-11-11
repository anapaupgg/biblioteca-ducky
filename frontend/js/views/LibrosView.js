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
/*   libros_view.tabla(libros) */
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
        document.getElementById('accion-ficha').addEventListener('click', () =>
        {
            const libro = this.libros?.find((registro) => registro.id_libro === this.clave_seleccionada);
            if (libro) window.location.href = 'libro_detalle.html?id=' + encodeURIComponent(libro.id_libro);
        });
    },

    filtros: function ()
    {
        return ui.leer(['q', 'estatus']);
    },

    tabla: function (libros)
    {
        this.libros = libros;
        if (!libros.some((libro) => libro.id_libro === this.clave_seleccionada))
            this.clave_seleccionada = null;
        document.getElementById('tabla').innerHTML =
            '<div class="catalogo-lista" role="listbox" aria-label="Libros del catálogo">' +
            '<div class="catalogo-fila catalogo-cabecera">Clave · ISBN · Título · Autor · Editorial · Condición</div>' +
            (libros.length ? libros.map((libro) =>
                '<button class="catalogo-fila catalogo-registro" type="button" role="option" data-libro="' +
                ui.esc(libro.id_libro) + '" aria-selected="' +
                (libro.id_libro === this.clave_seleccionada) + '" title="' +
                ui.esc(libro.titulo) + '">' + ui.esc([
                    libro.id_libro, libro.isbn, libro.titulo, libro.autores || 'Sin autor',
                    libro.editorial, libro.condiciones || 'Sin ejemplares'].join(' · ')) +
                '</button>').join('') :
                '<div class="catalogo-fila muted">No hay libros con ese filtro</div>') + '</div>';
        document.querySelectorAll('[data-libro]').forEach((fila) =>
            fila.addEventListener('click', () =>
            {
                this.clave_seleccionada = fila.dataset.libro;
                document.querySelectorAll('[data-libro]').forEach((otra) =>
                    otra.setAttribute('aria-selected', String(otra === fila)));
                document.getElementById('accion-ficha').disabled = false;
            }));
        document.getElementById('accion-ficha').disabled = !this.clave_seleccionada;
    }
};

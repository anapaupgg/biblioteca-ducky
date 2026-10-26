/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   buscar_view.titulo(valor) */
/*   buscar_view.enfocar() */
/*   buscar_view.vaciar() */
/*   buscar_view.enlazar(acciones) */
/*   buscar_view.filtros() */
/*   buscar_view.limpiar_filtros() */
/*   buscar_view.resultados(lista, filtros, acciones) */
/*   buscar_view.ficha(filtro) */
/*   buscar_view.solicitud(resultado) */
/*   buscar_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const FILTROS_BUSQUEDA = ['titulo', 'autor', 'tema', 'clave', 'isbn', 'editorial'];

const buscar_view =
{
    titulo: function (valor)
    {
        document.getElementById('titulo').value = valor;
    },
    enfocar: function ()
    {
        document.getElementById('titulo').focus();
    },
    vaciar: function ()
    {
        document.getElementById('resultados').innerHTML = '';
    },

    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.getElementById('form-buscar').addEventListener('submit', (elemento) =>
        {
            elemento.preventDefault();
            acciones.buscar();
        });
        document.getElementById('btn-limpiar').addEventListener('click', () => buscar_view
            .limpiar_filtros());
    },

    filtros: function ()
    {
        return ui.leer(FILTROS_BUSQUEDA);
    },

    limpiar_filtros: function ()
    {
        FILTROS_BUSQUEDA.forEach((id) =>
        {
            document.getElementById(id).value = '';
        });
        ui.limpiar();
        document.getElementById('resultados').innerHTML = '';
        ui.alerta('mensaje');
        document.getElementById('titulo').focus();
    },

    resultados: function (lista, filtros, acciones)
    {
        const resumen = Object.entries(filtros).filter(([, valor_2]) => valor_2).map(([clave,
            valor_3]) => clave + ': ' + valor_3).join(' · ');
        if (lista.length === 0)
        {
            document.getElementById('resultados').innerHTML = '';
            ui.alerta('mensaje', 'warning', 'No se encontraron coincidencias',
                'Revisa los filtros (' + resumen + ') o intenta con menos datos.');
            return;
        }
        ui.alerta('mensaje', 'info', 'Resultados de búsqueda', resumen + ' · ' + lista.length +
            ' resultado(s) activos.');

        const lectura = (elemento_2, valor_4) => '<div class="field"><span class="label">' +
            elemento_2 + '</span><div class="readonly">' + ui.esc(valor_4) + '</div></div>';
        document.getElementById('resultados').innerHTML = lista.map((libro, indice) =>
        {
            const digital = libro.formato === 'Digital';
            let acciones_html = '<button class="btn" data-ficha="' + indice +
                '">Ver ficha bibliográfica</button>';
            if (digital) acciones_html = '<a class="btn btn-primary" href="' + ui.esc(libro
                    .enlace_digital) +
                '" target="_blank" rel="noopener">Consultar en línea</a>' + acciones_html;
            else if (libro.disponibles_prestamo > 0) acciones_html =
                '<button class="btn btn-primary" data-solicitar="' + indice +
                '">Solicitar préstamo</button>' + acciones_html;

            return '<div class="card"><h2>' + ui.esc(libro.titulo) + (digital ?
                    ' · Recurso en línea' : '') + '</h2><div class="grid-2">' +
                lectura('Clave / ISBN', libro.id_libro + ' / ' + libro.isbn) + lectura(
                    'Autor', libro.autores || '—') +
                lectura('Editorial / formato', libro.editorial + ' / ' + libro.formato) +
                lectura('Tema', libro.tema) +
                (digital ? lectura('Enlace', libro.enlace_digital) :
                    lectura('Ubicación (estante / fila)', libro.ubicaciones || '—') +
                    lectura('Disponibles para préstamo', libro.disponibles_prestamo + ' de ' +
                        libro.ejemplares + (libro.prestados ? ' · ' + libro.prestados +
                            ' prestado(s)' : ''))) +
                '</div>' + (!digital && libro.disponibles_prestamo === 0 ?
                    '<div class="alert alert-warning"><strong>Todos los ejemplares están prestados o reservados</strong><span>Consulta la ficha para ver cuándo se devuelve cada ejemplar.</span></div>' :
                    '') +
                '<div class="actions" style="margin-bottom:0">' + acciones_html +
                '</div></div>';
        }).join('');

        const en = (attr, accion) => document.querySelectorAll('[' + attr + ']').forEach((boton) =>
            boton.addEventListener('click', () => accion(lista[Number(boton.getAttribute(attr))]))
            );
        en('data-solicitar', acciones.solicitar);
        en('data-ficha', acciones.ficha);
    },

    ficha: function (filtro)
    {
        const libro_2 = filtro.libro;
        const dialogo = ui.dialogo(
        {
            titulo: libro_2.titulo,
            texto: (libro_2.autores || '') + ' · ' + libro_2.editorial + ' · ' + (libro_2
                .anio_publicacion || '') + (libro_2.edicion ? ' · ' + libro_2.edicion +
                ' edición' : ''),
            cuerpo: '<p>' + ui.esc(libro_2.sinopsis || 'Sin sinopsis.') +
                '</p><div id="ficha-ejemplares"></div>',
            confirmar: 'Cerrar',
            cancelar: false
        });
        /* The dialog is already in the DOM: draw its copies table */
        ui.tabla('ficha-ejemplares',
            [
            {
                titulo: 'Ejemplar',
                valor: (elemento_3) => ui.esc(elemento_3.id_ejemplar)
            },
            {
                titulo: 'Ubicación',
                valor: (elemento_4) => ui.esc(elemento_4.ubicacion || 'En línea')
            },
            {
                titulo: 'Uso',
                valor: (elemento_5) => ui.esc(elemento_5.tipo_uso)
            },
            {
                titulo: 'Estatus',
                valor: (elemento_6) => ui.badge(elemento_6.estatus) + (elemento_6
                    .disponible_desde ? '<div class="small muted">vuelve ' + ui.fecha(
                        elemento_6.disponible_desde) + '</div>' : '')
            }], filtro.ejemplares);
        return dialogo;
    },

    solicitud: function (resultado)
    {
        return ui.dialogo(
        {
            titulo: 'Solicitud registrada',
            texto: resultado.mensaje,
            cuerpo: '<div class="alert alert-ok"><strong>Folio ' + ui.esc(resultado.folio) +
                ' · ' + ui.esc(resultado.libro) + '</strong>' +
                '<span>' + ui.fecha_hora(resultado.fecha) +
                '. El bibliotecario confirmará tu préstamo al entregarte el libro.</span></div>',
            confirmar: 'Entendido',
            cancelar: false
        });
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

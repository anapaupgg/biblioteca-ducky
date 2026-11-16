/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
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
/*   buscar_view.activar_movil() */
/*   buscar_view.modificar() */
/*   buscar_view.estado_movil(tipo, detalle) */
/*   buscar_view.ejemplo(campo, valor) */
/*   buscar_view.resultados(lista, filtros, acciones) */
/*   buscar_view.prestados(libro, acciones) */
/*   buscar_view.invalidos(filtros, campos, acciones) */
/*   buscar_view.estado_escritorio(titulo, descripcion, clase) */
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
        document.body.classList.remove('search-desktop-results', 'search-desktop-empty',
            'search-desktop-loaned', 'search-desktop-invalid');
        document.getElementById('titulo-busqueda-escritorio').textContent = 'Buscar libros';
        document.getElementById('descripcion-busqueda-escritorio').textContent =
            'Combina uno o varios filtros. Los textos requieren al menos 3 caracteres.';
        document.body.classList.remove('search-results-mobile');
        document.body.classList.remove('search-state-mobile', 'search-state-empty',
            'search-state-invalid', 'search-detail-mobile');
    },

    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.getElementById('form-buscar').addEventListener('submit', (elemento) =>
        {
            elemento.preventDefault();
            acciones.buscar();
        });
        document.getElementById('btn-limpiar').addEventListener('click', () => acciones.limpiar());
        document.getElementById('btn-ejemplo-isbn').addEventListener('click', () =>
            acciones.ejemplo('isbn', '9786073206037'));
        document.getElementById('btn-ejemplo-movil').addEventListener('click', () =>
            acciones.ejemplo('titulo', 'software'));
        document.getElementById('btn-modificar-busqueda').addEventListener('click', () =>
            acciones.modificar());
        document.getElementById('btn-corregir-busqueda').addEventListener('click', () =>
            acciones.modificar());
    },

    activar_movil: function ()
    {
        document.body.classList.add('search-mobile-preview');
    },

    modificar: function ()
    {
        this.vaciar();
        ui.alerta('mensaje');
        window.scrollTo(0, 0);
        this.enfocar();
    },

    estado_movil: function (tipo, detalle)
    {
        const vacio = tipo === 'empty';
        document.body.classList.remove('search-results-mobile', 'search-state-empty',
            'search-state-invalid');
        document.body.classList.add('search-state-mobile', vacio ? 'search-state-empty' :
            'search-state-invalid');
        document.getElementById('titulo-estado-busqueda').textContent = vacio ?
            'Sin resultados' : 'Revisa los filtros';
        document.getElementById('subtitulo-estado-busqueda').textContent = vacio ?
            'No encontramos libros con esos filtros.' :
            'Corrige los datos indicados para continuar.';
        document.getElementById('detalle-estado-busqueda').textContent = detalle;
        document.getElementById('btn-corregir-busqueda').textContent = vacio ?
            'Cambiar filtros' : 'Corregir búsqueda';
        if (window.matchMedia('(max-width: 600px)').matches ||
            document.body.classList.contains('search-mobile-preview')) window.scrollTo(0, 0);
    },

    ejemplo: function (campo, valor)
    {
        this.limpiar_filtros();
        document.getElementById(campo).value = valor;
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
        this.vaciar();
        ui.alerta('mensaje');
        document.getElementById('titulo').focus();
    },

    resultados: function (lista, filtros, acciones)
    {
        const etiquetas = { titulo: 'Título', autor: 'Autor', tema: 'Tema',
            clave: 'Clave', isbn: 'ISBN', editorial: 'Editorial' };
        const resumen = Object.entries(filtros).filter(([, valor_2]) => valor_2).map(([clave,
            valor_3]) => etiquetas[clave] + ': ' + valor_3).join(' · ');
        if (lista.length === 0)
        {
            this.estado_escritorio('No se encontraron coincidencias',
                'Se conservaron los filtros de búsqueda.', 'search-desktop-empty');
            ui.alerta('mensaje');
            const campo = (etiqueta, valor) => '<div class="field"><span class="label">' +
                etiqueta + '</span><div class="readonly">' + ui.esc(valor || '') + '</div></div>';
            document.getElementById('resultados').innerHTML =
                '<div class="alert search-empty-alert"><strong>0 resultados</strong>' +
                '<span>El catálogo activo no contiene libros que coincidan. Los libros dados de baja se excluyen.</span></div>' +
                '<div class="card search-empty-card"><h2>Filtros conservados</h2>' +
                '<div class="grid-2">' + FILTROS_BUSQUEDA.map((id) =>
                    campo(etiquetas[id], filtros[id])).join('') + '</div></div>' +
                '<div class="actions search-result-actions">' +
                '<button class="btn btn-primary" id="btn-modificar-filtros-vacio" type="button">Modificar filtros</button>' +
                '<button class="btn" id="btn-limpiar-filtros-vacio" type="button">Limpiar filtros</button></div>';
            document.getElementById('btn-modificar-filtros-vacio').addEventListener('click',
                acciones.modificar);
            document.getElementById('btn-limpiar-filtros-vacio').addEventListener('click',
                acciones.limpiar);
            this.estado_movil('empty', 'Prueba con otro título, autor o tema.');
            return;
        }
        if (lista.length === 1 && lista[0].formato !== 'Digital' && lista[0].ejemplares > 0 &&
            lista[0].prestados === lista[0].ejemplares)
        {
            this.prestados(lista[0], acciones);
            return;
        }
        this.estado_escritorio('Resultados de búsqueda', resumen + ' · ' + lista.length +
            ' resultados activos.', 'search-desktop-results');
        ui.alerta('mensaje');
        document.body.classList.add('search-results-mobile');
        document.body.classList.remove('search-detail-mobile');
        if (window.matchMedia('(max-width: 600px)').matches ||
            document.body.classList.contains('search-mobile-preview')) window.scrollTo(0, 0);

        const lectura = (elemento_2, valor_4) => '<div class="field"><span class="label">' +
            elemento_2 + '</span><div class="readonly">' + ui.esc(valor_4) + '</div></div>';
        document.getElementById('resultados').innerHTML = lista.map((libro, indice) =>
        {
            const digital = libro.formato === 'Digital';
            let enlace_digital = null;
            if (digital && libro.enlace_digital)
            {
                try
                {
                    const url = new URL(libro.enlace_digital, window.location.origin);
                    if (url.protocol === 'https:' || url.origin === window.location.origin)
                        enlace_digital = url.href;
                }
                catch
                {
                    enlace_digital = null;
                }
            }
            let acciones_html = indice > 0 ? '<button class="btn" data-ficha="' + indice +
                '">Ver ficha bibliográfica</button>' : '';
            if (digital && enlace_digital) acciones_html =
                '<a class="btn" href="' + ui.esc(enlace_digital) +
                '" target="_blank" rel="noopener noreferrer">Abrir recurso en línea</a>' +
                acciones_html;
            else if (libro.disponibles_prestamo > 0) acciones_html =
                '<button class="btn btn-primary" data-solicitar="' + indice +
                '">Solicitar préstamo</button>' + acciones_html;
            else if (!digital) acciones_html =
                '<button class="btn" type="button" disabled>Solicitar préstamo</button>' +
                acciones_html;

            const disponibilidad = digital ? 'Digital · Disponible en línea' :
                libro.ejemplares + (libro.ejemplares === 1 ? ' copia · ' : ' copias · ') +
                libro.disponibles_prestamo + (libro.disponibles_prestamo === 1 ?
                    ' disponible · ' : ' disponibles · ') + libro.prestados +
                (libro.prestados === 1 ? ' prestada' : ' prestadas');
            const movil = '<div class="card search-result-mobile"><h2>' +
                ui.esc(libro.titulo) + '</h2><p>' + ui.esc(libro.autores || '—') +
                '</p><p class="search-result-availability">' + ui.esc(disponibilidad) +
                '</p><button class="btn btn-primary" data-ficha="' + indice +
                '" type="button">Ver ficha</button></div>';
            const campos = digital ? [
                lectura('Clave / ISBN', libro.id_libro + ' / ' + libro.isbn),
                lectura('Autor / Editorial', (libro.autores || '—') + ' / ' + libro.editorial),
                lectura('Formato', 'En línea'),
                lectura('Enlace', libro.enlace_digital || 'No registrado')
            ] : [
                lectura('Clave / ISBN', libro.id_libro + ' / ' + libro.isbn),
                lectura('Autor', libro.autores || '—'),
                lectura('Editorial / formato', libro.editorial + ' / ' + libro.formato),
                lectura('Estante / fila', libro.ubicaciones || '—'),
                lectura('Disponibles', libro.disponibles_prestamo),
                lectura('Prestados', libro.prestados)
            ];
            return '<div class="card search-result-desktop"><h2>' + ui.esc(libro.titulo) +
                (digital ? ' · Recurso en línea' : '') + '</h2><div class="grid-2">' +
                campos.join('') + '</div>' + (acciones_html ?
                    '<div class="actions search-result-card-actions">' + acciones_html +
                    '</div>' : '') + '</div>' + movil;
        }).join('');

        document.getElementById('resultados').insertAdjacentHTML('afterbegin',
            '<div class="actions search-result-toolbar"><button class="btn" data-ficha="0" ' +
            'type="button">Ver ficha bibliográfica</button></div>');
        document.getElementById('resultados').insertAdjacentHTML('beforeend',
            '<div class="actions search-result-actions"><button class="btn" ' +
            'id="btn-modificar-filtros-resultado" type="button">Modificar filtros</button></div>');
        document.getElementById('btn-modificar-filtros-resultado').addEventListener('click',
            acciones.modificar);

        const en = (attr, accion) => document.querySelectorAll('[' + attr + ']').forEach((boton) =>
            boton.addEventListener('click', () => accion(lista[Number(boton.getAttribute(attr))]))
            );
        en('data-solicitar', acciones.solicitar);
        en('data-ficha', acciones.ficha);
    },

    prestados: function (libro, acciones)
    {
        const campo = (etiqueta, valor) => '<div class="field"><span class="label">' +
            etiqueta + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        const fecha = libro.devolucion_cercana ? ui.fecha(libro.devolucion_cercana) :
            'Sin fecha registrada';
        this.estado_escritorio('Todos los ejemplares están prestados',
            libro.id_libro + ' · ' + libro.titulo + '.', 'search-desktop-loaned');
        ui.alerta('mensaje');
        document.getElementById('resultados').innerHTML =
            '<div class="card search-loaned-card"><h2>' + ui.esc(libro.titulo) + '</h2>' +
            '<div class="grid-2">' +
            campo('Clave / ISBN', libro.id_libro + ' / ' + libro.isbn) +
            campo('Autor / Editorial', (libro.autores || '—') + ' / ' + libro.editorial) +
            campo('Formato / ubicación', libro.formato + ' / ' + (libro.ubicaciones || '—')) +
            campo('Disponibles / prestados', libro.disponibles_prestamo + ' / ' + libro.prestados) +
            campo('Devolución más cercana', fecha) +
            campo('Solicitud de préstamo', 'No disponible') + '</div>' +
            '<div class="actions search-result-card-actions"><button class="btn" type="button" ' +
            'disabled>Solicitar préstamo</button></div></div>' +
            '<div class="actions search-result-actions"><button class="btn btn-primary" ' +
            'id="btn-modificar-filtros-prestados" type="button">Modificar filtros</button></div>' +
            '<div class="card search-result-mobile"><h2>' + ui.esc(libro.titulo) +
            '</h2><p>' + ui.esc(libro.autores || '—') + '</p>' +
            '<p class="search-result-availability">0 disponibles · ' +
            ui.esc(libro.prestados) + ' prestados</p>' +
            '<button class="btn btn-primary" id="btn-ficha-prestados" type="button">Ver ficha</button></div>';
        document.getElementById('btn-modificar-filtros-prestados').addEventListener('click',
            acciones.modificar);
        document.getElementById('btn-ficha-prestados').addEventListener('click', () =>
            acciones.ficha(libro));
        document.body.classList.add('search-results-mobile');
    },

    invalidos: function (filtros, campos, acciones)
    {
        const etiquetas = { titulo: 'Título', autor: 'Autor', tema: 'Tema',
            clave: 'Clave', isbn: 'ISBN', editorial: 'Editorial' };
        const campo = (id) => '<div class="field' + (campos.includes(id) ?
            ' field-error' : '') + '"><span class="label">' + etiquetas[id] +
            '</span><div class="readonly">' + ui.esc(filtros[id] || '') + '</div></div>';
        this.estado_escritorio('Verifica los filtros marcados',
            'No se ejecutó la búsqueda. Se conservan los datos.', 'search-desktop-invalid');
        ui.alerta('mensaje');
        document.getElementById('resultados').innerHTML =
            '<div class="alert alert-error search-invalid-alert"><strong>Filtros no válidos</strong>' +
            '<span>Captura al menos un filtro. Los textos requieren 3 caracteres y el ISBN ' +
            'solo admite números, X o guiones.</span></div>' +
            '<div class="card search-invalid-card"><h2>Ejemplo con errores</h2>' +
            '<div class="grid-2">' + FILTROS_BUSQUEDA.map(campo).join('') + '</div></div>' +
            '<div class="actions search-result-actions">' +
            '<button class="btn btn-primary" id="btn-corregir-filtros" ' +
            'type="button">Corregir filtros</button>' +
            '<button class="btn" id="btn-limpiar-invalidos" type="button">Limpiar</button></div>';
        document.getElementById('btn-corregir-filtros').addEventListener('click', acciones.modificar);
        document.getElementById('btn-limpiar-invalidos').addEventListener('click', acciones.limpiar);
    },

    estado_escritorio: function (titulo, descripcion, clase)
    {
        document.body.classList.remove('search-desktop-results', 'search-desktop-empty',
            'search-desktop-loaned', 'search-desktop-invalid');
        document.body.classList.add(clase);
        document.getElementById('titulo-busqueda-escritorio').textContent = titulo;
        document.getElementById('descripcion-busqueda-escritorio').textContent = descripcion;
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

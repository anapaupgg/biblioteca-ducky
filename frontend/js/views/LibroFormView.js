/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libro_form_view.completar(campo, valor) */
/*   libro_form_view.enlazar(acciones) */
/*   libro_form_view.catalogos(campo_2) */
/*   libro_form_view.modo_edicion(ficha) */
/*   libro_form_view.datos() */
/*   libro_form_view.ajustar_formato() */
/*   libro_form_view.copias(delta) */
/*   libro_form_view.mensaje(tipo, titulo, texto) */
/*   libro_form_view.creado(resultado) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const CAMPOS_LIBRO = ['titulo', 'isbn', 'autores', 'editorial', 'tema', 'formato', 'edicion',
    'anio_publicacion',
    'paginas', 'precio_ultima_compra_usd', 'enlace_digital', 'sinopsis', 'id_ubicacion', 'tipo_uso'
];

const libro_form_view =
{
    completar: function (campo, valor)
    {
        document.getElementById(campo).value = valor;
    },

    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.getElementById('formato').addEventListener('change', () => libro_form_view
            .ajustar_formato());
        document.getElementById('menos').addEventListener('click', () => libro_form_view.copias(-1));
        document.getElementById('mas').addEventListener('click', () => libro_form_view.copias(1));
        document.getElementById('form-libro').addEventListener('submit', (elemento) =>
        {
            elemento.preventDefault();
            acciones.guardar();
        });
    },

    catalogos: function (campo_2)
    {
        const lista = (id, items) =>
        {
            document.getElementById(id).innerHTML = items.map((indice) => '<option value="' + ui
                .esc(indice.nombre) + '">').join('');
        };
        lista('lista-autores', campo_2.autores);
        lista('lista-editoriales', campo_2.editoriales);
        lista('lista-temas', campo_2.temas);
        document.getElementById('id_ubicacion').innerHTML = ui.opciones(campo_2.ubicaciones, 'id',
            'etiqueta', '', 'Selecciona la ubicación');
    },

    modo_edicion: function (ficha)
    {
        const libro = ficha.libro;
        document.getElementById('titulo-pagina').textContent = 'Modificar libro del catálogo · ' +
            libro.id_libro;
        document.getElementById('btn-guardar').textContent = 'Guardar cambios';
        document.getElementById('btn-cancelar').href = 'libro_detalle.html?id=' + encodeURIComponent(
            libro.id_libro);
        const valores =
        {
            titulo: libro.titulo,
            isbn: libro.isbn,
            autores: ficha.autores.map((primero) => primero.nombre).join(', '),
            editorial: libro.editorial,
            tema: libro.tema,
            formato: libro.formato,
            edicion: libro.edicion,
            anio_publicacion: libro.anio_publicacion,
            paginas: libro.paginas,
            precio_ultima_compra_usd: libro.precio_ultima_compra_usd,
            enlace_digital: libro.enlace_digital,
            sinopsis: libro.sinopsis
        };
        Object.entries(valores).forEach(([clave, valor_2]) =>
        {
            document.getElementById(clave).value = valor_2 === null || valor_2 === undefined ?
                '' : valor_2;
        });
        document.getElementById('isbn').readOnly = true;
        document.getElementById('formato').disabled = true;
        document.getElementById('card-copias').classList.add('hidden');
        this.ajustar_formato();
    },

    datos: function ()
    {
        const datos = ui.leer(CAMPOS_LIBRO);
        datos.copias = Number(document.getElementById('copias').value);
        return datos;
    },

    ajustar_formato: function ()
    {
        const digital = document.getElementById('formato').value === 'Digital';
        document.getElementById('campo-enlace').style.display = digital ? '' : 'none';
        document.getElementById('campo-ubicacion').style.display = digital ? 'none' : '';
        document.getElementById('campo-uso').style.display = digital ? 'none' : '';
    },

    copias: function (delta)
    {
        const out = document.getElementById('copias');
        out.value = Math.min(50, Math.max(0, Number(out.value) + delta));
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    },

    creado: function (resultado)
    {
        document.getElementById('form-libro').classList.add('hidden');
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Ficha bibliográfica creada · ' + ui.esc(resultado
                .id_libro) + '</strong>' +
            '<span>' + (resultado.ejemplares.length ? 'Ejemplares etiquetados: ' + ui.esc(resultado
                .ejemplares.join(', ')) + '.' : 'Sin ejemplares todavía.') +
            ' La ficha queda en estatus "Ficha creada" hasta darla de alta en el catálogo.</span></div>' +
            '<div class="actions"><a class="btn btn-primary" href="libro_detalle.html?id=' +
            encodeURIComponent(resultado.id_libro) + '">Ver ficha y dar de alta</a>' +
            '<a class="btn" href="libro_form.html">Registrar otra ficha</a><a class="btn" href="libros.html">Volver al catálogo</a></div>';
    }
};

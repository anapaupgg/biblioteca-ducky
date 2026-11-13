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
/*   libro_form_view.creado(resultado, datos, preparar_alta) */
/*   libro_form_view.confirmar_alta(ficha, confirmar, cancelar) */
/*   libro_form_view.alta_completada(ficha) */
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

const campo_libro_lectura = (etiqueta, valor) =>
    '<div class="field"><span class="label">' + ui.esc(etiqueta) +
    '</span><div class="readonly">' + ui.esc(valor || '—') + '</div></div>';

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
        document.getElementById('btn-sinopsis-ejemplo').addEventListener('click', () =>
        {
            document.getElementById('sinopsis').value =
                'Principios de ingeniería de software, requisitos, diseño, pruebas y mantenimiento de sistemas.';
        });
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
        document.getElementById('titulo-pagina').textContent = 'Modificar libro del catálogo';
        document.getElementById('descripcion-pagina').textContent =
            'Se guardarán únicamente los campos modificados.';
        document.getElementById('titulo-datos-libro').textContent = 'Datos del libro';
        document.getElementById('clave').value = libro.id_libro;
        document.getElementById('btn-guardar').textContent = 'Guardar modificación';
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
        document.getElementById('campo-ubicacion').classList.add('hidden');
        document.getElementById('campo-uso').classList.add('hidden');
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

    creado: function (resultado, datos, preparar_alta)
    {
        document.getElementById('form-libro').classList.add('hidden');
        document.getElementById('titulo-pagina').textContent = 'Ficha bibliográfica creada';
        document.getElementById('descripcion-pagina').textContent =
            'La ficha muestra los datos que acabas de registrar.';
        document.getElementById('mensaje').innerHTML =
            '<div class="actions"><button class="btn btn-primary" type="button" id="btn-preparar-alta">' +
            'Dar de alta en catálogo</button>' +
            '<a class="btn" href="libro_detalle.html?id=' + encodeURIComponent(resultado.id_libro) +
            '">Ver ficha para etiquetado</a><a class="btn" href="libros.html">Volver a libros</a></div>' +
            '<div id="error-preparar-alta"></div>' +
            '<div class="alert alert-ok"><strong>Ficha guardada</strong>' +
            '<span>Disponible para etiquetado y entrega del libro. El alta en catálogo es el siguiente paso.</span></div>' +
            '<div class="card"><h2>Sinopsis y ejemplares</h2><p>' +
            ui.esc(datos.sinopsis || 'Sin sinopsis') + '</p>' +
            '<p class="libro-copias-registradas"><span class="label">Copias registradas:</span><strong>' +
            resultado.ejemplares.length + '</strong></p>' +
            '<p class="small muted">La disponibilidad y ubicación se consultan por ejemplar.</p></div>' +
            '<div class="card"><h2>' + ui.esc(datos.titulo) + '</h2><div class="grid-2">' +
            campo_libro_lectura('Clave', resultado.id_libro) +
            campo_libro_lectura('ISBN', datos.isbn) +
            campo_libro_lectura('Título', datos.titulo) +
            campo_libro_lectura('Autor', datos.autores) +
            campo_libro_lectura('Tema', datos.tema) +
            campo_libro_lectura('Editorial', datos.editorial) + '</div></div>';
        document.getElementById('btn-preparar-alta').addEventListener('click', preparar_alta);
    },

    confirmar_alta: function (ficha, confirmar, cancelar)
    {
        const libro = ficha.libro;
        const ejemplares = ficha.ejemplares.filter((ejemplar) => ejemplar.estatus !== 'Baja');
        const ubicaciones = [...new Set(ejemplares.map((ejemplar) => ejemplar.estante ?
            ejemplar.estante + ' / ' + ejemplar.fila : 'En línea'))];
        const condiciones = [...new Set(ejemplares.map((ejemplar) => ejemplar.condicion))];
        const disponibles = ejemplares.filter((ejemplar) => ejemplar.estatus === 'Disponible').length;
        const prestados = ejemplares.filter((ejemplar) => ejemplar.estatus === 'Prestado').length;
        document.getElementById('titulo-pagina').textContent = 'Dar de alta en catálogo';
        document.getElementById('descripcion-pagina').textContent =
            'Selecciona una ficha bibliográfica válida.';
        document.getElementById('mensaje').innerHTML =
            '<div id="error-alta"></div><div class="card"><h2>' +
            ui.esc(libro.id_libro) + '</h2><div class="grid-2">' +
            campo_libro_lectura('Título', libro.titulo) +
            campo_libro_lectura('ISBN', libro.isbn) +
            campo_libro_lectura('Formato', libro.formato) +
            campo_libro_lectura('Estante / fila', ubicaciones.length === 1 ?
                ubicaciones[0] : ubicaciones.length ? 'Varias ubicaciones' : '—') +
            campo_libro_lectura('Condición', condiciones.length === 1 ?
                condiciones[0] : condiciones.length ? 'Varias condiciones' : '—') +
            campo_libro_lectura('Disponibles / prestados', disponibles + ' / ' + prestados) +
            '</div></div>' +
            (ejemplares.length ? '' : '<div class="alert alert-warning"><strong>Falta etiquetar un ejemplar</strong>' +
                '<span>Abre la ficha y registra al menos una copia antes de confirmar el alta.</span></div>') +
            '<div class="actions"><button class="btn btn-primary" type="button" id="btn-confirmar-alta"' +
            (ejemplares.length ? '' : ' disabled') + '>Confirmar alta</button>' +
            '<button class="btn" type="button" id="btn-cancelar-alta">Cancelar</button>' +
            (ejemplares.length ? '' : '<a class="btn" href="libro_detalle.html?id=' +
                encodeURIComponent(libro.id_libro) + '">Etiquetar ejemplares</a>') + '</div>';
        document.getElementById('btn-confirmar-alta').addEventListener('click', confirmar);
        document.getElementById('btn-cancelar-alta').addEventListener('click', cancelar);
    },

    bloquear_alta: function (bloquear)
    {
        document.getElementById('btn-confirmar-alta').disabled = bloquear;
    },

    error_alta: function (mensaje)
    {
        ui.alerta('error-alta', 'error', 'No se pudo dar de alta', mensaje);
    },

    error_preparar_alta: function (mensaje)
    {
        ui.alerta('error-preparar-alta', 'error', 'No se pudo revisar la ficha', mensaje);
    },

    alta_completada: function (ficha)
    {
        const libro = ficha.libro;
        document.getElementById('titulo-pagina').textContent = 'Libro dado de alta en catálogo';
        document.getElementById('descripcion-pagina').textContent = '';
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Libro dado de alta en catálogo</strong>' +
            '<span>' + ui.esc(libro.id_libro) + ' · ' + ui.esc(libro.titulo) +
            '. Estatus Activo; disponible para consulta y préstamo.</span></div>' +
            '<div class="card"><h2>Información de la operación</h2>' +
            '<p>Libro registrado en el catálogo.</p></div>' +
            '<div class="actions"><a class="btn" href="libros.html">Ver catálogo actualizado</a>' +
            '<a class="btn" href="inicio.html">Ir al inicio</a></div>';
    }
};

/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
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
/*   libro_form_view.cambio_pendiente() */
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
        ['estante-fila-resumen', 'condicion-resumen'].forEach((id) => document.getElementById(id)
            .addEventListener('change', () => this.cambio_pendiente()));
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
        this.ubicaciones = campo_2.ubicaciones;
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
        document.getElementById('estante-fila-resumen').innerHTML = ui.opciones(campo_2.ubicaciones,
            'id', 'etiqueta', '', 'Selecciona la ubicación');
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
        const ejemplares = ficha.ejemplares.filter((ejemplar) => ejemplar.estatus !== 'Baja');
        const ubicaciones = [...new Set(ejemplares.map((ejemplar) => ejemplar.id_ubicacion))];
        const condiciones = [...new Set(ejemplares.map((ejemplar) => ejemplar.condicion)
            .filter(Boolean))];
        this.copias_base = ejemplares.length;
        this.edicion_conjunta = libro.formato === 'Físico' &&
            ejemplares.every((ejemplar) => ejemplar.estatus === 'Disponible') &&
            ubicaciones.length <= 1 && condiciones.length <= 1 &&
            (ejemplares.length === 0 || Number.isInteger(ubicaciones[0]));
        this.ubicacion_base = ubicaciones[0] || null;
        this.condicion_base = condiciones[0] || null;
        this.ubicacion_base_texto = this.ubicaciones.find((item) => item.id ===
            this.ubicacion_base)?.etiqueta || 'Sin ubicación';
        const ubicacion = document.getElementById('estante-fila-resumen');
        const condicion = document.getElementById('condicion-resumen');
        if (this.edicion_conjunta)
        {
            ubicacion.disabled = false;
            condicion.disabled = false;
            ubicacion.value = ubicaciones[0] || '';
            condicion.value = condiciones[0] || 'Bueno';
        }
        else
        {
            const resumen_ubicacion = ubicaciones.length > 1 ? 'Varias ubicaciones' :
                libro.formato === 'Digital' ? 'En línea' : ubicaciones.length ?
                    this.ubicaciones.find((item) => item.id === ubicaciones[0])?.etiqueta ||
                        'Ubicación no disponible' : 'Sin ejemplares';
            ubicacion.innerHTML = '<option>' + ui.esc(resumen_ubicacion) + '</option>';
            condicion.innerHTML = '<option>' + ui.esc(condiciones.length > 1 ?
                'Varias condiciones' : condiciones[0] || 'Sin ejemplares') + '</option>';
        }
        document.getElementById('copias').value = ejemplares.length;
        document.getElementById('menos').disabled = true;
        document.getElementById('mas').disabled = !this.edicion_conjunta;
        const ayuda = document.getElementById('ayuda-copias');
        ayuda.classList.remove('hidden');
        ayuda.textContent = this.edicion_conjunta ?
            'Para retirar una copia existente, gestiona el ejemplar e indica el motivo de baja.' :
            'Las copias tienen ubicaciones, condiciones o préstamos distintos; gestiónalas por ejemplar.';
        document.querySelectorAll('.libro-form-edit-only').forEach((campo) => campo.classList
            .remove('hidden'));
        const editar_ejemplares = document.getElementById('editar-ejemplares');
        editar_ejemplares.href = 'libro_detalle.html?id=' + encodeURIComponent(libro.id_libro) +
            '&modo=ejemplares';
        editar_ejemplares.classList.remove('hidden');
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
        document.getElementById('campo-ubicacion').classList.add('hidden');
        document.getElementById('campo-uso').classList.toggle('hidden', !this.edicion_conjunta);
        document.querySelector('#campo-uso label').textContent =
            'Tipo de uso para copias nuevas';
        this.ajustar_formato();
    },

    datos: function ()
    {
        const datos = ui.leer(CAMPOS_LIBRO);
        datos.copias = Number(document.getElementById('copias').value);
        if (this.copias_base !== undefined)
        {
            datos.copias_base = this.copias_base;
            if (this.edicion_conjunta && (this.copias_base > 0 ||
                datos.copias > this.copias_base))
            {
                datos.id_ubicacion_edicion = Number(document.getElementById(
                    'estante-fila-resumen').value) || null;
                datos.condicion_edicion = document.getElementById('condicion-resumen').value;
                datos.id_ubicacion_base = this.ubicacion_base;
                datos.condicion_base = this.condicion_base;
            }
        }
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
        const minimo = this.copias_base === undefined ? 0 : this.copias_base;
        out.value = Math.min(minimo + 50, Math.max(minimo, Number(out.value) + delta));
        document.getElementById('menos').disabled = Number(out.value) <= minimo;
        document.getElementById('mas').disabled = this.copias_base !== undefined &&
            (!this.edicion_conjunta || Number(out.value) >= minimo + 50);
        this.cambio_pendiente();
    },

    cambio_pendiente: function ()
    {
        if (this.copias_base === undefined) return;
        const destino = 'cambio-pendiente';
        if (!this.edicion_conjunta) return ui.alerta(destino);
        const ubicacion = document.getElementById('estante-fila-resumen');
        const condicion = document.getElementById('condicion-resumen').value;
        const copias = Number(document.getElementById('copias').value);
        let detalle = '';
        if (Number(ubicacion.value) !== Number(this.ubicacion_base))
        {
            detalle = 'Ubicación anterior: ' + this.ubicacion_base_texto + ' → Nueva: ' +
                ubicacion.selectedOptions[0]?.textContent + '.';
        }
        else if (condicion !== this.condicion_base)
            detalle = 'Condición anterior: ' + (this.condicion_base || 'Sin condición') +
                ' → Nueva: ' + condicion + '.';
        else if (copias !== this.copias_base)
            detalle = 'Copias actuales: ' + this.copias_base + ' → Al guardar: ' + copias + '.';
        ui.alerta(destino, detalle ? 'info' : '', detalle ? 'Cambio pendiente' : '', detalle);
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
            '&modo=etiquetado' +
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
                encodeURIComponent(libro.id_libro) + '&modo=ejemplares">Etiquetar ejemplares</a>') + '</div>';
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

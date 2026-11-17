/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libro_detalle_view.ficha(filtro, acciones) */
/*   libro_detalle_view.etiquetado(ficha) */
/*   libro_detalle_view.edicion_completada(ficha) */
/*   libro_detalle_view.formulario_baja(ficha, al_continuar) */
/*   libro_detalle_view.confirmar_baja(ficha, datos, al_confirmar) */
/*   libro_detalle_view.baja_completada(ficha) */
/*   libro_detalle_view.mostrar_ejemplares() */
/*   libro_detalle_view.dialogo_ejemplares(digital, catalogos, al_confirmar) */
/*   libro_detalle_view.dialogo_condicion(ejemplar, catalogos, digital, al_confirmar) */
/*   libro_detalle_view.dialogo_baja(ejemplar, motivos, al_confirmar) */
/*   libro_detalle_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const libro_detalle_view =
{
    edicion_completada: function (ficha)
    {
        const libro = ficha.libro;
        const vigentes = ficha.ejemplares.filter((elemento) => elemento.estatus !== 'Baja');
        const ubicaciones = [...new Set(vigentes.map((elemento) => elemento.estante ?
            elemento.estante + ' / ' + elemento.fila : 'En línea'))];
        const ubicacion = ubicaciones.length === 1 ? ubicaciones[0] :
            ubicaciones.length ? 'Varias ubicaciones' : 'Sin ejemplares';
        const primer_ejemplar = vigentes[0];
        document.getElementById('titulo-pagina').textContent = 'Libro modificado exitosamente';
        document.getElementById('descripcion-pagina').textContent = 'Ubicación vigente: ' + ubicacion;
        document.getElementById('detalle').innerHTML =
            '<div class="actions actions-top"><a class="btn btn-primary" href="libros.html">' +
            'Consultar lista actualizada</a><a class="btn" href="libros.html">Volver a libros</a></div>' +
            '<div class="alert alert-ok" role="status"><strong>Cambios guardados</strong><span>' +
            ui.esc(libro.id_libro) + ' · Ubicación ' + ui.esc(ubicacion) +
            '. Los demás datos se conservaron.</span></div>' +
            '<div class="card"><h2>Sinopsis y ejemplares</h2><p>' +
            ui.esc(libro.sinopsis || 'Sin sinopsis') + '</p><p class="libro-copias-registradas">' +
            '<span class="label">Copias registradas:</span><strong>' + vigentes.length +
            '</strong></p><p class="small muted">La disponibilidad y ubicación se consultan por ejemplar.</p></div>' +
            '<div class="ficha-resumen ficha-resumen-edicion"><div class="ficha-resumen-fila">' +
            'Clave · Título · Ubicación · Condición</div><div class="ficha-resumen-fila">' +
            ui.esc(libro.id_libro + ' · ' + libro.titulo + ' · ' + ubicacion + ' · ' +
                (primer_ejemplar ? primer_ejemplar.condicion : '—')) + '</div></div>';
    },

    formulario_baja: function (ficha, al_continuar)
    {
        const libro = ficha.libro;
        const prestados = ficha.ejemplares.filter((elemento) => elemento.estatus === 'Prestado').length;
        document.getElementById('titulo-pagina').textContent = 'Dar de baja un libro';
        document.getElementById('descripcion-pagina').textContent =
            'Selecciona el motivo. El registro conserva su historial.';
        document.getElementById('detalle').innerHTML =
            '<div class="card"><h2>' + ui.esc(libro.id_libro + ' · ' + libro.titulo) +
            '</h2><div class="grid-2"><div class="field"><label for="motivo-baja-libro">' +
            'Motivo de baja</label><select id="motivo-baja-libro" required>' +
            '<option value="">Selecciona un motivo</option>' +
            ['Perdido', 'Robado', 'Dañado', 'Obsoleto'].map((motivo) =>
                '<option value="' + motivo + '">' + motivo + '</option>').join('') +
            '</select></div><div class="field"><label for="descripcion-baja-libro">' +
            'Descripción</label><input id="descripcion-baja-libro" maxlength="200" ' +
            'placeholder="Describe el estado del libro"></div></div>' +
            '<p class="small muted">Motivos permitidos: Perdido · Robado · Dañado · Obsoleto.</p></div>' +
            (prestados ? '<div class="alert alert-warning" role="status">' +
                '<strong>No se puede dar de baja todavía</strong><span>Hay ' + prestados +
                ' ejemplar(es) prestados.</span></div>' : '') +
            '<div class="actions"><button class="btn btn-danger" id="continuar-baja"' +
            (prestados ? ' disabled' : '') + '>Continuar baja</button>' +
            '<a class="btn" href="libro_detalle.html?id=' + encodeURIComponent(libro.id_libro) +
            '">Cancelar</a></div>';
        document.getElementById('continuar-baja').addEventListener('click', () =>
        {
            const motivo = document.getElementById('motivo-baja-libro');
            if (!motivo.value)
            {
                motivo.focus();
                this.mensaje('error', 'Selecciona el motivo de baja');
                return;
            }
            ui.alerta('mensaje');
            al_continuar({ motivo: motivo.value,
                descripcion: document.getElementById('descripcion-baja-libro').value.trim() });
        });
    },

    confirmar_baja: function (ficha, datos, al_confirmar)
    {
        return ui.dialogo({
            titulo: 'Confirmar baja del libro',
            texto: ficha.libro.id_libro + ' · ' + ficha.libro.titulo + '. Motivo: ' +
                datos.motivo + '. Quedará fuera del catálogo activo y no podrá prestarse.',
            cuerpo: '<p class="small muted">El historial y el motivo quedan conservados.</p>',
            confirmar: 'Dar de baja',
            peligro: true,
            principal_primero: true,
            amplio: true,
            al_confirmar: al_confirmar
        });
    },

    baja_completada: function (ficha)
    {
        const libro = ficha.libro;
        document.getElementById('titulo-pagina').textContent = 'Libro dado de baja';
        document.getElementById('descripcion-pagina').textContent = '';
        document.getElementById('detalle').innerHTML =
            '<div class="alert alert-ok" role="status"><strong>Libro dado de baja</strong>' +
            '<span>Baja confirmada.</span></div>' +
            '<div class="card"><h2>Información de la operación</h2>' +
            '<p>El libro ya no aparece en la consulta activa ni está disponible para préstamo.</p>' +
            (libro.motivo_baja ? '<p class="small muted">' + ui.esc(libro.id_libro) +
                ' · Motivo: ' + ui.esc(libro.motivo_baja) +
                (libro.descripcion_baja ? ' · ' + ui.esc(libro.descripcion_baja) : '') +
                '</p>' : '') + '</div>' +
            '<div class="actions"><a class="btn" href="buscar.html?retirado=' +
            encodeURIComponent(libro.id_libro) + '">Comprobar exclusión en búsqueda</a>' +
            '<a class="btn" href="libros.html">Volver</a>' +
            '<a class="btn" href="inicio.html">Ir al inicio</a></div>';
    },

    etiquetado: function (ficha)
    {
        const libro = ficha.libro;
        const campo = (etiqueta, valor) =>
            '<div class="field"><span class="label">' + ui.esc(etiqueta) +
            '</span><div class="readonly">' + ui.esc(valor || '—') + '</div></div>';
        document.getElementById('titulo-pagina').textContent =
            'Ficha para etiquetado y entrega';
        document.getElementById('descripcion-pagina').textContent =
            'Clave de etiquetado al pie de la ficha. Entrega al responsable del acervo.';
        document.getElementById('detalle').innerHTML =
            '<div class="card"><h2>' + ui.esc(libro.titulo) + '</h2><div class="grid-2">' +
            campo('Clave', libro.id_libro) + campo('ISBN', libro.isbn) +
            campo('Título', libro.titulo) +
            campo('Autor', ficha.autores.map((autor) => autor.nombre).join(', ')) +
            campo('Tema', libro.tema) + campo('Editorial', libro.editorial) +
            '</div><p class="ficha-clave-etiqueta">' + ui.esc(libro.id_libro) + '</p></div>' +
            '<div class="actions"><a class="btn btn-primary" href="libro_detalle.html?id=' +
            encodeURIComponent(libro.id_libro) + '&modo=alta">Continuar al alta</a>' +
            '<a class="btn" href="libro_detalle.html?id=' +
            encodeURIComponent(libro.id_libro) + '">Volver a ficha</a></div>';
    },

    mostrar_ejemplares: function ()
    {
        const detalles = document.getElementById('detalle-acervo');
        detalles.open = true;
        detalles.scrollIntoView({ block: 'start' });
        detalles.querySelector('#btn-ejemplares')?.focus();
    },

    ficha: function (filtro, acciones)
    {
        const libro = filtro.libro;
        const lectura = (elemento, valor) => '<div class="field"><span class="label">' + elemento +
            '</span><div class="readonly">' + ui.esc(valor === null || valor === undefined ||
                valor === '' ? '—' : valor) + '</div></div>';
        const retirado = libro.estatus === 'Retirado';
        const vigente = filtro.ejemplares.filter((ejemplar) => ejemplar.estatus !== 'Baja');
        const ubicaciones = [...new Set(vigente.map((ejemplar) => ejemplar.estante ?
            ejemplar.estante + ' / ' + ejemplar.fila : 'En línea'))];
        const condiciones = [...new Set(vigente.map((ejemplar) => ejemplar.condicion))];
        const disponibles = vigente.filter((ejemplar) => ejemplar.estatus === 'Disponible').length;
        const prestados = vigente.filter((ejemplar) => ejemplar.estatus === 'Prestado').length;
        const ubicacion = ubicaciones.length === 1 ? ubicaciones[0] :
            ubicaciones.length ? 'Varias ubicaciones' : '—';
        const condicion = condiciones.length === 1 ? condiciones[0] :
            condiciones.length ? 'Varias condiciones' : '—';
        const resumen = [libro.formato, ubicacion, disponibles, prestados, condicion];

        document.getElementById('detalle').innerHTML =
            '<div class="actions ficha-main-acciones">' +
            (retirado ? '' : '<a class="btn btn-primary" href="libro_form.html?id=' +
                encodeURIComponent(libro.id_libro) + '">Modificar libro</a>') +
            (libro.estatus === 'Ficha creada' ?
                '<button class="btn" id="btn-alta">Dar de alta en catálogo</button>' : '') +
            (libro.estatus === 'Activo en catálogo' ?
                '<button class="btn btn-danger" id="btn-retirar">Dar de baja libro</button>' : '') +
            (retirado ? '' :
                '<button class="btn" id="btn-condicion-global"' +
                (vigente.length ? '' : ' disabled') + '>Cambiar condición</button>') +
            '</div>' +
            (libro.estatus === 'Activo en catálogo' ?
                '<div class="actions ficha-main-acciones-secundarias"><button class="btn" ' +
                'id="btn-disponibilidad-externa" type="button">Disponibilidad en otra biblioteca' +
                '</button></div>' : '') +
            '<div class="card ficha-main-card"><h2>' + ui.esc(libro.titulo) +
            '</h2><div class="grid-2">' +
            lectura('Clave', libro.id_libro) + lectura('ISBN', libro.isbn) +
            lectura('Título', libro.titulo) +
            lectura('Autor', filtro.autores.map((autor) => autor.nombre).join(', ')) +
            lectura('Tema', libro.tema) + lectura('Editorial', libro.editorial) +
            '</div></div>' +
            '<div class="card ficha-main-sinopsis"><h2>Sinopsis y ejemplares</h2><p>' +
            ui.esc(libro.sinopsis || 'Sin sinopsis') +
            '</p><p class="libro-copias-registradas"><span class="label">Copias registradas:</span>' +
            '<strong>' + vigente.length + '</strong></p>' +
            '<p class="small muted">La disponibilidad y ubicación se consultan por ejemplar.</p></div>' +
            '<div class="ficha-resumen" aria-label="Resumen de disponibilidad">' +
            '<div class="ficha-resumen-fila">' +
            ['Formato', 'Ubicación', 'Disponibles', 'Prestados', 'Condición'].map((texto) =>
                '<span>' + texto + '</span>').join('') + '</div>' +
            '<div class="ficha-resumen-fila">' + resumen.map((valor) =>
                '<span title="' + ui.esc(valor) + '">' + ui.esc(valor) + '</span>').join('') +
            '</div></div>' +
            '<details class="card ficha-detalles" id="detalle-acervo"><summary>Datos adicionales y ejemplares</summary>' +
            '<div class="grid-2">' +
            lectura('Edición · Año', (libro.edicion || '—') + ' · ' + (libro.anio_publicacion ||
            '—')) + lectura('Páginas', libro.paginas) +
            lectura('Precio última compra', libro.precio_ultima_compra_usd ? '$' + Number(libro
                .precio_ultima_compra_usd).toFixed(2) + ' USD' : 'Sin confirmar por Tesorería') +
            lectura('Alta en catálogo', ui.fecha(libro.fecha_alta_catalogo)) +
            (libro.enlace_digital ?
                '<div class="field span-2"><span class="label">Enlace digital</span><div class="readonly"><a href="' +
                ui.esc(libro.enlace_digital) + '" target="_blank" rel="noopener">' + ui.esc(libro
                    .enlace_digital) + '</a></div></div>' : '') +
            '</div><h3>Ejemplares (' + vigente.length + ' vigentes)</h3>' +
            (retirado ? '' : '<div class="actions"><button class="btn" id="btn-ejemplares">' +
                'Etiquetar ejemplares</button></div>') +
            '<div id="tabla-ejemplares"></div>' +
            '<div class="actions"><a class="btn" href="libros.html">Volver al catálogo</a></div></details>';

        ui.tabla('tabla-ejemplares',
            [
            {
                titulo: 'Ejemplar',
                valor: (elemento_3) => '<strong>' + ui.esc(elemento_3.id_ejemplar) +
                    '</strong>'
            },
            {
                titulo: 'Ubicación',
                valor: (elemento_4) => elemento_4.estante ? ui.esc((elemento_4.seccion ?
                        elemento_4.seccion + ' · ' : '') + elemento_4.estante + ' / ' +
                    elemento_4.fila) : 'En línea'
            },
            {
                titulo: 'Uso',
                valor: (elemento_5) => ui.esc(elemento_5.tipo_uso)
            },
            {
                titulo: 'Condición',
                valor: (elemento_6) => ui.badge(elemento_6.condicion)
            },
            {
                titulo: 'Estatus',
                valor: (elemento_7) => ui.badge(elemento_7.estatus) + (elemento_7.prestado_a ?
                    '<div class="small muted">' + ui.esc(elemento_7.prestado_a) +
                    ' · vence ' + ui.fecha(elemento_7.vence) + '</div>' : '')
            },
            {
                titulo: '',
                valor: (elemento_8) => elemento_8.estatus === 'Baja' || retirado ? '' :
                    '<div class="row-actions">' +
                    '<button class="btn btn-sm" data-condicion="' + ui.esc(elemento_8
                        .id_ejemplar) + '">Cambiar condición</button>' +
                    '<button class="btn btn-sm btn-danger" data-baja="' + ui.esc(elemento_8
                        .id_ejemplar) + '">Baja</button></div>'
            }], filtro.ejemplares,
            {
                vacio: 'Aún no hay ejemplares etiquetados'
            });

        const enlazar = (id, accion) =>
        {
            const boton = document.getElementById(id);
            if (boton) boton.addEventListener('click', accion);
        };
        enlazar('btn-alta', acciones.alta);
        enlazar('btn-ejemplares', acciones.ejemplares);
        enlazar('btn-retirar', acciones.retirar);
        enlazar('btn-disponibilidad-externa', () => this.mensaje('info',
            'Disponibilidad en otra biblioteca',
            'Aún no hay un catálogo externo conectado. Consulta aquí la disponibilidad de Biblioteca Ducky.'));
        enlazar('btn-condicion-global', () =>
        {
            this.mostrar_ejemplares();
            document.querySelector('[data-condicion]')?.focus();
        });
        const buscar = (id) => filtro.ejemplares.find((elemento_9) => elemento_9.id_ejemplar === id);
        document.querySelectorAll('[data-condicion]').forEach((boton_2) => boton_2.addEventListener(
            'click', () => acciones.condicion(buscar(boton_2.dataset.condicion))));
        document.querySelectorAll('[data-baja]').forEach((boton_3) => boton_3.addEventListener(
            'click', () => acciones.baja(buscar(boton_3.dataset.baja))));
    },

    dialogo_ejemplares: function (digital, catalogos, al_confirmar)
    {
        return ui.dialogo(
        {
            titulo: 'Etiquetar ejemplares',
            texto: digital ? 'Se crea un acceso de préstamo digital por cada copia.' :
                'Cada copia recibe su clave de etiqueta (L000000-NN).',
            cuerpo: '<div class="grid-2"><div class="field"><label for="cantidad">Número de copias</label><input id="cantidad" type="number" min="1" max="50" value="1"></div>' +
                (digital ? '' :
                    '<div class="field"><label for="tipo_uso">Tipo de uso</label><select id="tipo_uso"><option>Préstamo externo</option><option>Préstamo en sala</option><option>Reservado</option></select></div>' +
                    '<div class="field span-2"><label for="id_ubicacion">Ubicación</label><select id="id_ubicacion">' +
                    ui.opciones(catalogos.ubicaciones, 'id', 'etiqueta', '',
                        'Selecciona la ubicación') + '</select></div>') +
                '</div>',
            confirmar: 'Etiquetar',
            al_confirmar: (datos) => al_confirmar(
            {
                cantidad: Number(datos.querySelector('#cantidad').value),
                tipo_uso: datos.querySelector('#tipo_uso') ? datos.querySelector(
                    '#tipo_uso').value : undefined,
                id_ubicacion: datos.querySelector('#id_ubicacion') ? datos
                    .querySelector('#id_ubicacion').value : undefined
            })
        });
    },

    dialogo_condicion: function (ejemplar, catalogos, digital, al_confirmar)
    {
        const opciones = (lista, actual) => lista.map((opciones) => '<option' + (opciones === actual ? ' selected' :
            '') + '>' + opciones + '</option>').join('');
        return ui.dialogo(
        {
            titulo: 'Cambiar condición del libro',
            texto: 'Ejemplar ' + ejemplar.id_ejemplar +
                '. Marca si es reservado, de consulta en sala o de préstamo externo.',
            cuerpo: '<div class="grid-2"><div class="field"><label for="condicion">Condición</label><select id="condicion">' +
                opciones(['Bueno', 'Regular', 'Dañado'], ejemplar.condicion) +
                '</select></div>' +
                (digital ? '' :
                    '<div class="field"><label for="tipo_uso">Tipo de uso</label><select id="tipo_uso">' +
                    opciones(['Préstamo externo', 'Préstamo en sala', 'Reservado'], ejemplar
                        .tipo_uso) + '</select></div>' +
                    '<div class="field span-2"><label for="id_ubicacion">Ubicación</label><select id="id_ubicacion">' +
                    ui.opciones(catalogos.ubicaciones, 'id', 'etiqueta', ejemplar
                        .id_ubicacion) + '</select></div>') +
                '</div>',
            confirmar: 'Guardar condición',
            al_confirmar: (datos_2) => al_confirmar(
            {
                condicion: datos_2.querySelector('#condicion').value,
                tipo_uso: datos_2.querySelector('#tipo_uso') ? datos_2.querySelector(
                    '#tipo_uso').value : undefined,
                id_ubicacion: datos_2.querySelector('#id_ubicacion') ? datos_2
                    .querySelector('#id_ubicacion').value : undefined
            })
        });
    },

    dialogo_baja: function (ejemplar, motivos, al_confirmar)
    {
        return ui.dialogo(
        {
            titulo: 'Baja del ejemplar ' + ejemplar.id_ejemplar,
            texto: 'El ejemplar se retira definitivamente; su historial se conserva.',
            cuerpo: '<div class="field"><label for="id_motivo">Motivo</label><select id="id_motivo">' +
                ui.opciones(motivos, 'id', 'descripcion', '', 'Selecciona el motivo') +
                '</select></div>' +
                '<div class="field" style="margin-top:12px"><label for="descripcion">Detalle</label><textarea id="descripcion" maxlength="200" placeholder="Obligatorio si el motivo es Otro"></textarea></div>',
            confirmar: 'Dar de baja',
            peligro: true,
            al_confirmar: (datos_3) => al_confirmar(datos_3.querySelector('#id_motivo').value,
                datos_3.querySelector('#descripcion').value)
        });
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

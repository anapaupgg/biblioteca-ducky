/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libro_detalle_view.ficha(filtro, acciones) */
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
    ficha: function (filtro, acciones)
    {
        const libro = filtro.libro;
        const lectura = (elemento, valor) => '<div class="field"><span class="label">' + elemento +
            '</span><div class="readonly">' + ui.esc(valor === null || valor === undefined ||
                valor === '' ? '—' : valor) + '</div></div>';
        const retirado = libro.estatus === 'Retirado';

        document.getElementById('detalle').innerHTML =
            '<div class="actions">' +
            (retirado ? '' : '<a class="btn btn-primary" href="libro_form.html?id=' +
                encodeURIComponent(libro.id_libro) + '">Modificar libro</a>') +
            (libro.estatus === 'Ficha creada' ?
                '<button class="btn btn-gold" id="btn-alta">Dar de alta en catálogo</button>' : '') +
            (retirado ? '' :
            '<button class="btn" id="btn-ejemplares">Etiquetar ejemplares</button>') +
            (retirado ? '' :
                '<button class="btn btn-danger" id="btn-retirar">Dar de baja libro</button>') +
            '<a class="btn" href="libros.html">Volver al catálogo</a></div>' +

            '<div class="card"><h2>' + ui.esc(libro.titulo) + ' ' + ui.badge(libro.estatus) +
            '</h2><div class="grid-2">' +
            lectura('Clave', libro.id_libro) + lectura('ISBN', libro.isbn) +
            lectura('Autor(es)', filtro.autores.map((primero) => primero.nombre + (primero
                .es_principal ? ' (principal)' : '')).join(', ')) + lectura('Editorial', libro
                .editorial) +
            lectura('Tema', libro.tema) + lectura('Formato', libro.formato) +
            lectura('Edición · Año', (libro.edicion || '—') + ' · ' + (libro.anio_publicacion ||
            '—')) + lectura('Páginas', libro.paginas) +
            lectura('Precio última compra', libro.precio_ultima_compra_usd ? '$' + Number(libro
                .precio_ultima_compra_usd).toFixed(2) + ' USD' : 'Sin confirmar por Tesorería') +
            lectura('Alta en catálogo', ui.fecha(libro.fecha_alta_catalogo)) +
            (libro.enlace_digital ?
                '<div class="field span-2"><span class="label">Enlace digital</span><div class="readonly"><a href="' +
                ui.esc(libro.enlace_digital) + '" target="_blank" rel="noopener">' + ui.esc(libro
                    .enlace_digital) + '</a></div></div>' : '') +
            '</div><h3 style="margin-top:20px">Sinopsis</h3><p class="muted">' + ui.esc(libro
                .sinopsis || 'Sin sinopsis') + '</p></div>' +

            '<div class="card"><h2>Ejemplares (' + filtro.ejemplares.filter((elemento_2) => elemento_2
                .estatus !== 'Baja').length +
            ' vigentes)</h2><div id="tabla-ejemplares"></div></div>';

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

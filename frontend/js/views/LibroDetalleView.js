/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de libro_detalle.html.                      */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   LibroDetalleView.ficha(f, acciones)            - Draw all    */
/*   LibroDetalleView.dialogo_ejemplares(c, cb)     - Label copies*/
/*   LibroDetalleView.dialogo_condicion(e, c, cb)   - Condition   */
/*   LibroDetalleView.dialogo_baja(e, motivos, cb)  - Copy baja   */
/******************************************************************/

const LibroDetalleView =
{
    ficha: function(f, acciones)
    {
        const l = f.libro;
        const lectura = (t, v) => '<div class="field"><span class="label">' + t + '</span><div class="readonly">' + Ui.esc(v === null || v === undefined || v === '' ? '—' : v) + '</div></div>';
        const retirado = l.estatus === 'Retirado';

        document.getElementById('detalle').innerHTML =
            '<div class="actions">' +
            (retirado ? '' : '<a class="btn btn-primary" href="libro_form.html?id=' + encodeURIComponent(l.id_libro) + '">Modificar libro</a>') +
            (l.estatus === 'Ficha creada' ? '<button class="btn btn-gold" id="btn-alta">Dar de alta en catálogo</button>' : '') +
            (retirado ? '' : '<button class="btn" id="btn-ejemplares">Etiquetar ejemplares</button>') +
            (retirado ? '' : '<button class="btn btn-danger" id="btn-retirar">Dar de baja libro</button>') +
            '<a class="btn" href="libros.html">Volver al catálogo</a></div>' +

            '<div class="card"><h2>' + Ui.esc(l.titulo) + ' ' + Ui.badge(l.estatus) + '</h2><div class="grid-2">' +
            lectura('Clave', l.id_libro) + lectura('ISBN', l.isbn) +
            lectura('Autor(es)', f.autores.map((a) => a.nombre + (a.es_principal ? ' (principal)' : '')).join(', ')) + lectura('Editorial', l.editorial) +
            lectura('Tema', l.tema) + lectura('Formato', l.formato) +
            lectura('Edición · Año', (l.edicion || '—') + ' · ' + (l.anio_publicacion || '—')) + lectura('Páginas', l.paginas) +
            lectura('Precio última compra', l.precio_ultima_compra_usd ? '$' + Number(l.precio_ultima_compra_usd).toFixed(2) + ' USD' : 'Sin confirmar por Tesorería') +
            lectura('Alta en catálogo', Ui.fecha(l.fecha_alta_catalogo)) +
            (l.enlace_digital ? '<div class="field span-2"><span class="label">Enlace digital</span><div class="readonly"><a href="' + Ui.esc(l.enlace_digital) + '" target="_blank" rel="noopener">' + Ui.esc(l.enlace_digital) + '</a></div></div>' : '') +
            '</div><h3 style="margin-top:20px">Sinopsis</h3><p class="muted">' + Ui.esc(l.sinopsis || 'Sin sinopsis') + '</p></div>' +

            '<div class="card"><h2>Ejemplares (' + f.ejemplares.filter((e) => e.estatus !== 'Baja').length + ' vigentes)</h2><div id="tabla-ejemplares"></div></div>';

        Ui.tabla('tabla-ejemplares',
        [
            { titulo: 'Ejemplar',  valor: (e) => '<strong>' + Ui.esc(e.id_ejemplar) + '</strong>' },
            { titulo: 'Ubicación', valor: (e) => e.estante ? Ui.esc((e.seccion ? e.seccion + ' · ' : '') + e.estante + ' / ' + e.fila) : 'En línea' },
            { titulo: 'Uso',       valor: (e) => Ui.esc(e.tipo_uso) },
            { titulo: 'Condición', valor: (e) => Ui.badge(e.condicion) },
            { titulo: 'Estatus',   valor: (e) => Ui.badge(e.estatus) + (e.prestado_a ? '<div class="small muted">' + Ui.esc(e.prestado_a) + ' · vence ' + Ui.fecha(e.vence) + '</div>' : '') },
            { titulo: '',          valor: (e) => e.estatus === 'Baja' || retirado ? '' : '<div class="row-actions">' +
                '<button class="btn btn-sm" data-condicion="' + Ui.esc(e.id_ejemplar) + '">Cambiar condición</button>' +
                '<button class="btn btn-sm btn-danger" data-baja="' + Ui.esc(e.id_ejemplar) + '">Baja</button></div>' }
        ], f.ejemplares, { vacio: 'Aún no hay ejemplares etiquetados' });

        const enlazar = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', fn); };
        enlazar('btn-alta', acciones.alta);
        enlazar('btn-ejemplares', acciones.ejemplares);
        enlazar('btn-retirar', acciones.retirar);
        const buscar = (id) => f.ejemplares.find((e) => e.id_ejemplar === id);
        document.querySelectorAll('[data-condicion]').forEach((b) => b.addEventListener('click', () => acciones.condicion(buscar(b.dataset.condicion))));
        document.querySelectorAll('[data-baja]').forEach((b) => b.addEventListener('click', () => acciones.baja(buscar(b.dataset.baja))));
    },

    dialogo_ejemplares: function(digital, catalogos, al_confirmar)
    {
        return Ui.dialogo(
        {
            titulo: 'Etiquetar ejemplares',
            texto: digital ? 'Se crea un acceso de préstamo digital por cada copia.' : 'Cada copia recibe su clave de etiqueta (L000000-NN).',
            cuerpo: '<div class="grid-2"><div class="field"><label for="cantidad">Número de copias</label><input id="cantidad" type="number" min="1" max="50" value="1"></div>' +
                (digital ? '' :
                '<div class="field"><label for="tipo_uso">Tipo de uso</label><select id="tipo_uso"><option>Préstamo externo</option><option>Préstamo en sala</option><option>Reservado</option></select></div>' +
                '<div class="field span-2"><label for="id_ubicacion">Ubicación</label><select id="id_ubicacion">' + Ui.opciones(catalogos.ubicaciones, 'id', 'etiqueta', '', 'Selecciona la ubicación') + '</select></div>') +
                '</div>',
            confirmar: 'Etiquetar',
            al_confirmar: (d) => al_confirmar(
            {
                cantidad: Number(d.querySelector('#cantidad').value),
                tipo_uso: d.querySelector('#tipo_uso') ? d.querySelector('#tipo_uso').value : undefined,
                id_ubicacion: d.querySelector('#id_ubicacion') ? d.querySelector('#id_ubicacion').value : undefined
            })
        });
    },

    dialogo_condicion: function(ejemplar, catalogos, digital, al_confirmar)
    {
        const opciones = (lista, actual) => lista.map((o) => '<option' + (o === actual ? ' selected' : '') + '>' + o + '</option>').join('');
        return Ui.dialogo(
        {
            titulo: 'Cambiar condición del libro',
            texto: 'Ejemplar ' + ejemplar.id_ejemplar + '. Marca si es reservado, de consulta en sala o de préstamo externo.',
            cuerpo: '<div class="grid-2"><div class="field"><label for="condicion">Condición</label><select id="condicion">' + opciones(['Bueno', 'Regular', 'Dañado'], ejemplar.condicion) + '</select></div>' +
                (digital ? '' :
                '<div class="field"><label for="tipo_uso">Tipo de uso</label><select id="tipo_uso">' + opciones(['Préstamo externo', 'Préstamo en sala', 'Reservado'], ejemplar.tipo_uso) + '</select></div>' +
                '<div class="field span-2"><label for="id_ubicacion">Ubicación</label><select id="id_ubicacion">' + Ui.opciones(catalogos.ubicaciones, 'id', 'etiqueta', ejemplar.id_ubicacion) + '</select></div>') +
                '</div>',
            confirmar: 'Guardar condición',
            al_confirmar: (d) => al_confirmar(
            {
                condicion: d.querySelector('#condicion').value,
                tipo_uso: d.querySelector('#tipo_uso') ? d.querySelector('#tipo_uso').value : undefined,
                id_ubicacion: d.querySelector('#id_ubicacion') ? d.querySelector('#id_ubicacion').value : undefined
            })
        });
    },

    dialogo_baja: function(ejemplar, motivos, al_confirmar)
    {
        return Ui.dialogo(
        {
            titulo: 'Baja del ejemplar ' + ejemplar.id_ejemplar,
            texto: 'El ejemplar se retira definitivamente; su historial se conserva.',
            cuerpo: '<div class="field"><label for="id_motivo">Motivo</label><select id="id_motivo">' + Ui.opciones(motivos, 'id', 'descripcion', '', 'Selecciona el motivo') + '</select></div>' +
                    '<div class="field" style="margin-top:12px"><label for="descripcion">Detalle</label><textarea id="descripcion" maxlength="200" placeholder="Obligatorio si el motivo es Otro"></textarea></div>',
            confirmar: 'Dar de baja',
            peligro: true,
            al_confirmar: (d) => al_confirmar(d.querySelector('#id_motivo').value, d.querySelector('#descripcion').value)
        });
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); }
};

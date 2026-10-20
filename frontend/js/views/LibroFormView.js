/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: View of libro_form.html (create / edit).          */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   LibroFormView.catalogos(c)        - Datalists and locations  */
/*   LibroFormView.modo_edicion(f)     - Fill the form to edit    */
/*   LibroFormView.datos()             - Form values              */
/*   LibroFormView.ajustar_formato()   - Digital vs physical      */
/*   LibroFormView.copias(delta)       - Stepper                  */
/*   LibroFormView.creado(r)           - Ficha created message    */
/******************************************************************/

const CAMPOS_LIBRO = ['titulo', 'isbn', 'autores', 'editorial', 'tema', 'formato', 'edicion', 'anio_publicacion',
                      'paginas', 'precio_ultima_compra_usd', 'enlace_digital', 'sinopsis', 'id_ubicacion', 'tipo_uso'];

const LibroFormView =
{
    catalogos: function(c)
    {
        const lista = (id, items) => { document.getElementById(id).innerHTML = items.map((i) => '<option value="' + Ui.esc(i.nombre) + '">').join(''); };
        lista('lista-autores', c.autores);
        lista('lista-editoriales', c.editoriales);
        lista('lista-temas', c.temas);
        document.getElementById('id_ubicacion').innerHTML = Ui.opciones(c.ubicaciones, 'id', 'etiqueta', '', 'Selecciona la ubicación');
    },

    modo_edicion: function(ficha)
    {
        const l = ficha.libro;
        document.getElementById('titulo-pagina').textContent = 'Modificar libro del catálogo · ' + l.id_libro;
        document.getElementById('btn-guardar').textContent = 'Guardar cambios';
        document.getElementById('btn-cancelar').href = 'libro_detalle.html?id=' + encodeURIComponent(l.id_libro);
        const valores =
        {
            titulo: l.titulo, isbn: l.isbn, autores: ficha.autores.map((a) => a.nombre).join(', '), editorial: l.editorial,
            tema: l.tema, formato: l.formato, edicion: l.edicion, anio_publicacion: l.anio_publicacion, paginas: l.paginas,
            precio_ultima_compra_usd: l.precio_ultima_compra_usd, enlace_digital: l.enlace_digital, sinopsis: l.sinopsis
        };
        Object.entries(valores).forEach(([k, v]) => { document.getElementById(k).value = v === null || v === undefined ? '' : v; });
        document.getElementById('isbn').readOnly = true;
        document.getElementById('formato').disabled = true;
        document.getElementById('card-copias').classList.add('hidden');
        this.ajustar_formato();
    },

    datos: function()
    {
        const d = Ui.leer(CAMPOS_LIBRO);
        d.copias = Number(document.getElementById('copias').value);
        return d;
    },

    ajustar_formato: function()
    {
        const digital = document.getElementById('formato').value === 'Digital';
        document.getElementById('campo-enlace').style.display = digital ? '' : 'none';
        document.getElementById('campo-ubicacion').style.display = digital ? 'none' : '';
        document.getElementById('campo-uso').style.display = digital ? 'none' : '';
    },

    copias: function(delta)
    {
        const out = document.getElementById('copias');
        out.value = Math.min(50, Math.max(0, Number(out.value) + delta));
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); },

    creado: function(r)
    {
        document.getElementById('form-libro').classList.add('hidden');
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Ficha bibliográfica creada · ' + Ui.esc(r.id_libro) + '</strong>' +
            '<span>' + (r.ejemplares.length ? 'Ejemplares etiquetados: ' + Ui.esc(r.ejemplares.join(', ')) + '.' : 'Sin ejemplares todavía.') +
            ' La ficha queda en estatus "Ficha creada" hasta darla de alta en el catálogo.</span></div>' +
            '<div class="actions"><a class="btn btn-primary" href="libro_detalle.html?id=' + encodeURIComponent(r.id_libro) + '">Ver ficha y dar de alta</a>' +
            '<a class="btn" href="libro_form.html">Registrar otra ficha</a><a class="btn" href="libros.html">Volver al catálogo</a></div>';
    }
};

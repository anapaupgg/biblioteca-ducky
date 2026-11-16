/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   perfiles_view.enlazar(acciones) */
/*   perfiles_view.enlazar_formulario(guardar) */
/*   perfiles_view.tabla(perfiles) */
/*   perfiles_view.formulario(funciones, perfil) */
/*   perfiles_view.datos() */
/*   perfiles_view.marcar_funciones(si) */
/*   perfiles_view.cerrar_formulario() */
/*   perfiles_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const perfiles_view =
{
    enlazar: function (acciones)
    {
        this.acciones = acciones;
        document.getElementById('btn-nuevo').addEventListener('click', acciones.crear);
        document.getElementById('btn-editar-perfil').addEventListener('click', () =>
            this.con_perfil(acciones.editar));
        document.getElementById('btn-eliminar-perfil').addEventListener('click', () =>
            this.con_perfil(acciones.eliminar));
        document.getElementById('btn-reactivar-perfil').addEventListener('click', () =>
            this.con_perfil(acciones.reactivar));
    },
    con_perfil: function (accion)
    {
        const perfil = this.perfiles?.find((registro) => registro.id === this.id_seleccionado);
        if (perfil) accion(perfil);
    },
    enlazar_formulario: function (guardar)
    {
        document.getElementById('form-perfil').addEventListener('submit', evento =>
        {
            evento.preventDefault();
            guardar();
        });
        document.getElementById('btn-cancelar').addEventListener('click', () => this
            .cerrar_formulario());
    },
    tabla: function (perfiles)
    {
        this.perfiles = perfiles;
        if (!perfiles.some((perfil) => perfil.id === this.id_seleccionado))
            this.id_seleccionado = null;
        document.getElementById('tabla').innerHTML =
            '<div class="perfiles-lista" role="listbox" aria-label="Perfiles disponibles">' +
            '<div class="perfiles-fila perfiles-encabezado" aria-hidden="true">' +
            '<span>Perfil · Descripción · Funciones · Usuarios · Estatus</span></div>' +
            perfiles.map((perfil) =>
            {
                const resumen = perfil.funciones.length > 3 ?
                    perfil.funciones.length + ' funciones' : perfil.funciones.join(', ');
                const texto = [perfil.nombre, perfil.descripcion || '—', resumen,
                    perfil.usuarios, perfil.estatus].join(' · ');
                return '<button type="button" role="option" class="perfiles-fila perfiles-registro"' +
                    ' data-perfil="' + perfil.id + '" aria-selected="' +
                    (perfil.id === this.id_seleccionado) + '" title="' + ui.esc(texto) + '">' +
                    '<span>' + ui.esc(texto) + '</span></button>';
            }).join('') + '</div>';
        document.querySelectorAll('[data-perfil]').forEach((fila) =>
            fila.addEventListener('click', () =>
            {
                this.id_seleccionado = Number(fila.dataset.perfil);
                document.querySelectorAll('[data-perfil]').forEach((otra) =>
                    otra.setAttribute('aria-selected', String(otra === fila)));
                this.actualizar_acciones();
            }));
        this.actualizar_acciones();
    },

    actualizar_acciones: function ()
    {
        const perfil = this.perfiles?.find((registro) => registro.id === this.id_seleccionado);
        const editable = perfil && perfil.id !== 1;
        const activo = editable && perfil.estatus === 'Activo';
        const reactivar = document.getElementById('btn-reactivar-perfil');
        document.getElementById('btn-editar-perfil').disabled = !activo;
        document.getElementById('btn-eliminar-perfil').disabled = !activo;
        document.getElementById('btn-eliminar-perfil').textContent = activo ?
            'Eliminar ' + perfil.nombre : 'Eliminar perfil';
        reactivar.classList.toggle('hidden', !editable || perfil.estatus !== 'Inactivo');
        reactivar.disabled = !editable || perfil.estatus !== 'Inactivo';
    },

    formulario: function (funciones, perfil)
    {
        const nombres_figma = ['Gestionar usuarios', 'Gestionar libros', 'Buscar libros',
            'Préstamos', 'Devoluciones', 'Chatbot'];
        const principales = nombres_figma.flatMap((nombre) =>
            funciones.filter((funcion) => funcion.nombre === nombre));
        const adicionales = funciones.filter((funcion) =>
            !nombres_figma.includes(funcion.nombre));
        const casillas = (lista) => lista.map((funcion) =>
            '<label class="check"><input type="checkbox" value="' + funcion.id + '"' +
            (perfil && perfil.ids_funciones.includes(funcion.id) ? ' checked' : '') + '>' +
            ui.esc(funcion.nombre) + '</label>').join('');
        document.getElementById('tabla').classList.add('hidden');
        document.getElementById('acciones-perfiles').classList.add('hidden');
        document.getElementById('perfiles-titulo').textContent = perfil ?
            'Modificar perfil' : 'Crear perfil';
        document.getElementById('perfiles-descripcion').textContent = perfil ?
            'Actualiza las funciones autorizadas del perfil.' :
            'Selecciona al menos una función. El nombre debe ser único.';
        const panel = document.getElementById('formulario');
        panel.classList.remove('hidden');
        panel.innerHTML =
            '<form id="form-perfil" novalidate>' +
            '<div class="card"><h2>' + (perfil ? 'Editar perfil ' + ui.esc(perfil.nombre) :
                'Datos del perfil') + '</h2>' +
            '<div class="grid-2">' +
            '<div class="field"><label for="nombre">Nombre del perfil</label><input id="nombre" maxlength="50" placeholder="Ej. Investigador"' +
            (perfil ? ' value="' + ui.esc(perfil.nombre) + '" readonly' : '') + '></div>' +
            '<div class="field"><label for="descripcion">Descripción</label><input id="descripcion" maxlength="200" placeholder="Ej. Consulta avanzada del acervo" value="' +
            ui.esc(perfil ? perfil.descripcion || '' : '') + '"></div></div></div>' +
            '<div class="card perfiles-formulario"><h2>Funciones autorizadas</h2><div id="funciones">' +
            '<div class="checks">' + casillas(principales) + '</div>' +
            '<p class="small muted">Préstamos, Devoluciones y Chatbot pertenecen al sistema completo; su selección configura el perfil. La cuota de libros se define como política general.</p>' +
            (adicionales.length ? '<details class="perfiles-adicionales"><summary>Funciones adicionales</summary>' +
                '<div class="checks">' + casillas(adicionales) + '</div></details>' : '') +
            '</div></div>' +
            '<div class="actions"><button class="btn btn-primary" type="submit">Guardar perfil</button>' +
            '<button class="btn" type="button" id="btn-cancelar">Cancelar</button></div></form>';
        document.getElementById(perfil ? 'descripcion' : 'nombre').focus();
    },

    datos: function ()
    {
        return (
        {
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            funciones: [...document.querySelectorAll('#funciones input:checked')].map((campo) =>
                Number(campo.value))
        });
    },

    marcar_funciones: function (si)
    {
        document.getElementById('funciones').closest('.card').style.borderColor = si ?
            'var(--color-red)' : '';
    },

    cerrar_formulario: function ()
    {
        const panel = document.getElementById('formulario');
        panel.classList.add('hidden');
        panel.innerHTML = '';
        document.getElementById('tabla').classList.remove('hidden');
        document.getElementById('acciones-perfiles').classList.remove('hidden');
        document.getElementById('perfiles-titulo').textContent = 'Perfiles y permisos';
        document.getElementById('perfiles-descripcion').textContent =
            'Asigna funciones a cada perfil y controla su disponibilidad.';
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

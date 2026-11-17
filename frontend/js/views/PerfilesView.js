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
/*   perfiles_view.funciones_disponibles(si) */
/*   perfiles_view.formulario(funciones, perfil) */
/*   perfiles_view.datos() */
/*   perfiles_view.marcar_funciones(si) */
/*   perfiles_view.nombre_duplicado(nombre) */
/*   perfiles_view.nombre_obligatorio() */
/*   perfiles_view.funciones_obligatorias() */
/*   perfiles_view.bloqueo_eliminacion(perfil, usuarios, puede_editar, volver) */
/*   perfiles_view.exito_creacion(perfil, administrador, volver) */
/*   perfiles_view.exito_eliminacion(perfil, administrador, volver) */
/*   perfiles_view.volver_lista() */
/*   perfiles_view.corregir_perfil() */
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
    funciones_disponibles: function (si)
    {
        this.catalogo_disponible = si;
        document.getElementById('btn-nuevo').disabled = !si;
        this.actualizar_acciones();
    },
    enlazar_formulario: function (guardar)
    {
        document.getElementById('form-perfil').addEventListener('submit', evento =>
        {
            evento.preventDefault();
            if (this.error_resumen_activo) this.corregir_perfil();
            else guardar();
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
        document.getElementById('btn-editar-perfil').disabled = !activo ||
            !this.catalogo_disponible;
        document.getElementById('btn-eliminar-perfil').disabled = !activo;
        document.getElementById('btn-eliminar-perfil').textContent = activo ?
            'Eliminar ' + perfil.nombre : 'Eliminar perfil';
        reactivar.classList.toggle('hidden', !editable || perfil.estatus !== 'Inactivo');
        reactivar.disabled = !editable || perfil.estatus !== 'Inactivo';
    },

    formulario: function (funciones, perfil)
    {
        this.error_resumen_activo = false;
        document.body.classList.remove('perfil-error-resumen', 'perfil-error-funciones');
        const nombres_figma = ['Gestionar usuarios', 'Gestionar libros', 'Buscar libros',
            'Préstamos', 'Devoluciones', 'Chatbot'];
        const principales = nombres_figma.flatMap((nombre) =>
            funciones.filter((funcion) => funcion.nombre === nombre));
        const adicionales = funciones.filter((funcion) =>
            !nombres_figma.includes(funcion.nombre));
        const casillas = (lista) => lista.map((funcion) =>
            '<label class="check"><input type="checkbox" value="' + funcion.id + '"' +
            (perfil && perfil.ids_funciones.includes(funcion.id) ? ' checked' : '') + '>' +
            '<span>' + ui.esc(funcion.nombre) + '</span></label>').join('');
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
            '<div class="field"><label for="nombre">Nombre del perfil</label><input id="nombre" maxlength="50" placeholder="Ej. Alumno"' +
            (perfil ? ' value="' + ui.esc(perfil.nombre) + '" readonly' : '') + '></div>' +
            '<div class="field"><label for="descripcion">Descripción</label><input id="descripcion" maxlength="200" placeholder="Ej. Consulta avanzada del acervo" value="' +
            ui.esc(perfil ? perfil.descripcion || '' : '') + '"></div></div></div>' +
            '<div class="card perfiles-formulario"><h2>Funciones autorizadas</h2><div id="funciones">' +
            '<div class="checks">' + casillas(principales) + '</div>' +
            '<p class="small muted">Préstamos, Devoluciones y Chatbot pertenecen al sistema completo; su selección configura el perfil. La cuota de libros se define como política general.</p>' +
            '</div></div>' +
            '<div class="actions"><button class="btn btn-primary" type="submit">Guardar perfil</button>' +
            '<button class="btn" type="button" id="btn-cancelar">Cancelar</button></div>' +
            (adicionales.length ? '<details class="perfiles-adicionales"><summary>Funciones adicionales</summary>' +
                '<div class="checks">' + casillas(adicionales) + '</div></details>' : '') +
            '</form>';
        document.getElementById(perfil ? 'descripcion' : 'nombre').focus();
    },

    datos: function ()
    {
        return (
        {
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            funciones: [...document.querySelectorAll('#form-perfil input[type="checkbox"]:checked')].map((campo) =>
                Number(campo.value))
        });
    },

    marcar_funciones: function (si)
    {
        document.getElementById('funciones').closest('.card').style.borderColor = si ?
            'var(--color-red)' : '';
    },

    nombre_duplicado: function (nombre)
    {
        this.error_resumen('Nombre de perfil duplicado', 'Ya existe ' + nombre +
            '. Cambia el nombre; se conservan descripción y funciones.');
    },

    nombre_obligatorio: function ()
    {
        this.error_resumen('El nombre del perfil es obligatorio',
            'Se conservan descripción y funciones seleccionadas.');
    },

    funciones_obligatorias: function ()
    {
        this.error_resumen('Selecciona al menos una función',
            'No puede registrarse un perfil sin funciones. Se conserva nombre y descripción.',
            true);
    },

    error_resumen: function (titulo, texto, sin_funciones)
    {
        this.error_resumen_activo = true;
        document.body.classList.add('perfil-error-resumen');
        if (sin_funciones)
        {
            document.body.classList.add('perfil-error-funciones');
            const nombre = document.getElementById('nombre').closest('.field');
            nombre.hidden = true;
            nombre.insertAdjacentHTML('beforebegin',
                '<div id="perfil-funciones-vacias" class="field"><span class="label">' +
                'Funciones</span><div class="readonly">Ninguna seleccionada</div></div>');
        }
        document.getElementById('perfiles-titulo').textContent = titulo;
        document.getElementById('perfiles-descripcion').textContent =
            'Corrige el campo marcado antes de guardar.';
        document.querySelector('#form-perfil > .card h2').textContent = 'Datos conservados';
        document.querySelector('#form-perfil .perfiles-formulario').hidden = true;
        const adicionales = document.querySelector('#form-perfil .perfiles-adicionales');
        if (adicionales) adicionales.hidden = true;
        document.getElementById('nombre').placeholder = '';
        document.getElementById('descripcion').readOnly = true;
        document.querySelector('#form-perfil button[type="submit"]').textContent =
            'Corregir perfil';
        this.mensaje('error', 'Perfil no registrado', texto);
    },

    corregir_perfil: function ()
    {
        this.error_resumen_activo = false;
        document.body.classList.remove('perfil-error-resumen', 'perfil-error-funciones');
        document.getElementById('perfil-funciones-vacias')?.remove();
        document.getElementById('nombre').closest('.field').hidden = false;
        document.getElementById('perfiles-titulo').textContent = 'Crear perfil';
        document.getElementById('perfiles-descripcion').textContent =
            'Selecciona al menos una función. El nombre debe ser único.';
        document.querySelector('#form-perfil > .card h2').textContent = 'Datos del perfil';
        document.querySelector('#form-perfil .perfiles-formulario').hidden = false;
        const adicionales = document.querySelector('#form-perfil .perfiles-adicionales');
        if (adicionales) adicionales.hidden = false;
        document.getElementById('nombre').placeholder = 'Ej. Alumno';
        document.getElementById('descripcion').readOnly = false;
        document.querySelector('#form-perfil button[type="submit"]').textContent =
            'Guardar perfil';
        this.mensaje();
        ui.limpiar();
        this.marcar_funciones(false);
        document.getElementById('nombre').focus();
    },

    cerrar_formulario: function ()
    {
        this.error_resumen_activo = false;
        document.body.classList.remove('perfil-error-resumen', 'perfil-error-funciones');
        this.mensaje();
        const panel = document.getElementById('formulario');
        panel.classList.add('hidden');
        panel.innerHTML = '';
        document.getElementById('tabla').classList.remove('hidden');
        document.getElementById('acciones-perfiles').classList.remove('hidden');
        document.getElementById('perfiles-titulo').textContent = 'Perfiles y permisos';
        document.getElementById('perfiles-descripcion').textContent =
            'Asigna funciones a cada perfil y controla su disponibilidad.';
    },

    bloqueo_eliminacion: function (perfil, usuarios, puede_editar, volver)
    {
        document.body.classList.add('perfil-baja-bloqueada');
        document.getElementById('tabla').classList.add('hidden');
        document.getElementById('acciones-perfiles').classList.add('hidden');
        document.getElementById('perfiles-titulo').textContent =
            'No puede eliminarse un perfil con usuarios asignados';
        const total = usuarios ? usuarios.length : perfil.usuarios;
        document.getElementById('perfiles-descripcion').textContent = perfil.nombre +
            ' tiene ' + total + ' usuarios asignados.';
        this.mensaje('warning', 'Eliminación bloqueada',
            'El perfil permanece Activo. Cambia primero los perfiles de sus usuarios.');
        const filas = usuarios ? usuarios.slice(0, 3).map((usuario) =>
            '<div class="perfiles-fila">' + ui.esc(usuario.clave + ' · ' + usuario.nombre +
                ' · ' + perfil.nombre) + '</div>').join('') +
            (usuarios.length > 3 ? '<div class="perfiles-fila">' +
                ui.esc('... · ' + (usuarios.length - 3) + ' usuarios adicionales · ' +
                    perfil.nombre) + '</div>' : '') :
            '<div class="perfiles-fila">' + ui.esc(total +
                ' usuarios asignados · Consulta los detalles desde Gestión de usuarios') +
                '</div>';
        const panel = document.getElementById('formulario');
        panel.classList.remove('hidden');
        panel.innerHTML = '<div class="perfiles-bloqueo-lista">' +
            '<div class="perfiles-fila">Clave · Nombre · Perfil</div>' + filas + '</div>' +
            '<div class="actions perfiles-bloqueo-acciones">' +
            (puede_editar ? '<a class="btn btn-primary" href="usuarios.html">Modificar usuarios</a>' : '') +
            '<button class="btn" type="button" id="volver-perfiles">Volver a perfiles</button>' +
            '</div>';
        document.getElementById('volver-perfiles').addEventListener('click', volver);
    },

    exito_creacion: function (perfil, administrador, volver)
    {
        document.body.classList.remove('perfil-error-resumen', 'perfil-error-funciones');
        document.body.classList.add('perfil-creado');
        document.getElementById('tabla').classList.add('hidden');
        document.getElementById('acciones-perfiles').classList.add('hidden');
        document.getElementById('perfiles-titulo').textContent =
            'Perfil registrado exitosamente';
        document.getElementById('perfiles-descripcion').textContent = perfil.nombre +
            ' está ' + perfil.estatus + ' y disponible al asignar usuarios.';
        const funciones = perfil.funciones.join(', ');
        this.mensaje('ok', 'Nuevo perfil disponible',
            'Alta de perfil ' + perfil.nombre + ' · Funciones: ' + funciones);
        const panel = document.getElementById('formulario');
        panel.classList.remove('hidden');
        panel.innerHTML = '<div class="card perfil-creado-operacion">' +
            '<h2>Registro de la operación</h2>' +
            '<p class="small muted">' + ui.esc(ui.fecha(perfil.fecha_alta) +
                ' · Administrador ' + administrador.clave) + '</p>' +
            '<p>' + ui.esc('Alta de perfil ' + perfil.nombre + ' · Funciones: ' +
                funciones) + '</p></div>' +
            '<div class="actions perfil-creado-acciones">' +
            '<a class="btn btn-primary" href="usuario_editar.html">Asignar a usuario</a>' +
            '<button class="btn" type="button" id="volver-perfiles">Volver a perfiles</button>' +
            '</div>';
        document.getElementById('volver-perfiles').addEventListener('click', volver);
    },

    exito_eliminacion: function (perfil, administrador, volver)
    {
        document.body.classList.add('perfil-eliminado');
        document.getElementById('tabla').classList.add('hidden');
        document.getElementById('acciones-perfiles').classList.add('hidden');
        document.getElementById('perfiles-titulo').textContent =
            'Perfil eliminado exitosamente';
        document.getElementById('perfiles-descripcion').textContent = '';
        this.mensaje('ok', 'Perfil eliminado exitosamente', perfil.nombre +
            ' ya no está disponible para nuevas asignaciones.');
        const panel = document.getElementById('formulario');
        panel.classList.remove('hidden');
        panel.innerHTML = '<div class="card perfil-eliminado-operacion">' +
            '<h2>Información de la operación</h2>' +
            '<p>' + ui.esc('Perfil ' + perfil.nombre + ' · Funciones: ' +
                perfil.funciones.join(', ') + ' · Administrador ' +
                administrador.clave) + '</p></div>' +
            '<div class="actions perfil-eliminado-acciones">' +
            '<button class="btn" type="button" id="volver-perfiles">Volver</button>' +
            '<a class="btn" href="inicio.html">Ir al inicio</a></div>';
        document.getElementById('volver-perfiles').addEventListener('click', volver);
    },

    volver_lista: function ()
    {
        document.body.classList.remove('perfil-baja-bloqueada', 'perfil-creado',
            'perfil-eliminado');
        document.getElementById('formulario').classList.add('hidden');
        document.getElementById('formulario').innerHTML = '';
        document.getElementById('tabla').classList.remove('hidden');
        document.getElementById('acciones-perfiles').classList.remove('hidden');
        document.getElementById('perfiles-titulo').textContent = 'Perfiles y permisos';
        document.getElementById('perfiles-descripcion').textContent =
            'Asigna funciones a cada perfil y controla su disponibilidad.';
        this.mensaje();
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

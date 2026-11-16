/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuarios_view.enlazar(acciones) */
/*   usuarios_view.filtros() */
/*   usuarios_view.tabla(usuarios, acciones) */
/*   usuarios_view.dialogo_reactivar(usuario, perfiles, al_confirmar) */
/*   usuarios_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const usuarios_view =
{
    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        this.acciones = acciones;
        let espera = null;
        document.getElementById('q').addEventListener('input', () =>
        {
            clearTimeout(espera);
            espera = setTimeout(() => acciones.cargar(), 250);
        });
        document.getElementById('estatus').addEventListener('change', () => acciones.cargar());
        document.getElementById('accion-consultar').addEventListener('click', () =>
            this.con_usuario((usuario) =>
            {
                window.location.href = 'usuario_editar.html?clave=' + encodeURIComponent(usuario.clave);
            }));
        document.getElementById('accion-baja').addEventListener('click', () =>
            this.con_usuario((usuario) =>
            {
                window.location.href = 'usuario_baja.html?clave=' +
                    encodeURIComponent(usuario.clave);
            }));
        document.getElementById('accion-reactivar').addEventListener('click', () =>
            this.con_usuario(acciones.reactivar));
    },

    con_usuario: function (accion)
    {
        const usuario = this.usuarios?.find((registro) => registro.clave === this.clave_seleccionada);
        if (!usuario)
        {
            this.mensaje('info', 'Selecciona un usuario',
                'Elige una fila de la lista para continuar.');
            return;
        }
        accion(usuario);
    },

    filtros: function ()
    {
        return ui.leer(['q', 'estatus']);
    },

    tabla: function (usuarios, acciones)
    {
        this.usuarios = usuarios;
        if (!usuarios.some((usuario) => usuario.clave === this.clave_seleccionada))
            this.clave_seleccionada = null;
        document.getElementById('tabla').innerHTML =
            '<div class="usuarios-lista" role="listbox" aria-label="Usuarios de la biblioteca">' +
            '<div class="usuarios-fila usuarios-cabecera">Clave · Nombre · Tipo · Perfil · Estatus</div>' +
            (usuarios.length ? usuarios.map((usuario) =>
                '<button type="button" role="option" class="usuarios-fila usuarios-registro" data-usuario="' +
                ui.esc(usuario.clave) + '" aria-selected="' +
                (usuario.clave === this.clave_seleccionada) + '">' +
                ui.esc([usuario.clave, usuario.nombre, usuario.tipo, usuario.perfil,
                    usuario.estatus].join(' · ')) + '</button>').join('') :
                '<div class="usuarios-fila muted">Usuario no encontrado: no hay coincidencias con el filtro</div>') +
            '</div>';
        document.querySelectorAll('[data-usuario]').forEach((fila) =>
            fila.addEventListener('click', () =>
            {
                this.clave_seleccionada = fila.dataset.usuario;
                document.querySelectorAll('[data-usuario]').forEach((otra) =>
                    otra.setAttribute('aria-selected', String(otra === fila)));
                this.actualizar_acciones();
            }));
        this.actualizar_acciones();
    },

    actualizar_acciones: function ()
    {
        const usuario = this.usuarios?.find((registro) => registro.clave === this.clave_seleccionada);
        const inactivo = usuario?.estatus === 'Inactivo';
        document.getElementById('accion-consultar').disabled = !usuario || inactivo;
        document.getElementById('accion-baja').disabled = !usuario || inactivo;
        document.getElementById('accion-reactivar').disabled = !inactivo;
        document.getElementById('accion-reactivar').textContent = inactivo ?
            'Reactivar a ' + usuario.nombre : 'Reactivar usuario';
    },

    dialogo_reactivar: function (usuario, perfiles, al_confirmar)
    {
        return ui.dialogo(
        {
            titulo: 'Reactivar a ' + usuario.nombre,
            texto: 'Se valida que la Clave ' + usuario.clave +
                ' siga vigente en la institución. Puedes conservar su perfil o asignar otro.',
            cuerpo: '<div class="field"><label for="id_perfil">Perfil</label><select id="id_perfil">' +
                ui.opciones(perfiles.filter((elemento) => elemento.asignable), 'id', 'nombre',
                    usuario.id_perfil) + '</select></div>',
            confirmar: 'Reactivar usuario',
            al_confirmar: (datos_2) => al_confirmar(datos_2.querySelector('#id_perfil').value)
        });
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

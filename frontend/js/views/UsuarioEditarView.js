/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Vista de consulta y cambio de perfil de usuario. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_editar_view.enlazar(acciones) */
/*   usuario_editar_view.poner_clave(clave) */
/*   usuario_editar_view.clave() */
/*   usuario_editar_view.detalle(usuario, perfiles) */
/*   usuario_editar_view.coincidencias(usuarios) */
/*   usuario_editar_view.perfil_elegido() */
/*   usuario_editar_view.vacio() */
/*   usuario_editar_view.exito(datos) */
/*   usuario_editar_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Recibe datos del controlador; no consulta API ni decide permisos. */
/* Escapa datos externos antes de construir HTML. */
/******************************************************************/

const usuario_editar_view =
{
    enlazar: function (acciones)
    {
        this.acciones = acciones;
        const buscar = document.getElementById('buscar-clave');
        buscar.addEventListener('change', () => acciones.consultar());
        buscar.addEventListener('keydown', (evento) =>
        {
            if (evento.key === 'Enter')
            {
                evento.preventDefault();
                acciones.consultar();
            }
        });
        document.getElementById('coincidencias-editar').addEventListener('click', (evento) =>
        {
            const opcion = evento.target.closest('[data-clave]');
            if (opcion) acciones.consultar(opcion.dataset.clave);
        });
        document.getElementById('nuevo-perfil').addEventListener('change', () =>
            this.actualizar_acciones());
        document.getElementById('btn-guardar').addEventListener('click', () => acciones.guardar());
        document.getElementById('btn-reactivar').addEventListener('click', () => acciones.reactivar());
        document.getElementById('btn-explicar-retiro').addEventListener('click', () =>
            acciones.explicar_retiro());
    },

    poner_clave: function (clave)
    {
        document.getElementById('buscar-clave').value = clave;
    },

    clave: function ()
    {
        return document.getElementById('buscar-clave').value.trim();
    },

    detalle: function (usuario, perfiles)
    {
        this.usuario_actual = usuario;
        document.getElementById('usuario-titulo').textContent = usuario.nombre + ' · ' +
            usuario.estatus;
        document.getElementById('buscar-clave').value = usuario.nombre;
        for (const campo of ['clave', 'nombre', 'tipo', 'correo', 'perfil'])
        {
            document.getElementById('dato-' + campo).textContent = usuario[campo] || '—';
        }
        document.getElementById('dato-telefono').textContent = usuario.telefono ||
            'No registrado';
        const select = document.getElementById('nuevo-perfil');
        const solo_lector = ['Alumno', 'Profesor'].includes(usuario.tipo);
        const disponibles = perfiles.filter((perfil) => perfil.asignable &&
            (!solo_lector || perfil.nivel <= 1));
        const inactivo = usuario.estatus !== 'Activo';
        select.innerHTML = ui.opciones(disponibles, 'id', 'nombre',
            inactivo ? usuario.id_perfil : '', 'Elige un perfil');
        select.disabled = disponibles.length === 0;
        document.getElementById('coincidencias-editar').innerHTML = '';
        document.getElementById('btn-guardar').hidden = inactivo;
        document.getElementById('btn-reactivar').hidden = !inactivo;
        this.actualizar_acciones();
    },

    actualizar_acciones: function ()
    {
        const elegido = Number(document.getElementById('nuevo-perfil').value);
        const usuario = this.usuario_actual;
        document.getElementById('btn-guardar').disabled = !usuario || !elegido ||
            elegido === usuario.id_perfil;
        document.getElementById('btn-reactivar').disabled = !usuario;
    },

    coincidencias: function (usuarios)
    {
        this.vacio();
        document.getElementById('coincidencias-editar').innerHTML =
            '<div class="card user-edit-matches"><h2>Selecciona un usuario</h2>' +
            usuarios.map((usuario) => '<button type="button" class="user-edit-match" ' +
                'data-clave="' + ui.esc(usuario.clave) + '">' +
                ui.esc(usuario.clave + ' · ' + usuario.nombre + ' · ' + usuario.estatus) +
                '</button>').join('') + '</div>';
    },

    perfil_elegido: function ()
    {
        return Number(document.getElementById('nuevo-perfil').value);
    },

    vacio: function ()
    {
        this.usuario_actual = null;
        document.getElementById('coincidencias-editar').innerHTML = '';
        document.getElementById('usuario-titulo').textContent = 'Selecciona un usuario';
        for (const campo of ['clave', 'nombre', 'tipo', 'correo', 'perfil'])
            document.getElementById('dato-' + campo).textContent = '';
        document.getElementById('dato-telefono').textContent = 'No registrado';
        document.getElementById('nuevo-perfil').innerHTML =
            '<option value="">Elige un perfil</option>';
        document.getElementById('nuevo-perfil').disabled = true;
        document.getElementById('btn-guardar').disabled = true;
        document.getElementById('btn-guardar').hidden = false;
        document.getElementById('btn-reactivar').hidden = true;
    },

    exito: function (datos)
    {
        const usuario = datos.usuario;
        const retiro = datos.retira;
        document.getElementById('formulario-editar').hidden = true;
        document.getElementById('titulo-pagina').textContent = retiro ?
            'Perfil actualizado y sesión cerrada' : 'Usuario modificado exitosamente';
        document.getElementById('descripcion-pagina').textContent =
            'Se modificó únicamente el perfil.';
        document.getElementById('resultado-editar').innerHTML =
            '<div class="alert alert-ok user-edit-alert"><strong>' +
            (retiro ? 'Perfil actualizado y sesión cerrada' : 'Perfil actualizado') +
            '</strong><span>' + ui.esc(usuario.nombre + ' · ' + datos.perfil_anterior +
                ' → ' + usuario.perfil) + (retiro ?
                '. Se cerró la sesión activa.' :
                '. Los permisos se aplicarán en el siguiente inicio de sesión.') +
            ' El aviso por correo está pendiente.</span></div>' +
            '<div class="card user-edit-operation"><h2>' +
            (retiro ? 'Información de la operación' : 'Registro de la operación') +
            '</h2><p>' + ui.esc(usuario.clave + ' · Perfil anterior: ' +
                datos.perfil_anterior + ' · Perfil nuevo: ' + usuario.perfil +
                ' · Administrador ' + datos.administrador.clave) + '</p></div>' +
            '<div class="actions user-edit-actions"><a class="btn btn-primary" ' +
            'href="usuarios.html">Volver a usuarios</a></div>';
        window.scrollTo(0, 0);
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

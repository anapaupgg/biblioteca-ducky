/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de usuario_editar.html.                     */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   UsuarioEditarView.clave()              - Searched clave      */
/*   UsuarioEditarView.detalle(u, perfiles) - Draw the user       */
/*   UsuarioEditarView.perfil_elegido()     - Selected profile    */
/******************************************************************/

const UsuarioEditarView =
{
    clave: function() { return document.getElementById('buscar-clave').value.trim(); },

    detalle: function(u, perfiles)
    {
        const lectura = (titulo, valor) => '<div class="field"><span class="label">' + titulo + '</span><div class="readonly">' + Ui.esc(valor) + '</div></div>';
        const inactivo = u.estatus !== 'Activo';
        const adeudo = u.adeudos.prestamos_activos + ' préstamo(s) activo(s) · ' + u.adeudos.multas_pendientes +
                       ' multa(s) pendiente(s) · ' + Ui.dinero(u.adeudos.monto);

        document.getElementById('detalle').innerHTML =
            '<div class="card"><h2>' + Ui.esc(u.nombre) + ' · ' + Ui.badge(u.estatus) + '</h2>' +
            '<div class="grid-2">' +
            lectura('Clave', u.clave) + lectura('Nombre', u.nombre) +
            lectura('Tipo de usuario', u.tipo) + lectura('Correo institucional', u.correo) +
            lectura('Perfil asignado', u.perfil + ' (' + (u.funciones || []).join(', ') + ')') +
            lectura('Fecha de alta', Ui.fecha(u.fecha_alta) + (u.admin_alta ? ' · por ' + u.admin_alta : ' · carga inicial')) +
            lectura('Adeudos', adeudo) +
            (u.baja ? lectura('Baja', Ui.fecha(u.baja.fecha_baja) + ' · ' + u.baja.motivo + (u.baja.comentario ? ' · ' + u.baja.comentario : '')) : '') +
            '<div class="field"><label for="nuevo-perfil">' + (inactivo ? 'Perfil al reactivar' : 'Nuevo perfil') + '</label>' +
            '<select id="nuevo-perfil">' + Ui.opciones(perfiles.filter((p) => p.asignable), 'id', 'nombre', u.id_perfil) + '</select></div>' +
            '</div><p class="small muted" style="margin-top:12px">Los datos institucionales no pueden modificarse aquí: se consultan de la institución. ' +
            'La baja se realiza desde "Dar de baja" en Gestión de usuarios.</p></div>' +
            '<div class="actions">' +
            (inactivo
                ? '<button class="btn btn-primary" id="btn-reactivar">Reactivar usuario</button>'
                : '<button class="btn btn-primary" id="btn-guardar">Guardar cambio de perfil</button>') +
            '<a class="btn" href="usuarios.html">Cancelar</a></div>';
    },

    perfil_elegido: function() { return Number(document.getElementById('nuevo-perfil').value); },

    vacio: function() { document.getElementById('detalle').innerHTML = ''; },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); }
};

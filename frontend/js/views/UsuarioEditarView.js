/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_editar_view.poner_clave(clave) */
/*   usuario_editar_view.enlazar_detalle(acciones) */
/*   usuario_editar_view.conservar_mensaje() */
/*   usuario_editar_view.restaurar_mensaje(mensaje) */
/*   usuario_editar_view.enlazar(acciones) */
/*   usuario_editar_view.clave() */
/*   usuario_editar_view.detalle(usuario, perfiles) */
/*   usuario_editar_view.perfil_elegido() */
/*   usuario_editar_view.vacio() */
/*   usuario_editar_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const usuario_editar_view =
{
    poner_clave: function (clave)
    {
        document.getElementById('buscar-clave').value = clave;
    },
    enlazar_detalle: function (acciones)
    {
        const guardar = document.getElementById('btn-guardar');
        const reactivar = document.getElementById('btn-reactivar');
        if (guardar) guardar.addEventListener('click', acciones.guardar);
        if (reactivar) reactivar.addEventListener('click', acciones.reactivar);
    },
    conservar_mensaje: function ()
    {
        return document.getElementById('mensaje').innerHTML;
    },
    restaurar_mensaje: function (mensaje)
    {
        document.getElementById('mensaje').innerHTML = mensaje;
    },

    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.getElementById('btn-buscar').addEventListener('click', () => acciones.consultar());
        document.getElementById('buscar-clave').addEventListener('keydown', (elemento) =>
        {
            if (elemento.key === 'Enter') acciones.consultar();
        });
    },

    clave: function ()
    {
        return document.getElementById('buscar-clave').value.trim();
    },

    detalle: function (usuario, perfiles)
    {
        const lectura = (titulo, valor) => '<div class="field"><span class="label">' + titulo +
            '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        const inactivo = usuario.estatus !== 'Activo';
        const adeudo = usuario.adeudos.prestamos_activos + ' préstamo(s) activo(s) · ' + usuario
            .adeudos.multas_pendientes +
            ' multa(s) pendiente(s) · ' + ui.dinero(usuario.adeudos.monto);

        document.getElementById('detalle').innerHTML =
            '<div class="card"><h2>' + ui.esc(usuario.nombre) + ' · ' + ui.badge(usuario.estatus) +
            '</h2>' +
            '<div class="grid-2">' +
            lectura('Clave', usuario.clave) + lectura('Nombre', usuario.nombre) +
            lectura('Tipo de usuario', usuario.tipo) + lectura('Correo institucional', usuario
            .correo) +
            lectura('Perfil asignado', usuario.perfil + ' (' + (usuario.funciones || []).join(', ') +
                ')') +
            lectura('Fecha de alta', ui.fecha(usuario.fecha_alta) + (usuario.admin_alta ? ' · por ' +
                usuario.admin_alta : ' · carga inicial')) +
            lectura('Adeudos', adeudo) +
            (usuario.baja ? lectura('Baja', ui.fecha(usuario.baja.fecha_baja) + ' · ' + usuario.baja
                .motivo + (usuario.baja.comentario ? ' · ' + usuario.baja.comentario : '')) : '') +
            '<div class="field"><label for="nuevo-perfil">' + (inactivo ? 'Perfil al reactivar' :
                'Nuevo perfil') + '</label>' +
            '<select id="nuevo-perfil">' + ui.opciones(perfiles.filter((elemento_2) => elemento_2
                .asignable), 'id', 'nombre', usuario.id_perfil) + '</select></div>' +
            '</div><p class="small muted" style="margin-top:12px">Los datos institucionales no pueden modificarse aquí: se consultan de la institución. ' +
            'La baja se realiza desde "Dar de baja" en Gestión de usuarios.</p></div>' +
            '<div class="actions">' +
            (inactivo ?
                '<button class="btn btn-primary" id="btn-reactivar">Reactivar usuario</button>' :
                '<button class="btn btn-primary" id="btn-guardar">Guardar cambio de perfil</button>'
                ) +
            '<a class="btn" href="usuarios.html">Cancelar</a></div>';
    },

    perfil_elegido: function ()
    {
        return Number(document.getElementById('nuevo-perfil').value);
    },

    vacio: function ()
    {
        document.getElementById('detalle').innerHTML = '';
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

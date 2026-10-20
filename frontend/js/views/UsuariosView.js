/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de usuarios.html.                           */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   UsuariosView.filtros()                   - { q, estatus }    */
/*   UsuariosView.tabla(usuarios, acciones)   - Users list        */
/*   UsuariosView.dialogo_baja(u, motivos, cb)- Baja dialog       */
/*   UsuariosView.dialogo_reactivar(u, p, cb) - Reactivate dialog */
/*   UsuariosView.mensaje(tipo, titulo, texto)                    */
/******************************************************************/

const UsuariosView =
{
    filtros: function() { return Ui.leer(['q', 'estatus']); },

    tabla: function(usuarios, acciones)
    {
        Ui.tabla('tabla',
        [
            { titulo: 'Clave',   valor: (u) => '<strong>' + Ui.esc(u.clave) + '</strong>' },
            { titulo: 'Nombre',  valor: (u) => Ui.esc(u.nombre) + '<div class="small muted">' + Ui.esc(u.correo) + '</div>' },
            { titulo: 'Tipo',    valor: (u) => Ui.esc(u.tipo) },
            { titulo: 'Perfil',  valor: (u) => Ui.esc(u.perfil) },
            { titulo: 'Estatus', valor: (u) => Ui.badge(u.estatus) },
            { titulo: '',        valor: (u) => '<div class="row-actions">' +
                (u.estatus === 'Activo'
                    ? '<a class="btn btn-sm" href="usuario_editar.html?clave=' + encodeURIComponent(u.clave) + '">Consultar y modificar</a>' +
                      '<button class="btn btn-sm btn-danger" data-baja="' + Ui.esc(u.clave) + '">Dar de baja</button>'
                    : '<button class="btn btn-sm btn-primary" data-reactivar="' + Ui.esc(u.clave) + '">Reactivar</button>') + '</div>' }
        ], usuarios, { vacio: 'Usuario no encontrado: no hay coincidencias con el filtro' });

        document.querySelectorAll('[data-baja]').forEach((b) =>
            b.addEventListener('click', () => acciones.baja(usuarios.find((u) => u.clave === b.dataset.baja))));
        document.querySelectorAll('[data-reactivar]').forEach((b) =>
            b.addEventListener('click', () => acciones.reactivar(usuarios.find((u) => u.clave === b.dataset.reactivar))));
    },

    dialogo_baja: function(usuario, motivos, al_confirmar)
    {
        return Ui.dialogo(
        {
            titulo: 'Confirmar baja de ' + usuario.nombre,
            texto: 'Se conserva su historial y se eliminan sus credenciales de acceso. Clave ' + usuario.clave + ' · ' + usuario.tipo + '.',
            cuerpo: '<div class="field"><label for="id_motivo">Motivo de baja</label><select id="id_motivo">' +
                    Ui.opciones(motivos, 'id', 'descripcion', '', 'Selecciona el motivo') + '</select></div>' +
                    '<div class="field" style="margin-top:12px"><label for="comentario">Comentario</label>' +
                    '<textarea id="comentario" maxlength="200" placeholder="Obligatorio si el motivo es Otro"></textarea></div>',
            confirmar: 'Dar de baja',
            peligro: true,
            al_confirmar: (d) => al_confirmar(d.querySelector('#id_motivo').value, d.querySelector('#comentario').value)
        });
    },

    dialogo_reactivar: function(usuario, perfiles, al_confirmar)
    {
        return Ui.dialogo(
        {
            titulo: 'Reactivar a ' + usuario.nombre,
            texto: 'Se valida que la Clave ' + usuario.clave + ' siga vigente en la institución. Puedes conservar su perfil o asignar otro.',
            cuerpo: '<div class="field"><label for="id_perfil">Perfil</label><select id="id_perfil">' +
                    Ui.opciones(perfiles.filter((p) => p.asignable), 'id', 'nombre', usuario.id_perfil) + '</select></div>',
            confirmar: 'Reactivar usuario',
            al_confirmar: (d) => al_confirmar(d.querySelector('#id_perfil').value)
        });
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); }
};

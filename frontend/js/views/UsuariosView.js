/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuarios_view.enlazar(acciones) */
/*   usuarios_view.filtros() */
/*   usuarios_view.tabla(usuarios, acciones) */
/*   usuarios_view.dialogo_baja(usuario, motivos, al_confirmar) */
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
        let espera = null;
        document.getElementById('q').addEventListener('input', () =>
        {
            clearTimeout(espera);
            espera = setTimeout(() => acciones.cargar(), 250);
        });
        document.getElementById('estatus').addEventListener('change', () => acciones.cargar());
    },

    filtros: function ()
    {
        return ui.leer(['q', 'estatus']);
    },

    tabla: function (usuarios, acciones)
    {
        ui.tabla('tabla',
            [
            {
                titulo: 'Clave',
                valor: (usuario_2) => '<strong>' + ui.esc(usuario_2.clave) + '</strong>'
            },
            {
                titulo: 'Nombre',
                valor: (usuario_3) => ui.esc(usuario_3.nombre) + '<div class="small muted">' +
                    ui.esc(usuario_3.correo) + '</div>'
            },
            {
                titulo: 'Tipo',
                valor: (usuario_4) => ui.esc(usuario_4.tipo)
            },
            {
                titulo: 'Perfil',
                valor: (usuario_5) => ui.esc(usuario_5.perfil)
            },
            {
                titulo: 'Estatus',
                valor: (usuario_6) => ui.badge(usuario_6.estatus)
            },
            {
                titulo: '',
                valor: (usuario_7) => '<div class="row-actions">' +
                    (usuario_7.estatus === 'Activo' ?
                        '<a class="btn btn-sm" href="usuario_editar.html?clave=' +
                        encodeURIComponent(usuario_7.clave) + '">Consultar y modificar</a>' +
                        '<button class="btn btn-sm btn-danger" data-baja="' + ui.esc(usuario_7
                            .clave) + '">Dar de baja</button>' :
                        '<button class="btn btn-sm btn-primary" data-reactivar="' + ui.esc(
                            usuario_7.clave) + '">Reactivar</button>') + '</div>'
            }], usuarios,
            {
                vacio: 'Usuario no encontrado: no hay coincidencias con el filtro'
            });

        document.querySelectorAll('[data-baja]').forEach((boton) =>
            boton.addEventListener('click', () => acciones.baja(usuarios.find((usuario_8) =>
                usuario_8.clave === boton.dataset.baja))));
        document.querySelectorAll('[data-reactivar]').forEach((boton_2) =>
            boton_2.addEventListener('click', () => acciones.reactivar(usuarios.find((
                usuario_9) => usuario_9.clave === boton_2.dataset.reactivar))));
    },

    dialogo_baja: function (usuario, motivos, al_confirmar)
    {
        return ui.dialogo(
        {
            titulo: 'Confirmar baja de ' + usuario.nombre,
            texto: 'Se conserva su historial y se eliminan sus credenciales de acceso. Clave ' +
                usuario.clave + ' · ' + usuario.tipo + '.',
            cuerpo: '<div class="field"><label for="id_motivo">Motivo de baja</label><select id="id_motivo">' +
                ui.opciones(motivos, 'id', 'descripcion', '', 'Selecciona el motivo') +
                '</select></div>' +
                '<div class="field" style="margin-top:12px"><label for="comentario">Comentario</label>' +
                '<textarea id="comentario" maxlength="200" placeholder="Obligatorio si el motivo es Otro"></textarea></div>',
            confirmar: 'Dar de baja',
            peligro: true,
            al_confirmar: (datos) => al_confirmar(datos.querySelector('#id_motivo').value,
                datos.querySelector('#comentario').value)
        });
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

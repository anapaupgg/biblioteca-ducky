/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: View of usuario_registrar.html.                   */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   UsuarioRegistrarView.perfiles(lista)      - Profile select   */
/*   UsuarioRegistrarView.datos()              - { clave, perfil }*/
/*   UsuarioRegistrarView.institucional(p)     - Read-only block  */
/*   UsuarioRegistrarView.exito(respuesta)     - Success message  */
/******************************************************************/

const UsuarioRegistrarView =
{
    perfiles: function(lista)
    {
        document.getElementById('id_perfil').innerHTML = Ui.opciones(lista.filter((p) => p.asignable), 'id',
            (p) => p.nombre + ' (' + p.funciones.join(', ') + ')', '', 'Selecciona un perfil');
    },

    datos: function() { return Ui.leer(['clave', 'id_perfil']); },

    institucional: function(persona)
    {
        const poner = (id, valor) => { document.getElementById(id).textContent = valor || '—'; };
        poner('i-nombre', persona && persona.nombre);
        poner('i-tipo', persona && persona.tipo);
        poner('i-correo', persona && (persona.correo || 'Sin correo institucional'));
        poner('i-vigente', persona && (persona.vigente ? 'Vigente' : 'No vigente') +
            (persona && persona.registrado ? ' · Ya registrado en la biblioteca (' + persona.estatus_biblioteca + ')' : ''));
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); },

    exito: function(r)
    {
        document.getElementById('form-usuario').classList.add('hidden');
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Usuario registrado exitosamente</strong>' +
            '<span>' + Ui.esc(r.usuario.nombre) + ' · ' + Ui.esc(r.usuario.clave) + ' · ' + Ui.esc(r.usuario.tipo) +
            ' · perfil ' + Ui.esc(r.usuario.perfil) + '</span></div>' +
            '<div class="card"><h2>Credenciales generadas</h2>' +
            '<p>Correo institucional del usuario: <strong>' + Ui.esc(r.usuario.correo) + '</strong></p>' +
            '<div class="alert alert-warning"><strong>Contraseña temporal: ' + Ui.esc(r.contrasena_temporal) + '</strong>' +
            '<span>Entrégala al usuario; deberá cambiarla en su primer acceso.</span></div>' +
            '<div class="actions"><a class="btn btn-primary" href="usuarios.html">Ver usuarios</a>' +
            '<a class="btn" href="usuario_registrar.html">Registrar otro usuario</a></div></div>';
    }
};

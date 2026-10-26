/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_registrar_view.enlazar(acciones) */
/*   usuario_registrar_view.perfiles(lista) */
/*   usuario_registrar_view.datos() */
/*   usuario_registrar_view.institucional(persona) */
/*   usuario_registrar_view.mensaje(tipo, titulo, texto) */
/*   usuario_registrar_view.exito(resultado) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const usuario_registrar_view =
{
    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.getElementById('clave').addEventListener('change', () => acciones.consultar());
        document.getElementById('form-usuario').addEventListener('submit', (elemento) =>
        {
            elemento.preventDefault();
            acciones.registrar();
        });
        document.getElementById('clave').focus();
    },

    perfiles: function (lista)
    {
        document.getElementById('id_perfil').innerHTML = ui.opciones(lista.filter((elemento_2) =>
                elemento_2.asignable), 'id',
            (elemento_3) => elemento_3.nombre + ' (' + elemento_3.funciones.join(', ') + ')', '',
            'Selecciona un perfil');
    },

    datos: function ()
    {
        return ui.leer(['clave', 'id_perfil']);
    },

    institucional: function (persona)
    {
        const poner = (id, valor) =>
        {
            document.getElementById(id).textContent = valor || '—';
        };
        poner('i-nombre', persona && persona.nombre);
        poner('i-tipo', persona && persona.tipo);
        poner('i-correo', persona && (persona.correo || 'Sin correo institucional'));
        poner('i-vigente', persona && (persona.vigente ? 'Vigente' : 'No vigente') +
            (persona && persona.registrado ? ' · Ya registrado en la biblioteca (' + persona
                .estatus_biblioteca + ')' : ''));
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    },

    exito: function (resultado)
    {
        document.getElementById('form-usuario').classList.add('hidden');
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Usuario registrado exitosamente</strong>' +
            '<span>' + ui.esc(resultado.usuario.nombre) + ' · ' + ui.esc(resultado.usuario.clave) +
            ' · ' + ui.esc(resultado.usuario.tipo) +
            ' · perfil ' + ui.esc(resultado.usuario.perfil) + '</span></div>' +
            '<div class="card"><h2>Credenciales generadas</h2>' +
            '<p>Correo institucional del usuario: <strong>' + ui.esc(resultado.usuario.correo) +
            '</strong></p>' +
            '<div class="alert alert-warning"><strong>Contraseña temporal: ' + ui.esc(resultado
                .contrasena_temporal) + '</strong>' +
            '<span>Entrégala al usuario; deberá cambiarla en su primer acceso.</span></div>' +
            '<div class="actions"><a class="btn btn-primary" href="usuarios.html">Ver usuarios</a>' +
            '<a class="btn" href="usuario_registrar.html">Registrar otro usuario</a></div></div>';
    }
};

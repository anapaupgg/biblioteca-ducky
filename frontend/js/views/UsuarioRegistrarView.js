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
        const perfil_lector = lista.find((elemento) => elemento.asignable &&
            elemento.nombre === 'Lector');
        document.getElementById('id_perfil').innerHTML = ui.opciones(lista.filter((elemento_2) =>
                elemento_2.asignable), 'id',
            (elemento_3) => elemento_3.nombre === 'Lector' ?
                'Lector (alumno o docente)' : elemento_3.nombre, perfil_lector?.id || '',
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
        poner('i-clave', persona && persona.clave);
        poner('i-nombre', persona && persona.nombre);
        poner('i-tipo', persona && persona.tipo);
        poner('i-correo', persona && (persona.correo || 'Sin correo institucional'));
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    },

    exito: function (resultado)
    {
        const usuario = resultado.usuario;
        const campo = (etiqueta, valor) =>
            '<div class="field"><span class="label">' + etiqueta + '</span>' +
            '<div class="readonly">' + ui.esc(valor || '—') + '</div></div>';
        document.getElementById('titulo-pagina').textContent =
            'Usuario registrado exitosamente';
        document.getElementById('descripcion-pagina').textContent = usuario.nombre +
            ' ya puede acceder a los servicios de su perfil.';
        document.getElementById('form-usuario').classList.add('hidden');
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Alta completada</strong>' +
            '<span>' + ui.esc(usuario.nombre) +
            ' ya puede acceder a los servicios de su perfil.</span></div>' +
            '<div class="card"><h2>Usuario registrado</h2><div class="grid-2">' +
            campo('Clave', usuario.clave) + campo('Nombre', usuario.nombre) +
            campo('Tipo de usuario', usuario.tipo) +
            campo('Correo institucional', usuario.correo) + '</div></div>' +
            '<div class="card usuario-exito-operacion"><h2>Registro de la operación</h2>' +
            '<p class="small muted">' + ui.esc(ui.fecha(usuario.fecha_alta)) +
            ' · Administrador ' + ui.esc(usuario.clave_admin_alta || '—') + '</p>' +
            '<p>Alta de ' + ui.esc(usuario.clave) + ' · Perfil ' +
            ui.esc(usuario.perfil) +
            ' · Datos institucionales verificados. Cuota de libros: política general del sistema.</p></div>' +
            '<div class="actions"><a class="btn btn-primary" href="usuarios.html">Volver a usuarios</a>' +
            '<a class="btn" href="usuario_registrar.html">Registrar otro usuario</a></div>' +
            '<div class="card usuario-exito-credencial"><h2>Contraseña temporal de primer acceso</h2>' +
            '<p>Se muestra una sola vez. Entrégala al usuario por un canal seguro; deberá cambiarla al entrar.</p>' +
            '<div class="readonly" aria-label="Contraseña temporal">' +
            ui.esc(resultado.contrasena_temporal) + '</div></div>';
    }
};

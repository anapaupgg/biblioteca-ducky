/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Vista de baja de usuarios y resultados de validación. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_baja_view.enlazar(acciones) */
/*   usuario_baja_view.motivos(lista) */
/*   usuario_baja_view.usuario(datos) */
/*   usuario_baja_view.datos() */
/*   usuario_baja_view.confirmar(usuario, al_confirmar) */
/*   usuario_baja_view.resultado(validacion, volver) */
/*   usuario_baja_view.exito(respuesta, motivo, administrador) */
/*   usuario_baja_view.formulario() */
/*   usuario_baja_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui. Recibe datos del controlador y los presenta. */
/* Los callbacks coordinan navegación; no consulta API ni decide permisos. */
/* Escapar datos de usuario y BD antes de insertarlos en HTML. */
/******************************************************************/

const usuario_baja_view =
{
    enlazar: function (acciones)
    {
        document.getElementById('form-baja-usuario').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.validar();
        });
        document.getElementById('clave').addEventListener('change', () => acciones.consultar());
        document.getElementById('id_motivo').addEventListener('change', () =>
            this.actualizar_comentario());
    },

    motivos: function (lista)
    {
        this.lista_motivos = lista;
        const sugerido = lista.find((motivo) => motivo.descripcion.includes('Solicitud'));
        const opciones = lista.map((motivo) => ({ ...motivo,
            etiqueta: motivo.descripcion === 'Solicitud' ? 'Solicitud del usuario' :
                motivo.descripcion }));
        document.getElementById('id_motivo').innerHTML = ui.opciones(opciones, 'id',
            'etiqueta', sugerido?.id || '', 'Selecciona el motivo');
        document.getElementById('motivos-disponibles').textContent = 'Motivos: ' +
            opciones.map((motivo) => motivo.etiqueta + (motivo.descripcion === 'Otro' ?
                ' (requiere descripción)' : '')).join(' · ') + '.';
        document.getElementById('validar-baja').disabled = lista.length === 0;
        this.actualizar_comentario();
    },

    actualizar_comentario: function ()
    {
        const seleccionado = this.lista_motivos?.find((motivo) => String(motivo.id) ===
            document.getElementById('id_motivo').value);
        document.getElementById('campo-comentario').hidden = seleccionado?.descripcion !== 'Otro';
    },

    poner_clave: function (clave)
    {
        document.getElementById('clave').value = clave;
    },

    usuario: function (datos)
    {
        const usuario = datos || {};
        for (const campo of ['clave', 'nombre', 'tipo', 'correo'])
        {
            document.getElementById('dato-' + campo).textContent = usuario[campo] || '';
        }
    },

    datos: function ()
    {
        return ui.leer(['clave', 'id_motivo', 'comentario']);
    },

    confirmar: function (usuario, al_confirmar)
    {
        return ui.dialogo(
        {
            titulo: 'Confirmar baja de ' + usuario.nombre,
            texto: 'Confirma la baja del usuario. Se conservará el historial.',
            cuerpo: '<p>El historial de préstamos y devoluciones se conserva.</p>',
            confirmar: 'Confirmar baja',
            peligro: true,
            principal_primero: true,
            amplio: true,
            al_confirmar
        });
    },

    estado: function (titulo, descripcion, contenido)
    {
        document.getElementById('titulo-pagina').textContent = titulo;
        document.getElementById('descripcion-pagina').textContent = descripcion;
        document.getElementById('form-baja-usuario').hidden = true;
        document.getElementById('resultado-baja').innerHTML = contenido;
        window.scrollTo(0, 0);
    },

    resultado: function (validacion, volver)
    {
        const usuario = validacion.usuario;
        const acciones = '<div class="actions user-baja-result-actions">' +
            '<button class="btn btn-primary" id="btn-volver-formulario" type="button">' +
            'Volver al formulario</button>' +
            (validacion.estado === 'prestamos' ?
                '<a class="btn" href="devoluciones.html">Ver devoluciones</a>' :
                '<a class="btn" href="inicio.html">Ir al inicio</a>') + '</div>';
        let titulo;
        let descripcion = '';
        let contenido;
        if (validacion.estado === 'prestamos')
        {
            titulo = 'Baja bloqueada: existen libros pendientes';
            descripcion = 'Primero deben devolverse todos los libros.';
            const filas = validacion.prestamos.map((prestamo) =>
                '<div class="user-baja-loan-row">' + ui.esc(prestamo.clave_libro + ' · ' +
                    prestamo.titulo + ' · ' + ui.fecha(prestamo.fecha_vencimiento)) +
                '</div>').join('');
            contenido = '<div class="alert alert-warning user-baja-alert"><strong>Usuario no dado de baja</strong>' +
                '<span>' + ui.esc(usuario.nombre) +
                ' mantiene su estatus Activo y sus credenciales.</span></div>' +
                '<div class="user-baja-loan-row">Clave · Título · Fecha de devolución</div>' +
                filas + acciones;
        }
        else if (validacion.estado === 'deuda')
        {
            titulo = 'Baja bloqueada: existe deuda con Tesorería';
            contenido = '<div class="alert alert-warning user-baja-alert"><strong>' + titulo +
                '</strong><span>Monto pendiente: $' + ui.esc(Number(validacion.monto).toFixed(2)) +
                ' MXN. Debe regularizarse con Tesorería antes de la baja.</span></div>' +
                '<div class="card user-baja-result-card"><h2>Información de la operación</h2>' +
                '<p>Se conserva el estatus Activo y las credenciales.</p></div>' + acciones;
        }
        else
        {
            const mensajes =
            {
                propio: 'No puede darse de baja a sí mismo',
                inactivo: 'El usuario ya está inactivo',
                superior: 'No puede dar de baja a un usuario con más privilegios',
                ultimo_administrador: 'No puede dar de baja al último Administrador del sistema'
            };
            titulo = mensajes[validacion.estado] || 'No fue posible validar la baja';
            contenido = '<div class="alert alert-warning user-baja-alert"><strong>' +
                ui.esc(titulo) + '</strong><span>' + ui.esc(usuario.nombre + ' · ' + usuario.clave) +
                ' conserva su estatus y credenciales.</span></div>' + acciones;
        }
        this.estado(titulo, descripcion, contenido);
        document.getElementById('btn-volver-formulario').addEventListener('click', volver);
    },

    exito: function (respuesta, motivo, administrador)
    {
        const usuario = respuesta.usuario;
        const baja = usuario.baja || {};
        const fecha = baja.fecha_baja ? ui.fecha_hora(baja.fecha_baja) :
            'Fecha no registrada';
        this.estado('Usuario dado de baja exitosamente',
            usuario.nombre + ' · ' + usuario.clave + ' · Inactivo.',
            '<div class="alert alert-ok user-baja-alert"><strong>Baja completada</strong>' +
            '<span>Credenciales desactivadas, sesiones cerradas e historial conservado. ' +
            'El aviso por correo institucional está pendiente.</span></div>' +
            '<div class="card user-baja-result-card"><h2>Registro de la operación</h2>' +
            '<p class="small muted">' + ui.esc(fecha + ' · Administrador ' +
                administrador.clave) + '</p><p>' + ui.esc('Baja de ' + usuario.clave +
                ' · Motivo: ' + motivo + ' · Estatus: Inactivo.') + '</p></div>' +
            '<div class="actions user-baja-result-actions"><a class="btn btn-primary" ' +
            'href="usuarios.html">Volver a usuarios</a></div>');
    },

    formulario: function ()
    {
        document.getElementById('titulo-pagina').textContent = 'Dar de baja a un usuario';
        document.getElementById('descripcion-pagina').textContent =
            'Conserva su historial y elimina sus credenciales de acceso.';
        document.getElementById('resultado-baja').innerHTML = '';
        document.getElementById('form-baja-usuario').hidden = false;
        window.scrollTo(0, 0);
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};

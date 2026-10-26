/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   login_view.enfocar() */
/*   login_view.enlazar(acciones) */
/*   login_view.credenciales() */
/*   login_view.mensaje(tipo, titulo, texto) */
/*   login_view.marcar(campos) */
/*   login_view.ocupado(si) */
/*   login_view.limpiar_contrasena() */
/*   login_view.mostrar_restablecer() */
/*   login_view.nueva_contrasena() */
/*   login_view.mensaje_restablecer(tipo, titulo, texto) */
/*   login_view.pedir_recuperacion(enviar) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const login_view =
{
    enfocar: function ()
    {
        document.getElementById('clave').focus();
    },

    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.getElementById('form-login').addEventListener('submit', (elemento) =>
        {
            elemento.preventDefault();
            acciones.login();
        });
        document.getElementById('btn-olvide').addEventListener('click', () => acciones.recuperar());
        document.getElementById('form-restablecer').addEventListener('submit', (elemento_2) =>
        {
            elemento_2.preventDefault();
            acciones.restablecer();
        });
    },

    credenciales: function ()
    {
        return (
        {
            clave: document.getElementById('clave').value.trim(),
            contrasena: document.getElementById('contrasena').value
        });
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    },

    marcar: function (campos)
    {
        ui.marcar(campos);
    },

    ocupado: function (si)
    {
        const boton = document.getElementById('btn-login');
        boton.disabled = si;
        boton.textContent = si ? 'Validando…' : 'Iniciar sesión';
    },

    limpiar_contrasena: function ()
    {
        document.getElementById('contrasena').value = '';
        document.getElementById('contrasena').focus();
    },

    mostrar_restablecer: function ()
    {
        document.getElementById('panel-login').classList.add('hidden');
        document.getElementById('panel-restablecer').classList.remove('hidden');
        document.getElementById('nueva').focus();
    },

    nueva_contrasena: function ()
    {
        return (
        {
            nueva: document.getElementById('nueva').value,
            confirmacion: document.getElementById('confirmacion').value
        });
    },

    mensaje_restablecer: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje-restablecer', tipo, titulo, texto);
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* login_view.pedir_recuperacion()                             */
    /* Purpose: Request recovery through the controller.       */
    /**************************************************************/
    pedir_recuperacion: function (enviar)
    {
        return ui.dialogo(
        {
            titulo: 'Recuperar contraseña',
            texto: 'Escribe tu matrícula, nómina o correo registrado.',
            cuerpo: '<label for="recuperar-cuenta">Cuenta</label><input id="recuperar-cuenta" maxlength="254" autocomplete="username">',
            confirmar: 'Enviar enlace',
            al_confirmar: dialogo => enviar(dialogo.querySelector('#recuperar-cuenta').value
                .trim())
        });
    }
};

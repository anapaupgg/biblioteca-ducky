/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de login.html.                              */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   LoginView.credenciales()          - { clave, contrasena }    */
/*   LoginView.mensaje(tipo, t, texto) - Alert above the form     */
/*   LoginView.marcar(campos)          - Highlight fields         */
/*   LoginView.ocupado(si)             - Disable while sending    */
/*   LoginView.mostrar_restablecer()   - Show reset panel         */
/*   LoginView.nueva_contrasena()      - { nueva, confirmacion }  */
/*   LoginView.pedir_recuperacion()    - Recovery dialog          */
/******************************************************************/

const LoginView =
{
    credenciales: function()
    {
        return {
            clave: document.getElementById('clave').value.trim(),
            contrasena: document.getElementById('contrasena').value
        };
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); },

    marcar: function(campos) { Ui.marcar(campos); },

    ocupado: function(si)
    {
        const boton = document.getElementById('btn-login');
        boton.disabled = si;
        boton.textContent = si ? 'Validando…' : 'Iniciar sesión';
    },

    limpiar_contrasena: function()
    {
        document.getElementById('contrasena').value = '';
        document.getElementById('contrasena').focus();
    },

    mostrar_restablecer: function()
    {
        document.getElementById('panel-login').classList.add('hidden');
        document.getElementById('panel-restablecer').classList.remove('hidden');
        document.getElementById('nueva').focus();
    },

    nueva_contrasena: function()
    {
        return {
            nueva: document.getElementById('nueva').value,
            confirmacion: document.getElementById('confirmacion').value
        };
    },

    mensaje_restablecer: function(tipo, titulo, texto) { Ui.alerta('mensaje-restablecer', tipo, titulo, texto); },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* LoginView.pedir_recuperacion()                             */
    /* Purpose: Request recovery through the controller.       */
    /**************************************************************/
    pedir_recuperacion: function(enviar)
    {
        return Ui.dialogo({
            titulo: 'Recuperar contraseña',
            texto: 'Escribe tu matrícula, nómina o correo registrado.',
            cuerpo: '<label for="recuperar-cuenta">Cuenta</label><input id="recuperar-cuenta" maxlength="254" autocomplete="username">',
            confirmar: 'Enviar enlace',
            al_confirmar: dialogo => enviar(dialogo.querySelector('#recuperar-cuenta').value.trim())
        });
    }
};

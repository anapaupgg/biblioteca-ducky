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
    /* LoginView.pedir_recuperacion(al_enviar)                    */
    /* Purpose: Dialog "Restablecer contraseña" where the user    */
    /*          types matrícula, nómina or institutional e-mail.  */
    /*          al_enviar(texto) returns the server answer.       */
    /**************************************************************/
    pedir_recuperacion: function(al_enviar)
    {
        let respuesta = null;
        return Ui.dialogo(
        {
            titulo: 'Restablecer contraseña',
            texto: 'Escribe tu matrícula, nómina o correo institucional. Te enviaremos un enlace válido por 30 minutos.',
            cuerpo: '<div class="field"><label for="clave_o_correo">Matrícula, nómina o correo</label>' +
                    '<input id="clave_o_correo" type="text" placeholder="621234 o nombre@ducky.edu.mx" autocomplete="email"></div>',
            confirmar: 'Enviar enlace',
            al_confirmar: async (dialogo) =>
            {
                respuesta = await al_enviar(dialogo.querySelector('#clave_o_correo').value.trim());
            }
        }).then((ok) => (ok ? respuesta : null));
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* LoginView.confirmar_envio(respuesta)                       */
    /* Purpose: Dialog "Revisa tu correo". In this prototype the  */
    /*          link that would be e-mailed is shown here.        */
    /**************************************************************/
    confirmar_envio: function(respuesta)
    {
        const demo = respuesta.enlace_demo
            ? '<div class="alert"><strong>Enlace enviado a ' + Ui.esc(respuesta.correo_demo) + '</strong>' +
              '<span><a href="' + Ui.esc(respuesta.enlace_demo) + '">Abrir enlace para restablecer la contraseña</a></span></div>'
            : '';
        return Ui.dialogo({ titulo: 'Revisa tu correo', texto: respuesta.mensaje, cuerpo: demo, confirmar: 'Entendido', cancelar: false });
    }
};

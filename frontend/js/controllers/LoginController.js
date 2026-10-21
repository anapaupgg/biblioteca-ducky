/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controlador de login.html.                        */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   LoginController.iniciar()      - Bind events, read URL state */
/*   LoginController.login()        - Submit credentials          */
/*   LoginController.recuperar()    - Start password recovery     */
/*   LoginController.restablecer()  - Save new password by token  */
/******************************************************************/

const LoginController =
{
    iniciar: function()
    {
        if (Session.token() && !Ui.param('token'))
        {
            window.location.href = 'inicio.html';
            return;
        }

        document.getElementById('form-login').addEventListener('submit', (e) => { e.preventDefault(); this.login(); });
        document.getElementById('btn-olvide').addEventListener('click', () => this.recuperar());
        document.getElementById('form-restablecer').addEventListener('submit', (e) => { e.preventDefault(); this.restablecer(); });

        if (Ui.param('expirada')) LoginView.mensaje('warning', 'Sesión expirada: inicia sesión nuevamente');
        if (Ui.param('salida'))   LoginView.mensaje('ok', 'Sesión cerrada', 'Gracias por usar Biblioteca Ducky.');
        if (Ui.param('token'))    LoginView.mensaje('warning', 'Enlace no disponible', 'La recuperación por correo aún no está disponible. Contacta al administrador de la biblioteca.');
        else document.getElementById('clave').focus();
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* LoginController.login()                                    */
    /* Purpose: Validate locally (empty / format), then call the  */
    /*          API. On success store the session and go to       */
    /*          inicio.html (or to the temporary password change).*/
    /**************************************************************/
    login: async function()
    {
        LoginView.mensaje();
        Ui.limpiar();
        const datos = LoginView.credenciales();

        const vacios = [];
        if (!datos.clave) vacios.push('clave');
        if (!datos.contrasena) vacios.push('contrasena');
        if (vacios.length > 0)
        {
            LoginView.marcar(vacios);
            LoginView.mensaje('error', 'Faltan datos para entrar', 'Ingresa tu Usuario y contraseña.');
            return;
        }
        if (!/^[A-Za-z0-9]{6}$/.test(datos.clave))
        {
            LoginView.marcar(['clave']);
            LoginView.mensaje('error', 'Ingresa un Usuario válido', 'La matrícula o nómina tiene 6 caracteres.');
            return;
        }

        LoginView.ocupado(true);
        try
        {
            const resultado = await AuthModel.login(datos.clave, datos.contrasena);
            Session.set(resultado.token, resultado.usuario);
            window.location.href = resultado.cambiar_contrasena ? 'cambiar_contrasena.html' : 'inicio.html';
        }
        catch (error)
        {
            LoginView.ocupado(false);
            LoginView.marcar(error.campos);
            const titulos = { 401: 'No pudimos verificar tus datos', 403: 'Acceso no permitido', 423: 'Cuenta bloqueada' };
            LoginView.mensaje('error', titulos[error.status] || 'No fue posible iniciar sesión', error.message);
            if (error.status === 401) LoginView.limpiar_contrasena();
        }
    },

    recuperar: async function()
    {
        await LoginView.pedir_recuperacion();
    },

    restablecer: async function()
    {
        const datos = LoginView.nueva_contrasena();
        try
        {
            const r = await AuthModel.restablecer(Ui.param('token'), datos.nueva, datos.confirmacion);
            LoginView.mensaje_restablecer('ok', r.mensaje);
            setTimeout(() => { window.location.href = 'login.html'; }, 1800);
        }
        catch (error)
        {
            Ui.marcar(error.campos);
            LoginView.mensaje_restablecer('error', error.message);
        }
    }
};

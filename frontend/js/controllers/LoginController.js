/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   login_controller.iniciar() */
/*   login_controller.login() */
/*   login_controller.recuperar() */
/*   login_controller.restablecer() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const login_controller =
{
    iniciar: function ()
    {
        this.token = new URLSearchParams(window.location.hash.slice(1)).get('token') || ui.param(
            'token');
        if (this.token) window.history.replaceState(null, '', 'login.html');
        if (session.token() && !this.token)
        {
            window.location.href = 'inicio.html';
            return;
        }

        login_view.enlazar(
        {
            login: (...argumentos) => this.login(...argumentos),
            recuperar: (...argumentos) => this.recuperar(...argumentos),
            restablecer: (...argumentos) => this.restablecer(...argumentos)
        });

        if (ui.param('expirada')) login_view.mensaje('warning',
            'Sesión expirada: inicia sesión nuevamente');
        if (ui.param('salida')) login_view.mensaje('ok', 'Sesión cerrada',
            'Gracias por usar Biblioteca Ducky.');
        if (this.token) login_view.mostrar_restablecer();
        else login_view.enfocar();
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* login_controller.login()                                    */
    /* Purpose: Validate locally (empty / format), then call the  */
    /*          API. On success store the session and go to       */
    /*          inicio.html (or to the temporary password change).*/
    /**************************************************************/
    login: async function ()
    {
        login_view.mensaje();
        ui.limpiar();
        const datos = login_view.credenciales();

        const vacios = [];
        if (!datos.clave) vacios.push('clave');
        if (!datos.contrasena) vacios.push('contrasena');
        if (vacios.length > 0)
        {
            login_view.marcar(vacios);
            login_view.mensaje('error', 'Faltan datos para entrar',
                'Ingresa tu Usuario y contraseña.');
            return;
        }
        if (!/^[A-Za-z0-9]{6}$/.test(datos.clave))
        {
            login_view.marcar(['clave']);
            login_view.mensaje('error', 'Ingresa un Usuario válido',
                'La matrícula o nómina tiene 6 caracteres.');
            return;
        }

        login_view.ocupado(true);
        try
        {
            const resultado = await auth_model.login(datos.clave, datos.contrasena);
            session.set(resultado.token, resultado.usuario);
            window.location.href = resultado.cambiar_contrasena ? 'cambiar_contrasena.html' :
                'inicio.html';
        }
        catch (error)
        {
            login_view.ocupado(false);
            login_view.marcar(error.campos);
            const titulos =
            {
                401: 'No pudimos verificar tus datos',
                403: 'Acceso no permitido',
                423: 'Cuenta bloqueada'
            };
            login_view.mensaje('error', titulos[error.status] || 'No fue posible iniciar sesión',
                error.message);
            if (error.status === 401) login_view.limpiar_contrasena();
        }
    },

    recuperar: async function ()
    {
        await login_view.pedir_recuperacion(async cuenta =>
        {
            const resultado_2 = await auth_model.recuperar(cuenta);
            login_view.mensaje('ok', 'Solicitud recibida', resultado_2.mensaje);
        });
    },

    restablecer: async function ()
    {
        const datos = login_view.nueva_contrasena();
        try
        {
            const resultado_3 = await auth_model.restablecer(this.token, datos.nueva, datos
                .confirmacion);
            session.clear();
            this.token = null;
            login_view.mensaje_restablecer('ok', resultado_3.mensaje);
            setTimeout(() =>
            {
                window.location.href = 'login.html';
            }, 1800);
        }
        catch (error)
        {
            ui.marcar(error.campos);
            login_view.mensaje_restablecer('error', error.message);
        }
    }
};

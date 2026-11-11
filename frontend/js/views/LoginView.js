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
/*   login_view.perfiles(lista) */
/*   login_view.elegir_perfil() */
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
    perfiles_disponibles: [
        'Administrador del sistema', 'Administrador de biblioteca',
        'Administrador del catálogo', 'Lector'
    ],

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
        document.getElementById('perfil').addEventListener('click', () => this.elegir_perfil());
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
            contrasena: document.getElementById('contrasena').value,
            perfil: document.getElementById('perfil').dataset.valor || ''
        });
    },

    perfiles: function (lista)
    {
        if (Array.isArray(lista) && lista.length > 0)
        {
            this.perfiles_disponibles = lista.filter((nombre) => typeof nombre === 'string');
        }
    },

    elegir_perfil: function ()
    {
        const boton = document.getElementById('perfil');
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML =
            '<div class="dialog login-profile-dialog" role="dialog" aria-modal="true" ' +
            'aria-labelledby="perfil-titulo"><h2 id="perfil-titulo">¿Con qué perfil entras?</h2>' +
            '<p>Elige el perfil asignado a tu cuenta institucional.</p>' +
            '<div class="login-profile-options">' + this.perfiles_disponibles.map((perfil) =>
                '<button type="button" class="btn" data-perfil="' + ui.esc(perfil) + '">' +
                ui.esc(perfil === 'Lector' ? 'Lector (alumno o docente)' : perfil) +
                '</button>').join('') + '</div></div>';
        document.body.appendChild(overlay);
        boton.setAttribute('aria-expanded', 'true');

        const cerrar = () =>
        {
            overlay.remove();
            boton.setAttribute('aria-expanded', 'false');
            document.removeEventListener('keydown', tecla);
            boton.focus();
        };
        const tecla = (evento) =>
        {
            if (evento.key === 'Escape') cerrar();
        };
        document.addEventListener('keydown', tecla);
        overlay.addEventListener('click', (evento) =>
        {
            if (evento.target === overlay) cerrar();
        });
        overlay.querySelectorAll('[data-perfil]').forEach((opcion) =>
            opcion.addEventListener('click', () =>
            {
                boton.dataset.valor = opcion.dataset.perfil;
                boton.textContent = opcion.textContent;
                boton.classList.add('selected');
                boton.classList.remove('error');
                cerrar();
            }));
        overlay.querySelector('[data-perfil]')?.focus();
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

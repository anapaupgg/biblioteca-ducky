/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Datos de la sesión. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   session._leer() */
/*   session.set(token, usuario) */
/*   session.actualizar_usuario(usuario) */
/*   session.get() */
/*   session.token() */
/*   session.clear() */
/*   session.puede(funcion) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

const SESSION_KEY = 'biblioteca_ducky_sesion';

const session =
{
    _leer: function ()
    {
        try
        {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
        }
        catch (error)
        {
            return null;
        }
    },

    set: function (token, usuario)
    {
        try
        {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(
            {
                token: token,
                usuario: usuario
            }));
        }
        catch (error_2)
        {
            /* private mode: the session lives only in this page */ }
    },

    actualizar_usuario: function (usuario)
    {
        const actual = this._leer();
        if (actual) this.set(actual.token, usuario);
    },

    get: function ()
    {
        const registro = this._leer();
        return registro ? registro.usuario : null;
    },
    token: function ()
    {
        const registro_2 = this._leer();
        return registro_2 ? registro_2.token : null;
    },
    clear: function ()
    {
        try
        {
            sessionStorage.removeItem(SESSION_KEY);
        }
        catch (error_3)
        {
            /* ignore */ }
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* session.puede(funcion)                                     */
    /* Purpose: true when the profile has the function (used to   */
    /*          show or hide menu entries and buttons)            */
    /**************************************************************/
    puede: function (funcion)
    {
        const usuario = this.get();
        return Boolean(usuario && usuario.funciones && usuario.funciones.includes(funcion));
    }
};

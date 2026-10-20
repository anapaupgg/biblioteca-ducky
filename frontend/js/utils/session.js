/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Datos de la sesión.                               */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   Session.set(token, usuario) - Store after login              */
/*   Session.get()               - Current user or null           */
/*   Session.token()             - Current token or null          */
/*   Session.clear()             - Forget the session             */
/*   Session.puede(funcion)      - Does the profile have it?      */
/******************************************************************/

const SESSION_KEY = 'biblioteca_ducky_sesion';

const Session =
{
    _leer: function()
    {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
        catch (e) { return null; }
    },

    set: function(token, usuario)
    {
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: token, usuario: usuario })); }
        catch (e) { /* private mode: the session lives only in this page */ }
    },

    actualizar_usuario: function(usuario)
    {
        const actual = this._leer();
        if (actual) this.set(actual.token, usuario);
    },

    get:   function() { const s = this._leer(); return s ? s.usuario : null; },
    token: function() { const s = this._leer(); return s ? s.token : null; },
    clear: function() { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* Session.puede(funcion)                                     */
    /* Purpose: true when the profile has the function (used to   */
    /*          show or hide menu entries and buttons)            */
    /**************************************************************/
    puede: function(funcion)
    {
        const usuario = this.get();
        return Boolean(usuario && usuario.funciones && usuario.funciones.includes(funcion));
    }
};

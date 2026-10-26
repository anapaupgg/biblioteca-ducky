/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Modelo cliente: transporte de datos hacia la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   auth_model.login(clave, contrasena) */
/*   auth_model.recuperar(clave_o_correo) */
/*   auth_model.restablecer(token, nueva, confirmacion) */
/*   auth_model.cambiar_contrasena(actual, nueva, confirmacion) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de api; recibe datos validados por el controlador. */
/* Devuelve Promise de JSON; rechaza con api_error ante errores HTTP. */
/* Identificadores string/number se codifican en la URL; no manipula DOM. */
/******************************************************************/

const auth_model =
{
    /* POST /auth/login -> { token, usuario, cambiar_contrasena } */
    login: function (clave, contrasena)
    {
        return api.post('/auth/login',
        {
            clave: clave,
            contrasena: contrasena
        });
    },

    /* POST /auth/recuperar -> { mensaje } */
    recuperar: function (clave_o_correo)
    {
        return api.post('/auth/recuperar',
        {
            clave_o_correo: clave_o_correo
        });
    },

    /* POST /auth/restablecer */
    restablecer: function (token, nueva, confirmacion)
    {
        return api.post('/auth/restablecer',
        {
            token: token,
            nueva: nueva,
            confirmacion: confirmacion
        });
    },

    /* POST /auth/contrasena (temporary password) */
    cambiar_contrasena: function (actual, nueva, confirmacion)
    {
        return api.post('/auth/contrasena',
        {
            actual: actual,
            nueva: nueva,
            confirmacion: confirmacion
        });
    }
};

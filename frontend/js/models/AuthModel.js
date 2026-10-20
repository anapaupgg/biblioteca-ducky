/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Authentication model: login, session, recovery    */
/*              and password change (/api/auth).                  */
/*              Views and controllers never call fetch directly:  */
/*              they go through this object, which uses Api.      */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   AuthModel.login(clave, contrasena)                           */
/*   AuthModel.recuperar(clave_o_correo)                          */
/*   AuthModel.restablecer(token, nueva, confirmacion)            */
/*   AuthModel.cambiar_contrasena(actual, nueva, confirmacion)    */
/******************************************************************/

const AuthModel =
{
    /* POST /auth/login -> { token, usuario, cambiar_contrasena } */
    login: function(clave, contrasena)
    {
        return Api.post('/auth/login', { clave: clave, contrasena: contrasena });
    },

    /* POST /auth/recuperar -> { mensaje, enlace_demo } */
    recuperar: function(clave_o_correo)
    {
        return Api.post('/auth/recuperar', { clave_o_correo: clave_o_correo });
    },

    /* POST /auth/restablecer */
    restablecer: function(token, nueva, confirmacion)
    {
        return Api.post('/auth/restablecer', { token: token, nueva: nueva, confirmacion: confirmacion });
    },

    /* POST /auth/contrasena (temporary password) */
    cambiar_contrasena: function(actual, nueva, confirmacion)
    {
        return Api.post('/auth/contrasena', { actual: actual, nueva: nueva, confirmacion: confirmacion });
    }
};

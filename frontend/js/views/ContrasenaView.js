/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   contrasena_view.enlazar(acciones) */
/*   contrasena_view.datos() */
/*   contrasena_view.mensaje(tipo, titulo, texto) */
/*   contrasena_view.marcar(campos) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const contrasena_view =
{
    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.getElementById('form-contrasena').addEventListener('submit', (elemento) =>
        {
            elemento.preventDefault();
            acciones.guardar();
        });
    },

    datos: function ()
    {
        return ui.leer(['actual', 'nueva', 'confirmacion']);
    },
    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    },
    marcar: function (campos)
    {
        ui.marcar(campos);
    }
};

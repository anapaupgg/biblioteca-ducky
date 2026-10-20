/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: View of cambiar_contrasena.html                   */
/******************************************************************/

const ContrasenaView =
{
    datos:   function() { return Ui.leer(['actual', 'nueva', 'confirmacion']); },
    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); },
    marcar:  function(campos) { Ui.marcar(campos); }
};

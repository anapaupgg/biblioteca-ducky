/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Funciones de validación. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   faltantes(body, campos) */
/*   requerir(body, campos, mensaje) */
/*   es_clave_usuario(valor) */
/*   es_isbn(valor) */
/*   es_correo(valor) */
/*   texto_busqueda(valor) */
/*   entero_positivo(valor) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

const
{
    error_negocio
} = require('./errores');

/******************************************************************/
/* Reuse Instructions                                             */
/* faltantes(body, campos)                                        */
/* Purpose: Return the names of the required fields that are      */
/*          missing, null or blank in the payload.                */
/* Returns: array of field names (empty when everything is there) */
/******************************************************************/
const faltantes = (body, campos) =>
    campos.filter((campo) =>
    {
        const valor = body ? body[campo] : undefined;
        if (Array.isArray(valor)) return valor.length === 0;
        return valor === undefined || valor === null || String(valor).trim() === '';
    });

/******************************************************************/
/* Reuse Instructions                                             */
/* requerir(body, campos, mensaje)                                */
/* Purpose: Throw ErrorNegocio(400) listing the missing fields.   */
/******************************************************************/
const requerir = (body, campos, mensaje) =>
{
    const vacios = faltantes(body, campos);
    if (vacios.length > 0)
    {
        throw new error_negocio(400, mensaje || 'Completa los campos obligatorios', vacios);
    }
};

const es_clave_usuario = (valor) => typeof valor === 'string' && /^[A-Za-z0-9]{6}$/.test(valor.trim());
const es_isbn = (valor) => /^([0-9]{9}[0-9X]|[0-9]{13})$/.test(String(valor || '').replace(/-/g, ''));
const es_correo = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || ''));
const texto_busqueda = (valor) => !valor || String(valor).trim().length >= 3;
const entero_positivo = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

module.exports =
{
    faltantes,
    requerir,
    es_clave_usuario,
    es_isbn,
    es_correo,
    texto_busqueda,
    entero_positivo
};

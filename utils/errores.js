/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Manejo de errores de la API.                      */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   MENSAJES_RESTRICCION        - Friendly text per constraint   */
/*   responder_error(res, error) - Send the proper HTTP response  */
/******************************************************************/

/* PostgreSQL SQLSTATE codes used below                           */
const PG_REGLA_NEGOCIO = 'P0001';   /* RAISE EXCEPTION from a trigger */
const PG_DUPLICADO     = '23505';   /* unique_violation               */
const PG_REFERENCIA    = '23503';   /* foreign_key_violation          */
const PG_CHECK         = '23514';   /* check_violation                */
const PG_NULO          = '23502';   /* not_null_violation             */
const PG_FORMATO       = '22P02';   /* invalid_text_representation    */

/******************************************************************/
/* Friendly messages for the constraints defined in 01_esquema    */
/******************************************************************/
const MENSAJES_RESTRICCION =
{
    usuarios_pkey:            'La Clave ya existe en el sistema',
    usuarios_correo_key:      'El correo institucional ya está registrado',
    ck_usuarios_clave:        'La Clave debe tener 6 caracteres (matrícula o nómina)',
    perfiles_nombre_key:      'Ya existe un perfil con ese nombre',
    libros_pkey:              'Ya existe un libro con esa Clave',
    libros_isbn_key:          'La ficha ya existe: hay un libro registrado con ese ISBN',
    ck_libros_clave:          'La Clave del libro debe tener el formato L000000',
    ck_libros_isbn:           'El ISBN debe tener 10 o 13 dígitos',
    ck_libros_enlace:         'Un libro digital necesita su enlace de consulta',
    ck_libros_alta:           'Falta la fecha de alta en catálogo',
    uq_libro_autor_principal: 'Solo puede haber un autor principal',
    uq_ubicacion:             'Esa ubicación (sección, estante y fila) ya existe',
    uq_prestamo_abierto:      'El ejemplar ya tiene un préstamo abierto',
    uq_espera_activa:         'Ya existe una solicitud en lista de espera de este usuario para el libro',
    devoluciones_id_prestamo_key: 'Ese préstamo ya fue devuelto',
    pagos_multa_id_multa_key: 'Esa multa ya tiene un pago registrado',
    presupuestos_mensuales_periodo_key: 'Ya existe un presupuesto para ese mes',
    ck_presupuesto_periodo:   'El periodo debe tener el formato AAAA-MM',
    ck_presupuesto_monto:     'El monto autorizado debe ser mayor a cero',
    ck_recuperacion_30min:    'La recuperación debe vencer a los 30 minutos'
};

/******************************************************************/
/* Reuse Instructions                                             */
/* responder_error(res, error, contexto)                          */
/* Purpose: Map a database or validation error to a JSON response */
/*          { error } with the right HTTP status:                 */
/*            422 business rule / check   409 duplicate           */
/*            400 bad format / missing    500 unexpected          */
/* Parameters:                                                    */
/*   res      - Express response                                  */
/*   error    - Error thrown by pg or by a controller             */
/*   contexto - string - used in the server log only              */
/******************************************************************/
const responder_error = (res, error, contexto) =>
{
    if (error.status)
    {
        return res.status(error.status).json({ error: error.message, campos: error.campos || [] });
    }

    const amigable = MENSAJES_RESTRICCION[error.constraint];

    switch (error.code)
    {
        case PG_REGLA_NEGOCIO:
            return res.status(422).json({ error: error.message });
        case PG_DUPLICADO:
            return res.status(409).json({ error: amigable || 'El registro ya existe' });
        case PG_CHECK:
            return res.status(422).json({ error: amigable || 'Algún dato no cumple las reglas del sistema' });
        case PG_REFERENCIA:
            return res.status(422).json({ error: amigable || 'Uno de los datos seleccionados no existe' });
        case PG_NULO:
            return res.status(400).json({ error: 'Falta el dato obligatorio: ' + error.column });
        case PG_FORMATO:
            return res.status(400).json({ error: 'Algún dato tiene un formato inválido' });
        default:
            console.error((contexto || 'error') + ':', error);
            return res.status(500).json({ error: 'Ocurrió un error inesperado, intenta de nuevo' });
    }
};

/******************************************************************/
/* Reuse Instructions                                             */
/* ErrorNegocio(status, message, campos)                          */
/* Purpose: Error that a controller throws to answer with a given */
/*          HTTP status and the list of fields to highlight.      */
/******************************************************************/
class ErrorNegocio extends Error
{
    constructor(status, message, campos)
    {
        super(message);
        this.status = status;
        this.campos = campos;
    }
}

module.exports = { responder_error, ErrorNegocio };

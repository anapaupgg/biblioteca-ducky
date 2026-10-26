/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Llamadas a la API. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   api.request(method, path, body) */
/*   api.get(path, query) */
/*   api.post(path, body) */
/*   api.put(path, body) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

const API_BASE_URL = '/api';

class api_error extends Error
{
    constructor(status, body)
    {
        super((body && body.error) || ('Error ' + status));
        this.name = 'ApiError';
        this.status = status;
        this.body = body ||
        {
        };
        this.campos = (body && body.campos) || [];
    }
}

const api =
{
    /**************************************************************/
    /* Reuse Instructions                                         */
    /* api.request(method, path, body)                            */
    /* Purpose: Send the request with the Bearer token. A 401     */
    /*          means the session expired: the session is cleared */
    /*          and the user goes back to the login screen.       */
    /* Returns: Promise resolving to the parsed JSON              */
    /* Throws : ApiError on non-2xx; ApiError(0) on network error */
    /**************************************************************/
    request: async function (method, path, body)
    {
        const opciones =
        {
            method: method,
            headers:
            {
                'Content-Type': 'application/json'
            }
        };
        const token = session.token();
        if (token) opciones.headers.Authorization = 'Bearer ' + token;
        if (body !== undefined) opciones.body = JSON.stringify(body);

        let respuesta;
        try
        {
            respuesta = await fetch(API_BASE_URL + path, opciones);
        }
        catch (error)
        {
            throw new api_error(0,
            {
                error: 'No fue posible conectar con el servidor. Intenta de nuevo.'
            });
        }

        const texto = await respuesta.text();
        let datos = null;
        try
        {
            datos = texto ? JSON.parse(texto) : null;
        }
        catch (error_2)
        {
            throw new api_error(respuesta.status,
            {
                error: 'El servidor devolvió una respuesta inesperada. Verifica que estés conectado a Biblioteca Ducky e intenta de nuevo.'
            });
        }

        if (respuesta.status === 401 && token && datos && datos.codigo === 'SESION_EXPIRADA')
        {
            session.clear();
            window.location.href = 'login.html?expirada=1';
        }
        if (!respuesta.ok) throw new api_error(respuesta.status, datos);
        return datos;
    },

    get: function (path, query)
    {
        const limpio =
        {
        };
        Object.entries(query ||
        {
        }).forEach(([clave, valor]) =>
        {
            if (valor !== undefined && valor !== null && valor !== '') limpio[clave] = valor;
        });
        const qs = new URLSearchParams(limpio).toString();
        return this.request('GET', path + (qs ? '?' + qs : ''));
    },

    post: function (path, body)
    {
        return this.request('POST', path, body ||
        {
        });
    },
    put: function (path, body)
    {
        return this.request('PUT', path, body ||
        {
        });
    }
};

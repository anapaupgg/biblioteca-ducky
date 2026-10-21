/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Llamadas a la API.                                */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   ApiError                 - Error with HTTP status and body   */
/*   Api.get(path, query)     - GET with optional query object    */
/*   Api.post(path, body)     - POST JSON                         */
/*   Api.put(path, body)      - PUT JSON                          */
/******************************************************************/

/* Same origin: the Express server also serves this frontend      */
const API_BASE_URL = '/api';

class ApiError extends Error
{
    constructor(status, body)
    {
        super((body && body.error) || ('Error ' + status));
        this.name   = 'ApiError';
        this.status = status;
        this.body   = body || {};
        this.campos = (body && body.campos) || [];
    }
}

const Api =
{
    /**************************************************************/
    /* Reuse Instructions                                         */
    /* Api.request(method, path, body)                            */
    /* Purpose: Send the request with the Bearer token. A 401     */
    /*          means the session expired: the session is cleared */
    /*          and the user goes back to the login screen.       */
    /* Returns: Promise resolving to the parsed JSON              */
    /* Throws : ApiError on non-2xx; ApiError(0) on network error */
    /**************************************************************/
    request: async function(method, path, body)
    {
        const opciones = { method: method, headers: { 'Content-Type': 'application/json' } };
        const token = Session.token();
        if (token) opciones.headers.Authorization = 'Bearer ' + token;
        if (body !== undefined) opciones.body = JSON.stringify(body);

        let respuesta;
        try
        {
            respuesta = await fetch(API_BASE_URL + path, opciones);
        }
        catch (error_red)
        {
            throw new ApiError(0, { error: 'No fue posible conectar con el servidor. Intenta de nuevo.' });
        }

        const texto = await respuesta.text();
        let datos = null;
        try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = { error: texto }; }

        if (respuesta.status === 401 && token && datos && datos.codigo === 'SESION_EXPIRADA')
        {
            Session.clear();
            window.location.href = 'login.html?expirada=1';
        }
        if (!respuesta.ok) throw new ApiError(respuesta.status, datos);
        return datos;
    },

    get: function(path, query)
    {
        const limpio = {};
        Object.entries(query || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') limpio[k] = v; });
        const qs = new URLSearchParams(limpio).toString();
        return this.request('GET', path + (qs ? '?' + qs : ''));
    },

    post: function(path, body) { return this.request('POST', path, body || {}); },
    put:  function(path, body) { return this.request('PUT', path, body || {}); }
};

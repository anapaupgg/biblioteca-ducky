/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: Validación del perfil elegido en el acceso.      */
/******************************************************************/

/******************************************************************/
/* Listing Contents: rechazo de perfil ajeno sin sesión abierta.  */
/* Reuse Instructions: npm test; stubs sin conexión a PostgreSQL. */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters';
const modelo = require('../models/sesionModel');
const controlador = require('../controllers/authController');

const respuesta = () => ({
    status(codigo)
    {
        this.codigo = codigo;
        return this;
    },
    json(cuerpo)
    {
        this.cuerpo = cuerpo;
        return this;
    }
});

test('el perfil incorrecto cierra la sesión recién creada y rechaza el acceso', async () =>
{
    const originales = {
        iniciar_sesion: modelo.iniciar_sesion,
        obtener_activa: modelo.obtener_activa,
        cerrar: modelo.cerrar
    };
    let cerrada = null;
    try
    {
        modelo.iniciar_sesion = async () => ({ resultado: 'OK', id_sesion: 123,
            cambiar_contrasena: false });
        modelo.obtener_activa = async () => ({ perfil: 'Administrador del sistema',
            funciones: ['Préstamos'] });
        modelo.cerrar = async (id) => { cerrada = id; };
        const res = respuesta();
        await controlador.login({
            body: { clave: '100001', contrasena: 'prueba', perfil: 'Lector' },
            headers: { 'user-agent': 'Test' }
        }, res);
        assert.equal(res.codigo, 401);
        assert.equal(cerrada, 123);
        assert.deepEqual(res.cuerpo.campos, ['perfil']);
    }
    finally
    {
        Object.assign(modelo, originales);
    }
});

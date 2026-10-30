/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Pruebas de regresión y contratos del sistema. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   Dependencias, configuración y montaje del módulo. */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Ejecutar con npm test; DUCKY_TEST_DB=1 habilita integración local. */
/* Las pruebas de datos revierten cambios o usan esquema aislado. */
/******************************************************************/

const
{
    test
} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
process.env.SESSION_SECRET = 'prueba-rutas-sin-secretos-reales-12345';
const sesiones = require('../models/sesionModel');
const auth = require('../middleware/auth');
// Controladores sustituidos: ninguna ruta ejecuta escrituras ni lee datos personales.
const grupos = [
    ['chatbot', 'Chatbot', [
        ['get', '/']
    ]],
    ['usuarios', 'Gestionar usuarios', [
        ['get', '/catalogos'],
        ['get', '/institucion/123456'],
        ['get', '/'],
        ['get', '/123456'],
        ['post', '/'],
        ['put', '/123456/perfil'],
        ['post', '/123456/baja'],
        ['post', '/123456/reactivar']
    ]],
    ['perfiles', 'Gestionar perfiles', [
        ['get', '/funciones'],
        ['get', '/'],
        ['post', '/'],
        ['put', '/4'],
        ['post', '/4/baja'],
        ['post', '/4/reactivar']
    ]],
    ['libros', 'Gestionar libros', [
        ['get', '/catalogos'],
        ['post', '/ubicaciones'],
        ['get', '/'],
        ['get', '/L000128'],
        ['post', '/'],
        ['put', '/L000128'],
        ['post', '/L000128/alta'],
        ['post', '/L000128/retirar'],
        ['post', '/L000128/ejemplares'],
        ['put', '/ejemplares/1'],
        ['post', '/ejemplares/1/baja']
    ]],
    ['busqueda', 'Buscar libros', [
        ['get', '/listado'],
        ['get', '/'],
        ['get', '/L000128'],
        ['post', '/L000128/solicitud']
    ]],
    ['pedidos', ['Solicitar compras', 'Autorizar compras', 'Gestionar libros'],
        [
            ['get', '/presupuestos'],
            ['get', '/'],
            ['get', '/1']
        ]
    ],
    ['pedidos', 'Solicitar compras', [['post', '/']]],
    ['pedidos', 'Autorizar compras', [['put', '/1/estatus']]],
    ['pedidos', 'Gestionar libros', [
        ['post', '/1/recepcion']
    ]],
    ['prestamos', 'Buscar libros', [['get', '/mios']]],
    ['prestamos', 'Préstamos', [
        ['get', '/solicitudes'],
        ['post', '/solicitudes/1/autorizar']
    ]]
];
const archivos =
{
    chatbot: 'chatbot',
    usuarios: 'usuario',
    perfiles: 'perfil',
    libros: 'libro',
    busqueda: 'busqueda',
    pedidos: 'pedido',
    prestamos: 'prestamo'
};
const roles =
{
    sistema: ['Gestionar usuarios', 'Gestionar perfiles', 'Gestionar libros', 'Buscar libros',
        'Préstamos', 'Devoluciones', 'Chatbot', 'Solicitar compras', 'Autorizar compras'
    ],
    biblioteca: ['Gestionar usuarios', 'Buscar libros', 'Préstamos', 'Devoluciones', 'Chatbot', 'Solicitar compras', 'Autorizar compras'],
    catalogo: ['Gestionar libros', 'Buscar libros', 'Chatbot'],
    lector: ['Buscar libros', 'Chatbot'],
    soloPerfiles: ['Gestionar perfiles'],
    solo_prestamos: ['Préstamos'],
    solo_solicitudes: ['Solicitar compras'],
    solo_autorizacion: ['Autorizar compras'],
    sinPermisos: []
};
test('matriz HTTP: rutas reales rechazan anónimos, lector y permisos ajenos antes del controlador',
async () =>
    {
        let usuario, ejecuciones = 0;
        const original = sesiones.obtener_activa;
        sesiones.obtener_activa = async () => usuario;
        const app = express();
        app.use(express.json());
        for (const [grupo, prefijo] of Object.entries(archivos))
        {
            const ctx = vm.createContext(
            {
                module:
                {
                    exports:
                    {
                    }
                },
                require: n => n === 'express' ? express : n.includes('middleware/auth') ?
                    auth : new Proxy(
                    {
                    },
                    {
                        get: () => (_req, res) =>
                        {
                            ejecuciones++;
                            res.sendStatus(204);
                        }
                    })
            });
            vm.runInContext(fs.readFileSync(path.join(__dirname, '../routes', prefijo + 'Routes.js'),
                'utf8'), ctx);
            app.use('/api/' + grupo, ctx.module.exports);
        }
        const server = app.listen(0, '127.0.0.1');
        await new Promise((resolve, reject) =>
        {
            server.once('listening', resolve);
            server.once('error', reject);
        });
        const base = 'http://127.0.0.1:' + server.address().port;
        const token = auth.firmar_token(1);
        let casos = 0;
        try
        {
            for (const [grupo, permiso, rutas] of grupos)
                for (const [method, ruta] of rutas)
                {
                    const url = base + '/api/' + grupo + ruta;
                    let before = ejecuciones;
                    assert.equal((await fetch(url,
                    {
                        method
                    })).status, 401, method + ' ' + url + ' anónimo');
                    assert.equal(ejecuciones, before);
                    for (const [rol, funciones] of Object.entries(roles))
                    {
                        usuario =
                        {
                            clave: 'TEST01',
                            es_temporal: false,
                            funciones
                        };
                        before = ejecuciones;
                        const permitido = [permiso].flat().some(p => funciones.includes(p));
                        const r = await fetch(url,
                        {
                            method,
                            headers:
                            {
                                Authorization: 'Bearer ' + token
                            }
                        });
                        assert.equal(r.status, permitido ? 204 : 403, rol + ' ' + method + ' ' + url);
                        assert.equal(ejecuciones - before, permitido ? 1 : 0);
                        casos++;
                    }
                    usuario =
                    {
                        clave: 'TEST01',
                        es_temporal: true,
                        funciones: roles.sistema
                    };
                    before = ejecuciones;
                    assert.equal((await fetch(url,
                    {
                        method,
                        headers:
                        {
                            Authorization: 'Bearer ' + token
                        }
                    })).status, 403);
                    assert.equal(ejecuciones, before);
                }
            // El mismo token deja de permitir operaciones al cambiar permisos o cerrar sesión.
            usuario =
            {
                funciones: roles.sistema
            };
            assert.equal((await fetch(base + '/api/usuarios',
            {
                headers:
                {
                    Authorization: 'Bearer ' + token
                }
            })).status, 204);
            usuario =
            {
                funciones: roles.lector
            };
            assert.equal((await fetch(base + '/api/usuarios',
            {
                headers:
                {
                    Authorization: 'Bearer ' + token
                }
            })).status, 403);
            usuario = null;
            assert.equal((await fetch(base + '/api/usuarios',
            {
                headers:
                {
                    Authorization: 'Bearer ' + token
                }
            })).status, 401);
            assert.equal(casos, 351);
        }
        finally
        {
            sesiones.obtener_activa = original;
            await new Promise(resolve => server.close(resolve));
        }
    });

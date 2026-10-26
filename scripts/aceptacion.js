/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Aceptación HTTP real sobre la copia restaurada. */
/* Listing Contents: configurar, llamar, principal. */
/* Reuse Instructions: ejecutar tras respaldo-verificar y migración. */
/* Solo usa ducky_validacion_*; sin correos, sin tocar el origen. */
/******************************************************************/
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const carpeta = fs.readFileSync('.local-validation/actual.txt', 'utf8');
const configuracion = JSON.parse(fs.readFileSync(carpeta + '/config.json'));
assert.match(configuracion.database_name, /^ducky_validacion_[0-9]+_[a-f0-9]+$/);
assert.equal(new URL(configuracion.database_url).pathname, '/' + configuracion.database_name);
process.env.DATABASE_URL = configuracion.database_url;
process.env.SESSION_SECRET = configuracion.session_secret;
process.env.RESEND_API_KEY = '';
const
{
    pool
} = require('../db');
const express = require('express');
const app = express();
app.use(express.json());
for (const [prefijo, archivo] of Object.entries(
    {
        auth: 'auth',
        usuarios: 'usuario',
        perfiles: 'perfil',
        libros: 'libro',
        busqueda: 'busqueda',
        pedidos: 'pedido',
        chatbot: 'chatbot'
    }))
{
    app.use('/api/' + prefijo, require('../routes/' + archivo + 'Routes'));
}
let base;
const resultados = [];

async function llamar(nombre, metodo, ruta, token, datos, esperado = 200)
{
    const inicio = performance.now();
    const respuesta = await fetch(base + '/api' + ruta,
    {
        method: metodo,
        headers:
        {
            'Content-Type': 'application/json',
            ...(token ?
            {
                Authorization: 'Bearer ' + token
            } :
            {})
        },
        body: datos === undefined ? undefined : JSON.stringify(datos)
    });
    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, esperado, nombre + ': ' + JSON.stringify(cuerpo));
    resultados.push(
    {
        nombre,
        estado: respuesta.status,
        ms: Math.round(performance.now() - inicio)
    });
    return cuerpo;
}

async function principal()
{
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    base = 'http://127.0.0.1:' + servidor.address().port;
    try
    {
        assert.equal((await pool.query('SELECT current_database() AS nombre')).rows[0].nombre, configuracion.database_name);
        const sistema = (await llamar('Login sistema', 'POST', '/auth/login', null,
        {
            clave: '100001',
            contrasena: '1234'
        })).token;
        const biblioteca = (await llamar('Login biblioteca', 'POST', '/auth/login', null,
        {
            clave: '100002',
            contrasena: '1234'
        })).token;
        const catalogo = (await llamar('Login catálogo', 'POST', '/auth/login', null,
        {
            clave: '100003',
            contrasena: '1234'
        })).token;
        const lector = (await llamar('Login lector', 'POST', '/auth/login', null,
        {
            clave: '621234',
            contrasena: '1234'
        })).token;
        await llamar('Anónimo no lee usuarios', 'GET', '/usuarios', null, undefined, 401);
        await llamar('Lector no compra', 'POST', '/pedidos', lector,
        {}, 403);
        await llamar('Catálogo no autoriza', 'PUT', '/pedidos/1/estatus', catalogo,
        {
            estatus: 'Autorizado'
        }, 403);
        await llamar('Usuario fuera de directorio', 'POST', '/usuarios', sistema,
        {
            clave: '999998',
            id_perfil: 4
        }, 422);
        const funciones = await llamar('Funciones', 'GET', '/perfiles/funciones', sistema);
        const buscar = funciones.find(funcion => funcion.nombre === 'Buscar libros').id;
        const chatbot = funciones.find(funcion => funcion.nombre === 'Chatbot').id;
        const perfil = (await llamar('Crear perfil lector de prueba', 'POST', '/perfiles', sistema,
        {
            nombre: 'Aceptación ' + Date.now(),
            funciones: [buscar, chatbot]
        }, 201)).perfil;
        const clave = '810077';
        assert.equal((await pool.query('SELECT 1 FROM usuarios WHERE clave_usuario=$1', [clave])).rowCount, 0, 'Clave de fixture debe estar libre');
        const alta = await llamar('Alta usuario', 'POST', '/usuarios', sistema,
        {
            clave,
            id_perfil: perfil.id
        }, 201);
        await llamar('Alta duplicada rechazada', 'POST', '/usuarios', sistema,
        {
            clave,
            id_perfil: perfil.id
        }, 409);
        const sesion_temporal = (await llamar('Login temporal', 'POST', '/auth/login', null,
        {
            clave,
            contrasena: alta.contrasena_temporal
        })).token;
        await llamar('Temporal sin acceso al catálogo', 'GET', '/busqueda/listado', sesion_temporal, undefined, 403);
        const contrasena = 'Validar-' + crypto.randomBytes(10).toString('hex');
        await llamar('Cambiar temporal', 'POST', '/auth/contrasena', sesion_temporal,
        {
            actual: alta.contrasena_temporal,
            nueva: contrasena,
            confirmacion: contrasena
        });
        await llamar('Cambio perfil que retira Chatbot', 'PUT', '/usuarios/' + clave + '/perfil', sistema,
        {
            id_perfil: 3
        });
        await llamar('Cambio de perfil adicional', 'PUT', '/usuarios/' + clave + '/perfil', sistema,
        {
            id_perfil: 4
        });
        await llamar('Token revocado por retiro de permisos', 'GET', '/auth/sesion', sesion_temporal, undefined, 401);
        const motivos = (await llamar('Catálogos usuarios', 'GET', '/usuarios/catalogos', sistema)).motivos;
        await llamar('Baja usuario', 'POST', '/usuarios/' + clave + '/baja', sistema,
        {
            id_motivo: motivos[0].id
        });
        assert.equal((await pool.query('SELECT 1 FROM credenciales WHERE clave_usuario=$1', [clave])).rowCount, 0);
        const reactivado = await llamar('Reactivar usuario', 'POST', '/usuarios/' + clave + '/reactivar', sistema,
        {
            id_perfil: 4
        });
        assert.notEqual(reactivado.contrasena_temporal, alta.contrasena_temporal);
        await llamar('Baja perfil sin asignados', 'POST', '/perfiles/' + perfil.id + '/baja', sistema,
        {});
        await llamar('Reactivar perfil', 'POST', '/perfiles/' + perfil.id + '/reactivar', sistema,
        {});
        const catalogos = await llamar('Catálogos libros', 'GET', '/libros/catalogos', catalogo);
        const ubicacion = catalogos.ubicaciones[0].id;
        const ficha = {
            titulo: 'Aceptación integral',
            isbn: '9780000000001',
            editorial: 'Editorial pruebas',
            tema: 'Pruebas',
            autores: ['Autor de prueba'],
            formato: 'Físico',
            copias: 2,
            id_ubicacion: ubicacion
        };
        await llamar('Ficha inválida sin título', 'POST', '/libros', catalogo,
        {
            ...ficha,
            titulo: ''
        }, 400);
        const libro = await llamar('Crear ficha y ejemplares', 'POST', '/libros', catalogo, ficha, 201);
        await llamar('ISBN duplicado', 'POST', '/libros', catalogo, ficha, 409);
        await llamar('Activar catálogo', 'POST', '/libros/' + libro.id_libro + '/alta', catalogo,
        {});
        assert.equal((await llamar('Buscar título activo', 'GET', '/busqueda?titulo=Aceptaci%C3%B3n', lector)).length, 1);
        await llamar('Modificar ficha', 'PUT', '/libros/' + libro.id_libro, catalogo,
        {
            ...ficha,
            titulo: 'Aceptación modificada'
        });
        await llamar('Retirar título', 'POST', '/libros/' + libro.id_libro + '/retirar', catalogo,
        {});
        assert.equal((await llamar('Retirado fuera de búsqueda', 'GET', '/busqueda?titulo=Aceptaci%C3%B3n', lector)).length, 0);
        await llamar('Reactivar título', 'POST', '/libros/' + libro.id_libro + '/alta', catalogo,
        {});
        const presupuesto = (await pool.query(`INSERT INTO presupuestos_mensuales(periodo,monto_autorizado,clave_responsable)
            VALUES('2099-12',1000,'100001') RETURNING id_presupuesto`)).rows[0].id_presupuesto;
        const linea = {
            id_libro: libro.id_libro,
            titulo: ficha.titulo,
            cantidad: 2,
            costo_unitario: 100
        };
        const pedido = await llamar('Crear compra', 'POST', '/pedidos', biblioteca,
        {
            id_presupuesto: presupuesto,
            lineas: [linea]
        }, 201);
        const id_pedido = pedido.pedido.id_pedido;
        await llamar('Exceder presupuesto', 'POST', '/pedidos', biblioteca,
        {
            id_presupuesto: presupuesto,
            lineas: [
            {
                ...linea,
                cantidad: 100
            }]
        }, 422);
        await llamar('Biblioteca autoriza', 'PUT', '/pedidos/' + id_pedido + '/estatus', biblioteca,
        {
            estatus: 'Autorizado'
        });
        await llamar('Recibir compra', 'POST', '/pedidos/' + id_pedido + '/recepcion', catalogo,
        {
            id_ubicacion: ubicacion
        });
        await llamar('Recepción duplicada rechazada', 'POST', '/pedidos/' + id_pedido + '/recepcion', catalogo,
        {
            id_ubicacion: ubicacion
        }, 409);
        const rechazado = await llamar('Crear compra rechazable', 'POST', '/pedidos', biblioteca,
        {
            id_presupuesto: presupuesto,
            lineas: [linea]
        }, 201);
        await llamar('Sistema rechaza compra', 'PUT', '/pedidos/' + rechazado.pedido.id_pedido + '/estatus', sistema,
        {
            estatus: 'Rechazado'
        });
        const saldo = (await pool.query('SELECT saldo FROM v_presupuesto_saldo WHERE id_presupuesto=$1', [presupuesto])).rows[0].saldo;
        assert.equal(saldo, 800);
        const ejemplares = (await llamar('Ficha conserva ejemplares', 'GET', '/libros/' + libro.id_libro, catalogo)).ejemplares;
        assert.equal(ejemplares.length, 4);
        await llamar('Perfil sin funciones rechazado', 'PUT', '/perfiles/' + perfil.id, sistema,
        {
            nombre: perfil.nombre,
            funciones: []
        }, 400);
        await llamar('Editar funciones del perfil', 'PUT', '/perfiles/' + perfil.id, sistema,
        {
            nombre: perfil.nombre,
            descripcion: 'Validación del avance',
            funciones: [buscar]
        });
        await llamar('Perfil base protegido', 'POST', '/perfiles/1/baja', sistema,
        {}, 403);
        await llamar('Búsqueda vacía rechazada', 'GET', '/busqueda', lector, undefined, 400);
        await llamar('Búsqueda corta rechazada', 'GET', '/busqueda?titulo=ab', lector, undefined, 400);
        for (const [filtro, valor] of Object.entries(
            {
                isbn: ficha.isbn,
                clave: libro.id_libro,
                autor: 'Autor de prueba',
                editorial: ficha.editorial,
                tema: ficha.tema
            }))
        {
            const coincidencias = await llamar('Búsqueda por ' + filtro, 'GET', '/busqueda?' + filtro + '=' + encodeURIComponent(valor), lector);
            assert.ok(coincidencias.some(item => item.id_libro === libro.id_libro));
        }
        const ficha_publica = await llamar('Ubicación física del libro', 'GET', '/busqueda/' + libro.id_libro, lector);
        assert.ok(ficha_publica.ejemplares.every(item => item.ubicacion));
        const listado = await llamar('Listado imprimible contiene ISBN', 'GET', '/busqueda/listado', lector);
        assert.equal(listado.find(item => item.id_libro === libro.id_libro).isbn, ficha.isbn);
        const id_ejemplar = ejemplares[0].id_ejemplar;
        await llamar('Modificar condición de ejemplar', 'PUT', '/libros/ejemplares/' + id_ejemplar, catalogo,
        {
            condicion: 'Regular'
        });
        await llamar('Baja ejemplar exige motivo', 'POST', '/libros/ejemplares/' + id_ejemplar + '/baja', catalogo,
        {}, 400);
        await llamar('Baja de ejemplar', 'POST', '/libros/ejemplares/' + id_ejemplar + '/baja', catalogo,
        {
            id_motivo: catalogos.motivos[0].id
        });
        await llamar('Baja de ejemplar duplicada', 'POST', '/libros/ejemplares/' + id_ejemplar + '/baja', catalogo,
        {
            id_motivo: catalogos.motivos[0].id
        }, 409);
        const sin_baja = await llamar('Ejemplar de baja no aparece en búsqueda', 'GET', '/busqueda/' + libro.id_libro, lector);
        assert.ok(!sin_baja.ejemplares.some(item => item.id_ejemplar === id_ejemplar));
        for (const costo of ['', null, 'Infinity'])
            await llamar('Compra rechaza costo ' + String(costo), 'POST', '/pedidos', biblioteca,
            {
                id_presupuesto: presupuesto,
                lineas: [
                {
                    ...linea,
                    costo_unitario: costo
                }]
            }, 400);
        await llamar('Compra rechaza línea nula', 'POST', '/pedidos', biblioteca,
        {
            lineas: [null]
        }, 400);
        await llamar('Logout lector', 'POST', '/auth/logout', lector,
        {});
        await llamar('Sesión cerrada no reutilizable', 'GET', '/auth/sesion', lector, undefined, 401);
        fs.writeFileSync(carpeta + '/aceptacion.json', JSON.stringify(
        {
            fecha: new Date().toISOString(),
            casos: resultados
        }, null, 4),
        {
            mode: 0o600
        });
        console.log('Aceptación HTTP: ' + resultados.length + ' casos aprobados en copia aislada.');
    }
    finally
    {
        servidor.closeAllConnections();
        await new Promise(resolve => servidor.close(resolve));
        await pool.end();
    }
}
principal().catch(error =>
{
    console.error(error.message);
    process.exitCode = 1;
});

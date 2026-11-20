/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Pruebas de regresión y contratos del sistema. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   pedir(q, funciones = ['Chatbot', 'Buscar libros']) */
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
const modelo = require('../models/chatbotModel');
const prestamo_model = require('../models/prestamoModel');
const claude = require('../services/claudeService');
const
{
    consultar
} = require('../controllers/chatbotController');
const filas = [
{
    id_pregunta: 1,
    pregunta: '¿Cuánto dura el préstamo?',
    respuesta: '5 días',
    fuentes: ['Regla 5']
},
{
    id_pregunta: 2,
    pregunta: '¿Cuánto se paga por atraso?',
    respuesta: '10 pesos',
    fuentes: ['Regla 3']
},
{
    id_pregunta: 3,
    pregunta: '¿Cuántas veces puedo renovar?',
    respuesta: '2 veces',
    fuentes: ['Regla 6']
}];
async function pedir(q, funciones = ['Chatbot', 'Buscar libros'], desde_formulario = false)
{
    const res =
    {
        set()
        {},
        status(n)
        {
            this.code = n;
            return this;
        },
        json(data)
        {
            this.data = data;
            return this;
        }
    };
    await consultar(
    {
        method: desde_formulario ? 'POST' : 'GET',
        body: desde_formulario ? { q } : undefined,
        query: q === undefined || desde_formulario ?
        {
        } :
        {
            q
        },
        usuario:
        {
            clave: '621234',
            funciones
        }
    }, res);
    return res;
}
test('FAQ normaliza acentos, admite sinónimos, devuelve fuentes y reconoce desconocidas', async () =>
{
    const original = modelo.listar;
    modelo.listar = async () => filas;
    try
    {
        for (const [q, id] of [
                ['duración del préstamo', 1],
                ['multa', 2],
                ['renovaciones', 3]
            ]) assert.equal((await pedir(q)).data.resultados[0].id_pregunta, id);
        assert.deepEqual((await pedir('¿Cuál es mi contraseña?')).data.resultados, []);
        assert.deepEqual((await pedir('multa')).data.resultados[0].fuentes, ['Regla 3']);
        const sugerencias = (await pedir()).data.sugerencias;
        assert.equal(sugerencias.length, 8);
        assert.deepEqual(sugerencias.map((fila) => fila.grupo).slice(0, 4),
            Array(4).fill('Sobre el sistema'));
        const objetivo = await pedir('¿Cuál es el objetivo del sistema?');
        assert.match(objetivo.data.resultados[0].respuesta, /consulta y circulación/);
        const perfil = await pedir('¿Qué puedo hacer según mi perfil?', ['Chatbot']);
        assert.match(perfil.data.resultados[0].respuesta, /Chatbot/);
        const buscar = await pedir('¿Cómo encuentro un libro?');
        assert.match(buscar.data.resultados[0].respuesta, /Buscar libros/);
        assert.match(buscar.data.resultados[0].respuesta, /clave, ISBN o editorial/);
        assert.equal(buscar.data.resultados[0].accion, 'buscar');
        assert.equal(objetivo.data.resultados[0].accion, null);
        for (const q of ['',
                {
                },
                ['multa'], 'x'.repeat(301)
            ]) assert.equal((await pedir(q)).code, 400);
    }
    finally
    {
        modelo.listar = original;
    }
});
test('Catálogo: intención, permisos, límite y separación de préstamos personales', async () =>
{
    const
    {
        intencion
    } = require('../services/chatbotService');
    assert.deepEqual(intencion('¿Qué libros hay?'),
    {
        tipo: 'catalogo',
        terminos: [],
        disponibles: false
    });
    assert.deepEqual(intencion('Libros disponibles de programación'),
    {
        tipo: 'catalogo',
        terminos: ['programacion'],
        disponibles: true
    });
    assert.deepEqual(intencion('¿Tienen Cien años de soledad?').terminos, ['cien', 'anos',
        'soledad'
    ]);
    assert.equal(intencion('¿Cuánto dura el préstamo?').tipo, 'faq');
    const original = modelo.buscar_libros;
    const original_prestamos = prestamo_model.mis_prestamos;
    let llamadas = 0;
    const claves_prestamos = [];
    prestamo_model.mis_prestamos = async (clave) =>
    {
        claves_prestamos.push(clave);
        return [{ titulo: 'Ejemplo', id_ejemplar: 'L000128-01', fecha_vencimiento: '2026-11-28' }];
    };
    modelo.buscar_libros = async () =>
    {
        llamadas++;
        return Array.from(
        {
            length: 6
        }, (_, i) => (
        {
            id_libro: String(i)
        }));
    };
    try
    {
        assert.equal((await pedir('¿Qué libros hay?', ['Chatbot'])).code, 403);
        assert.equal(llamadas, 0);
        assert.equal((await pedir('Mis préstamos', ['Chatbot'])).code, 403);
        for (const q of ['¿Qué libros tengo prestados?', 'Mis préstamos', '¿Qué libros tengo?'])
        {
            assert.match((await pedir(q)).data.resultados[0].respuesta, /Ejemplo.*2026-11-28/);
        }
        assert.deepEqual(claves_prestamos, Array(3).fill('621234'));
        assert.equal(llamadas, 0);
        const respuesta = await pedir('¿Qué libros hay?');
        assert.equal(respuesta.data.libros.length, 5);
        assert.match(respuesta.data.mensaje, /primeros 5/);
        modelo.buscar_libros = async () => [];
        assert.match((await pedir('Libros de inexistente')).data.mensaje, /No encontré libros/);
    }
    finally
    {
        modelo.buscar_libros = original;
        prestamo_model.mis_prestamos = original_prestamos;
    }
});

test('Preguntas abiertas por POST responden ventas, certificación, préstamos y otros flujos sin Claude', async () =>
{
    const original = modelo.listar;
    const original_claude = claude.responder;
    modelo.listar = async () => filas;
    claude.responder = async () => null;
    try
    {
        for (const [pregunta, respuesta] of [
            ['¿La aplicación permite venta de libros?', /no vende libros al público/],
            ['que certificacion esta persiguiendo esta aplicación', /ISO 9001:2015/],
            ['¿Puede vender libros o qué norma ISO busca?', /no vende libros al público/],
            ['¿Cómo se registra un préstamo desde el mostrador?', /Valid|valida y confirma/],
            ['¿Qué pasa si devuelvo el libro?', /Registrar devolución/],
            ['Perdí mi ejemplar', /registra la pérdida/],
            ['Olvidé mi contraseña, qué hago', /Olvidaste tu contraseña/],
            ['¿Con qué tecnologías hicieron la app?', /PostgreSQL/],
            ['¿Cómo saco un PDF del acervo?', /Listado de libros/]
        ])
        {
            const r = await pedir(pregunta, undefined, true);
            assert.ok(r.data.resultados.some((fila) => respuesta.test(fila.respuesta)), pregunta);
        }
        assert.equal((await pedir(undefined, undefined, true)).code, 400);
    }
    finally
    {
        modelo.listar = original;
        claude.responder = original_claude;
    }
});

test('Claude recibe contexto público y una consulta redactada; devuelve respuesta o fallback', async () =>
{
    const entorno = { ANTHROPIC_API_KEY: 'clave-ficticia', ANTHROPIC_MODEL: 'modelo-de-prueba' };
    let llamadas = 0;
    const enviar = async (url, opciones) =>
    {
        llamadas++;
        assert.equal(url, 'https://api.anthropic.com/v1/messages');
        const cuerpo = JSON.parse(opciones.body);
        assert.equal(cuerpo.model, 'modelo-de-prueba');
        assert.equal(cuerpo.max_tokens, 320);
        assert.match(cuerpo.system, /ISO 9001:2015/);
        assert.match(cuerpo.system, /5 días/);
        assert.doesNotMatch(opciones.body, /alumno@|654321|clave-ficticia/);
        return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Respuesta abierta' }] }) };
    };
    assert.equal(await claude.responder('¿Sirve el correo alumno@example.test o la matrícula 654321?',
        filas, enviar, entorno), 'Respuesta abierta');
    assert.equal(await claude.responder('Mi contraseña es secreto-de-prueba', filas, enviar, entorno), null);
    assert.equal(await claude.responder('Una pregunta', filas, enviar, {}), null);
    assert.equal(llamadas, 1);
    assert.equal(await claude.responder('Una pregunta', filas, async () => ({ ok: false }), entorno), null);
});
test('PostgreSQL: FAQ desaparece con fuente inactiva, sin fuentes o pregunta inactiva; rollback',
{
    skip: process.env.DUCKY_TEST_DB !== '1'
}, async () =>
{
    const
    {
        pool
    } = require('../db');
    const c = await pool.connect();
    try
    {
        await c.query('BEGIN');
        const catalogo = await modelo.buscar_libros([], false, c);
        assert.ok(catalogo.length);
        assert.ok(catalogo.length <= 6);
        const clave = catalogo[0].id_libro.toLowerCase();
        assert.equal((await modelo.buscar_libros([clave], false, c))[0].id_libro, catalogo[0]
            .id_libro);
        assert.deepEqual(await modelo.buscar_libros(["%' OR 1=1 --"], false, c), []);
        assert.ok((await modelo.buscar_libros([], true, c)).every(l => l.disponibles_prestamo >
            0));

        const lista = await modelo.listar(c);
        assert.ok(lista.length);
        const id = lista[0].id_pregunta;
        await c.query('SAVEPOINT antes');
        await c.query(
            "UPDATE contenidos_chatbot SET estatus='Inactivo' WHERE id_contenido=(SELECT id_contenido FROM pregunta_contenido WHERE id_pregunta=$1 LIMIT 1)",
            [id]);
        assert.ok(!(await modelo.listar(c)).some(f => f.id_pregunta === id));
        await c.query('ROLLBACK TO SAVEPOINT antes');
        await c.query('DELETE FROM pregunta_contenido WHERE id_pregunta=$1', [id]);
        assert.ok(!(await modelo.listar(c)).some(f => f.id_pregunta === id));
        await c.query('ROLLBACK TO SAVEPOINT antes');
        await c.query("UPDATE preguntas_chatbot SET estatus='Inactiva' WHERE id_pregunta=$1", [
            id]);
        assert.ok(!(await modelo.listar(c)).some(f => f.id_pregunta === id));
    }
    finally
    {
        await c.query('ROLLBACK');
        c.release();
        await pool.end();
    }
});

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
async function pedir(q, funciones = ['Chatbot', 'Buscar libros'])
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
        query: q === undefined ?
        {
        } :
        {
            q
        },
        usuario:
        {
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
        assert.equal((await pedir()).data.sugerencias.length, 3);
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
    let llamadas = 0;
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
        for (const q of ['¿Qué libros tengo prestados?', 'Mis préstamos', '¿Qué libros tengo?'])
        {
            assert.match((await pedir(q)).data.mensaje, /préstamos personales/);
        }
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
    }
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

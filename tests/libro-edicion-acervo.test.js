/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-17 */
/* Description: Verifica cambios conjuntos de ejemplares con rollback. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: edición de copias disponibles y reversión. */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* DUCKY_TEST_DB=1 habilita PostgreSQL local; ninguna fila persiste. */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const controlador_con_acervo = (ejemplares) =>
{
    const llamadas = [];
    const ficha =
    {
        libro: { id_libro: 'L000129', formato: 'Físico', estatus: 'Activo en catálogo' },
        autores: [], ejemplares
    };
    const modelo =
    {
        buscar: async () => ficha,
        bloquear_acervo: async () => ({ libro: ficha.libro, ejemplares }),
        ubicacion_existe: async () => true,
        actualizar_copias_uniformes: async (_client, _id, datos) =>
            llamadas.push(['ubicacion', datos]),
        agregar_ejemplares: async (_client, datos) =>
            llamadas.push(['agregar', datos]),
        actualizar: async () => llamadas.push(['ficha'])
    };
    class ErrorNegocio extends Error
    {
        constructor(codigo, mensaje)
        {
            super(mensaje);
            this.codigo = codigo;
        }
    }
    const contexto = vm.createContext(
    {
        module: { exports: {} },
        require: (nombre) =>
        {
            if (nombre === '../db') return { con_usuario: async (_clave, trabajo) =>
                trabajo({}) };
            if (nombre === '../models/libroModel') return modelo;
            if (nombre === '../utils/errores') return {
                error_negocio: ErrorNegocio,
                responder_error: (respuesta, error) => respuesta.status(error.codigo || 500)
                    .json({ mensaje: error.message })
            };
            if (nombre === '../utils/validators') return {
                faltantes: () => [], es_isbn: () => true, entero_positivo: () => true
            };
            throw new Error('Dependencia inesperada: ' + nombre);
        }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../controllers/libroController.js'),
        'utf8'), contexto);
    const respuesta =
    {
        status(codigo) { this.codigo = codigo; return this; },
        json(datos) { this.datos = datos; return this; }
    };
    return { actualizar: contexto.module.exports.actualizar, respuesta, llamadas };
};

test('edición conjunta conserva tipos existentes y agrega la copia dentro de la operación',
    async () =>
{
    const ejemplares = [
        { id_ubicacion: 2, condicion: 'Bueno', tipo_uso: 'Préstamo externo',
            estatus: 'Disponible' },
        { id_ubicacion: 2, condicion: 'Bueno', tipo_uso: 'Préstamo en sala',
            estatus: 'Disponible' }
    ];
    const { actualizar, respuesta, llamadas } = controlador_con_acervo(ejemplares);
    await actualizar({ params: { id: 'L000129' }, usuario: { clave: '100001' }, body:
    {
        titulo: 'Ingeniería de software', isbn: '9786073206037', autores: 'Ian Sommerville',
        editorial: 'Pearson', tema: 'Software', copias_base: 2, copias: 3,
        id_ubicacion_base: 2, condicion_base: 'Bueno', id_ubicacion_edicion: 4,
        condicion_edicion: 'Regular', tipo_uso: 'Préstamo externo'
    } }, respuesta);
    assert.equal(respuesta.codigo, 200);
    assert.deepEqual(llamadas.map((llamada) => llamada[0]),
        ['ubicacion', 'agregar', 'ficha']);
    assert.equal(llamadas[1][1].cantidad, 1);
    assert.equal(llamadas[1][1].tipo_uso, 'Préstamo externo');
});

test('copias prestadas o reducción rechazada no escriben ficha ni ejemplares', async () =>
{
    const ejemplares = [
        { id_ubicacion: 2, condicion: 'Bueno', tipo_uso: 'Préstamo externo',
            estatus: 'Prestado' }
    ];
    const { actualizar, respuesta, llamadas } = controlador_con_acervo(ejemplares);
    const cuerpo =
    {
        titulo: 'Ingeniería de software', isbn: '9786073206037', autores: 'Ian Sommerville',
        editorial: 'Pearson', tema: 'Software', copias_base: 1, copias: 2,
        id_ubicacion_base: 2, condicion_base: 'Bueno', id_ubicacion_edicion: 4,
        condicion_edicion: 'Regular', tipo_uso: 'Préstamo externo'
    };
    await actualizar({ params: { id: 'L000129' }, usuario: { clave: '100001' },
        body: cuerpo }, respuesta);
    assert.equal(respuesta.codigo, 422);
    assert.equal(llamadas.length, 0);
    cuerpo.copias = 0;
    await actualizar({ params: { id: 'L000129' }, usuario: { clave: '100001' },
        body: cuerpo }, respuesta);
    assert.equal(respuesta.codigo, 400);
    assert.equal(llamadas.length, 0);
});

test('PostgreSQL: edición conjunta y copia adicional se revierten íntegramente',
    { skip: process.env.DUCKY_TEST_DB !== '1' }, async () =>
{
    const { pool } = require('../db');
    const libro_model = require('../models/libroModel');
    const id = 'L000129';
    const antes = await libro_model.buscar(id);
    const activos = antes.ejemplares.filter((ejemplar) => ejemplar.estatus !== 'Baja');
    assert.ok(activos.length > 0);
    assert.ok(activos.every((ejemplar) => ejemplar.estatus === 'Disponible'));
    assert.equal(new Set(activos.map((ejemplar) => ejemplar.id_ubicacion)).size, 1);
    const ubicacion = activos[0].id_ubicacion;
    const client = await pool.connect();
    try
    {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.usuario', '100001', true)");
        const acervo = await libro_model.bloquear_acervo(client, id);
        assert.equal(acervo.ejemplares.length, activos.length);
        assert.equal(await libro_model.ubicacion_existe(client, ubicacion), true);
        await libro_model.actualizar_copias_uniformes(client, id,
            { id_ubicacion: ubicacion, condicion: 'Regular' });
        const nuevas = await libro_model.agregar_ejemplares(client,
        {
            id_libro: id,
            cantidad: 1,
            id_ubicacion: ubicacion,
            condicion: 'Regular',
            digital: false,
            tipo_uso: activos[0].tipo_uso
        });
        assert.equal(nuevas.length, 1);
        const durante = await client.query(
            `SELECT condicion FROM ejemplares WHERE id_libro = $1 AND estatus <> 'Baja'`, [id]);
        assert.equal(durante.rows.length, activos.length + 1);
        assert.ok(durante.rows.every((fila) => fila.condicion === 'Regular'));
    }
    finally
    {
        await client.query('ROLLBACK');
        client.release();
    }
    const despues = await libro_model.buscar(id);
    assert.deepEqual(despues.ejemplares, antes.ejemplares);
});

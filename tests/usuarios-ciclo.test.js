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
const vm = require('node:vm');

test('reactivación rechaza perfil superior aunque no se cambie y valida tipo institucional', async () =>
{
    const perfilModel = require('../models/perfilModel');
    const errores = require('../utils/errores');
    let escrituras = 0;
    let tipo = 'Colaborador';
    let funciones = ['Gestionar perfiles'];
    const contexto = vm.createContext(
    {
        module:
        {
            exports:
            {
            }
        },
        require: nombre =>
        {
            if (nombre === 'crypto') return require('node:crypto');
            if (nombre === '../db') return (
            {
                con_usuario: async () =>
                {
                    escrituras++;
                }
            });
            if (nombre.includes('usuarioModel')) return (
            {
                buscar: async () => (
                {
                    rows: [
                    {
                        clave: 'TEST01',
                        estatus: 'Inactivo',
                        id_perfil: 1,
                        funciones
                    }]
                })
            });
            if (nombre.includes('perfilModel')) return (
            {
                nivel: perfilModel.nivel,
                buscar: async () => (
                {
                    rows: [
                    {
                        id: 1,
                        estatus: 'Activo',
                        funciones
                    }]
                })
            });
            if (nombre.includes('institucion')) return (
            {
                consultar: async () => (
                {
                    vigente: true,
                    tipo
                })
            });
            if (nombre.includes('errores')) return errores;
            return (
            {
            });
        }
    });
    vm.runInContext(fs.readFileSync(require.resolve('../controllers/usuarioController'), 'utf8'),
        contexto);
    const req =
    {
        params:
        {
            clave: 'TEST01'
        },
        body:
        {
        },
        usuario:
        {
            clave: 'ADMIN1',
            funciones: ['Gestionar usuarios']
        }
    };
    const res =
    {
        status(c)
        {
            this.code = c;
            return this;
        },
        json(b)
        {
            this.body = b;
        }
    };
    await contexto.module.exports.reactivar(req, res);
    assert.equal(res.code, 403);
    funciones = ['Gestionar usuarios'];
    tipo = 'Alumno';
    await contexto.module.exports.reactivar(req, res);
    assert.equal(res.code, 422);
    assert.equal(escrituras, 0);
});

test('PostgreSQL: baja revoca acceso; reactivación cambia credencial y conserva historial; rollback',
{
    skip: process.env.DUCKY_TEST_DB !== '1'
}, async () =>
{
    const
    {
        pool
    } = require('../db');
    const modelo = require('../models/usuarioModel');
    const c = await pool.connect();
    try
    {
        await c.query('BEGIN');
        const admin = (await c.query(
            "SELECT clave_usuario FROM v_menu_usuario WHERE funcion = 'Gestionar usuarios' LIMIT 1"
            )).rows[0].clave_usuario;
        await c.query("SELECT set_config('app.usuario', $1, true)", [admin]);
        const perfil = (await c.query(
            "SELECT id_perfil FROM perfiles WHERE estatus = 'Activo' ORDER BY id_perfil LIMIT 1"
            )).rows[0].id_perfil;
        const tipo = (await c.query(
                "SELECT id_tipo_usuario FROM tipos_usuario WHERE nombre = 'Colaborador'")).rows[0]
            .id_tipo_usuario;
        const motivo = (await c.query(
            "SELECT id_motivo FROM motivos_baja WHERE aplica_a = 'Usuario' AND descripcion <> 'Otro' LIMIT 1"
            )).rows[0].id_motivo;
        const clave = require('node:crypto').randomBytes(3).toString('hex');
        await modelo.crear(c,
        {
            clave,
            nombre: 'Prueba transaccional',
            correo: clave + '@example.invalid',
            id_tipo: tipo,
            id_perfil: perfil,
            admin,
            contrasena: 'Anterior1234'
        });
        await c.query('INSERT INTO sesiones (clave_usuario) VALUES ($1)', [clave]);
        await c.query(
            "INSERT INTO recuperaciones_acceso (clave_usuario,token_hash,fecha_expiracion) VALUES ($1,$2,now()+interval '30 minutes')",
            [clave, require('node:crypto').randomBytes(32).toString('hex')]);
        await modelo.dar_baja(c,
        {
            clave,
            id_motivo: motivo,
            admin
        });
        assert.equal((await c.query('SELECT * FROM credenciales WHERE clave_usuario=$1', [clave]))
            .rowCount, 0);
        assert.equal((await c.query(
            'SELECT * FROM sesiones WHERE clave_usuario=$1 AND fecha_fin IS NULL', [
                clave
            ])).rowCount, 0);
        assert.equal((await c.query(
            'SELECT * FROM recuperaciones_acceso WHERE clave_usuario=$1 AND NOT usado',
            [clave])).rowCount, 0);
        await c.query('SAVEPOINT antes_reactivar');
        await assert.rejects(modelo.reactivar(c,
        {
            clave,
            admin
        }), /contraseña temporal/);
        await c.query('ROLLBACK TO SAVEPOINT antes_reactivar');
        await modelo.reactivar(c,
        {
            clave,
            admin,
            id_perfil: perfil,
            contrasena: 'NuevaTemporal1234'
        });
        const cred = (await c.query(
            "SELECT es_temporal, contrasena_hash=crypt('Anterior1234',contrasena_hash) AS anterior, contrasena_hash=crypt('NuevaTemporal1234',contrasena_hash) AS nueva FROM credenciales WHERE clave_usuario=$1",
            [clave])).rows[0];
        assert.deepEqual(cred,
        {
            es_temporal: true,
            anterior: false,
            nueva: true
        });
        assert.equal((await c.query(
            "SELECT * FROM usuarios WHERE clave_usuario=$1 AND estatus='Activo'", [
                clave
            ])).rowCount, 1);
        assert.equal((await c.query(
            'SELECT * FROM bajas_usuario WHERE clave_usuario=$1 AND fecha_reactivacion IS NOT NULL',
            [clave])).rowCount, 1);
        await assert.rejects(modelo.reactivar(c,
        {
            clave,
            admin,
            contrasena: 'OtraTemporal1234'
        }), /estado del usuario cambió/);
        await c.query('ROLLBACK TO SAVEPOINT antes_reactivar');
        assert.equal((await c.query(
            "SELECT * FROM usuarios WHERE clave_usuario=$1 AND estatus='Inactivo'", [
                clave
            ])).rowCount, 1);
        assert.equal((await c.query('SELECT * FROM credenciales WHERE clave_usuario=$1', [clave]))
            .rowCount, 0);
    }
    finally
    {
        await c.query('ROLLBACK');
        c.release();
        await pool.end();
    }
});

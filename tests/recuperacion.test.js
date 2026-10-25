const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const service = require('../services/correoService');
function controlador(serviceMock, model = {}) {
    const context = vm.createContext({ module: {exports:{}}, Buffer, console: {error(){}}, require: name => {
        if (name.includes('correoService')) return serviceMock;
        if (name.includes('recuperacionModel')) return model;
        if (name.includes('errores')) return require('../utils/errores');
        return {};
    }});
    vm.runInContext(fs.readFileSync(require.resolve('../controllers/authController'),'utf8'),context);
    return context.module.exports;
}
async function ejecutar(fn, body) {
    const res = {status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
    await fn({body},res);
    return JSON.parse(JSON.stringify({status:res.code,body:res.data}));
}
test('sin configuración no se emiten ni consumen tokens', async () => {
    const c = controlador({configuracion:()=>null},new Proxy({}, {get(){throw Error('No consultar BD');}}));
    for(const fn of [c.recuperar,c.restablecer]) assert.equal((await ejecutar(fn,{})).status,503);
});
test('tokens firmados rechazan tokens antiguos, alterados y otra clave', () => {
    const config={secret:'a'.repeat(32)};
    const token=service.crear_token(config);
    assert.equal(service.token_valido(token,config),true);
    assert.equal(service.token_valido('abc'.repeat(16),config),false);
    assert.equal(service.token_valido(token,{secret:'b'.repeat(32)}),false);
    assert.equal(service.token_valido(token+'a',config),false);
});
test('ausencia, envío exitoso y fallo devuelven misma respuesta sin secretos', async () => {
    let invalidado=false;
    const responses=[];
    for(const modo of ['ausente','ok','fallo']) {
        const c=controlador({configuracion:()=>({}),crear_token:()=> 'secreto',enviar:async()=>{if(modo==='fallo')throw Error('provider');}},
            {emitir:async()=>modo==='ausente'?null:'privado@example.com',invalidar:async t=>{assert.equal(t,'secreto');invalidado=true;}});
        responses.push(await ejecutar(c.recuperar,{clave_o_correo:'100001'}));
    }
    assert.deepEqual(responses[0],responses[1]); assert.deepEqual(responses[1],responses[2]);
    assert.equal(invalidado,true); assert.doesNotMatch(JSON.stringify(responses),/secreto|privado/);
});
test('restablecer rechaza token antiguo antes de consultar BD y aplica validación', async()=>{
    let calls=0;
    const config={secret:'a'.repeat(32)};
    const c=controlador({...service,configuracion:()=>config},{consumir:async()=>{calls++;return true;}});
    assert.equal((await ejecutar(c.restablecer,{token:'antiguo',nueva:'abcdefghi',confirmacion:'abcdefghi'})).status,400);
    assert.equal(calls,0);
    const token=service.crear_token(config);
    assert.equal((await ejecutar(c.restablecer,{token,nueva:'abcdefghi',confirmacion:'otra'})).status,400);
    assert.equal(calls,0);
    assert.equal((await ejecutar(c.restablecer,{token,nueva:'abcdefghi',confirmacion:'abcdefghi'})).status,200);
});
test('Resend usa enlace en fragmento, timeout e idempotencia sin contraseña',async()=>{
    const original=global.fetch;
    let request;
    global.fetch=async(url,options)=>{request={url,...options};return {ok:true};};
    try {
        await service.enviar({key:'test',from:'biblioteca@example.com',base:'https://example.com'},'test@example.com','token');
        assert.equal(request.url,'https://api.resend.com/emails');
        assert.match(JSON.parse(request.body).text,/login.html#token=token/);
        assert.ok(request.headers['Idempotency-Key']); assert.ok(request.signal);
        global.fetch=async()=>({ok:false});
        await assert.rejects(service.enviar({key:'test',base:'https://example.com'},'test@example.com','token'));
    } finally {global.fetch=original;}
});

test('PostgreSQL: recuperación consume una vez, rechaza vencido y revoca sesiones con rollback',
    {skip:process.env.DUCKY_TEST_DB!=='1'},async()=>{
    const {pool}=require('../db'); const c=await pool.connect();
    const crypto=require('node:crypto');
    try {
        await c.query('BEGIN');
        const usuarioModel=require('../models/usuarioModel');
        const admin=(await c.query("SELECT clave_usuario FROM v_menu_usuario WHERE funcion='Gestionar usuarios' LIMIT 1")).rows[0].clave_usuario;
        await c.query("SELECT set_config('app.usuario',$1,true)",[admin]);
        const perfil=(await c.query("SELECT id_perfil FROM perfiles WHERE estatus='Activo' LIMIT 1")).rows[0].id_perfil;
        const tipo=(await c.query("SELECT id_tipo_usuario FROM tipos_usuario WHERE nombre='Colaborador'")).rows[0].id_tipo_usuario;
        const clave=crypto.randomBytes(3).toString('hex');
        await usuarioModel.crear(c,{clave,nombre:'Prueba recuperación',correo:clave+'@example.invalid',id_tipo:tipo,id_perfil:perfil,admin,contrasena:'Antes12345'});
        const context=vm.createContext({module:{exports:{}},require:name=>name==='node:crypto'?crypto:{pool:c,con_usuario:async(_,f)=>f(c)}});
        vm.runInContext(fs.readFileSync(require.resolve('../models/recuperacionModel'),'utf8'),context);
        const model=context.module.exports;
        const token=service.crear_token({secret:'a'.repeat(32)});
        assert.equal(await model.emitir(clave,token),clave+'@example.invalid');
        assert.equal(await model.emitir(clave,'otro'),null);
        await c.query('INSERT INTO sesiones(clave_usuario) VALUES($1)',[clave]);
        assert.equal(await model.consumir(token,'Despues12345'),true);
        assert.equal(await model.consumir(token,'Distinta12345'),false);
        assert.equal((await c.query('SELECT 1 FROM sesiones WHERE clave_usuario=$1 AND fecha_fin IS NULL',[clave])).rowCount,0);
        assert.equal((await c.query("SELECT contrasena_hash=crypt('Despues12345',contrasena_hash) AS ok FROM credenciales WHERE clave_usuario=$1",[clave])).rows[0].ok,true);
        await c.query("UPDATE recuperaciones_acceso SET usado=FALSE,fecha_solicitud=now()-interval '31 minutes',fecha_expiracion=now()-interval '1 minute' WHERE clave_usuario=$1",[clave]);
        assert.equal(await model.consumir(token,'Otra12345'),false);
    } finally {await c.query('ROLLBACK');c.release();await pool.end();}
});

test('URL de recuperación exige HTTPS o loopback explícito solo en desarrollo', () => {
    const env = {RESEND_API_KEY:'test',RECOVERY_FROM:'test@example.com',RECOVERY_SECRET:'a'.repeat(32),APP_PUBLIC_URL:'https://biblioteca.example.com'};
    assert.equal(service.configuracion(env).base,env.APP_PUBLIC_URL);
    for (const url of ['http://localhost:3001','http://127.0.0.1:3001','http://[::1]:3001']) {
        assert.equal(service.configuracion({...env,APP_PUBLIC_URL:url}),null);
        const local={...env,APP_PUBLIC_URL:url,NODE_ENV:'development',RECOVERY_ALLOW_LOCALHOST:'true'};
        assert.ok(service.configuracion(local));
        assert.equal(service.configuracion({...local,NODE_ENV:'production'}),null);
    }
    for (const url of ['http://example.com','http://localhost.evil.com','http://192.168.1.5','https://example.com/subruta','https://user:pass@example.com','https://example.com?token=1','https://example.com#token=1']) {
        assert.equal(service.configuracion({...env,APP_PUBLIC_URL:url,NODE_ENV:'development',RECOVERY_ALLOW_LOCALHOST:'true'}),null);
    }
});

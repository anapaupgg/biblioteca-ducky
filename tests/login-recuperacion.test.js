const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function preparar(falla=false) {
    const estado={borrada:false,panel:false,peticiones:[]};
    const window={location:{hash:'#token=token-del-correo',href:'login.html#token=token-del-correo'},history:{replaceState:(_,__,url)=>{estado.url=url;}}};
    const ctx=vm.createContext({window,URLSearchParams,document:{getElementById:()=>({addEventListener(){},focus(){}})},
        Session:{token:()=> 'sesion-anterior',clear:()=>{estado.borrada=true;}},Ui:{param:()=>null,marcar(){}},
        LoginView:{mostrar_restablecer:()=>{estado.panel=true;},mensaje(){},nueva_contrasena:()=>({nueva:'Prueba1234',confirmacion:'Prueba1234'}),mensaje_restablecer:tipo=>{estado.mensaje=tipo;}},
        AuthModel:{restablecer:async(...args)=>{estado.peticiones.push(args);if(falla)throw Error('Enlace vencido');return {mensaje:'Actualizada'};}},
        setTimeout:fn=>{estado.redirigir=fn;}});
    vm.runInContext(fs.readFileSync(require.resolve('../frontend/js/controllers/LoginController.js'),'utf8'),ctx);
    return {estado,window,ctx};
}
test('enlace abre formulario pese a sesión previa y borra URL; éxito limpia sesión antes de redirigir',async()=>{
    const {estado,window,ctx}=preparar();
    vm.runInContext('LoginController.iniciar()',ctx);
    assert.equal(estado.panel,true);assert.equal(estado.url,'login.html');
    assert.notEqual(window.location.href,'inicio.html');
    await vm.runInContext('LoginController.restablecer()',ctx);
    assert.equal(estado.peticiones[0][0],'token-del-correo');assert.equal(estado.borrada,true);
    assert.equal(vm.runInContext('LoginController.token',ctx),null);
    estado.redirigir();assert.equal(window.location.href,'login.html');
});
test('fallo de recuperación conserva sesión y no redirige ni anuncia éxito',async()=>{
    const {estado,ctx}=preparar(true);vm.runInContext('LoginController.iniciar()',ctx);
    await vm.runInContext('LoginController.restablecer()',ctx);
    assert.equal(estado.borrada,false);assert.equal(estado.mensaje,'error');assert.equal(estado.redirigir,undefined);
});

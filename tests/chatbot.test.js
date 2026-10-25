const {test}=require('node:test');
const assert=require('node:assert/strict');
const modelo=require('../models/chatbotModel');
const {consultar}=require('../controllers/chatbotController');
const filas=[{id_pregunta:1,pregunta:'¿Cuánto dura el préstamo?',respuesta:'5 días',fuentes:['Regla 5']},{id_pregunta:2,pregunta:'¿Cuánto se paga por atraso?',respuesta:'10 pesos',fuentes:['Regla 3']},{id_pregunta:3,pregunta:'¿Cuántas veces puedo renovar?',respuesta:'2 veces',fuentes:['Regla 6']}];
async function pedir(q){const res={set(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};await consultar({query:q===undefined?{}:{q}},res);return res;}
test('FAQ normaliza acentos, admite sinónimos, devuelve fuentes y reconoce desconocidas',async()=>{
 const original=modelo.listar;modelo.listar=async()=>filas;
 try {
  for(const [q,id] of [['duración del préstamo',1],['multa',2],['renovaciones',3]])assert.equal((await pedir(q)).data.resultados[0].id_pregunta,id);
  assert.deepEqual((await pedir('¿Cuál es mi contraseña?')).data.resultados,[]);
  assert.deepEqual((await pedir('multa')).data.resultados[0].fuentes,['Regla 3']);
  assert.equal((await pedir()).data.sugerencias.length,3);
  for(const q of ['',{},['multa'],'x'.repeat(301)])assert.equal((await pedir(q)).code,400);
 }finally{modelo.listar=original;}
});
test('PostgreSQL: FAQ desaparece con fuente inactiva, sin fuentes o pregunta inactiva; rollback', {skip:process.env.DUCKY_TEST_DB!=='1'},async()=>{
 const {pool}=require('../db');const c=await pool.connect();
 try{
  await c.query('BEGIN');
  const lista=await modelo.listar(c);assert.ok(lista.length);
  const id=lista[0].id_pregunta;
  await c.query('SAVEPOINT antes');
  await c.query("UPDATE contenidos_chatbot SET estatus='Inactivo' WHERE id_contenido=(SELECT id_contenido FROM pregunta_contenido WHERE id_pregunta=$1 LIMIT 1)",[id]);
  assert.ok(!(await modelo.listar(c)).some(f=>f.id_pregunta===id));
  await c.query('ROLLBACK TO SAVEPOINT antes');
  await c.query('DELETE FROM pregunta_contenido WHERE id_pregunta=$1',[id]);
  assert.ok(!(await modelo.listar(c)).some(f=>f.id_pregunta===id));
  await c.query('ROLLBACK TO SAVEPOINT antes');
  await c.query("UPDATE preguntas_chatbot SET estatus='Inactiva' WHERE id_pregunta=$1",[id]);
  assert.ok(!(await modelo.listar(c)).some(f=>f.id_pregunta===id));
 }finally{await c.query('ROLLBACK');c.release();await pool.end();}
});

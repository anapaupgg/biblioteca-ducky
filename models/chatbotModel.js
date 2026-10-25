// Solo preguntas activas con fuentes completas y vigentes.
const { pool } = require('../db');
async function listar(client = pool) {
    const r = await client.query(`SELECT q.id_pregunta, q.pregunta, q.respuesta,
        array_agg(c.referencia || ' · versión ' || c.version ORDER BY c.id_contenido) AS fuentes
        FROM preguntas_chatbot q
        JOIN pregunta_contenido pc ON pc.id_pregunta=q.id_pregunta
        JOIN contenidos_chatbot c ON c.id_contenido=pc.id_contenido
        WHERE q.estatus='Activa'
        GROUP BY q.id_pregunta
        HAVING bool_and(c.estatus='Activo')
        ORDER BY q.id_pregunta`);
    return r.rows;
}
module.exports = { listar };
